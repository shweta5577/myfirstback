const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", default: null },
    action: { type: String, required: true },
    level: { type: String, enum: ["info", "warning", "error"], default: "info" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
