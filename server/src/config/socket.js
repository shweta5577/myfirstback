let io;

const setSocketServer = (socketServer) => {
  io = socketServer;
};

const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

const emitRealtimeEvent = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

module.exports = {
  setSocketServer,
  getSocketServer,
  emitRealtimeEvent
};
