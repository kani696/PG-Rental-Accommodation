const Property = require("../models/Property");

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


// Search properties
const searchProperties = async (req, res) => {
    try {
        const search = req.query.search || "";

        const properties = await Property.find({
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
        }).sort({ createdAt: -1 });

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


module.exports = {
    addProperty,
    searchProperties
};