const { body, query } = require("express-validator");
const { handleValidationErrors } = require("./validationUtils");

const passwordRules = body("password")
  .notEmpty()
  .withMessage("Password is required")
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

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  passwordRules,
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const googleLoginValidation = [
  body("idToken")
    .optional()
    .isString()
    .withMessage("idToken must be a string"),

  body("access_token")
    .optional()
    .isString()
    .withMessage("access_token must be a string"),

  // Custom validation to ensure at least one token is provided
  (req, res, next) => {
    if (!req.body.idToken && !req.body.access_token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Either idToken or access_token is required",
        },
      });
    }
    next();
  },
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  passwordRules,
];

const resendVerificationValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

const verifyEmailValidation = [
  query("token").notEmpty().withMessage("Verification token is required"),
];

const refreshTokenValidation = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("Refresh token must be a string"),
];

module.exports = {
  registerValidation,
  loginValidation,
  googleLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation,
  verifyEmailValidation,
  refreshTokenValidation,
  handleValidationErrors,
};