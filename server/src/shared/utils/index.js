// Shared utilities
const { ValidationError, NotFoundError, AuthenticationError, AuthorizationError } = require('../errors');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createResponse = (success, data = null, message = null, meta = null) => {
  const response = { success };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (meta) response.meta = meta;
  return response;
};

const paginate = (query, page = 1, limit = 20, maxLimit = 100) => {
  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;
  return { skip, limit: parsedLimit, page: parsedPage };
};

const buildPaginationResponse = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, loginAttempts, lockUntil, refreshToken, refreshTokenExpires, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};

module.exports = {
  asyncHandler,
  createResponse,
  paginate,
  buildPaginationResponse,
  sanitizeUser,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
};