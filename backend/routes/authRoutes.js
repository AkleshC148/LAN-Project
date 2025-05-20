const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken, jwtAuthMiddleware } = require("../middleware/jwt");
const crypto = require("crypto");

// Helper function to generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// 📌 Sign Up (User Registration)
router.post("/signup", async (req, res) => {
    try {
        
        const { scholarId, macAddress } = req.body;
        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        console.log("✅ /signup route hit");
    console.log("Request Body:", req.body);  // Log the data

        if (!scholarId || !macAddress) {
            return res.status(400).json({ error: "Scholar ID and MAC Address are required" });
        }

        let existingUser = await User.findOne({ scholarId });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists. Please log in." });
        }

        const otp = generateOTP();
        const newUser = new User({
            scholarId,
            macAddress,
            ipAddress,
            otp,
            otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000)

        });

        await newUser.save();
        res.status(201).json({ message: "Signup successful. OTP generated.", otp });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 Login (OTP Generation for Existing Users)
router.post("/login", async (req, res) => {
    try {
        const { scholarId, macAddress } = req.body;
        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        if (!scholarId || !macAddress) {
            return res.status(400).json({ error: "Scholar ID and MAC Address are required" });
        }

        let user = await User.findOne({ scholarId });

        if (!user) {
            return res.status(404).json({ error: "User not found. Please sign up." });
        }

        if (user.macAddress !== macAddress) {
            return res.status(403).json({ error: "MAC Address mismatch. Unauthorized device." });
        }

        user.otp = generateOTP();
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
        user.ipAddress = ipAddress;

        await user.save();
        res.status(200).json({ message: "OTP generated. Proceed to verification.", otp: user.otp });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 OTP Verification & JWT Token Generation
router.post("/verify-otp", async (req, res) => {
    try {
        const { scholarId, otp } = req.body;
        const user = await User.findOne({ scholarId });

        if (!user || !user.isOTPValid(otp)) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }

        // Generate JWT Token
        const token = generateToken({ scholarId, macAddress: user.macAddress, ipAddress: user.ipAddress });

        res.status(200).json({ message: "Authentication successful", token });
    } catch (err) {
        console.error("OTP Verification Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 Secure Profile Route (Requires JWT)
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ scholarId: req.user.scholarId });
        res.status(200).json({ user });
    } catch (err) {
        console.error("Profile Error:", err);
        res.status(500).json({ error: "User not found" });
    }
});

module.exports = router;
