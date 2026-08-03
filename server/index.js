const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { YSocketIO } = require("y-socket.io/dist/server");

const app = require("./src/app");
const { logger } = require("./src/shared/utils/logger");

dotenv.config();

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
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));