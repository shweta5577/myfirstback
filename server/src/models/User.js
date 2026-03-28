const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient"
    },
    patientCode: { type: String, unique: true, sparse: true }, // Human-readable patient ID (e.g., PAT-2026-001)
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "mr"],
      default: "en"
    },
    fcmToken: { type: String, trim: true, default: null },
    fcmTokens: [{ type: String, trim: true }],
    adherenceScore: { type: Number, default: 100 }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Auto-generate patientCode for patients only
userSchema.pre("save", async function generatePatientCode() {
  if (this.role === "patient" && !this.patientCode) {
    const count = await mongoose.model("User").countDocuments({ role: "patient" });
    const year = new Date().getFullYear();
    this.patientCode = `PAT-${year}-${String(count + 1).padStart(4, "0")}`;
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
