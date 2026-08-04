import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import documentService from "../services/documentService";
import { normalizeDocument, normalizeDocuments } from "../utils/documentUtils";
import { getErrorMessage } from "../utils/getErrorMessage";

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [searchQuery, setSearchQuery] = useState("");
  const [docType, setDocType] = useState("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchDocuments = useCallback(
    async (overrideParams = {}) => {
      try {
        setLoading(true);
        setError("");
        const params = {
          page:
            overrideParams.page !== undefined ? overrideParams.page : currentPage,
          limit:
            overrideParams.limit !== undefined ? overrideParams.limit : limit,
          search:
            overrideParams.search !== undefined
              ? overrideParams.search
              : searchQuery,
          type:
            overrideParams.type !== undefined ? overrideParams.type : docType,
        };

        const data = await documentService.getDocuments(params);

        if (Array.isArray(data)) {
          setDocuments(normalizeDocuments(data));
          setPagination({
            total: data.length,
            page: 1,
            limit: data.length || 9,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        } else if (data?.documents) {
          setDocuments(normalizeDocuments(data.documents));
          setPagination(
            data.pagination || {
              total: data.documents.length,
              page: params.page,
              limit: params.limit,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load documents."));
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit, searchQuery, docType]
  );

  const getDocumentById = useCallback(async (id) => {
    const doc = await documentService.getDocumentById(id);
    return normalizeDocument(doc);
  }, []);

  const createDocument = async (documentData) => {
    const response = await documentService.createDocument(documentData);
    await fetchDocuments({ page: 1 });
    return normalizeDocument(response.document);
  };

  const updateDocument = async (id, documentData) => {
    const response = await documentService.updateDocument(id, documentData);

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? normalizeDocument(response.document) : doc))
    );

    return normalizeDocument(response.document);
  };

  const deleteDocument = async (id) => {
    await documentService.deleteDocument(id);
    
    await fetchDocuments();
  };

  const duplicateDocument = async (doc) => {
    const response = await documentService.duplicateDocument(doc);
    await fetchDocuments({ page: 1 });
    return normalizeDocument(response.document);
  };

  const renameDocument = async (id, newTitle) =>
    updateDocument(id, { title: newTitle });

  const changePage = (page) => {
    setCurrentPage(page);
    fetchDocuments({ page });
  };

  const changeSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchDocuments({ page: 1, search: query });
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1);
    fetchDocuments({ page: 1, limit: newLimit });
  };

  const changeDocType = (type) => {
    setDocType(type);
    setCurrentPage(1);
    fetchDocuments({ page: 1, type });
  };

  const clearError = () => setError("");

  const shareDocument = async (id, email, role) => {
    const response = await documentService.shareDocument(id, email, role);
    return normalizeDocument(response.document);
  };

  const updateCollaboratorRole = async (id, collaboratorId, role) => {
    const response = await documentService.updateCollaboratorRole(id, collaboratorId, role);
    return normalizeDocument(response.document);
  };

  const removeCollaborator = async (id, collaboratorId) => {
    const response = await documentService.removeCollaborator(id, collaboratorId);
    return normalizeDocument(response.document);
  };

  const getComments = useCallback(async (id) => {
    const response = await documentService.getComments(id);
    return response.comments || [];
  }, []);

  const addComment = async (id, content, parentCommentId = null) => {
    const response = await documentService.addComment(id, content, parentCommentId);
    return response.comment;
  };

  const updateComment = async (id, commentId, content) => {
    const response = await documentService.updateComment(id, commentId, content);
    return response.comment;
  };

  const deleteComment = async (id, commentId) => {
    const response = await documentService.deleteComment(id, commentId);
    return response;
  };

  const resolveComment = async (id, commentId) => {
    const response = await documentService.resolveComment(id, commentId);
    return response.comment;
  };

  const unresolveComment = async (id, commentId) => {
    const response = await documentService.unresolveComment(id, commentId);
    return response.comment;
  };

  const getDocumentVersions = async (id, params = {}) => {
    const response = await documentService.getDocumentVersions(id, params);
    return response;
  };

  const restoreDocumentVersion = async (id, versionNumber) => {
    const response = await documentService.restoreDocumentVersion(id, versionNumber);
    return normalizeDocument(response.document);
  };

  const closeDocument = async (id, content) => {
    return documentService.closeDocument(id, content);
  };

  const value = {
    documents,
    loading,
    error,
    pagination,
    currentPage,
    limit,
    searchQuery,
    docType,
    fetchDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    renameDocument,
    shareDocument,
    updateCollaboratorRole,
    removeCollaborator,
    getComments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    getDocumentVersions,
    restoreDocumentVersion,
    closeDocument,
    changePage,
    changeSearch,
    changeLimit,
    changeDocType,
    clearError,
  };

  return (
    <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
};