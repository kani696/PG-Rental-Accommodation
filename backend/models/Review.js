
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate reviews by the same student
reviewSchema.index(
    { student: 1, property: 1 },
    { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);
