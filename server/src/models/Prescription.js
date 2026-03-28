const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    dosage: { type: String, required: true },
    frequencyPerDay: { type: Number, default: 1, min: 1, max: 6 },
    timings: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    instructions: { type: String, default: "" },
    adherencePercent: { type: Number, default: 100 },
    active: { type: Boolean, default: true },
    lastDispensedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
