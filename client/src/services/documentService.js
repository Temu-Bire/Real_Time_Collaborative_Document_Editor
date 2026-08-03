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

export const shareDocument = async (id, email, role = "Viewer") => {
  const response = await api.post(`/documents/${id}/share`, { email, role });
  return response.data;
};

export const updateCollaboratorRole = async (id, collaboratorId, role) => {
  const response = await api.patch(`/documents/${id}/share/${collaboratorId}`, { role });
  return response.data;
};

export const removeCollaborator = async (id, collaboratorId) => {
  const response = await api.delete(`/documents/${id}/share/${collaboratorId}`);
  return response.data;
};

export const updatePublicSharing = async (id, isPublic, publicRole = "Viewer") => {
  const response = await api.patch(`/documents/${id}/public`, { isPublic, publicRole });
  return response.data;
};

export const getComments = async (id) => {
  const response = await api.get(`/documents/${id}/comments`);
  return response.data;
};

export const addComment = async (id, content, parentCommentId = null) => {
  const response = await api.post(`/documents/${id}/comments`, { content, parentCommentId });
  return response.data;
};

export const updateComment = async (id, commentId, content) => {
  const response = await api.patch(`/documents/${id}/comments/${commentId}`, { content });
  return response.data;
};

export const deleteComment = async (id, commentId) => {
  const response = await api.delete(`/documents/${id}/comments/${commentId}`);
  return response.data;
};

export const resolveComment = async (id, commentId) => {
  const response = await api.patch(`/documents/${id}/comments/${commentId}/resolve`);
  return response.data;
};

export const unresolveComment = async (id, commentId) => {
  const response = await api.patch(`/documents/${id}/comments/${commentId}/unresolve`);
  return response.data;
};

export const getDocumentVersions = async (id, params = {}) => {
  const response = await api.get(`/documents/${id}/versions`, { params });
  return response.data;
};

export const restoreDocumentVersion = async (id, versionNumber) => {
  const response = await api.post(`/documents/${id}/versions/restore`, { versionNumber });
  return response.data;
};

export default {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  renameDocument,
  duplicateDocument,
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
};