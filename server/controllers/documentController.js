const Document = require("../models/Document");

// CREATE DOCUMENT
const createDocument = async (req, res) => {
  try {
    const { title, content = "" } = req.body;
    const document = await Document.create({
      title,
      content,
      owner: req.user.userId,
    });

    res.status(201).json({
      message: "Document created successfully",
      document,
    });
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
}
};

// GET ALL DOCUMENTS OF LOGGED-IN USER
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      owner: req.user.userId,
    }).sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
}
};

// GET SINGLE DOCUMENT
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json(document);
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
}
};

// UPDATE DOCUMENT
const updateDocument = async (req, res) => {
  try {
    const { title, content } = req.body;

    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        title,
        content,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json({
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
}
};

// DELETE DOCUMENT
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
  console.error(error);

  res.status(500).json({
    message: error.message || "Internal server error",
  });
}
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};