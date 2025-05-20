const mongoose = require("mongoose");
require("dotenv").config();

// Defining the MongoDB URL
const mongoURL = process.env.MONGODB_LAN_URL || "mongodb://localhost:27017/lan_communication";

// Setting up MongoDB connection
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Mongoose default connection object
const db = mongoose.connection;

// Event listeners
db.on("connected", () => {
    console.log("✅ Connected to MongoDB (LAN Communication Project)");
});

db.on("disconnected", () => {
    console.log("⚠️ MongoDB Disconnected...");
});

db.on("error", (err) => {
    console.log("❌ MongoDB Connection Error:", err);
});

// Exporting DB connection
module.exports = db;
