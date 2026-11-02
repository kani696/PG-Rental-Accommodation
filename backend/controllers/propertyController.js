
const Property = require("../models/Property");
const ContactMessage = require("../models/ContactMessage");

// 1. Add property
const addProperty = async (req, res) => {
    try {
        const {
            title,
            description,
            location,
            rent,
            roomType,
            amenities,
            contactNumber
        } = req.body;

        if (
            !title ||
            !description ||
            !location ||
            rent === undefined ||
            !roomType ||
            !contactNumber
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can add properties"
            });
        }

        if (Number(rent) < 0) {
            return res.status(400).json({
                success: false,
                message: "Rent cannot be negative"
            });
        }

        const property = await Property.create({
            owner: req.user.id,
            title,
            description,
            location,
            rent: Number(rent),
            roomType,
            amenities: Array.isArray(amenities) ? amenities : [],
            contactNumber
        });

        return res.status(201).json({
            success: true,
            message: "Property added successfully",
            property
        });

    } catch (error) {
        console.error("Add property error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while adding property"
        });
    }
};


// 2. Search and filter properties
const searchProperties = async (req, res) => {
    try {
        const {
            search = "",
            maxRent,
            roomType
        } = req.query;

        const filter = {
            $or: [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        };

        if (maxRent !== undefined && maxRent !== "") {
            const rentValue = Number(maxRent);

            if (!Number.isFinite(rentValue) || rentValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maximum rent"
                });
            }

            filter.rent = { $lte: rentValue };
        }

        if (roomType) {
            filter.roomType = roomType;
        }

        const properties = await Property.find(filter)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Search properties error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while searching properties"
        });
    }
};


// 3. Get property details by ID
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        return res.status(200).json({
            success: true,
            property
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid property ID"
        });
    }
};


// 4. Contact property owner
const contactOwner = async (req, res) => {
    try {
        const {
            senderName,
            senderEmail,
            message
        } = req.body;

        if (!senderName || !senderEmail || !message) {
            return res.status(400).json({
                success: false,
                message: "All contact fields are required"
            });
        }

        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const inquiry = await ContactMessage.create({
            property: property._id,
            owner: property.owner,
            senderName,
            senderEmail,
            message
        });

        return res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully",
            inquiryId: inquiry._id
        });

    } catch (error) {
        console.error("Contact owner error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your inquiry"
        });
    }
};


// Export all controller functions
module.exports = {
    addProperty,
    searchProperties,
    getPropertyById,
    contactOwner
};
