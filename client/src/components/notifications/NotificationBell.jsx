import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Share2,
  MessageSquare,
  Reply,
  ShieldCheck,
  Loader2,
  Inbox,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import UserAvatar from "../common/UserAvatar";
import { timeAgo } from "../../utils/timeAgo";

const TYPE_ICONS = {
  document_shared: <Share2 className="w-4 h-4 text-indigo-500" />,
  role_changed: <ShieldCheck className="w-4 h-4 text-amber-500" />,
  comment: <MessageSquare className="w-4 h-4 text-emerald-500" />,
  reply: <Reply className="w-4 h-4 text-violet-500" />,
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const handleOpen = (notification) => {
    if (!notification.read) markRead(notification._id);
    setIsOpen(false);
    if (notification.document?._id) {
      navigate(`/documents/${notification.document._id}`);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-semibold text-red-500">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const isUnread = !notification.read;
                  return (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => handleOpen(notification)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                          isUnread
                            ? "bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {notification.actor ? (
                            <UserAvatar user={notification.actor} size="xs" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                              {TYPE_ICONS[notification.type] || (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {notification.actor?.name || "Someone"}
                            </span>{" "}
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {timeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
