
const Property = require("../models/Property");

// Get all property listings for admin
const getAllListings = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can view all listings"
            });
        }

        const properties = await Property.find({})
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Get all listings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve property listings"
        });
    }
};

// Approve or reject a property
const updateVerificationStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can verify listings"
            });
        }

        const { status } = req.body;
        const propertyId = req.params.id;

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Approved or Rejected"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        property.verificationStatus = status;
        await property.save();

        return res.status(200).json({
            success: true,
            message: `Property ${status.toLowerCase()} successfully`,
            property
        });

    } catch (error) {
        console.error("Update verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update verification status"
        });
    }
};

module.exports = {
    getAllListings,
    updateVerificationStatus
};
