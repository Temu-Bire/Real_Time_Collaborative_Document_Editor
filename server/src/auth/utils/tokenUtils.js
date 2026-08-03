const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { logger } = require("./logger");

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const generateTokenPair = (payload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: "syncwrite",
    audience: "syncwrite-client",
  });

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: "syncwrite",
      audience: "syncwrite-client",
    }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "syncwrite",
      audience: "syncwrite-client",
    });
  } catch (error) {
    logger.debug({ error: error.message }, "Access token verification failed");
    throw error;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: "syncwrite",
      audience: "syncwrite-client",
    });
  } catch (error) {
    logger.debug({ error: error.message }, "Refresh token verification failed");
    throw error;
  }
};

const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const decodeTokenWithoutVerification = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  decodeTokenWithoutVerification,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};