const documentService = require("../services/documentService");
const asyncHandler = require("../utils/asyncHandler");

const createDocument = asyncHandler(async (req, res) => {
  const { title, content = "" } = req.body;
  const document = await documentService.createDocument(req.user.userId, {
    title,
    content,
  });

  res.status(201).json({
    message: "Document created successfully",
    document,
  });
});

const getDocuments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const search = req.query.search || "";

  const result = await documentService.getDocumentsByUser(req.user.userId, {
    page,
    limit,
    search,
  });

  res.status(200).json(result);
});

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await documentService.getDocumentById(
    req.params.id,
    req.user.userId
  );

  if (!document) {
    return res.status(404).json({ message: "Document not found or access denied" });
  }

  res.status(200).json(document);
});

const updateDocument = asyncHandler(async (req, res) => {
  const { title, content, changeDescription } = req.body;

  const document = await documentService.updateDocument(
    req.params.id,
    { title, content },
    req.user.userId,
    changeDescription,
    false
  );

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.status(200).json({
    message: "Document updated successfully",
    document,
  });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await documentService.deleteDocument(req.params.id);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.status(200).json({ message: "Document deleted successfully" });
});

const shareDocument = asyncHandler(async (req, res) => {
  const { email, role = "Viewer" } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required to share document" });
  }

  try {
    const document = await documentService.addCollaborator(
      req.params.id,
      email,
      role
    );
    res.status(200).json({
      message: `Document shared successfully with ${email}`,
      document,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to share document" });
  }
});

const updateCollaboratorRole = asyncHandler(async (req, res) => {
  const { collaboratorId } = req.params;
  const { role } = req.body;

  if (!role || !["Viewer", "Commenter", "Editor"].includes(role)) {
    return res.status(400).json({ message: "Valid role is required" });
  }

  const document = await documentService.updateCollaboratorRole(
    req.params.id,
    collaboratorId,
    role
  );

  res.status(200).json({
    message: "Collaborator role updated successfully",
    document,
  });
});

const removeCollaborator = asyncHandler(async (req, res) => {
  const { collaboratorId } = req.params;

  const document = await documentService.removeCollaborator(
    req.params.id,
    collaboratorId
  );

  res.status(200).json({
    message: "Collaborator removed successfully",
    document,
  });
});

const updatePublicSharing = asyncHandler(async (req, res) => {
  const { isPublic, publicRole = "Viewer" } = req.body;

  const document = await documentService.updatePublicSharing(
    req.params.id,
    isPublic,
    publicRole
  );

  res.status(200).json({
    message: "Public link settings updated",
    document,
  });
});

const getComments = asyncHandler(async (req, res) => {
  const comments = await documentService.getComments(req.params.id);
  res.status(200).json({ comments });
});

const addComment = asyncHandler(async (req, res) => {
  const { content, parentCommentId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content cannot be empty" });
  }

  const comment = await documentService.addComment(
    req.params.id,
    req.user.userId,
    content,
    parentCommentId
  );

  res.status(201).json({
    message: "Comment added successfully",
    comment,
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content cannot be empty" });
  }

  const comment = await documentService.updateComment(
    commentId,
    req.user.userId,
    content
  );

  res.status(200).json({
    message: "Comment updated successfully",
    comment,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  await documentService.deleteComment(
    commentId,
    req.user.userId,
    req.userRole
  );

  res.status(200).json({ message: "Comment deleted successfully" });
});

const resolveComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await documentService.resolveComment(
    commentId,
    req.user.userId,
    req.userRole
  );

  res.status(200).json({
    message: "Comment resolved successfully",
    comment,
  });
});

const unresolveComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await documentService.unresolveComment(
    commentId,
    req.user.userId,
    req.userRole
  );

  res.status(200).json({
    message: "Comment unresolved successfully",
    comment,
  });
});

const getDocumentVersions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await documentService.getDocumentVersions(req.params.id, req.user.userId, {
    page,
    limit,
  });

  res.status(200).json(result);
});

const restoreDocumentVersion = asyncHandler(async (req, res) => {
  const { versionNumber } = req.body;

  if (!versionNumber || typeof versionNumber !== "number") {
    return res.status(400).json({ message: "Valid version number is required" });
  }

  const document = await documentService.restoreDocumentVersion(
    req.params.id,
    versionNumber,
    req.user.userId
  );

  res.status(200).json({
    message: `Document restored to version ${versionNumber}`,
    document,
  });
});

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
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