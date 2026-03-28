const express = require("express");
const {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  adherenceAnalytics
} = require("../controllers/prescriptionController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getPrescriptions);
router.get("/analytics/adherence", auth, allowRoles("doctor", "admin"), adherenceAnalytics);
router.post("/", auth, allowRoles("doctor", "admin"), createPrescription);
router.put("/:id", auth, allowRoles("doctor", "admin"), updatePrescription);

module.exports = router;
