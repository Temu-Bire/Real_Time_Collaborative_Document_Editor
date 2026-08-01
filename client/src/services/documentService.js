import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/documents`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// CREATE
export const createDocument = async (documentData) => {
  const response = await api.post("/", documentData);
  return response.data;
};

// GET ALL
export const getDocuments = async () => {
  const response = await api.get("/");
  return response.data;
};

// GET ONE
export const getDocumentById = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

// UPDATE
export const updateDocument = async (id, documentData) => {
  const response = await api.put(`/${id}`, documentData);
  return response.data;
};

// DELETE
export const deleteDocument = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export default {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};