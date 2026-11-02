
const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    addProperty,
    searchProperties,
    getPropertyById,
    contactOwner
} = require("../controllers/propertyController");

const router = express.Router();

// Search properties - public
router.get("/search", searchProperties);

// Contact property owner - public inquiry form
router.post("/:id/contact", contactOwner);

// View individual property details - public
router.get("/:id", getPropertyById);

// Add property - authenticated owner
router.post("/", protect, addProperty);

module.exports = router;
