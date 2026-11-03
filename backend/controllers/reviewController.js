
const Review = require("../models/Review");
const Property = require("../models/Property");

// Add a review
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const propertyId = req.params.id;

        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can submit reviews"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        if (
            !Number.isInteger(Number(rating)) ||
            Number(rating) < 1 ||
            Number(rating) > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Review comment is required"
            });
        }

        const property = await Property.findById(propertyId);

        if (!property || property.verificationStatus !== "Approved") {
            return res.status(404).json({
                success: false,
                message: "Approved property not found"
            });
        }

        const existingReview = await Review.findOne({
            student: req.user.id,
            property: propertyId
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this property"
            });
        }

        const review = await Review.create({
            student: req.user.id,
            property: propertyId,
            rating: Number(rating),
            comment: comment.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this property"
            });
        }

        console.error("Add review error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit review"
        });
    }
};


// Get reviews for a property
const getPropertyReviews = async (req, res) => {
    try {
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

        const reviews = await Review.find({
            property: propertyId
        })
            .populate("student", "name")
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;

        const averageRating = totalReviews === 0
            ? 0
            : Number(
                (
                    reviews.reduce((sum, review) => sum + review.rating, 0) /
                    totalReviews
                ).toFixed(1)
            );

        return res.status(200).json({
            success: true,
            totalReviews,
            averageRating,
            reviews
        });

    } catch (error) {
        console.error("Get reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve reviews"
        });
    }
};


module.exports = {
    addReview,
    getPropertyReviews
};
