const express = require("express");

const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require("../controllers/documentController");
const {
  documentValidation,
  handleValidationErrors,
} = require("../validators/documentValidator");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All document routes require authentication
router.use(authMiddleware);

// Create document
router.post("/", createDocument, documentValidation, handleValidationErrors);

// Get all documents
router.get("/", getDocuments);

// Get single document
router.get("/:id", getDocumentById);

// Update document
router.put("/:id", updateDocument, documentValidation, handleValidationErrors);

// Delete document
router.delete("/:id", deleteDocument);

module.exports = router;