const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const patientRoutes = require("./routes/patientRoutes");
const iotRoutes = require("./routes/iotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { saveFcmToken } = require("./controllers/notificationController");
const seedData = require("./seed/seedData");
const { auth, allowRoles } = require("./middleware/auth");
const { initializeFirebaseAdmin } = require("./config/firebaseAdmin");

const app = express();

// Safe to call at startup because firebaseAdmin.js prevents duplicate initialization.
initializeFirebaseAdmin();

const parseAllowedOrigins = () => {
  const origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return origins;
  }

  if (process.env.NODE_ENV === "production") {
    // Allow same-origin and Render preview domains when no explicit origin is set.
    return true;
  }

  return ["http://localhost:5173", "http://localhost:5174"];
};

app.use(
  cors({
    origin: parseAllowedOrigins(),
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.post("/api/save-token", auth, saveFcmToken);

app.post("/api/seed", auth, allowRoles("admin"), async (req, res) => {
  try {
    const result = await seedData();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Seed failed", error: error.message });
  }
});

const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  return res.sendFile(path.join(clientDistPath, "index.html"));
});

app.use((error, req, res, next) => {
  return res.status(500).json({ message: "Internal server error", error: error.message });
});

module.exports = app;
