
const Booking = require("../models/Booking");
const Property = require("../models/Property");

// Student sends a booking request
const createBooking = async (req, res) => {
    try {
        const { propertyId, moveInDate, message } = req.body;

        // Validate required fields
        if (!propertyId || !moveInDate) {
            return res.status(400).json({
                success: false,
                message: "Property ID and move-in date are required"
            });
        }

        // Only students can book a property
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can send booking requests"
            });
        }

        // Validate property ID
        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        // Validate move-in date
        const date = new Date(moveInDate);

        if (Number.isNaN(date.getTime()) || date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid future move-in date"
            });
        }

        // Find the selected property
        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Prevent owners from booking their own property
        if (property.owner.toString() === req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You cannot book your own property"
            });
        }

        // Create booking request
        const booking = await Booking.create({
            student: req.user.id,
            property: property._id,
            owner: property.owner,
            moveInDate: date,
            message: message || ""
        });

        return res.status(201).json({
            success: true,
            message: "Booking request submitted successfully",
            booking
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Student views their booking requests
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            student: req.user.id
        })
            .populate("property", "title location rent")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getMyBookings
};
