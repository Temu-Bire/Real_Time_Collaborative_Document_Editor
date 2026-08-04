const http = require("http");
const { Server } = require("socket.io");
const { YSocketIO } = require("y-socket.io/dist/server");

const app = require("./src/app");
const { logger } = require("./src/shared/utils/logger");
const { verifyAccessToken } = require("./src/shared/utils/tokenUtils");
const Document = require("./src/features/documents/models/Document");
const { getDocumentUserRole } = require("./src/shared/middleware/permissionMiddleware");
const { setIo } = require("./src/shared/socketEmitter");

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

// Make the io instance available to feature services for real-time push events.
setIo(io);

// Attach Y-Socket.IO sync handler to your existing Socket.IO instance
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

// Authorization middleware for the real-time collaboration layer.
// Runs for every connection to a `/yjs|document-<id>` namespace BEFORE any
// Yjs data is exchanged. This enforces that only authenticated users with
// access to the document can join its real-time room.
ysocketio.nsp.use(async (socket, next) => {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = verifyAccessToken(token);

    // Derive the document id from the namespace the client connected to,
    // e.g. `/yjs|document-65f0...` -> `65f0...`
    const nspName = socket.nsp?.name || "";
    const match = nspName.match(/^\/yjs(?:\||%7C)(document-.+)$/i);
    if (!match) {
      return next(new Error("Unauthorized"));
    }

    const documentId = match[1].replace(/^document-/i, "");
    if (!documentId) {
      return next(new Error("Unauthorized"));
    }

    const document = await Document.findById(documentId).lean();
    if (!document) {
      return next(new Error("Forbidden"));
    }

    const role = getDocumentUserRole(document, decoded.userId);
    if (!role) {
      return next(new Error("Forbidden"));
    }

    socket.data.userId = decoded.userId;
    socket.data.userRole = role;
    socket.data.documentId = documentId;

    logger.info(
      { socketId: socket.id, documentId, userId: decoded.userId, role },
      "Real-time connection authorized"
    );

    next();
  } catch (error) {
    logger.warn({ error: error.message }, "Real-time authorization failed");
    next(new Error(error.name === "TokenExpiredError" ? "Token expired" : "Unauthorized"));
  }
});

// Custom Socket Events (Optional awareness/chat logging)
io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "User connected");

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "User disconnected");
  });
});

// Notification channel: authenticate the main-namespace socket and join the
// user's notification room so the server can push "notification:new" events.
io.use((socket, next) => {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    const decoded = verifyAccessToken(token);
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  if (socket.data.userId) {
    socket.join(`user:${socket.data.userId}`);
    logger.info({ socketId: socket.id, userId: socket.data.userId }, "User joined notification room");
  }

  socket.on("disconnect", () => {
    if (socket.data.userId) {
      socket.leave(`user:${socket.data.userId}`);
    }
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
