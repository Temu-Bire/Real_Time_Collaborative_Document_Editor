const Document = require("../../features/documents/models/Document");
const { asyncHandler } = require("../utils");
const { HTTP_STATUS, ERROR_CODES, DOCUMENT_PERMISSIONS } = require("../constants");

const ROLE_RANK = {
  Owner: 4,
  Editor: 3,
  Commenter: 2,
  Viewer: 1,
};

const getUserIdString = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user._id) return user._id.toString();
  if (user.toString) return user.toString();
  return null;
};

const getDocumentUserRole = (document, userId) => {
  if (!userId) return document.isPublic ? document.publicRole : null;

  const strUserId = getUserIdString(userId);
  if (!strUserId) return null;

  const ownerId = getUserIdString(document.owner);
  if (ownerId === strUserId) {
    return "Owner";
  }

  const collaborator = document.collaborators.find(
    (c) => getUserIdString(c.user) === strUserId
  );

  if (collaborator) {
    return collaborator.role;
  }

  if (document.isPublic) {
    return document.publicRole || "Viewer";
  }

  return null;
};

const requireDocumentPermission = (requiredRole = "Viewer") => {
  return asyncHandler(async (req, res, next) => {
    const documentId = req.params.id || req.body.documentId;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Document ID is required",
        },
      });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: "Document not found",
        },
      });
    }

    const userRole = getDocumentUserRole(document, req.user?.userId);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: "Unauthorized: You do not have permission to access this document",
        },
      });
    }

    const userRank = ROLE_RANK[userRole] || 0;
    const requiredRank = ROLE_RANK[requiredRole] || 1;

    if (userRank < requiredRank) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `Forbidden: This action requires ${requiredRole} permissions or higher`,
        },
      });
    }

    req.document = document;
    req.userRole = userRole;
    next();
  });
};

module.exports = {
  getDocumentUserRole,
  requireDocumentPermission,
  ROLE_RANK,
  DOCUMENT_PERMISSIONS,
};