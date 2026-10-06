const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    addProperty,
    searchProperties
} = require("../controllers/propertyController");

const router = express.Router();

// Add property - owner only
router.post("/", protect, addProperty);

// Search properties - public
router.get("/search", searchProperties);

module.exports = router;