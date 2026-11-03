
const Favourite = require("../models/Favourite");
const Property = require("../models/Property");

// 1. Add a property to favourites
const addFavourite = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can save favourite properties"
            });
        }

        const { propertyId } = req.body;

        if (!propertyId || !/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Valid property ID is required"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const existingFavourite = await Favourite.findOne({
            student: req.user.id,
            property: propertyId
        });

        if (existingFavourite) {
            return res.status(409).json({
                success: false,
                message: "Property is already in your favourites"
            });
        }

        const favourite = await Favourite.create({
            student: req.user.id,
            property: propertyId
        });

        return res.status(201).json({
            success: true,
            message: "Property added to favourites",
            favourite
        });

    } catch (error) {
        // Also handle duplicates caused by simultaneous requests
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Property is already in your favourites"
            });
        }

        console.error("Add favourite error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add favourite"
        });
    }
};


// 2. Get student's favourite properties
const getMyFavourites = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can view favourite properties"
            });
        }

        const favourites = await Favourite.find({
            student: req.user.id
        })
            .populate("property")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: favourites.length,
            favourites
        });

    } catch (error) {
        console.error("Get favourites error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve favourites"
        });
    }
};


// 3. Remove a property from favourites
const removeFavourite = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can remove favourite properties"
            });
        }

        const favouriteId = req.params.id;

        if (!/^[0-9a-fA-F]{24}$/.test(favouriteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid favourite ID"
            });
        }

        const favourite = await Favourite.findOne({
            _id: favouriteId,
            student: req.user.id
        });

        if (!favourite) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found"
            });
        }

        await Favourite.findOneAndDelete({
            _id: favouriteId,
            student: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Property removed from favourites"
        });

    } catch (error) {
        console.error("Remove favourite error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove favourite"
        });
    }
};


module.exports = {
    addFavourite,
    getMyFavourites,
    removeFavourite
};
