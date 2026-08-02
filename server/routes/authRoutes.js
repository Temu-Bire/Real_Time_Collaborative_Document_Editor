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
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation,
  handleValidationErrors,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", loginValidation, handleValidationErrors, login);
router.post("/google", googleLogin);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword
);
router.post(
  "/resend-verification",
  resendVerificationValidation,
  handleValidationErrors,
  resendVerification
);
router.get("/verify-email", verifyEmail);

router.get("/profile", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;
