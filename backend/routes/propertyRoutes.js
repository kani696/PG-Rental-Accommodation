
const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    addProperty,
    searchProperties,
    getPropertyById,
    contactOwner,
    getMyListings,
    updateProperty,
    deleteProperty,
    updateAvailability
} = require("../controllers/propertyController");

const {
    getAllListings,
    updateVerificationStatus
} = require("../controllers/adminController");

const router = express.Router();

// Public routes
router.get("/search", searchProperties);
router.post("/:id/contact", contactOwner);

// Admin routes
router.get("/admin/listings", protect, getAllListings);
router.patch("/:id/verification", protect, updateVerificationStatus);

// Owner routes
router.get("/my-listings", protect, getMyListings);
router.put("/:id/availability", protect, updateAvailability);
router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);

// Property routes
router.post("/", protect, addProperty);
router.get("/:id", getPropertyById);

module.exports = router;
