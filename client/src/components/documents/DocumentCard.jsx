import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Copy, Check, X, FileText, Trash2, Share2, Users } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { normalizeDocument } from "../../utils/documentUtils";

const ROLE_BADGE = {
  Owner: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  Editor: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Commenter: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Viewer: "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

const DocumentCard = ({ document: rawDoc, onDelete, onRename, onDuplicate, onShare }) => {
  const navigate = useNavigate();
  const doc = normalizeDocument(rawDoc);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(doc.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = doc.isOwner !== false;
  const userRole = doc.userRole || (isOwner ? "Owner" : "Viewer");
  const isSharedWithMe = !isOwner;

  const handleSaveRename = (e) => {
    e.stopPropagation();
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== doc.title) {
      onRename(doc.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setNewTitle(doc.title);
    setIsRenaming(false);
  };

  const handleConfirmDelete = async (e) => {
    e?.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(doc.id);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const cardCursor = !isRenaming ? "cursor-pointer" : "cursor-default";

  return (
    <>
      <div
        onClick={() => !isRenaming && navigate(`/documents/${doc.id}`)}
        className={`relative group p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4 min-h-[150px] ${cardCursor}`}
      >
        {/* Shared-with-me banner */}
        {isSharedWithMe && (
          <div className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700 rounded-t-2xl">
            <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Shared with you
            </span>
          </div>
        )}

        <div className={`flex items-start justify-between gap-2 ${isSharedWithMe ? "mt-5" : ""}`}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />

            {isRenaming && isOwner ? (
              <div
                className="flex items-center gap-1 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveRename(e)}
                  className="w-full text-sm font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md border border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {doc.title || "Untitled Document"}
              </h3>
            )}
          </div>

          {/* Action buttons — shown on hover */}
          {!isRenaming && (
            <div
              className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Rename Document"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Duplicate Document"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {onShare && (
                    <button
                      type="button"
                      onClick={() => onShare(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Share Document"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer: date + role badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Updated {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${ROLE_BADGE[userRole] || ROLE_BADGE.Viewer}`}
          >
            {userRole}
          </span>
        </div>
      </div>

      {isOwner && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          message={`Are you sure you want to delete "${doc.title || "Untitled Document"}"? This action cannot be undone.`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          loading={deleting}
        />
      )}
    </>
  );
};

export default DocumentCard;
