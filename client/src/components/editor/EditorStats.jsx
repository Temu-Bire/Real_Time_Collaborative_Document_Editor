import { FileText } from "lucide-react";
const EditorStats = ({ wordCount, charCount }) => (
  <div className="w-full max-w-[210mm] mt-5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3 shadow-xs">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        <FileText className="w-3.5 h-3.5 text-indigo-500" />
        {wordCount} words
      </span>
      <span className="flex items-center gap-1.5">{charCount} characters</span>
    </div>

    <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-right">
      <span className="hidden sm:inline">A4 Page (210 × 297 mm)</span>
      <span className="sm:hidden">A4 Page</span>
    </div>
  </div>
);

export default EditorStats;
