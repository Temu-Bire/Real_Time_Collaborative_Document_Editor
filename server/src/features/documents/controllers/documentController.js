const documentService = require("../services/documentService");
const { asyncHandler } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const documentController = {
  createDocument: asyncHandler(async (req, res) => {
    const { title, content = "" } = req.body;
    const document = await documentService.createDocument(req.user.userId, {
      title,
      content,
    });

    // Return in format expected by frontend: { document }
    res.status(201).json({ document });
  }),

  getDocuments: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = req.query.search || "";

    const result = await documentService.getDocumentsByUser(req.user.userId, {
      page,
      limit,
      search,
    });

    // Return result directly for backward compatibility with frontend
    res.status(200).json(result);
  }),

  getDocumentById: asyncHandler(async (req, res) => {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user.userId
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Document not found or access denied",
        },
      });
    }

    // Return document directly for backward compatibility
    res.status(200).json(document);
  }),

  updateDocument: asyncHandler(async (req, res) => {
    const { title, content, changeDescription, isAutosave = true } = req.body;

    const document = await documentService.updateDocument(
      req.params.id,
      { title, content },
      req.user.userId,
      changeDescription,
      isAutosave !== false
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    // Return { document } so client can access response.document
    res.status(200).json({ document });
  }),

  deleteDocument: asyncHandler(async (req, res) => {
    const document = await documentService.deleteDocument(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  }),

  shareDocument: asyncHandler(async (req, res) => {
    const { email, role = "Viewer" } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is required to share document",
        },
      });
    }

    try {
      const document = await documentService.addCollaborator(
        req.params.id,
        email,
        role
      );
      // Return { document } so client can access response.document
      res.status(200).json({ document });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: err.message || "Failed to share document",
        },
      });
    }
  }),

  updateCollaboratorRole: asyncHandler(async (req, res) => {
    const { collaboratorId } = req.params;
    const { role } = req.body;

    if (!role || !["Viewer", "Commenter", "Editor"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid role is required",
        },
      });
    }

    const document = await documentService.updateCollaboratorRole(
      req.params.id,
      collaboratorId,
      role
    );

    // Return { document } so client can access response.document
    res.status(200).json({ document });
  }),

  removeCollaborator: asyncHandler(async (req, res) => {
    const { collaboratorId } = req.params;

    const document = await documentService.removeCollaborator(
      req.params.id,
      collaboratorId
    );

    // Return { document } so client can access response.document
    res.status(200).json({ document });
  }),

  updatePublicSharing: asyncHandler(async (req, res) => {
    const { isPublic, publicRole = "Viewer" } = req.body;

    const document = await documentService.updatePublicSharing(
      req.params.id,
      isPublic,
      publicRole
    );

    // Return { document } so client can access response.document
    res.status(200).json({ document });
  }),

  getComments: asyncHandler(async (req, res) => {
    const comments = await documentService.getComments(req.params.id);
    // Return comments directly for backward compatibility
    res.status(200).json({ comments });
  }),

  addComment: asyncHandler(async (req, res) => {
    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot be empty",
        },
      });
    }

    const comment = await documentService.addComment(
      req.params.id,
      req.user.userId,
      content,
      parentCommentId
    );

    // Return comment directly for backward compatibility
    res.status(201).json({ comment });
  }),

  updateComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content cannot be empty",
        },
      });
    }

    const comment = await documentService.updateComment(
      commentId,
      req.user.userId,
      content
    );

    // Return comment directly for backward compatibility
    res.status(200).json({ comment });
  }),

  deleteComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    await documentService.deleteComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    // Return success directly for backward compatibility
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  }),

  resolveComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await documentService.resolveComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    // Return comment directly for backward compatibility
    res.status(200).json({ comment });
  }),

  unresolveComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await documentService.unresolveComment(
      commentId,
      req.user.userId,
      req.userRole
    );

    // Return comment directly for backward compatibility
    res.status(200).json({ comment });
  }),

  getDocumentVersions: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await documentService.getDocumentVersions(req.params.id, req.user.userId, {
      page,
      limit,
    });

    // Return result directly for backward compatibility
    res.status(200).json(result);
  }),

  restoreDocumentVersion: asyncHandler(async (req, res) => {
    const { versionNumber } = req.body;

    if (!versionNumber || typeof versionNumber !== "number") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid version number is required",
        },
      });
    }

    const document = await documentService.restoreDocumentVersion(
      req.params.id,
      versionNumber,
      req.user.userId
    );

    // Return { document } so client can access response.document
    res.status(200).json({ document });
  }),

  // Create a manual version (user explicitly saves a version)
  createVersion: asyncHandler(async (req, res) => {
    const { changeDescription } = req.body;
    const documentId = req.params.id;
    const userId = req.user.userId;

    const document = await documentService.getDocumentById(documentId, userId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Document not found or access denied",
        },
      });
    }

    const result = await documentService.createManualVersion(
      documentId,
      userId,
      changeDescription || "Manual version"
    );

    res.status(201).json({
      document,
      versionCreated: !result.skipped,
      skippedReason: result.reason,
    });
  }),

  // Handle document close from frontend
  handleDocumentClose: asyncHandler(async (req, res) => {
    const { content } = req.body;
    const documentId = req.params.id;
    const userId = req.user.userId;

    const result = await documentService.handleDocumentClose(documentId, userId, content);

    // Return result directly for backward compatibility
    res.status(200).json(result);
  }),
};

module.exports = documentController;