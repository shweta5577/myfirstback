const express = require("express");
const {
  updateTemperature,
  updateStock,
  triggerDispense,
  simulatePillDrop,
  rfidCheck
} = require("../controllers/iotController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/temperature", updateTemperature);
router.post("/stock", auth, allowRoles("admin"), updateStock);
router.post("/dispense", auth, allowRoles("admin", "doctor"), triggerDispense);
router.post("/pill-drop", auth, allowRoles("admin", "doctor"), simulatePillDrop);
router.post("/rfid-check", auth, allowRoles("patient", "admin", "doctor"), rfidCheck);

module.exports = router;
