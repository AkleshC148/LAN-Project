const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
    callerId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, enum: ["initiated", "accepted", "rejected", "ended"], default: "initiated" },
    timestamp: { type: Date, default: Date.now },
});

const Call = mongoose.model("Call", callSchema);
module.exports = Call;
