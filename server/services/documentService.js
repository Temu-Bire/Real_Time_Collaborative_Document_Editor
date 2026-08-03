const Document = require("../models/Document");
const User = require("../models/User");
const Comment = require("../models/Comment");
const DocumentVersion = require("../models/DocumentVersion");
const { getDocumentUserRole } = require("../middleware/permissionMiddleware");

const createDocument = async (ownerId, { title, content = "" }) => {
  return Document.create({
    title,
    content,
    owner: ownerId,
    collaborators: [],
  });
};

const getDocumentsByUser = async (userId, { page = 1, limit = 12, search = "" }) => {
  const skip = (page - 1) * limit;
  const strSearch = search.trim();

  const query = {
    $or: [{ owner: userId }, { "collaborators.user": userId }],
  };

  if (strSearch) {
    query.title = { $regex: strSearch, $options: "i" };
  }

  const [total, documents] = await Promise.all([
    Document.countDocuments(query),
    Document.find(query)
      .populate("owner", "name email profilePicture")
      .populate("collaborators.user", "name email profilePicture")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const normalizedDocs = documents.map((doc) => {
    const userRole = getDocumentUserRole(doc, userId);
    return {
      ...doc,
      userRole,
      isOwner: doc.owner._id.toString() === userId.toString(),
    };
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    documents: normalizedDocs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getDocumentById = async (documentId, userId) => {
  const doc = await Document.findById(documentId)
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();

  if (!doc) return null;

  const userRole = getDocumentUserRole(doc, userId);
  if (!userRole) return null;

  return {
    ...doc,
    userRole,
    isOwner: doc.owner._id.toString() === userId.toString(),
  };
};

const updateDocument = async (documentId, { title, content }, authorId, changeDescription, isAutosave = false) => {
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const document = await Document.findByIdAndUpdate(documentId, updates, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();

  if (document && (title !== undefined || content !== undefined)) {
    const latestVersion = await DocumentVersion.findOne({ document: documentId })
      .sort({ versionNumber: -1 })
      .select("versionNumber")
      .lean();

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    await DocumentVersion.create({
      document: documentId,
      title: document.title,
      content: document.content || "",
      author: authorId,
      versionNumber,
      changeDescription: changeDescription || (isAutosave ? "Auto-save" : "Manual save"),
      isAutosave,
    });
  }

  return document;
};

const deleteDocument = async (documentId) => {
  await Comment.deleteMany({ document: documentId });
  await DocumentVersion.deleteMany({ document: documentId });
  return Document.findByIdAndDelete(documentId).lean();
};

const addCollaborator = async (documentId, targetEmail, role = "Viewer") => {
  const targetUser = await User.findOne({ email: targetEmail.toLowerCase().trim() });
  if (!targetUser) {
    throw new Error("User with this email was not found");
  }

  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  if (document.owner.toString() === targetUser._id.toString()) {
    throw new Error("User is already the owner of this document");
  }

  const existingIndex = document.collaborators.findIndex(
    (c) => c.user.toString() === targetUser._id.toString()
  );

  if (existingIndex >= 0) {
    document.collaborators[existingIndex].role = role;
  } else {
    document.collaborators.push({ user: targetUser._id, role });
  }

  await document.save();
  return Document.findById(documentId)
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();
};

const updateCollaboratorRole = async (documentId, collaboratorUserId, newRole) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error("Document not found");

  const collaborator = document.collaborators.find(
    (c) => c.user.toString() === collaboratorUserId.toString()
  );

  if (!collaborator) throw new Error("Collaborator not found");

  collaborator.role = newRole;
  await document.save();

  return Document.findById(documentId)
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();
};

const removeCollaborator = async (documentId, collaboratorUserId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error("Document not found");

  document.collaborators = document.collaborators.filter(
    (c) => c.user.toString() !== collaboratorUserId.toString()
  );

  await document.save();

  return Document.findById(documentId)
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();
};

const updatePublicSharing = async (documentId, isPublic, publicRole = "Viewer") => {
  return Document.findByIdAndUpdate(
    documentId,
    { isPublic, publicRole },
    { returnDocument: "after" }
  )
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();
};

const getComments = async (documentId) => {
  const comments = await Comment.find({ document: documentId })
    .populate("author", "name email profilePicture")
    .populate("resolvedBy", "name email profilePicture")
    .sort({ createdAt: 1 })
    .lean();

  const commentMap = new Map();
  const rootComments = [];

  comments.forEach((comment) => {
    comment.replies = [];
    commentMap.set(comment._id.toString(), comment);
  });

  comments.forEach((comment) => {
    if (comment.parentComment) {
      const parent = commentMap.get(comment.parentComment.toString());
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
};

const addComment = async (documentId, authorId, content, parentCommentId = null) => {
  const commentData = {
    document: documentId,
    author: authorId,
    content: content.trim(),
  };

  if (parentCommentId) {
    commentData.parentComment = parentCommentId;
  }

  const comment = await Comment.create(commentData);

  return Comment.findById(comment._id)
    .populate("author", "name email profilePicture")
    .populate("resolvedBy", "name email profilePicture")
    .lean();
};

const updateComment = async (commentId, authorId, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  if (comment.author.toString() !== authorId.toString()) {
    throw new Error("Unauthorized: You can only edit your own comments");
  }

  comment.content = content.trim();
  await comment.save();

  return Comment.findById(comment._id)
    .populate("author", "name email profilePicture")
    .populate("resolvedBy", "name email profilePicture")
    .lean();
};

const deleteComment = async (commentId, authorId, userRole) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  const isAuthor = comment.author.toString() === authorId.toString();
  const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

  if (!isAuthor && !isOwnerOrEditor) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  await Comment.deleteMany({ _id: commentId });
  await Comment.deleteMany({ parentComment: commentId });

  return { success: true };
};

const resolveComment = async (commentId, userId, userRole) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  const isAuthor = comment.author.toString() === userId.toString();
  const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

  if (!isAuthor && !isOwnerOrEditor) {
    throw new Error("Unauthorized: You can only resolve your own comments or need Editor permissions");
  }

  comment.isResolved = true;
  comment.resolvedBy = userId;
  comment.resolvedAt = new Date();
  await comment.save();

  return Comment.findById(comment._id)
    .populate("author", "name email profilePicture")
    .populate("resolvedBy", "name email profilePicture")
    .lean();
};

const unresolveComment = async (commentId, userId, userRole) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  const isAuthor = comment.author.toString() === userId.toString();
  const isOwnerOrEditor = ["Owner", "Editor"].includes(userRole);

  if (!isAuthor && !isOwnerOrEditor) {
    throw new Error("Unauthorized: You can only unresolve your own comments or need Editor permissions");
  }

  comment.isResolved = false;
  comment.resolvedBy = null;
  comment.resolvedAt = null;
  await comment.save();

  return Comment.findById(comment._id)
    .populate("author", "name email profilePicture")
    .populate("resolvedBy", "name email profilePicture")
    .lean();
};

const getDocumentVersions = async (documentId, userId, { page = 1, limit = 20 } = {}) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  const userRole = getDocumentUserRole(doc, userId);
  if (!userRole) throw new Error("Unauthorized: Access denied");

  const skip = (page - 1) * limit;

  const [total, versions] = await Promise.all([
    DocumentVersion.countDocuments({ document: documentId }),
    DocumentVersion.find({ document: documentId })
      .populate("author", "name email profilePicture")
      .sort({ versionNumber: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    versions,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const restoreDocumentVersion = async (documentId, versionNumber, userId) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  const userRole = getDocumentUserRole(doc, userId);
  if (!userRole || userRole === "Viewer" || userRole === "Commenter") {
    throw new Error("Unauthorized: Editor or Owner permissions required");
  }

  const version = await DocumentVersion.findOne({ document: documentId, versionNumber });
  if (!version) throw new Error("Version not found");

  const updatedDoc = await Document.findByIdAndUpdate(
    documentId,
    { title: version.title, content: version.content },
    { new: true, runValidators: true }
  )
    .populate("owner", "name email profilePicture")
    .populate("collaborators.user", "name email profilePicture")
    .lean();

  const latestVersion = await DocumentVersion.findOne({ document: documentId })
    .sort({ versionNumber: -1 })
    .select("versionNumber")
    .lean();

  const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  await DocumentVersion.create({
    document: documentId,
    title: version.title,
    content: version.content,
    author: userId,
    versionNumber: newVersionNumber,
    changeDescription: `Restored from version ${versionNumber}`,
    isAutosave: false,
  });

  return updatedDoc;
};

module.exports = {
  createDocument,
  getDocumentsByUser,
  getDocumentById,
  updateDocument,
  deleteDocument,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  updatePublicSharing,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
  getDocumentVersions,
  restoreDocumentVersion,
};