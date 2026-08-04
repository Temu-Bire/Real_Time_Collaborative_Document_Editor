import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Download,
  Upload,
  FileDown,
  Search,
  Keyboard,
  ChevronDown,
} from "lucide-react";

const FileMenu = ({
  onSave,
  onExportPdf,
  onExportMarkdown,
  onImportMarkdown,
  onFind,
  onShowShortcuts,
  canEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: "Save now",
      shortcut: "Ctrl S",
      icon: <Check className="w-4 h-4" />,
      disabled: !canEdit,
      onClick: () => {
        setIsOpen(false);
        onSave();
      },
    },
    {
      label: "Export as PDF",
      shortcut: "Ctrl P",
      icon: <FileDown className="w-4 h-4" />,
      onClick: () => {
        setIsOpen(false);
        onExportPdf();
      },
    },
    {
      label: "Export as Markdown",
      shortcut: "Ctrl Shift E",
      icon: <Download className="w-4 h-4" />,
      onClick: () => {
        setIsOpen(false);
        onExportMarkdown();
      },
    },
    {
      label: "Import Markdown…",
      shortcut: "Ctrl Shift I",
      icon: <Upload className="w-4 h-4" />,
      onClick: () => {
        setIsOpen(false);
        onImportMarkdown();
      },
    },
    {
      label: "Find in document",
      shortcut: "Ctrl F",
      icon: <Search className="w-4 h-4" />,
      onClick: () => {
        setIsOpen(false);
        onFind();
      },
    },
    {
      label: "Keyboard shortcuts",
      shortcut: "Ctrl /",
      icon: <Keyboard className="w-4 h-4" />,
      onClick: () => {
        setIsOpen(false);
        onShowShortcuts();
      },
    },
  ];

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs transition-colors cursor-pointer"
        title="File menu"
      >
        File
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 font-medium transition ${
                item.disabled
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              } ${index === 0 ? "border-b border-slate-100 dark:border-slate-700/80" : ""}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <kbd className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {item.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileMenu;
