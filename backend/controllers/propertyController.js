
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

        if (!Number.isFinite(Number(rent)) || Number(rent) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Rent must be greater than 0"
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
            roomType,
            availability
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
            if (!["Single", "Shared", "Double"].includes(roomType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid room type"
                });
            }

            filter.roomType = roomType;
        }

        if (availability) {
            if (!["Available", "Not Available"].includes(availability)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid availability status"
                });
            }

           filter.availability = availability === "Available"
    ? { $in: ["Available", null] }
    : "Not Available";
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


// 5. Get properties belonging to logged-in owner
const getMyListings = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can view their listings"
            });
        }

        const properties = await Property.find({
            owner: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Get my listings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your property listings"
        });
    }
};


// 6. Update an owner's property
const updateProperty = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can update properties"
            });
        }

        const propertyId = req.params.id;

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own properties"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "location",
            "rent",
            "roomType",
            "amenities",
            "contactNumber"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No property details provided for update"
            });
        }

        if (updates.title !== undefined && !String(updates.title).trim()) {
            return res.status(400).json({
                success: false,
                message: "Property title cannot be empty"
            });
        }

        if (updates.description !== undefined && !String(updates.description).trim()) {
            return res.status(400).json({
                success: false,
                message: "Description cannot be empty"
            });
        }

        if (updates.location !== undefined && !String(updates.location).trim()) {
            return res.status(400).json({
                success: false,
                message: "Location cannot be empty"
            });
        }

        if (updates.rent !== undefined) {
            const rentValue = Number(updates.rent);

            if (!Number.isFinite(rentValue) || rentValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Rent must be greater than 0"
                });
            }

            updates.rent = rentValue;
        }

        if (
            updates.roomType !== undefined &&
            !["Single", "Shared", "Double"].includes(updates.roomType)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid room type"
            });
        }

        if (
            updates.amenities !== undefined &&
            !Array.isArray(updates.amenities)
        ) {
            return res.status(400).json({
                success: false,
                message: "Amenities must be an array"
            });
        }

        if (
            updates.contactNumber !== undefined &&
            !String(updates.contactNumber).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Contact number cannot be empty"
            });
        }

        Object.assign(property, updates);

        await property.save();

        return res.status(200).json({
            success: true,
            message: "Property updated successfully",
            property
        });

    } catch (error) {
        console.error("Update property error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update property"
        });
    }
};


// 7. Delete an owner's property
const deleteProperty = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can delete properties"
            });
        }

        const propertyId = req.params.id;

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own properties"
            });
        }

        await Property.findByIdAndDelete(propertyId);

        return res.status(200).json({
            success: true,
            message: "Property deleted successfully"
        });

    } catch (error) {
        console.error("Delete property error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete property"
        });
    }
};


// 8. Update property availability
const updateAvailability = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Only property owners can update availability"
            });
        }

        const propertyId = req.params.id;
        const { availability } = req.body;

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        if (!["Available", "Not Available"].includes(availability)) {
            return res.status(400).json({
                success: false,
                message: "Availability must be Available or Not Available"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own property availability"
            });
        }

        property.availability = availability;
        await property.save();

        return res.status(200).json({
            success: true,
            message: "Property availability updated successfully",
            property
        });

    } catch (error) {
        console.error("Update availability error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update property availability"
        });
    }
};


module.exports = {
    addProperty,
    searchProperties,
    getPropertyById,
    contactOwner,
    getMyListings,
    updateProperty,
    deleteProperty,
    updateAvailability
};
