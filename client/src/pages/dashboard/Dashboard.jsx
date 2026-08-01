import { useEffect, useState } from "react";

import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import DocumentCard from "../../components/documents/DocumentCard";
import CreateDocumentModal from "../../components/documents/CreateDocumentModal";
import { useDocuments } from "../../context/DocumentContext";

const Dashboard = () => {
  const {
    documents,
    loading,
    fetchDocuments,
    deleteDocument,
  } = useDocuments();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold">
            My Documents
          </h1>

          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700"
          >
            + New Document
          </button>

        </div>

        {documents.length === 0 ? (
          <EmptyState
            onCreate={() => setShowModal(true)}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {documents.map((document) => (
              <DocumentCard
                key={document._id}
                document={document}
                onDelete={deleteDocument}
              />
            ))}

          </div>
        )}

            <CreateDocumentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                />
      </div>
    </>
  );
};

export default Dashboard;