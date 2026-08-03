const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Comment = require("../../comments/models/Comment");
const versionService = require("./versionService");
const { getDocumentUserRole } = require("../../../shared/middleware/permissionMiddleware");
const { asyncHandler, buildPaginationResponse } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const documentService = {
  async createDocument(ownerId, { title, content = "" }) {
    return Document.create({
      title,
      content,
      owner: ownerId,
      collaborators: [],
    });
  },

  async getDocumentsByUser(userId, { page = 1, limit = 12, search = "" }) {
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

    return {
      documents: normalizedDocs,
      pagination: buildPaginationResponse(total, page, limit),
    };
  },

  async getDocumentById(documentId, userId) {
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
  },

  async updateDocument(documentId, { title, content }, authorId, _changeDescription, isAutosave = true) {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    const document = await Document.findByIdAndUpdate(documentId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "name email profilePicture")
      .populate("collaborators.user", "name email profilePicture")
      .lean();

    if (document && isAutosave) {
      await versionService.handleAutoSave(
        documentId,
        authorId,
        document.title,
        document.content || ""
      );
    }

    return document;
  },

  async createManualVersion(documentId, authorId, changeDescription) {
    const doc = await Document.findById(documentId).lean();
    if (!doc) return null;

    return versionService.createManualVersion({
      documentId,
      authorId,
      title: doc.title,
      content: doc.content || "",
      changeDescription,
    });
  },

  async deleteDocument(documentId) {
    await Comment.deleteMany({ document: documentId });
    await DocumentVersion.deleteMany({ document: documentId });
    return Document.findByIdAndDelete(documentId).lean();
  },

  async addCollaborator(documentId, targetEmail, role = "Viewer") {
    const User = require("../../../features/auth/models/User");
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
  },

  async updateCollaboratorRole(documentId, collaboratorUserId, newRole) {
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
  },

  async removeCollaborator(documentId, collaboratorUserId) {
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
  },

  async updatePublicSharing(documentId, isPublic, publicRole = "Viewer") {
    return Document.findByIdAndUpdate(
      documentId,
      { isPublic, publicRole },
      { new: true }
    )
      .populate("owner", "name email profilePicture")
      .populate("collaborators.user", "name email profilePicture")
      .lean();
  },

  async getComments(documentId) {
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
  },

  async addComment(documentId, authorId, content, parentCommentId = null) {
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
  },

  async updateComment(commentId, authorId, content) {
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
  },

  async deleteComment(commentId, authorId, userRole) {
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
  },

  async resolveComment(commentId, userId, userRole) {
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
  },

  async unresolveComment(commentId, userId, userRole) {
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
  },

  async getDocumentVersions(documentId, userId, { page = 1, limit = 20 } = {}) {
    return versionService.getVersions(documentId, userId, { page, limit });
  },

  async restoreDocumentVersion(documentId, versionNumber, userId) {
    return versionService.restoreVersion(documentId, versionNumber, userId);
  },

  // Handle document close - create version if there are unsaved changes
  async handleDocumentClose(documentId, userId, content) {
    return versionService.handleDocumentClose(documentId, userId, content);
  },
};

module.exports = documentService;