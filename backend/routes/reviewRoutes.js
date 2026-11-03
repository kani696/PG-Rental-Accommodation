
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    addReview,
    getPropertyReviews
} = require("../controllers/reviewController");

const router = express.Router();

// Get all reviews for a property
router.get("/:id", getPropertyReviews);

// Submit a review (login required)
router.post("/:id", protect, addReview);

module.exports = router;
