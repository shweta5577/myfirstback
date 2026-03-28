const mongoose = require("mongoose");

let memoryServer;

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
    await mongoose.connect(mongoUri, { dbName });
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    // eslint-disable-next-line no-console
    console.warn(`MongoDB connection failed (${error.message}). Falling back to in-memory MongoDB for development.`);
    await connectInMemoryMongo(dbName);
  }
};

module.exports = connectDB;
