
const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
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
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same student from saving a property more than once
favouriteSchema.index(
    { student: 1, property: 1 },
    { unique: true }
);

module.exports = mongoose.model("Favourite", favouriteSchema);
