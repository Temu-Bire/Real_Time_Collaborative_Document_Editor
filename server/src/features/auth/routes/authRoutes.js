const express = require("express");
const cookieParser = require("cookie-parser");

const authController = require("../controllers/authController");
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../middleware/authMiddleware");
const {
  registerValidation,
  loginValidation,
  googleLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation,
  verifyEmailValidation,
  refreshTokenValidation,
} = require("../validators/authValidator");
const {
  loginLimiter,
  passwordResetLimiter,
  verificationResendLimiter,
  authLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

// Apply cookie parser for refresh token cookie handling
router.use(cookieParser());

// Public routes with strict rate limiting
router.post(
  "/register",
  authLimiter,
  registerValidation,
  authController.register
);

router.post(
  "/login",
  loginLimiter,
  loginValidation,
  authController.login
);

router.post(
  "/google",
  authLimiter,
  googleLoginValidation,
  authController.googleLogin
);

router.post(
  "/refresh",
  authLimiter,
  refreshTokenValidation,
  authController.refreshTokens
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidation,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  resetPasswordValidation,
  authController.resetPassword
);

router.post(
  "/resend-verification",
  verificationResendLimiter,
  resendVerificationValidation,
  authController.resendVerification
);

router.get(
  "/verify-email",
  verifyEmailValidation,
  authController.verifyEmail
);

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;