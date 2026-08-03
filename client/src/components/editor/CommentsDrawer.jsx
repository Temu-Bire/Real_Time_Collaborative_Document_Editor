import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader2, ShieldAlert, RotateCcw, Trash2, CheckCircle, ChevronDown, ChevronUp, Reply, Edit2 } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import { getErrorMessage } from "../../utils/getErrorMessage";

const CommentsDrawer = ({
  isOpen,
  onClose,
  documentId,
  userRole,
  currentUserId,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  unresolveComment,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  const canComment = userRole === "Owner" || userRole === "Editor" || userRole === "Commenter";
  const canManageComments = userRole === "Owner" || userRole === "Editor";

  const commentActionsRef = useRef(new Map());

  useEffect(() => {
    if (!isOpen || !documentId) return;

    const fetchCommentsList = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getComments(documentId);
        setComments(data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load comments."));
      } finally {
        setLoading(false);
      }
    };

    fetchCommentsList();
  }, [isOpen, documentId, getComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment || posting) return;

    try {
      setPosting(true);
      setError("");
      const comment = await addComment(documentId, newComment.trim(), replyingTo);
      if (replyingTo) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === replyingTo || c.id === replyingTo
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          )
        );
        setReplyingTo(null);
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setNewComment("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to post comment."));
    } finally {
      setPosting(false);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyContent.trim() || !canComment || posting) return;

    try {
      setPosting(true);
      setError("");
      const comment = await addComment(documentId, replyContent.trim(), parentId);
      setComments((prev) =>
        prev.map((c) =>
          c._id === parentId || c.id === parentId
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        )
      );
      setReplyingTo(null);
      setReplyContent("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to post reply."));
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      setError("");
      const comment = await updateComment(documentId, commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId || c.id === commentId
            ? comment
            : {
                ...c,
                replies: c.replies?.map((r) =>
                  r._id === commentId || r.id === commentId ? comment : r
                ),
              }
        )
      );
      setEditingCommentId(null);
      setEditContent("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update comment."));
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment? Replies will also be deleted.")) return;

    try {
      setError("");
      await deleteComment(documentId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId && c.id !== commentId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete comment."));
    }
  };

  const handleResolve = async (commentId) => {
    try {
      setError("");
      const comment = await resolveComment(documentId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId || c.id === commentId
            ? comment
            : {
                ...c,
                replies: c.replies?.map((r) =>
                  r._id === commentId || r.id === commentId ? comment : r
                ),
              }
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resolve comment."));
    }
  };

  const handleUnresolve = async (commentId) => {
    try {
      setError("");
      const comment = await unresolveComment(documentId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId || c.id === commentId
            ? comment
            : {
                ...c,
                replies: c.replies?.map((r) =>
                  r._id === commentId || r.id === commentId ? comment : r
                ),
              }
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to unresolve comment."));
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const canManageComment = (comment) => {
    const isAuthor = comment.author?._id === currentUserId || comment.author?.id === currentUserId;
    return isAuthor || canManageComments;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderComment = (comment, depth = 0) => {
    const isReply = depth > 0;
    const isResolved = comment.isResolved;
    const isExpanded = expandedReplies.has(comment._id || comment.id);
    const replies = comment.replies || [];
    const showActions = canManageComment(comment);
    const isEditing = editingCommentId === (comment._id || comment.id);

    const commentStyle = isReply
      ? "ml-8 border-l-2 border-slate-200 dark:border-slate-700 pl-3"
      : "";

    return (
      <div key={comment._id || comment.id} className={`${commentStyle} relative`}>
        {isEditing ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Edit your comment..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditContent("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(comment._id || comment.id)}
                disabled={posting}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-3.5 rounded-2xl transition-all ${isResolved ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 opacity-70" : "bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <UserAvatar user={comment.author} size="xs" />
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {comment.author?.name || comment.author?.email || "Anonymous"}
                  </span>
                  {isResolved && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Resolved
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatTime(comment.createdAt)}
                    {formatDate(comment.createdAt) !== formatDate(new Date()) && (
                      <>
                        , {formatDate(comment.createdAt)}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {showActions && (
                <div className="flex items-center gap-1 shrink-0">
                  {!isResolved && canManageComments && (
                    <button
                      onClick={() => handleResolve(comment._id || comment.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                      title="Resolve comment"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {isResolved && canManageComments && (
                    <button
                      onClick={() => handleUnresolve(comment._id || comment.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors"
                      title="Unresolve comment"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {(comment.author?._id === currentUserId || comment.author?.id === currentUserId) && (
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id || comment.id);
                        setEditContent(comment.content);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                      title="Edit comment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canManageComment(comment) && (
                    <button
                      onClick={() => handleDelete(comment._id || comment.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>

            {replies.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => toggleReplies(comment._id || comment.id)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>
                </button>
              </div>
            )}

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {replies.map((reply) => renderComment(reply, depth + 1))}
                {canComment && (
                  <div className="mt-2 flex gap-2">
                    <UserAvatar user={{ name: "You" }} size="xs" />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleReplySubmit(comment._id || comment.id)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleReplySubmit(comment._id || comment.id)}
                        disabled={posting || !replyContent.trim()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 shrink-0"
                        title="Send reply"
                      >
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Comments & Notes
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
            {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body - Comment List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No comments on this document yet.
            </p>
            {canComment && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Start a discussion below.
              </p>
            )}
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Drawer Footer - New Comment Form */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800">
        {canComment ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <UserAvatar user={{ name: "You" }} size="xs" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                title="Send comment"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-1">
            You are viewing this document in Read-only mode.
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsDrawer;