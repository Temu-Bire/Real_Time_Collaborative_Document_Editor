const User = require("../models/User");
const { logger } = require("../../../shared/utils/logger");
const authConfig = require("../../../config/auth");

const authRepository = {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
  },

  async findById(userId) {
    return User.findById(userId).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil"
    );
  },

  async findByGoogleId(googleId) {
    return User.findOne({ googleId }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
  },

  async findByVerificationToken(token) {
    return User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
  },

  async findByResetToken(hashedToken) {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
  },

  async create(userData) {
    const user = await User.create(userData);
    logger.info({ userId: user._id, email: user.email }, "User created");
    return user;
  },

  async update(userId, updateData) {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil"
    );
    logger.info({ userId }, "User updated");
    return user;
  },

  async updateWithSensitiveFields(userId, updateData) {
    // Mongoose silently drops `undefined` values, which would leave token
    // fields in place. Convert them into $unset so consumed verification and
    // reset tokens are actually cleared from the document.
    const setFields = {};
    const unsetFields = {};
    Object.entries(updateData || {}).forEach(([key, value]) => {
      if (value === undefined) {
        unsetFields[key] = "";
      } else {
        setFields[key] = value;
      }
    });

    const update = {
      ...(Object.keys(setFields).length > 0 && { $set: setFields }),
      ...(Object.keys(unsetFields).length > 0 && { $unset: unsetFields }),
    };

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
    logger.info({ userId }, "User updated with sensitive fields");
    return user;
  },

  async incrementLoginAttempts(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { loginAttempts: 1 },
        $set: {
          lockUntil:
            Date.now() + authConfig.accountLockout.lockoutDurationMs,
        },
      },
      { new: true }
    ).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
    logger.warn({ userId, attempts: user?.loginAttempts }, "Login attempts incremented");
    return user;
  },

  async resetLoginAttempts(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { loginAttempts: 0, lockUntil: null } },
      { new: true }
    ).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil"
    );
    logger.info({ userId }, "Login attempts reset");
    return user;
  },

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { lastLoginAt: new Date() } },
      { new: true }
    ).select(
      "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil"
    );
  },

  async deleteRefreshToken(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $unset: { refreshToken: 1, refreshTokenExpires: 1 } },
      { new: true }
    );
  },

  async storeRefreshToken(userId, hashedRefreshToken, expiresAt) {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: {
          refreshToken: hashedRefreshToken,
          refreshTokenExpires: expiresAt,
        },
      },
      { new: true }
    );
  },

  async findByRefreshToken(hashedRefreshToken) {
    return User.findOne({
      refreshToken: hashedRefreshToken,
      refreshTokenExpires: { $gt: Date.now() },
    }).select(
      "+password +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires +loginAttempts +lockUntil +refreshToken +refreshTokenExpires"
    );
  },

  async revokeAllRefreshTokens(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $unset: { refreshToken: 1, refreshTokenExpires: 1 } },
      { new: true }
    );
  },
};

module.exports = authRepository;