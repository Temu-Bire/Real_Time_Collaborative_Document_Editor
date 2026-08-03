const User = require("../../auth/models/User");
const { asyncHandler, buildPaginationResponse } = require("../../../shared/utils");
const { logger } = require("../../../shared/utils/logger");

const userService = {
  async getProfile(userId) {
    const user = await User.findById(userId).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -refreshToken -refreshTokenExpires"
    );
    if (!user) throw new Error("User not found");
    return { user };
  },

  async updateProfile(userId, updateData) {
    const allowedFields = ["name", "profilePicture"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) updates[field] = updateData[field];
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -refreshToken -refreshTokenExpires"
    );

    if (!user) throw new Error("User not found");
    logger.info({ userId }, "Profile updated");
    return { user };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const bcrypt = require("bcryptjs");
    const authConfig = require("../../../config/auth");

    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) {
      throw new Error("Cannot change password for Google accounts");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcrypt.rounds);
    user.password = hashedPassword;
    await user.save();

    // Revoke all refresh tokens to force re-login
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save();

    logger.info({ userId }, "Password changed");
    return { message: "Password changed successfully" };
  },

  async getAllUsers({ page = 1, limit = 20, search = "" } = {}) {
    const skip = (page - 1) * limit;
    const query = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -refreshToken -refreshTokenExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      users,
      pagination: buildPaginationResponse(total, page, limit),
    };
  },

  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error("User not found");
    logger.info({ userId }, "User deleted");
    return { message: "User deleted successfully" };
  },
};

module.exports = userService;