const mongoose = require("mongoose");

let memoryServer;

const getMongoConnectionMeta = (mongoUri) => {
  try {
    const parsed = new URL(mongoUri);
    const hosts = parsed.host || "unknown-host";
    const username = parsed.username ? decodeURIComponent(parsed.username) : "(none)";
    const protocol = parsed.protocol || "mongodb:";
    return { hosts, username, protocol };
  } catch (error) {
    return { hosts: "invalid-uri", username: "unknown", protocol: "unknown" };
  }
};

const connectInMemoryMongo = async (dbName) => {
  if (!memoryServer) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
  }

  const memoryUri = memoryServer.getUri();
  await mongoose.connect(memoryUri, { dbName });
  // eslint-disable-next-line no-console
  console.log(`MongoDB in-memory connected (${dbName})`);
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || "medivend";
  const isProduction = process.env.NODE_ENV === "production";

  if (!mongoUri) {
    if (isProduction) {
      throw new Error("MONGO_URI is not configured");
    }

    // eslint-disable-next-line no-console
    console.warn("MONGO_URI is not configured. Falling back to in-memory MongoDB for development.");
    await connectInMemoryMongo(dbName);
    return;
  }

  try {
    const meta = getMongoConnectionMeta(mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[MongoDB] Connecting (${meta.protocol}//${meta.hosts}) as ${meta.username}`);

    await mongoose.connect(mongoUri, { dbName });
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error("[MongoDB] Production connection failed", {
        code: error.code,
        codeName: error.codeName,
        message: error.message
      });

      throw error;
    }

    // eslint-disable-next-line no-console
    console.warn(`MongoDB connection failed (${error.message}). Falling back to in-memory MongoDB for development.`);
    await connectInMemoryMongo(dbName);
  }
};

module.exports = connectDB;
