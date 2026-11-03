
const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    addFavourite,
    getMyFavourites,
    removeFavourite
} = require("../controllers/favouriteController");

const router = express.Router();

// Add a favourite
router.post("/", protect, addFavourite);

// View logged-in student's favourites
router.get("/my-favourites", protect, getMyFavourites);

// Remove a favourite
router.delete("/:id", protect, removeFavourite);

module.exports = router;
