const express = require("express");
const {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getInventoryAlerts
} = require("../controllers/medicineController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getAllMedicines);
router.get("/alerts/inventory", auth, allowRoles("admin", "doctor"), getInventoryAlerts);
router.post("/", auth, allowRoles("admin"), createMedicine);
router.put("/:id", auth, allowRoles("admin"), updateMedicine);
router.delete("/:id", auth, allowRoles("admin"), deleteMedicine);

module.exports = router;
