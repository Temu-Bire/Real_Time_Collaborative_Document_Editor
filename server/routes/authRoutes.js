const express = require("express");
const {
  register,
  login,
  googleLogin,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const {
  registerValidation,
  handleValidationErrors,
} = require("../validators/authValidator");

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-verification", resendVerification);
router.get("/verify-email", verifyEmail);

// ── Protected routes ───────────────────────────────────────────────────────
router.get("/profile", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;