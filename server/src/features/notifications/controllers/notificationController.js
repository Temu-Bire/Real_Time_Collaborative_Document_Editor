const notificationService = require("../services/notificationService");
const { asyncHandler } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await notificationService.getNotifications(req.user.userId, {
      page,
      limit,
    });

    res.status(200).json({ success: true, data: result });
  }),

  getUnreadCount: asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.status(200).json({ success: true, data: { unreadCount: count } });
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(
      req.user.userId,
      req.params.id
    );
    res.status(200).json({ success: true, data: { notification } });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user.userId);
    res.status(200).json({ success: true });
  }),
};

module.exports = notificationController;
