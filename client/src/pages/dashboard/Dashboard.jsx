import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import DocumentCard from "../../components/documents/DocumentCard";
import { useDocuments } from "../../context/DocumentContext";

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    documents,
    loading,
    pagination,
    currentPage,
    searchQuery,
    fetchDocuments,
    deleteDocument,
    createDocument,
    changePage,
    changeSearch,
    changeLimit,
  } = useDocuments();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async () => {
    try {
      const document = await createDocument({
        title: "Untitled Document",
        content: "",
      });

      navigate(`/documents/${document._id}`);
    } catch (error) {
      console.error(error);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Top Header & New Document CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              My Documents
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                {pagination?.total || documents.length} total
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create, edit, and organize all your real-time collaborative documents.
            </p>
          </div>

          <button
            onClick={handleCreateDocument}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New Document</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
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

          {/* Per Page Selector */}
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

        {/* Loading Spinner */}
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
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <EmptyState onCreate={handleCreateDocument} />
          )
        ) : (
          <>
            {/* Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  onDelete={deleteDocument}
                />
              ))}
            </div>

            {/* Pagination Controls Bar */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing Page{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {pagination.totalPages}
                  </span>{" "}
                  ({pagination.total} items total)
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;