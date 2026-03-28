const express = require("express");
const {
  getPatientDashboard,
  markDoseTaken,
  triggerVoiceReminder
} = require("../controllers/patientController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", auth, allowRoles("patient"), getPatientDashboard);
router.post("/dose/taken", auth, allowRoles("patient"), markDoseTaken);
router.post("/voice-reminder", auth, allowRoles("patient"), triggerVoiceReminder);

module.exports = router;
