
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createBooking,
    getMyBookings,
    getOwnerDashboard,
    updateBookingStatus
} = require("../controllers/bookingController");

// Owner dashboard
router.get("/owner-dashboard", protect, getOwnerDashboard);

// Submit booking request
router.post("/", protect, createBooking);

// View student's bookings
router.get("/my-bookings", protect, getMyBookings);

// Approve or reject booking
router.patch("/:id/status", protect, updateBookingStatus);

module.exports = router;
