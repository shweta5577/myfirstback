const express = require("express");
const {
  getMachineOverview,
  lockUnlockMachine,
  createMockPayment
} = require("../controllers/adminController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/machine", auth, allowRoles("admin"), getMachineOverview);
router.post("/machine/lock", auth, allowRoles("admin"), lockUnlockMachine);
router.post("/payment/mock", auth, allowRoles("admin"), createMockPayment);

module.exports = router;
