const Medicine = require("../models/Medicine");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitRealtimeEvent } = require("../config/socket");

const getAllMedicines = async (req, res) => {
  const medicines = await Medicine.find().sort({ createdAt: -1 });
  return res.json(medicines);
};

const createMedicine = async (req, res) => {
  try {
    const normalizedName = (req.body.name || "").trim();
    if (!normalizedName) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const existingMedicine = await Medicine.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" }
    });

    let medicine;
    if (existingMedicine) {
      existingMedicine.stockCount = Number(req.body.stockCount ?? existingMedicine.stockCount);
      existingMedicine.expiryDate = req.body.expiryDate || existingMedicine.expiryDate;
      existingMedicine.price = Number(req.body.price ?? existingMedicine.price);
      existingMedicine.description = req.body.description ?? existingMedicine.description;
      existingMedicine.dosageForm = req.body.dosageForm ?? existingMedicine.dosageForm;
      medicine = await existingMedicine.save();
    } else {
      medicine = await Medicine.create({ ...req.body, name: normalizedName });
    }

    emitRealtimeEvent("inventory:updated", medicine);
    return res.status(201).json(medicine);
  } catch (error) {
    return res.status(400).json({ message: "Unable to create medicine", error: error.message });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    emitRealtimeEvent("inventory:updated", medicine);
    return res.json(medicine);
  } catch (error) {
    return res.status(400).json({ message: "Unable to update medicine", error: error.message });
  }
};

const deleteMedicine = async (req, res) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) return res.status(404).json({ message: "Medicine not found" });
  emitRealtimeEvent("inventory:deleted", { id: req.params.id });
  return res.json({ message: "Medicine deleted" });
};

const getInventoryAlerts = async (req, res) => {
  const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 10);
  const lowStock = await Medicine.find({ stockCount: { $lte: lowStockThreshold } });

  const inDays = Number(process.env.EXPIRY_ALERT_DAYS || 30);
  const now = new Date();
  const boundary = new Date(now.getTime() + inDays * 24 * 60 * 60 * 1000);
  const expiringSoon = await Medicine.find({ expiryDate: { $lte: boundary } });

  return res.json({ lowStock, expiringSoon });
};

const notifyAdminsForInventoryRisks = async () => {
  const admins = await User.find({ role: "admin" });
  if (!admins.length) return;

  const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 10);
  const lowCount = await Medicine.countDocuments({ stockCount: { $lte: lowStockThreshold } });

  if (lowCount > 0) {
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        title: "Low Stock Alert",
        message: `${lowCount} medicines are below threshold`,
        type: "stock"
      }))
    );
  }
};

module.exports = {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getInventoryAlerts,
  notifyAdminsForInventoryRisks
};
