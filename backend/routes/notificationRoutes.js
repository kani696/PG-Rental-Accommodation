
const express = require("express");
const router = express.Router();

const {
    getMyNotifications,
    markAsRead
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

// Get logged-in user's notifications
router.get("/", protect, getMyNotifications);

// Mark notification as read
router.put("/:id/read", protect, markAsRead);

module.exports = router;
