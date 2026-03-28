const Prescription = require("../models/Prescription");
const DoseEvent = require("../models/DoseEvent");
const User = require("../models/User");
const mongoose = require("mongoose");

const resolvePatientUserId = async (identifier) => {
  if (!identifier) return null;

  const value = String(identifier).trim();
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    const userById = await User.findOne({ _id: value, role: "patient" }).select("_id");
    if (userById) return userById._id;
  }

  const userByIdentity = await User.findOne({
    role: "patient",
    $or: [{ email: value.toLowerCase() }, { patientCode: value }]
  }).select("_id");

  return userByIdentity?._id || null;
};

const getPrescriptions = async (req, res) => {
  const query = {};

  if (req.user.role === "patient") query.patient = req.user._id;
  if (req.user.role === "doctor") query.doctor = req.user._id;
  if (req.query.patientId) {
    const patientUserId = await resolvePatientUserId(req.query.patientId);
    if (!patientUserId) {
      return res.status(404).json({ message: "Patient not found for provided patientId/email/code" });
    }
    query.patient = patientUserId;
  }

  const prescriptions = await Prescription.find(query)
    .populate("patient", "name email")
    .populate("doctor", "name email")
    .populate("medicine");

  return res.json(prescriptions);
};

const createPrescription = async (req, res) => {
  try {
    const patientUserId = await resolvePatientUserId(req.body.patient);
    if (!patientUserId) {
      return res.status(400).json({ message: "Invalid patient. Use valid patient ID, email, or patient code." });
    }

    const payload = {
      ...req.body,
      patient: patientUserId,
      doctor: req.user._id
    };
    const prescription = await Prescription.create(payload);
    return res.status(201).json(prescription);
  } catch (error) {
    return res.status(400).json({ message: "Unable to create prescription", error: error.message });
  }
};

const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    if (req.user.role === "doctor" && String(prescription.doctor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your prescription" });
    }

    Object.assign(prescription, req.body);
    await prescription.save();
    return res.json(prescription);
  } catch (error) {
    return res.status(400).json({ message: "Unable to update prescription", error: error.message });
  }
};

const adherenceAnalytics = async (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) return res.status(400).json({ message: "patientId is required" });

  const total = await DoseEvent.countDocuments({ patient: patientId });
  const taken = await DoseEvent.countDocuments({ patient: patientId, status: "taken" });
  const missed = await DoseEvent.countDocuments({ patient: patientId, status: "missed" });

  const adherencePercent = total ? Math.round((taken / total) * 100) : 100;
  return res.json({ total, taken, missed, adherencePercent });
};

module.exports = {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  adherenceAnalytics
};
