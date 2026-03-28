const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");

const seedData = async () => {
  const existingAdmin = await User.findOne({ email: "admin@medivend.com" });
  if (existingAdmin) {
    return { message: "Seed already exists" };
  }

  const [admin, doctor, patient] = await User.create([
    { name: "Admin", email: "admin@medivend.com", password: "Admin@123", role: "admin" },
    { name: "Dr. Sharma", email: "doctor@medivend.com", password: "Doctor@123", role: "doctor" },
    {
      name: "Rahul Patil",
      email: "patient@medivend.com",
      password: "Patient@123",
      role: "patient",
      preferredLanguage: "en"
    }
  ]);

  const medicine = await Medicine.create({
    name: "Paracetamol 500mg",
    description: "Fever and pain relief",
    dosageForm: "tablet",
    stockCount: 120,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    price: 20,
    requiresPrescription: true
  });

  await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    medicine: medicine._id,
    dosage: "1 tablet",
    frequencyPerDay: 2,
    timings: ["09:00", "21:00"],
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    instructions: "After food"
  });

  return {
    message: "Seeded successfully",
    users: {
      admin: "admin@medivend.com / Admin@123",
      doctor: "doctor@medivend.com / Doctor@123",
      patient: "patient@medivend.com / Patient@123"
    },
    ids: { admin: admin._id, doctor: doctor._id, patient: patient._id, medicine: medicine._id }
  };
};

module.exports = seedData;
