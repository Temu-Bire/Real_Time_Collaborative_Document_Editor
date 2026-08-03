const express = require("express");

const {
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
} = require("../controllers/documentController");
const {
  documentIdValidation,
  documentValidation,
  createDocumentValidation,
  handleValidationErrors,
} = require("../validators/documentValidator");
const authMiddleware = require("../src/auth/middleware/authMiddleware").authMiddleware;
const { requireDocumentPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  createDocumentValidation,
  handleValidationErrors,
  createDocument
);

router.get("/", getDocuments);

router.get(
  "/:id",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Viewer"),
  getDocumentById
);

router.put(
  "/:id",
  documentIdValidation,
  documentValidation,
  handleValidationErrors,
  requireDocumentPermission("Editor"),
  updateDocument
);

router.delete(
  "/:id",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Owner"),
  deleteDocument
);

// Sharing & Collaborators
router.post(
  "/:id/share",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Owner"),
  shareDocument
);

router.patch(
  "/:id/share/:collaboratorId",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Owner"),
  updateCollaboratorRole
);

router.delete(
  "/:id/share/:collaboratorId",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Owner"),
  removeCollaborator
);

router.patch(
  "/:id/public",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Owner"),
  updatePublicSharing
);

// Comments
router.get(
  "/:id/comments",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Viewer"),
  getComments
);

router.post(
  "/:id/comments",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  addComment
);

router.patch(
  "/:id/comments/:commentId",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  updateComment
);

router.delete(
  "/:id/comments/:commentId",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  deleteComment
);

router.patch(
  "/:id/comments/:commentId/resolve",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  resolveComment
);

router.patch(
  "/:id/comments/:commentId/unresolve",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  unresolveComment
);

// Version History
router.get(
  "/:id/versions",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Viewer"),
  getDocumentVersions
);

router.post(
  "/:id/versions/restore",
  documentIdValidation,
  handleValidationErrors,
  requireDocumentPermission("Editor"),
  restoreDocumentVersion
);

module.exports = router;