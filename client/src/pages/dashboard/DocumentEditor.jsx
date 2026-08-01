import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Cloud, Loader2, Sun, Moon, Sparkles } from "lucide-react";
import {
  getDocumentById,
  updateDocument,
} from "../../services/documentService";

import TextEditor from "../../components/editor/TextEditor";
import EditableTitle from "../../components/editor/EditableTitle";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import UserAvatar from "../../components/common/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved ✓");

  const isInitialLoad = useRef(true);

  // Sync browser document title
  useEffect(() => {
    document.title = `${title || "Untitled"} - SyncWrite`;
  }, [title]);

  // Load document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const doc = await getDocumentById(id);
        if (doc) {
          setTitle(doc.title || "Untitled Document");
          setContent(doc.content || "");
        }
      } catch (error) {
        console.error("Failed to load document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Save document handler
  const saveDocument = useCallback(
    async (updatedTitle = title, updatedContent = content) => {
      try {
        setSaving(true);
        setSaveStatus("Saving...");

        await updateDocument(id, {
          title: updatedTitle,
          content: updatedContent,
        });

        setSaveStatus("Saved ✓");
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus("Save failed ✕");
      } finally {
        setSaving(false);
      }
    },
    [id, title, content]
  );

  // Auto save debounce
  useEffect(() => {
    if (loading) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setSaveStatus("Unsaved changes...");
    const timer = setTimeout(() => {
      saveDocument(title, content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, loading, saveDocument]);

  const handleTitleSave = (newTitle) => {
    setTitle(newTitle);
    saveDocument(newTitle, content);
  };

  const renderThemeIcon = () => {
    if (resolvedTheme === "night") {
      return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="w-4 h-4 text-indigo-400" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Navbar Toolbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <EditableTitle
              title={title}
              onTitleChange={setTitle}
              onTitleSave={handleTitleSave}
            />
          </div>

          {/* Right: Status & Theme & User */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Saving...</span>
                </>
              ) : saveStatus.includes("Saved") ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{saveStatus}</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-amber-500" />
                  <span>{saveStatus}</span>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-semibold"
              title={`Active Theme: ${theme.toUpperCase()} (Click to toggle Light / Dark / Night)`}
            >
              {renderThemeIcon()}
              <span className="capitalize hidden sm:inline">{theme}</span>
            </button>

            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </header>

      {/* Editor Canvas Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex justify-center">
        <TextEditor content={content} setContent={setContent} />
      </main>
    </div>
  );
};

export default DocumentEditor;