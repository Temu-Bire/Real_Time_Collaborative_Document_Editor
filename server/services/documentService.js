const Document = require("../models/Document");

const LIST_PROJECTION = "title owner createdAt updatedAt";

const buildOwnerQuery = (ownerId, search = "") => {
  const query = { owner: ownerId };

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  return query;
};

const createDocument = async (ownerId, { title, content = "" }) => {
  return Document.create({
    title,
    content,
    owner: ownerId,
  });
};

const getDocumentsByOwner = async (ownerId, { page = 1, limit = 12, search = "" }) => {
  const skip = (page - 1) * limit;
  const query = buildOwnerQuery(ownerId, search.trim());

  const [total, documents] = await Promise.all([
    Document.countDocuments(query),
    Document.find(query)
      .select(LIST_PROJECTION)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    documents,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getDocumentById = async (documentId, ownerId) => {
  return Document.findOne({
    _id: documentId,
    owner: ownerId,
  }).lean();
};

const updateDocument = async (documentId, ownerId, { title, content }) => {
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  return Document.findOneAndUpdate(
    { _id: documentId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  ).lean();
};

const deleteDocument = async (documentId, ownerId) => {
  return Document.findOneAndDelete({
    _id: documentId,
    owner: ownerId,
  }).lean();
};

module.exports = {
  createDocument,
  getDocumentsByOwner,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
