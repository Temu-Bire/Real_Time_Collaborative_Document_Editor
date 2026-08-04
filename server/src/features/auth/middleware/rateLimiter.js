const rateLimit = require("express-rate-limit");
const { logger } = require("../../../shared/utils/logger");
const authConfig = require("../../../config/auth");

// Requests that should never be rate limited:
//  - health checks
//  - authentication endpoints (login/register/refresh/etc.)
//  - document saves / autosave (PUT /api/documents/:id) and document close,
//    which fire frequently while editing
const isExempt = (req) => {
  const url = req.originalUrl || "";
  if (url.startsWith("/api/health")) return true;
  if (url.startsWith("/api/auth")) return true;
  if (req.method === "PUT" && url.startsWith("/api/documents/")) return true;
  if (url.endsWith("/close")) return true;
  return false;
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.maxRequests,
  skip: isExempt,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, "Rate limit exceeded");
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: authConfig.rateLimit.windowMs,
  max: authConfig.rateLimit.authMaxRequests,
  skip: isExempt,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, "Auth rate limit exceeded");
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts, please try again later",
      },
    });
  },
});

// Specific limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skip: isExempt,
  message: {
    success: false,
    error: {
      code: "LOGIN_RATE_LIMIT_EXCEEDED",
      message: "Too many login attempts, please try again in 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, email: req.body.email }, "Login rate limit exceeded");
    res.status(429).json({
      success: false,
      error: {
        code: "LOGIN_RATE_LIMIT_EXCEEDED",
        message: "Too many login attempts, please try again in 15 minutes",
      },
    });
  },
  keyGenerator: (req) => `${req.ip}:${req.body.email || "unknown"}`,
});

// Limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  skip: isExempt,
  message: {
    success: false,
    error: {
      code: "RESET_RATE_LIMIT_EXCEEDED",
      message: "Too many password reset requests, please try again in an hour",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, email: req.body.email }, "Password reset rate limit exceeded");
    res.status(429).json({
      success: false,
      error: {
        code: "RESET_RATE_LIMIT_EXCEEDED",
        message: "Too many password reset requests, please try again in an hour",
      },
    });
  },
  keyGenerator: (req) => `${req.ip}:${req.body.email || "unknown"}`,
});

// Limiter for email verification resend
const verificationResendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  skip: isExempt,
  message: {
    success: false,
    error: {
      code: "VERIFICATION_RESEND_RATE_LIMIT_EXCEEDED",
      message: "Too many verification email requests, please try again in an hour",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, email: req.body.email }, "Verification resend rate limit exceeded");
    res.status(429).json({
      success: false,
      error: {
        code: "VERIFICATION_RESEND_RATE_LIMIT_EXCEEDED",
        message: "Too many verification email requests, please try again in an hour",
      },
    });
  },
  keyGenerator: (req) => `${req.ip}:${req.body.email || "unknown"}`,
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  verificationResendLimiter,
};