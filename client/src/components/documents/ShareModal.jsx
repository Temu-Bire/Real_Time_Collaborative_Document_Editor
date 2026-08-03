import { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  UserPlus,
  Trash2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import { getErrorMessage } from "../../utils/getErrorMessage";

const ShareModal = ({
  isOpen,
  onClose,
  document,
  onShare,
  onUpdateRole,
  onRemoveCollaborator,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await onShare(document.id, email.trim(), role);
      setSuccess(`Successfully invited ${email} as ${role}`);
      setEmail("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to share document."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/documents/${document.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = document.isOwner !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Share Document
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                {document.title || "Untitled Document"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add collaborator form */}
          {isOwner ? (
            <form onSubmit={handleShare} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="enter.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Commenter">Commenter</option>
                  <option value="Editor">Editor</option>
                </select>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Invite</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs rounded-xl">
              Only the document owner can invite new collaborators.
            </div>
          )}

          {/* Current Owner & Collaborators list */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              People with Access
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {/* Owner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <UserAvatar user={document.owner} size="sm" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {document.owner?.name || document.owner?.email || "Owner"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {document.owner?.email}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                  Owner
                </span>
              </div>

              {/* Collaborators */}
              {document.collaborators?.map((collab) => {
                const u = collab.user;
                if (!u) return null;
                const userId = u._id || u.id;

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} size="sm" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {u.name || u.email}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={collab.role}
                            onChange={(e) => onUpdateRole(document.id, userId, e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg font-semibold"
                          >
                            <option value="Viewer">Viewer</option>
                            <option value="Commenter">Commenter</option>
                            <option value="Editor">Editor</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onRemoveCollaborator(document.id, userId)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md">
                          {collab.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Share link with collaborators
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
