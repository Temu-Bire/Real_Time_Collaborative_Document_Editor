import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Cloud,
  Loader2,
  FileQuestion,
  Sun,
  Moon,
  Share2,
  MessageSquare,
  History,
} from "lucide-react";

import TextEditor from "../../components/editor/TextEditor";
import EditableTitle from "../../components/editor/EditableTitle";
import PresencePanel from "../../components/editor/PresencePanel";
import ShareModal from "../../components/documents/ShareModal";
import CommentsDrawer from "../../components/editor/CommentsDrawer";
import VersionHistoryDrawer from "../../components/editor/VersionHistoryDrawer";
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
  const { isDark, toggleTheme } = useTheme();
  const {
    getDocumentById,
    updateDocument,
    shareDocument,
    updateCollaboratorRole,
    removeCollaborator,
    getComments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    getDocumentVersions,
    restoreDocumentVersion,
  } = useDocuments();

  const [documentData, setDocumentData] = useState(null);
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [userRole, setUserRole] = useState("Viewer");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved ✓");
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentClientId, setCurrentClientId] = useState(null);

  // Modals / Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const isInitialLoad = useRef(true);
  const isReadOnly = userRole === "Viewer" || userRole === "Commenter";

  const handlePresenceChange = useCallback((users, clientId) => {
    setOnlineUsers(users);
    setCurrentClientId(clientId);
  }, []);

  useEffect(() => {
    document.title = `${title || "Untitled"} - SyncWrite`;
  }, [title]);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      setError("");
      const doc = await getDocumentById(id);
      if (doc) {
        setDocumentData(doc);
        setTitle(doc.title || "Untitled Document");
        setContent(doc.content || "");
        setUserRole(doc.userRole || (doc.isOwner ? "Owner" : "Viewer"));
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setNotFound(true);
      } else {
        setError(getErrorMessage(err, "Failed to load document."));
      }
    } finally {
      setLoading(false);
    }
  }, [id, getDocumentById]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const saveDocument = useCallback(
    async (updatedTitle = title, updatedContent = content, changeDescription) => {
      if (isReadOnly) return;
      try {
        setSaving(true);
        setSaveStatus("Saving...");
        setError("");

        const updatedDoc = await updateDocument(id, {
          title: updatedTitle,
          content: updatedContent,
          changeDescription,
        });

        if (updatedDoc) {
          setDocumentData((prev) => ({ ...prev, ...updatedDoc }));
        }

        setSaveStatus("Saved ✓");
      } catch (err) {
        setSaveStatus("Save failed ✕");
        setError(getErrorMessage(err, "Failed to save document."));
      } finally {
        setSaving(false);
      }
    },
    [id, title, content, updateDocument, isReadOnly]
  );

  useEffect(() => {
    if (loading || notFound || isReadOnly) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setSaveStatus("Unsaved changes...");
    const timer = setTimeout(() => {
      saveDocument(title, content, "Auto-save");
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, loading, notFound, saveDocument, isReadOnly]);

  const handleTitleSave = (newTitle) => {
    if (isReadOnly) return;
    setTitle(newTitle);
    saveDocument(newTitle, content, "Title changed");
  };

  const handleShareSubmit = async (docId, email, role) => {
    const updated = await shareDocument(docId, email, role);
    setDocumentData(updated);
  };

  const handleUpdateRole = async (docId, collaboratorId, role) => {
    const updated = await updateCollaboratorRole(docId, collaboratorId, role);
    setDocumentData(updated);
  };

  const handleRemoveCollaborator = async (docId, collaboratorId) => {
    const updated = await removeCollaborator(docId, collaboratorId);
    setDocumentData(updated);
  };

  const renderRoleBadge = () => {
    switch (userRole) {
      case "Owner":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0">
            Owner
          </span>
        );
      case "Editor":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
            Editor
          </span>
        );
      case "Commenter":
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 shrink-0">
            Commenter
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
            Viewer
          </span>
        );
    }
  };

  const renderSaveStatus = () => {
    if (isReadOnly) return null;
    if (saving) {
      return (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <FileQuestion className="w-16 h-16 text-slate-400 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
          Document not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          This document may have been deleted or you do not have permission to access it.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-md cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Fixed Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="max-w-full px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left section: Back button & Title */}
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="p-2 border-none rounded-full bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <EditableTitle
              title={title}
              onTitleChange={setTitle}
              onTitleSave={handleTitleSave}
              isReadOnly={isReadOnly}
            />

            {renderRoleBadge()}
          </div>

          {/* Right section: Online users, Save status, Share, Comments, Version History, Theme, User Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <PresencePanel users={onlineUsers} currentUserId={currentClientId} />

            {renderSaveStatus() && (
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300"
                title={saveStatus}
              >
                {renderSaveStatus()}
              </div>
            )}

            {/* Share button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Share Document & Permissions"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Comments button */}
            <button
              type="button"
              onClick={() => setIsCommentsDrawerOpen((prev) => !prev)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              title="Comments & Notes"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Version History button */}
            <button
              type="button"
              onClick={() => setIsVersionHistoryOpen(true)}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              title="Version History"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-full bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-3">
          <ErrorAlert message={error} onDismiss={() => setError("")} />
        </div>
      )}

      {/* Main Canvas Container */}
      <main className="flex-1 w-full overflow-y-auto px-4 py-6 flex justify-center">
        <TextEditor
          key={id}
          content={content}
          setContent={setContent}
          documentId={id}
          userName={user?.name || user?.email || "Anonymous"}
          userId={user?.id || user?._id}
          isReadOnly={isReadOnly}
          onPresenceChange={handlePresenceChange}
        />
      </main>

      {/* Modals & Drawers */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={documentData || { id, title, isOwner: userRole === "Owner" }}
        onShare={handleShareSubmit}
        onUpdateRole={handleUpdateRole}
        onRemoveCollaborator={handleRemoveCollaborator}
      />

      <CommentsDrawer
        isOpen={isCommentsDrawerOpen}
        onClose={() => setIsCommentsDrawerOpen(false)}
        documentId={id}
        userRole={userRole}
        currentUserId={user?.id || user?._id}
        getComments={getComments}
        addComment={addComment}
        updateComment={updateComment}
        deleteComment={deleteComment}
        resolveComment={resolveComment}
        unresolveComment={unresolveComment}
      />

      <VersionHistoryDrawer
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        documentId={id}
        userRole={userRole}
        getDocumentVersions={getDocumentVersions}
        restoreDocumentVersion={restoreDocumentVersion}
      />
    </div>
  );
};

export default DocumentEditor;