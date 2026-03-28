const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dosageForm: { type: String, default: "tablet" },
    stockCount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: true },
    price: { type: Number, default: 1, min: 1 },
    requiresPrescription: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
