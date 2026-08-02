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
    [currentPage, limit, searchQuery]
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

  const clearError = () => setError("");

  const value = {
    documents,
    loading,
    error,
    pagination,
    currentPage,
    limit,
    searchQuery,
    fetchDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    renameDocument,
    changePage,
    changeSearch,
    changeLimit,
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
