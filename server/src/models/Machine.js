const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, unique: true },
    location: { type: String, default: "Main Lobby" },
    isLocked: { type: Boolean, default: true },
    temperature: { type: Number, default: 25 },
    lastPingAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Machine", machineSchema);
