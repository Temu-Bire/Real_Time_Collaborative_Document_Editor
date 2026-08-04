import api from "./api";

export const getNotifications = async (params = {}) => {
  const response = await api.get("/notifications", { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post("/notifications/read-all");
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
