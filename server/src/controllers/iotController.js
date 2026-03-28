const Machine = require("../models/Machine");
const Medicine = require("../models/Medicine");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitRealtimeEvent } = require("../config/socket");
const { writeLog } = require("../services/auditLogger");

const ensureMachine = async (machineId = "MACHINE-001") => {
  let machine = await Machine.findOne({ machineId });
  if (!machine) {
    machine = await Machine.create({ machineId });
  }
  return machine;
};

const updateTemperature = async (req, res) => {
  const { machineId, temperature } = req.body;
  const machine = await ensureMachine(machineId);

  machine.temperature = temperature;
  machine.lastPingAt = new Date();
  await machine.save();

  if (temperature > Number(process.env.MAX_TEMP || 35)) {
    const admins = await User.find({ role: "admin" });
    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          user: admin._id,
          title: "Temperature Alert",
          message: `Machine ${machine.machineId} temperature is high (${temperature}C)`,
          type: "alert"
        }))
      );
    }
  }

  await writeLog({ action: "temperature_update", machine: machine._id, data: { temperature } });
  emitRealtimeEvent("iot:temperature", machine);
  return res.json({ message: "Temperature received", machine });
};

const updateStock = async (req, res) => {
  const { medicineId, stockCount } = req.body;
  const medicine = await Medicine.findByIdAndUpdate(
    medicineId,
    { stockCount },
    { new: true, runValidators: true }
  );

  if (!medicine) return res.status(404).json({ message: "Medicine not found" });

  await writeLog({ action: "stock_update", data: { medicineId, stockCount } });
  emitRealtimeEvent("inventory:updated", medicine);
  return res.json({ message: "Stock updated", medicine });
};

const triggerDispense = async (req, res) => {
  const { medicineId, quantity = 1 } = req.body;
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) return res.status(404).json({ message: "Medicine not found" });
  if (medicine.stockCount < quantity) {
    return res.status(400).json({ message: "Insufficient stock" });
  }

  medicine.stockCount -= quantity;
  await medicine.save();

  await writeLog({ action: "dispense_trigger", data: { medicineId, quantity } });
  emitRealtimeEvent("machine:dispense", { medicineId, quantity, dispensedAt: new Date() });
  return res.json({ message: "Dispense triggered", medicine });
};

const simulatePillDrop = async (req, res) => {
  const payload = {
    detected: Boolean(req.body.detected),
    timestamp: new Date().toISOString()
  };
  await writeLog({ action: "pill_drop_sensor", data: payload });
  emitRealtimeEvent("iot:pill-drop", payload);
  return res.json({ message: "Pill drop event captured", payload });
};

const rfidCheck = async (req, res) => {
  const { cardId } = req.body;
  const valid = cardId && cardId.toString().length >= 4;
  const payload = { cardId, valid, timestamp: new Date().toISOString() };
  await writeLog({ action: "rfid_check", data: payload });
  emitRealtimeEvent("iot:rfid", payload);
  return res.json({ message: valid ? "RFID verified" : "RFID failed", valid });
};

module.exports = {
  updateTemperature,
  updateStock,
  triggerDispense,
  simulatePillDrop,
  rfidCheck,
  ensureMachine
};
