const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { YSocketIO } = require("y-socket.io/dist/server");

const connectDB = require("./config/db");
const authRoutes = require("./src/auth/routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./src/auth/middleware/rateLimiter");
const { logger } = require("./src/auth/utils/logger");

dotenv.config();

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
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser for refresh token handling
app.use(cookieParser());

// General rate limiting
app.use("/api", apiLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(
    { method: req.method, path: req.path, ip: req.ip, userAgent: req.get("User-Agent") },
    "Incoming request"
  );
  next();
});

// Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Attach Y-Socket.IO sync handler to your existing Socket.IO instance
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

// Custom Socket Events (Optional awareness/chat logging)
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "User connected");

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "User disconnected");
  });
});

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, `Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});