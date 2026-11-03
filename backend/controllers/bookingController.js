
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Notification = require("../models/Notification");

// Student sends a booking request
const createBooking = async (req, res) => {
    try {
        const { propertyId, moveInDate, message } = req.body;

        if (!propertyId || !moveInDate) {
            return res.status(400).json({
                success: false,
                message: "Property ID and move-in date are required"
            });
        }

        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can send booking requests"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const date = new Date(moveInDate);

        if (Number.isNaN(date.getTime()) || date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid future move-in date"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (property.owner.toString() === req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You cannot book your own property"
            });
        }

        const booking = await Booking.create({
            student: req.user.id,
            property: property._id,
            owner: property.owner,
            moveInDate: date,
            message: message || ""
        });

        await Notification.create({
            recipient: property.owner,
            sender: req.user.id,
            booking: booking._id,
            message: "You have received a new booking request.",
            type: "Booking Request"
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


// Owner views dashboard
const getOwnerDashboard = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can access the dashboard"
            });
        }

        const properties = await Property.find({
            owner: req.user.id
        }).sort({ createdAt: -1 });

        const bookings = await Booking.find({
            owner: req.user.id
        })
            .populate("student", "name email")
            .populate("property", "title location rent")
            .sort({ createdAt: -1 });

        const pending = bookings.filter(
            booking => booking.status === "Pending"
        ).length;

        const approved = bookings.filter(
            booking => booking.status === "Approved"
        ).length;

        const rejected = bookings.filter(
            booking => booking.status === "Rejected"
        ).length;

        return res.status(200).json({
            success: true,
            dashboard: {
                totalProperties: properties.length,
                totalBookings: bookings.length,
                pendingBookings: pending,
                approvedBookings: approved,
                rejectedBookings: rejected,
                properties,
                recentBookings: bookings.slice(0, 5)
            }
        });

    } catch (error) {
        console.error("Owner dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load owner dashboard"
        });
    }
};


// Owner approves or rejects a booking
const updateBookingStatus = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can update booking status"
            });
        }

        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status"
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        booking.status = status;
        await booking.save();

        await Notification.create({
            recipient: booking.student,
            sender: req.user.id,
            booking: booking._id,
            message: `Your booking request has been ${status.toLowerCase()}.`,
            type: status === "Approved"
                ? "Booking Approved"
                : "Booking Rejected"
        });

        return res.status(200).json({
            success: true,
            message: `Booking ${status.toLowerCase()} successfully`,
            booking
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
    getMyBookings,
    getOwnerDashboard,
    updateBookingStatus
};
