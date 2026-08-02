import { FileText } from "lucide-react";

const EditorStats = ({ wordCount, charCount }) => (
  <div className="w-full max-w-4xl mt-6 px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-indigo-500" />
        {wordCount} words
      </span>
      <span>{charCount} characters</span>
    </div>

    <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-center sm:text-right">
      <span className="hidden xs:inline">Standard Letter Canvas (8.5&quot; x 11&quot;)</span>
      <span className="xs:hidden">Letter Canvas</span>
    </div>
  </div>
);

export default EditorStats;
