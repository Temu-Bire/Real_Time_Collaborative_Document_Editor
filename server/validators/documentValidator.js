const { body, validationResult } = require("express-validator");

const documentValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters")
    .default("Untitled Document"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be text"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  documentValidation,
  handleValidationErrors,
};