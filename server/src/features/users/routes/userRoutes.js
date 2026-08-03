const express = require("express");
const { body, param, query } = require("express-validator");
const { validationResult } = require("express-validator");

const userController = require("../controllers/userController");
const { authMiddleware } = require("../../auth/middleware/authMiddleware");
const { requireDocumentPermission } = require("../../../shared/middleware/permissionMiddleware");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      },
    });
  }
  next();
};

const passwordRules = body("newPassword")
  .notEmpty()
  .withMessage("New password is required")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/)
  .withMessage("Password must contain an uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain a lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain a number")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Password must contain a special character");

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", userController.getProfile);

router.patch(
  "/profile",
  [
    body("name").optional().trim().isLength({ min: 3, max: 30 }).withMessage("Name must be between 3 and 30 characters"),
    body("profilePicture").optional().isURL().withMessage("Profile picture must be a valid URL"),
  ],
  handleValidationErrors,
  userController.updateProfile
);

router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    passwordRules,
  ],
  handleValidationErrors,
  userController.changePassword
);

// Admin routes
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("search").optional().isString().withMessage("Search must be a string"),
  ],
  handleValidationErrors,
  userController.getAllUsers
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  handleValidationErrors,
  userController.deleteUser
);

module.exports = router;