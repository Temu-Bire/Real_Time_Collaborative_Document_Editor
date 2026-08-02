import api from "./api";

export const createDocument = async (documentData) => {
  const response = await api.post("/documents", documentData);
  return response.data;
};

export const getDocuments = async (params = {}) => {
  const response = await api.get("/documents", { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const updateDocument = async (id, documentData) => {
  const response = await api.put(`/documents/${id}`, documentData);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const renameDocument = async (id, newTitle) =>
  updateDocument(id, { title: newTitle });

export const duplicateDocument = async (docToDuplicate) =>
  createDocument({
    title: `${docToDuplicate.title || "Untitled Document"} (Copy)`,
    content: docToDuplicate.content || "",
  });

export default {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  renameDocument,
  duplicateDocument,
};
