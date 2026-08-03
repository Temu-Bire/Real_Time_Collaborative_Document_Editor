import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, SlidersHorizontal, X } from "lucide-react";

import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorAlert from "../../components/common/ErrorAlert";
import Pagination from "../../components/common/Pagination";
import DocumentCard from "../../components/documents/DocumentCard";
import ShareModal from "../../components/documents/ShareModal";
import { useDocuments } from "../../context/DocumentContext";
import { getErrorMessage } from "../../utils/getErrorMessage";

const DOC_TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned by me" },
  { value: "shared", label: "Shared with me" },
  { value: "recent", label: "Recent" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    documents,
    loading,
    error,
    pagination,
    currentPage,
    searchQuery,
    docType,
    fetchDocuments,
    deleteDocument,
    createDocument,
    renameDocument,
    duplicateDocument,
    changePage,
    changeSearch,
    changeLimit,
    changeDocType,
    clearError,
    shareDocument,
    updateCollaboratorRole,
    removeCollaborator,
  } = useDocuments();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [actionError, setActionError] = useState("");

  // Dashboard-level Share Modal state
  const [shareTarget, setShareTarget] = useState(null); // the doc being shared

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateDocument = async () => {
    try {
      setActionError("");
      const document = await createDocument({
        title: "Untitled Document",
        content: "",
      });
      if (document?.id) {
        navigate(`/documents/${document.id}`);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to create document."));
    }
  };

  const handleDuplicateDocument = async (doc) => {
    try {
      setActionError("");
      await duplicateDocument(doc);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to duplicate document."));
    }
  };

  const handleRenameDocument = async (docId, newTitle) => {
    try {
      setActionError("");
      await renameDocument(docId, newTitle);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to rename document."));
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      setActionError("");
      await deleteDocument(docId);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to delete document."));
      throw err;
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    changeSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    changeSearch("");
  };

  // Share handlers
  const handleOpenShare = (doc) => setShareTarget(doc);
  const handleCloseShare = () => setShareTarget(null);

  const handleShareSubmit = async (docId, email, role) => {
    const updated = await shareDocument(docId, email, role);
    setShareTarget(updated);
  };

  const handleUpdateRole = async (docId, collaboratorId, role) => {
    const updated = await updateCollaboratorRole(docId, collaboratorId, role);
    setShareTarget(updated);
  };

  const handleRemoveCollaborator = async (docId, collaboratorId) => {
    const updated = await removeCollaborator(docId, collaboratorId);
    setShareTarget(updated);
  };

  const displayError = actionError || error;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
              My Documents
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                {pagination?.total || documents.length} total
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create, edit, and organize your documents in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateDocument}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 shrink-0 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Document</span>
          </button>
        </div>

        {displayError && (
          <ErrorAlert
            message={displayError}
            onDismiss={() => {
              setActionError("");
              clearError();
            }}
            className="mb-6"
          />
        )}

        {/* Document type filter tabs */}
        <div
          role="tablist"
          aria-label="Filter documents"
          className="flex flex-wrap items-center gap-1.5 mb-4 p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs w-fit max-w-full overflow-x-auto"
        >
          {DOC_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={docType === tab.value}
              onClick={() => changeDocType(tab.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                docType === tab.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              Items per page:
            </span>
            <select
              value={pagination?.limit || 9}
              onChange={(e) => changeLimit(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : documents.length === 0 ? (
          searchQuery ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center my-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                No matching documents found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No documents match your query &quot;{searchQuery}&quot;. Try adjusting your search term or clear the filter.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition"
              >
                Clear Search Filter
              </button>
            </div>
          ) : docType === "recent" ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center my-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                No recently opened documents
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Open any document to have it appear here for quick access.
              </p>
            </div>
          ) : docType === "shared" ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center my-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Nothing shared with you yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Documents that others share with you will show up here.
              </p>
            </div>
          ) : (
            <EmptyState onCreate={handleCreateDocument} />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDelete={handleDeleteDocument}
                  onRename={handleRenameDocument}
                  onDuplicate={handleDuplicateDocument}
                  onShare={handleOpenShare}
                />
              ))}
            </div>

            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={changePage}
            />
          </>
        )}
      </main>

      {/* Dashboard-level Share Modal */}
      <ShareModal
        isOpen={!!shareTarget}
        onClose={handleCloseShare}
        document={shareTarget}
        onShare={handleShareSubmit}
        onUpdateRole={handleUpdateRole}
        onRemoveCollaborator={handleRemoveCollaborator}
      />
    </div>
  );
};

export default Dashboard;
