const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const connectDB = require("./config/database");
const { requestLogger, errorHandler, notFoundHandler } = require("./shared/middleware");
const { apiLimiter } = require("./features/auth/middleware/rateLimiter");
const { logger } = require("./shared/utils/logger");

// Load environment variables.
// Base values come from `.env`; environment-specific overrides are loaded
// from `.env.development` / `.env.production` based on NODE_ENV.
dotenv.config();
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
  override: true,
});

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser for refresh token handling
app.use(cookieParser());

// General rate limiting
app.use("/api", apiLimiter);

// Request logging
app.use(requestLogger);

// Database
connectDB();

// Feature routes
const authRoutes = require("./features/auth/routes/authRoutes");
const userRoutes = require("./features/users/routes/userRoutes");
const documentRoutes = require("./features/documents/routes/documentRoutes");
const commentRoutes = require("./features/comments/routes/commentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents", commentRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;