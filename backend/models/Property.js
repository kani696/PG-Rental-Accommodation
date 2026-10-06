const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        rent: {
            type: Number,
            required: true,
            min: 0
        },

        roomType: {
            type: String,
            enum: ["Single", "Shared", "Double"],
            required: true
        },

        amenities: {
            type: [String],
            default: []
        },

        contactNumber: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Property", propertySchema);