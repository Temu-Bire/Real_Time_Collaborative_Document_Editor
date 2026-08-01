import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import documentService from "../services/documentService";

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch documents with params
  const fetchDocuments = useCallback(
    async (overrideParams = {}) => {
      try {
        setLoading(true);
        const params = {
          page: overrideParams.page !== undefined ? overrideParams.page : currentPage,
          limit: overrideParams.limit !== undefined ? overrideParams.limit : limit,
          search: overrideParams.search !== undefined ? overrideParams.search : searchQuery,
        };

        const data = await documentService.getDocuments(params);

        if (Array.isArray(data)) {
          setDocuments(data);
          setPagination({
            total: data.length,
            page: 1,
            limit: data.length || 9,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        } else if (data && data.documents) {
          setDocuments(data.documents);
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
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, limit, searchQuery]
  );

  // Create a new document
  const createDocument = async (documentData) => {
    try {
      const response = await documentService.createDocument(documentData);
      // Refresh documents
      await fetchDocuments({ page: 1 });
      return response.document;
    } catch (error) {
      console.error("Failed to create document:", error);
      throw error;
    }
  };

  // Update a document
  const updateDocument = async (id, documentData) => {
    try {
      const response = await documentService.updateDocument(id, documentData);

      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? response.document : doc))
      );

      return response.document;
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    }
  };

  // Delete a document
  const deleteDocument = async (id) => {
    try {
      await documentService.deleteDocument(id);
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

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

  const value = {
    documents,
    loading,
    pagination,
    currentPage,
    limit,
    searchQuery,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    changePage,
    changeSearch,
    changeLimit,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);