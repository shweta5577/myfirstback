const Machine = require("../models/Machine");
const Log = require("../models/Log");
const Medicine = require("../models/Medicine");
const Payment = require("../models/Payment");
const { emitRealtimeEvent } = require("../config/socket");
const { writeLog } = require("../services/auditLogger");
const { ensureMachine } = require("./iotController");

const getMachineOverview = async (req, res) => {
  const machine = await ensureMachine("MACHINE-001");
  const logs = await Log.find().sort({ createdAt: -1 }).limit(50);
  const medicineCount = await Medicine.countDocuments();

  return res.json({
    machine,
    logs,
    medicineCount
  });
};

const lockUnlockMachine = async (req, res) => {
  const machine = await ensureMachine("MACHINE-001");
  const { lock } = req.body;
  machine.isLocked = Boolean(lock);
  await machine.save();

  await writeLog({ actor: req.user._id, machine: machine._id, action: lock ? "machine_locked" : "machine_unlocked" });
  emitRealtimeEvent("machine:lock-status", { isLocked: machine.isLocked });
  return res.json({ message: machine.isLocked ? "Machine locked" : "Machine unlocked", machine });
};

const createMockPayment = async (req, res) => {
  const { patient, medicine, amount, method } = req.body;
  const payment = await Payment.create({ patient, medicine, amount, method, status: "success" });

  await writeLog({
    actor: req.user._id,
    action: "payment_success",
    data: { paymentId: payment._id, amount, method }
  });

  emitRealtimeEvent("payment:completed", payment);
  return res.status(201).json(payment);
};

module.exports = {
  getMachineOverview,
  lockUnlockMachine,
  createMockPayment
};
