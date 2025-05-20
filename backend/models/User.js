const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    scholarId: { type: String, required: true, unique: true }, 
    otp: { type: String },  // Store OTP
    otpExpiresAt: { type: Date },  // OTP Expiry Time
    macAddress: { type: String, required: true }, 
    ipAddress: { type: String, required: true },
});

// OTP Expiry Check
userSchema.methods.isOTPValid = function (enteredOTP) {
    return this.otp === enteredOTP && this.otpExpiresAt > new Date();
};

const User = mongoose.model("User", userSchema);
module.exports = User;
