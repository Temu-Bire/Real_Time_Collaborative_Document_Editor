const express = require("express");

const {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
} = require("../controllers/commentController");
const { commentValidation, handleValidationErrors } = require("../../documents/validators/documentValidator");
const { authMiddleware } = require("../../auth/middleware/authMiddleware");
const { requireDocumentPermission } = require("../../../shared/middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Comments
router.get(
  "/:id/comments",
  handleValidationErrors,
  requireDocumentPermission("Viewer"),
  getComments
);

router.post(
  "/:id/comments",
  commentValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  addComment
);

router.patch(
  "/:id/comments/:commentId",
  commentValidation,
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  updateComment
);

router.delete(
  "/:id/comments/:commentId",
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  deleteComment
);

router.patch(
  "/:id/comments/:commentId/resolve",
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  resolveComment
);

router.patch(
  "/:id/comments/:commentId/unresolve",
  handleValidationErrors,
  requireDocumentPermission("Commenter"),
  unresolveComment
);

module.exports = router;