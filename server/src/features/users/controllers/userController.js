const userService = require("../services/userService");
const { asyncHandler } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const userController = {
  getProfile: asyncHandler(async (req, res) => {
    const result = await userService.getProfile(req.user.userId);
    res.status(200).json({ success: true, data: result });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const result = await userService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", data: result });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Current password and new password are required" },
      });
    }
    const result = await userService.changePassword(req.user.userId, currentPassword, newPassword);
    res.status(200).json({ success: true, message: result.message });
  }),

  getAllUsers: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || "";
    const result = await userService.getAllUsers({ page, limit, search });
    res.status(200).json({ success: true, data: result });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  }),
};

module.exports = userController;