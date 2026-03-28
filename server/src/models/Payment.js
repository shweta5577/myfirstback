const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["upi", "card"], required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
