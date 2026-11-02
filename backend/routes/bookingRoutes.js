
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createBooking,
    getMyBookings
} = require("../controllers/bookingController");

// Submit a booking request
router.post("/", protect, createBooking);

// View logged-in student's bookings
router.get("/my-bookings", protect, getMyBookings);

module.exports = router;
