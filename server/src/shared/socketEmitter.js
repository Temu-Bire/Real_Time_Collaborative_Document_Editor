/**
 * socketEmitter - Holds the Socket.IO instance so feature services can push
 * real-time events (e.g. notifications) without circular imports.
 */
let io = null;

const setIo = (socketIoInstance) => {
  io = socketIoInstance;
};

const getIo = () => io;

/**
 * Emit an event to a specific user's notification room.
 * Users join `user:<id>` on connect (see server/index.js).
 */
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  const id = typeof userId === "object" ? userId.toString() : userId;
  io.to(`user:${id}`).emit(event, payload);
};

module.exports = { setIo, getIo, emitToUser };
