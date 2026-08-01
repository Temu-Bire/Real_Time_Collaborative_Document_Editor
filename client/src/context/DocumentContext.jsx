import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import documentService from "../services/documentService";

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new document
  const createDocument = async (documentData) => {
    try {
      const response = await documentService.createDocument(documentData);

      // Add new document to state
      setDocuments((prev) => [response.document, ...prev]);

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
        prev.map((doc) =>
          doc._id === id ? response.document : doc
        )
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

      setDocuments((prev) =>
        prev.filter((doc) => doc._id !== id)
      );
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  };

  // Load documents when app starts
  useEffect(() => {
    fetchDocuments();
  }, []);

  const value = {
    documents,
    loading,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);