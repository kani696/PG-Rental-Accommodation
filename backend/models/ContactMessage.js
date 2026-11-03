const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        senderName: {
            type: String,
            required: true,
            trim: true
        },

        senderEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ContactMessage",
    contactMessageSchema
);