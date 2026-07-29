const express = require("express");
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const {
  registerValidation,
  handleValidationErrors,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;