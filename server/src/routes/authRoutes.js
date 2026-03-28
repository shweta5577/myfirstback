const express = require("express");
const { signup, login, me, listPatients } = require("../controllers/authController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", auth, me);
router.get("/patients", auth, allowRoles("doctor", "admin"), listPatients);

module.exports = router;
