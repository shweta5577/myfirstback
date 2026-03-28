const mongoose = require("mongoose");

const doseEventSchema = new mongoose.Schema(
  {
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "taken", "missed"],
      default: "pending"
    },
    takenAt: { type: Date, default: null },
    verificationMethod: { type: String, enum: ["rfid", "manual", "none"], default: "none" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoseEvent", doseEventSchema);
