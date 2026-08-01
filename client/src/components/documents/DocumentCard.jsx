import { useNavigate } from "react";
import { useNavigate as useNav } from "react-router-dom";
import { Trash2, FileText, Clock, ExternalLink } from "lucide-react";

const stripHtml = (html = "") => {
  return html.replace(/<[^>]*>/g, "").trim();
};

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNav();
  const plainText = stripHtml(document.content);

  const formattedDate = new Date(document.updatedAt).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div
      onClick={() => navigate(`/documents/${document._id}`)}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-indigo-50 dark:bg-indigo-950/60 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5 shrink-0" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {document.title || "Untitled Document"}
            </h2>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
        </div>

        {/* Content Snippet */}
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-6 line-clamp-4 min-h-[4.5rem] font-sans">
          {plainText || "Empty document — click to start writing..."}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {formattedDate}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(
                `Are you sure you want to delete "${document.title}"?`
              )
            ) {
              onDelete(document._id);
            }
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;