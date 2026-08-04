import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import notificationService from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const getAccessToken = () => localStorage.getItem("accessToken") || "";

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 25 });
      const items = res?.data?.notifications ?? [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll unread count periodically as a fallback for the socket.
  useEffect(() => {
    if (!user) return;
    refreshUnread();
    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, [user, refreshUnread]);

  // Real-time notification channel.
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect_error", () => {
      // Token may be stale; polling fallback keeps the badge updated.
    });

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 60));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const markRead = useCallback(
    async (notificationId) => {
      try {
        await notificationService.markNotificationRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    refreshUnread,
    markRead,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
