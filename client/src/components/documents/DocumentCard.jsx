import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Copy, Check, X, FileText, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { normalizeDocument } from "../../utils/documentUtils";

const DocumentCard = ({ document: rawDoc, onDelete, onRename, onDuplicate }) => {
  const navigate = useNavigate();
  const doc = normalizeDocument(rawDoc);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(doc.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(doc.id);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => !isRenaming && navigate(`/documents/${doc.id}`)}
        className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between gap-4 min-h-[140px]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />

            {isRenaming ? (
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

          {!isRenaming && (
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
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
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500">
          Updated {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        message={`Are you sure you want to delete "${doc.title || "Untitled Document"}"? This action cannot be undone.`}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </>
  );
};

export default DocumentCard;
