require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { setSocketServer } = require("./config/socket");
const { startDispenseScheduler } = require("./services/dispenseScheduler");
const { initializeFirebaseAdmin } = require("./config/firebaseAdmin");
const { runStartupSeed } = require("./services/startupSeeder");

const port = Number(process.env.PORT || 5000);

const getSocketCorsOrigin = () => {
  const origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  if (process.env.NODE_ENV === "production") {
    return true;
  }

  return ["http://localhost:5173", "http://localhost:5174"];
};

const bootstrap = async () => {
  await connectDB();
  await runStartupSeed();
  initializeFirebaseAdmin();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: getSocketCorsOrigin(),
      credentials: true
    }
  });

  setSocketServer(io);

  io.on("connection", (socket) => {
    socket.emit("connected", { id: socket.id, message: "Realtime channel connected" });
  });

  startDispenseScheduler();

  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
