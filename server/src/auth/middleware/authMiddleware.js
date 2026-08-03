const { verifyAccessToken } = require("../utils/tokenUtils");
const { logger } = require("../utils/logger");

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      authProvider: decoded.authProvider,
    };

    next();
  } catch (error) {
    logger.debug({ error: error.message }, "Authentication failed");

    let message = "Invalid token";
    let code = "INVALID_TOKEN";

    if (error.name === "TokenExpiredError") {
      message = "Token expired";
      code = "TOKEN_EXPIRED";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token";
      code = "INVALID_TOKEN";
    }

    return res.status(401).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      authProvider: decoded.authProvider,
    };

    next();
  } catch {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};