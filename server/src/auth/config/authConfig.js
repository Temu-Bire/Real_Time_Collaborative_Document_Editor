module.exports = {
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },
  jwt: {
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    issuer: "syncwrite",
    audience: "syncwrite-client",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 5,
  },
  accountLockout: {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS, 10) || 5,
    lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS, 10) || 30 * 60 * 1000, // 30 minutes
  },
  emailVerification: {
    tokenExpiryHours: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS, 10) || 24,
  },
  passwordReset: {
    tokenExpiryHours: parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS, 10) || 1,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};