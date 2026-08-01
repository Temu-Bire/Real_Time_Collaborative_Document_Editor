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

// GET ALL DOCUMENTS OF LOGGED-IN USER (with pagination & search)
const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const search = req.query.search ? req.query.search.trim() : "";
    const skip = (page - 1) * limit;

    const query = { owner: req.user.userId };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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