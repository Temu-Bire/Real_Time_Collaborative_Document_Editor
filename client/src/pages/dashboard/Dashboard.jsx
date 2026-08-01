import { useEffect, useState } from "react";

import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import DocumentCard from "../../components/documents/DocumentCard";
import { useDocuments } from "../../context/DocumentContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

    const {
    documents,
    loading,
    fetchDocuments,
    deleteDocument,
    createDocument,
    } = useDocuments();


  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

    const handleCreateDocument = async () => {
    try {
        const document = await createDocument({
        title: "Untitled Document",
        content: "",
        });

        navigate(`/documents/${document._id}`);

    } catch(error){
        console.error(error);
    }
    };
  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold">
            My Documents
          </h1>

        <button
            onClick={handleCreateDocument}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700"
            >
            + New Document
        </button>
        </div>

        {documents.length === 0 ? (
            <EmptyState
            onCreate={handleCreateDocument}
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
      </div>
    </>
  );
};

export default Dashboard;