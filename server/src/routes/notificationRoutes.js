const express = require("express");
const {
	getMyNotifications,
	markNotificationRead,
	saveFcmToken,
	sendPushNotification,
	sendPushToUser,
	simulateMissedDosePush
} = require("../controllers/notificationController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getMyNotifications);
router.patch("/:id/read", auth, markNotificationRead);
router.post("/save-token", auth, saveFcmToken);
router.post("/push", auth, allowRoles("admin", "doctor"), sendPushNotification);
router.post("/push/user", auth, allowRoles("admin", "doctor"), sendPushToUser);
router.post("/test/missed-dose", auth, allowRoles("admin", "doctor"), simulateMissedDosePush);

module.exports = router;
