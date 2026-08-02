const { body, param } = require("express-validator");
const { handleValidationErrors } = require("./validationUtils");

const documentIdValidation = [
  param("id").isMongoId().withMessage("Invalid document ID"),
];

const documentValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be text"),
];

const createDocumentValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be text"),
];

module.exports = {
  documentIdValidation,
  documentValidation,
  createDocumentValidation,
  handleValidationErrors,
};
