const express = require("express");

const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require("../controllers/documentController");
const {
  documentIdValidation,
  documentValidation,
  createDocumentValidation,
  handleValidationErrors,
} = require("../validators/documentValidator");
const authMiddleware = require("../middleware/authMiddleware");

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
  getDocumentById
);

router.put(
  "/:id",
  documentIdValidation,
  documentValidation,
  handleValidationErrors,
  updateDocument
);

router.delete(
  "/:id",
  documentIdValidation,
  handleValidationErrors,
  deleteDocument
);

module.exports = router;
