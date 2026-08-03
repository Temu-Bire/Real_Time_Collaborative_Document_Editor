import { useState, useEffect } from "react";
import { Loader2, X, RotateCcw, ShieldAlert, Clock, FileText } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import { getErrorMessage } from "../../utils/getErrorMessage";

const VersionHistoryDrawer = ({
  isOpen,
  onClose,
  documentId,
  userRole,
  getDocumentVersions,
  restoreDocumentVersion,
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const canRestore = userRole === "Owner" || userRole === "Editor";

  useEffect(() => {
    if (!isOpen || !documentId) return;

    const fetchVersions = async (page = 1) => {
      try {
        setLoading(true);
        setError("");
        const data = await getDocumentVersions(documentId, { page, limit: 20 });
        setVersions(data.versions || []);
        setPagination(data.pagination || {});
        setCurrentPage(page);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load version history."));
      } finally {
        setLoading(false);
      }
    };

    fetchVersions(1);
  }, [isOpen, documentId, getDocumentVersions]);

  const handleRestore = async (versionNumber) => {
    if (!canRestore) return;
    if (!window.confirm(`Are you sure you want to restore this document to version ${versionNumber}? This will create a new version with the restored content.`)) return;

    try {
      setRestoring(versionNumber);
      setError("");
      const result = await restoreDocumentVersion(documentId, versionNumber);
      setVersions((prev) => {
        const newVersion = {
          _id: `new-${Date.now()}`,
          versionNumber: result.versionNumber || prev[0]?.versionNumber + 1,
          title: result.title,
          content: result.content,
          author: result.author,
          createdAt: new Date().toISOString(),
          changeDescription: `Restored from version ${versionNumber}`,
          isAutosave: false,
        };
        return [newVersion, ...prev];
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to restore version."));
    } finally {
      setRestoring(null);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDocumentVersions(documentId, { page, limit: 20 });
        setVersions(data.versions || []);
        setPagination(data.pagination || {});
        setCurrentPage(page);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load versions."));
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getContentPreview = (content) => {
    if (!content) return "Empty document";
    const text = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Version History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pagination.total} versions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body - Version List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && versions.length === 0 ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : versions.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No version history yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Versions are created when you save the document.
            </p>
          </div>
        ) : (
          <>
            {versions.map((version, index) => {
              const isLatest = index === 0;
              const isAuto = version.isAutosave;
              return (
                <div
                  key={version._id || version.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLatest
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            v{version.versionNumber}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                              Current
                            </span>
                          )}
                          {isAuto && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                              Auto-save
                            </span>
                          )}
                        </div>
                        <UserAvatar user={version.author} size="xs" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {version.author?.name || version.author?.email || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.createdAt)}
                        </span>
                        {version.changeDescription && (
                          <span className="truncate max-w-[200px]">
                            {version.changeDescription}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg max-h-16 overflow-hidden">
                        {getContentPreview(version.content)}
                      </p>
                    </div>

                    {canRestore && !isLatest && !restoring && (
                      <button
                        onClick={() => handleRestore(version.versionNumber)}
                        className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors shrink-0"
                        title="Restore this version"
                      >
                        <RotateCcw className="w-4.5 h-4.5" />
                      </button>
                    )}

                    {restoring === version.versionNumber && (
                      <div className="p-2 shrink-0">
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-purple-600" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {pagination.hasNextPage && (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading}
                className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-colors disabled:opacity-50"
              >
                Load more versions
              </button>
            )}
          </>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Versions are saved at meaningful milestones — after significant edits, when you leave, or on manual save.
        </p>
      </div>
    </div>
  );
};

export default VersionHistoryDrawer;