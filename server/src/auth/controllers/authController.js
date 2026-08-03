const authService = require("../services/authService");
const { logger } = require("../utils/logger");

const getClientInfo = (req) => ({
  userAgent: req.get("User-Agent"),
  ip: req.ip || req.connection.remoteAddress,
});

const handleError = (res, error) => {
  logger.error(
    { error: error.message, stack: error.stack, code: error.code },
    "Auth controller error"
  );

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message,
    },
  });
};

const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: { user: result.user },
        ...(result.verificationToken && { dev: { verificationToken: result.verificationToken } }),
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async login(req, res) {
    try {
      const clientInfo = getClientInfo(req);
      const result = await authService.login({ ...req.body, ...clientInfo });

      // Set refresh token in httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async googleLogin(req, res) {
    try {
      const clientInfo = getClientInfo(req);
      const result = await authService.googleLogin({ ...req.body, ...clientInfo });

      // Set refresh token in httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async refreshTokens(req, res) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      const clientInfo = getClientInfo(req);
      const result = await authService.refreshTokens(refreshToken, clientInfo.userAgent, clientInfo.ip);

      // Set new refresh token in httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      // Clear invalid refresh token cookie
      res.clearCookie("refreshToken");
      handleError(res, error);
    }
  },

  async logout(req, res) {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (userId) {
        await authService.logout(userId, refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const result = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async forgotPassword(req, res) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: result.message,
        ...(result.resetToken && { dev: { resetToken: result.resetToken, resetUrl: result.resetUrl } }),
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async resendVerification(req, res) {
    try {
      const result = await authService.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        message: result.message,
        ...(result.verificationToken && { dev: { verificationToken: result.verificationToken } }),
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      const result = await authService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      handleError(res, error);
    }
  },
};

module.exports = authController;