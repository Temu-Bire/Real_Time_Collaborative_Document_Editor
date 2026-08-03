const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const authRepository = require("../repositories/authRepository");
const {
  generateTokenPair,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} = require("../../../shared/utils/tokenUtils");
const { logger } = require("../../../shared/utils/logger");
const authConfig = require("../../../config/auth");

const googleClient = new OAuth2Client(authConfig.google.clientId);

const userPublicFields = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture,
  isEmailVerified: user.isEmailVerified,
  authProvider: user.authProvider,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const calculateRefreshTokenExpiry = () => {
  const days = parseInt(REFRESH_TOKEN_EXPIRY.replace("d", ""), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const authService = {
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      error.code = "USER_EXISTS";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.rounds);

    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpires = new Date(
      Date.now() + authConfig.emailVerification.tokenExpiryHours * 60 * 60 * 1000
    );

    const user = await authRepository.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    // TODO: Send verification email using email service
    // await emailService.sendVerificationEmail(user.email, verificationToken);
    logger.info(
      { userId: user._id, email: user.email },
      "Registration successful, verification email would be sent"
    );

    return {
      message: "User registered successfully. Please verify your email.",
      user: userPublicFields(user),
      // In development, return token for testing
      ...(process.env.NODE_ENV !== "production" && { verificationToken }),
    };
  },

  async login({ email, password, userAgent, ip }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await authRepository.findByEmail(normalizedEmail);
    if (!user || !user.password) {
      logger.warn({ email: normalizedEmail, ip }, "Login failed: user not found or no password");
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn({ userId: user._id, ip }, "Login failed: account locked");
      const error = new Error("Account temporarily locked due to too many failed attempts. Please try again later.");
      error.statusCode = 429;
      error.code = "ACCOUNT_LOCKED";
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await authRepository.incrementLoginAttempts(user._id);
      logger.warn({ userId: user._id, ip }, "Login failed: invalid password");
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // Reset login attempts on successful login
    await authRepository.resetLoginAttempts(user._id);
    await authRepository.updateLastLogin(user._id);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id,
      email: user.email,
      authProvider: user.authProvider,
    });

    // Store hashed refresh token
    const hashedRefreshToken = hashToken(refreshToken);
    const refreshTokenExpires = calculateRefreshTokenExpiry();
    await authRepository.storeRefreshToken(user._id, hashedRefreshToken, refreshTokenExpires);

    logger.info({ userId: user._id, email: user.email }, "Login successful");

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: userPublicFields(user),
    };
  },

  async googleLogin({ idToken, access_token, userAgent, ip }) {
    let googleId, email, name, picture, emailVerified;

    if (access_token) {
      const fetch = (await import("node-fetch")).default;
      const googleRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!googleRes.ok) {
        logger.warn({ ip }, "Google login failed: invalid access token");
        const error = new Error("Invalid Google access token");
        error.statusCode = 401;
        error.code = "INVALID_GOOGLE_TOKEN";
        throw error;
      }

      const payload = await googleRes.json();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      emailVerified = payload.email_verified;
    } else if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: authConfig.google.clientId,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      emailVerified = payload.email_verified;
    } else {
      const error = new Error("Google token is required");
      error.statusCode = 400;
      error.code = "MISSING_GOOGLE_TOKEN";
      throw error;
    }

    if (!emailVerified) {
      logger.warn({ email, ip }, "Google login failed: email not verified");
      const error = new Error("Google email is not verified");
      error.statusCode = 400;
      error.code = "EMAIL_NOT_VERIFIED";
      throw error;
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await authRepository.findByGoogleId(googleId);

    if (!user) {
      const existingUser = await authRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        logger.warn({ email: normalizedEmail, ip }, "Google login failed: email already registered locally");
        const error = new Error("An account with this email already exists. Please sign in with your password.");
        error.statusCode = 409;
        error.code = "EMAIL_EXISTS_LOCAL";
        throw error;
      }

      user = await authRepository.create({
        name,
        email: normalizedEmail,
        googleId,
        profilePicture: picture,
        authProvider: "google",
        isEmailVerified: true,
      });
    }

    // Update last login
    await authRepository.updateLastLogin(user._id);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id,
      email: user.email,
      authProvider: user.authProvider,
    });

    // Store hashed refresh token
    const hashedRefreshToken = hashToken(refreshToken);
    const refreshTokenExpires = calculateRefreshTokenExpiry();
    await authRepository.storeRefreshToken(user._id, hashedRefreshToken, refreshTokenExpires);

    logger.info({ userId: user._id, email: user.email }, "Google login successful");

    return {
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: userPublicFields(user),
    };
  },

  async refreshTokens(refreshToken, userAgent, ip) {
    if (!refreshToken) {
      const error = new Error("Refresh token is required");
      error.statusCode = 400;
      error.code = "MISSING_REFRESH_TOKEN";
      throw error;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      logger.warn({ ip }, "Token refresh failed: invalid refresh token");
      const err = new Error("Invalid or expired refresh token");
      err.statusCode = 401;
      err.code = "INVALID_REFRESH_TOKEN";
      throw err;
    }

    // Check if refresh token exists in database and matches
    const hashedRefreshToken = hashToken(refreshToken);
    const user = await authRepository.findByRefreshToken(hashedRefreshToken);

    if (!user || user._id.toString() !== payload.userId) {
      logger.warn({ userId: payload.userId, ip }, "Token refresh failed: token not found or revoked");
      const error = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      error.code = "INVALID_REFRESH_TOKEN";
      throw error;
    }

    // Generate new token pair (refresh token rotation)
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user._id,
      email: user.email,
      authProvider: user.authProvider,
    });

    // Store new hashed refresh token, invalidate old one
    const hashedNewRefreshToken = hashToken(newRefreshToken);
    const refreshTokenExpires = calculateRefreshTokenExpiry();
    await authRepository.storeRefreshToken(user._id, hashedNewRefreshToken, refreshTokenExpires);

    logger.info({ userId: user._id }, "Tokens refreshed successfully");

    return {
      message: "Tokens refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(userId, refreshToken) {
    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken);
      // Only delete if it matches the current user's token
      const user = await authRepository.findByRefreshToken(hashedRefreshToken);
      if (user && user._id.toString() === userId.toString()) {
        await authRepository.deleteRefreshToken(userId);
      }
    } else {
      // Revoke all refresh tokens for this user
      await authRepository.revokeAllRefreshTokens(userId);
    }

    logger.info({ userId }, "Logout successful");
    return { message: "Logged out successfully" };
  },

  async getProfile(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return { user: userPublicFields(user) };
  },

  async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await authRepository.findByEmail(normalizedEmail);

    // Always respond success to prevent user enumeration
    if (!user || user.authProvider === "google") {
      logger.info({ email: normalizedEmail }, "Forgot password requested for non-existent or Google account");
      return {
        message: "If an account with that email exists, a reset link has been sent.",
      };
    }

    const resetToken = generateSecureToken();
    const hashedResetToken = hashToken(resetToken);
    const resetExpires = new Date(
      Date.now() + authConfig.passwordReset.tokenExpiryHours * 60 * 60 * 1000
    );

    await authRepository.updateWithSensitiveFields(user._id, {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: resetExpires,
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // TODO: Send reset email using email service
    // await emailService.sendPasswordResetEmail(user.email, resetUrl);
    logger.info({ userId: user._id, email: user.email }, "Password reset email would be sent");

    return {
      message: "If an account with that email exists, a reset link has been sent.",
      // In development, return token for testing
      ...(process.env.NODE_ENV !== "production" && { resetToken, resetUrl }),
    };
  },

  async resetPassword(token, password) {
    if (!token || !password) {
      const error = new Error("Token and password are required");
      error.statusCode = 400;
      error.code = "MISSING_TOKEN_OR_PASSWORD";
      throw error;
    }

    const hashedToken = hashToken(token);
    const user = await authRepository.findByResetToken(hashedToken);

    if (!user) {
      logger.warn("Password reset failed: invalid or expired token");
      const error = new Error("Invalid or expired reset token");
      error.statusCode = 400;
      error.code = "INVALID_RESET_TOKEN";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.rounds);

    await authRepository.updateWithSensitiveFields(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Revoke all refresh tokens to force re-login
    await authRepository.revokeAllRefreshTokens(user._id);

    logger.info({ userId: user._id }, "Password reset successful");

    return { message: "Password reset successfully" };
  },

  async resendVerification(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await authRepository.findByEmail(normalizedEmail);

    if (!user || user.authProvider === "google") {
      logger.info({ email: normalizedEmail }, "Resend verification requested for non-existent or Google account");
      return { message: "Verification email sent if account exists." };
    }

    if (user.isEmailVerified) {
      const error = new Error("Email is already verified.");
      error.statusCode = 400;
      error.code = "ALREADY_VERIFIED";
      throw error;
    }

    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpires = new Date(
      Date.now() + authConfig.emailVerification.tokenExpiryHours * 60 * 60 * 1000
    );

    await authRepository.updateWithSensitiveFields(user._id, {
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpires,
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);
    logger.info({ userId: user._id, email: user.email }, "Verification email would be sent");

    return {
      message: "Verification email sent.",
      // In development, return token for testing
      ...(process.env.NODE_ENV !== "production" && { verificationToken }),
    };
  },

  async verifyEmail(token) {
    if (!token) {
      const error = new Error("Verification token is required");
      error.statusCode = 400;
      error.code = "MISSING_VERIFICATION_TOKEN";
      throw error;
    }

    const hashedToken = hashToken(token);
    const user = await authRepository.findByVerificationToken(hashedToken);

    if (!user) {
      logger.warn("Email verification failed: invalid or expired token");
      const error = new Error("Invalid or expired verification token");
      error.statusCode = 400;
      error.code = "INVALID_VERIFICATION_TOKEN";
      throw error;
    }

    await authRepository.updateWithSensitiveFields(user._id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });

    logger.info({ userId: user._id }, "Email verified successfully");

    return { message: "Email verified successfully" };
  },
};

module.exports = authService;