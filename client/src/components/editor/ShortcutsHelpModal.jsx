import { X } from "lucide-react";

const SHORTCUTS = [
  { keys: "Ctrl/Cmd + B", action: "Bold" },
  { keys: "Ctrl/Cmd + I", action: "Italic" },
  { keys: "Ctrl/Cmd + U", action: "Underline" },
  { keys: "Ctrl/Cmd + Z", action: "Undo" },
  { keys: "Ctrl/Cmd + Shift + Z", action: "Redo" },
  { keys: "Ctrl/Cmd + S", action: "Save document" },
  { keys: "Ctrl/Cmd + P", action: "Export to PDF" },
  { keys: "Ctrl/Cmd + Shift + E", action: "Export to Markdown" },
  { keys: "Ctrl/Cmd + Shift + I", action: "Import Markdown" },
  { keys: "Ctrl/Cmd + F", action: "Find in document" },
  { keys: "Ctrl/Cmd + /", action: "Show this help" },
  { keys: "Esc", action: "Close dialogs / find" },
  { keys: "Ctrl/Cmd + Enter", action: "Insert page break" },
  { keys: "Mod + K", action: "Focus document search (dashboard)" },
];

const ShortcutsHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="shortcuts-modal w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <ul className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <li
                key={shortcut.keys}
                className="flex items-center justify-between gap-4 py-1.5"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {shortcut.action}
                </span>
                <kbd className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 whitespace-nowrap">
                  {shortcut.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpModal;
