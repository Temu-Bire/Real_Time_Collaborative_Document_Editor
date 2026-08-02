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
  const limit = parseInt(req.query.limit, 10) || 9;
  const search = req.query.search || "";

  const result = await documentService.getDocumentsByOwner(req.user.userId, {
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
    return res.status(404).json({ message: "Document not found" });
  }

  res.status(200).json(document);
});

const updateDocument = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  const document = await documentService.updateDocument(
    req.params.id,
    req.user.userId,
    { title, content }
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
  const document = await documentService.deleteDocument(
    req.params.id,
    req.user.userId
  );

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.status(200).json({ message: "Document deleted successfully" });
});

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
