import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Cloud,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  FileQuestion,
} from "lucide-react";

import TextEditor from "../../components/editor/TextEditor";
import EditableTitle from "../../components/editor/EditableTitle";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import UserAvatar from "../../components/common/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useDocuments } from "../../context/DocumentContext";
import { getErrorMessage } from "../../utils/getErrorMessage";

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { getDocumentById, updateDocument } = useDocuments();

  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved ✓");
  const [error, setError] = useState("");

  const isInitialLoad = useRef(true);

  useEffect(() => {
    document.title = `${title || "Untitled"} - SyncWrite`;
  }, [title]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setError("");
        const doc = await getDocumentById(id);
        if (doc) {
          setTitle(doc.title || "Untitled Document");
          setContent(doc.content || "");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getErrorMessage(err, "Failed to load document."));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, getDocumentById]);

  const saveDocument = useCallback(
    async (updatedTitle = title, updatedContent = content) => {
      try {
        setSaving(true);
        setSaveStatus("Saving...");
        setError("");

        await updateDocument(id, {
          title: updatedTitle,
          content: updatedContent,
        });

        setSaveStatus("Saved ✓");
      } catch (err) {
        setSaveStatus("Save failed ✕");
        setError(getErrorMessage(err, "Failed to save document."));
      } finally {
        setSaving(false);
      }
    },
    [id, title, content, updateDocument]
  );

  useEffect(() => {
    if (loading || notFound) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setSaveStatus("Unsaved changes...");
    const timer = setTimeout(() => {
      saveDocument(title, content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, loading, notFound, saveDocument]);

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

  const renderSaveStatus = () => {
    if (saving) {
      return (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span className="hidden xs:inline">Saving...</span>
        </>
      );
    }
    if (saveStatus.includes("Saved")) {
      return (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden xs:inline">{saveStatus}</span>
        </>
      );
    }
    return (
      <>
        <Cloud className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden xs:inline">{saveStatus}</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <FileQuestion className="w-16 h-16 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Document not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          This document may have been deleted or you do not have permission to view it.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/95 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 px-3 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0 flex-1">
            <button
              type="button"
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

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400"
              title={saveStatus}
            >
              {renderSaveStatus()}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2 text-xs font-semibold"
              title={`Active Theme: ${theme.toUpperCase()}`}
            >
              {renderThemeIcon()}
              <span className="capitalize hidden md:inline">{theme}</span>
            </button>

            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <ErrorAlert message={error} onDismiss={() => setError("")} />
        </div>
      )}

      <main className="flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-y-auto p-3 sm:p-10 flex justify-center">
        <div className="w-full max-w-4xl flex justify-center">
          <TextEditor content={content} setContent={setContent} />
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor;
