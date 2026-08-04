const Notification = require("../models/Notification");
const { buildPaginationResponse } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");
const { emitToUser } = require("../../../shared/socketEmitter");

const notificationService = {
  /**
   * Create a notification and push it to the recipient in real time.
   */
  async create({ recipientId, actorId, type, documentId = null, title = "", message = "" }) {
    if (!recipientId) return null;
    if (actorId && String(recipientId) === String(actorId)) return null;

    let notification;
    try {
      notification = await Notification.create({
        recipient: recipientId,
        actor: actorId || undefined,
        type,
        document: documentId || undefined,
        title: String(title).slice(0, 200),
        message: String(message).slice(0, 500),
      });
    } catch (err) {
      logger.warn({ error: err.message }, "Failed to create notification");
      return null;
    }

    const populated = await Notification.findById(notification._id)
      .populate("actor", "name email profilePicture")
      .lean();

    emitToUser(recipientId, "notification:new", populated);

    return populated;
  },

  async getNotifications(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.find({ recipient: userId })
        .populate("actor", "name email profilePicture")
        .populate("document", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      notifications,
      pagination: buildPaginationResponse(total, page, limit),
    };
  },

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, read: false });
  },

  async markRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    )
      .populate("actor", "name email profilePicture")
      .populate("document", "title")
      .lean();

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  },

  async markAllRead(userId) {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );
    return { success: true };
  },
};

module.exports = notificationService;
