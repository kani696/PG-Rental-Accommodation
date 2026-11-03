
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
        }

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            if (existingAdmin.role !== "admin") {
                throw new Error("This email already belongs to a non-admin account");
            }

            console.log("Admin account already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: "Administrator",
            email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin account created successfully!");

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
