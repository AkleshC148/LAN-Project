const express = require("express");
const router = express.Router();
const Call = require("../models/Call");

// POST /call/initiate
router.post("/initiate", async (req, res) => {
    const { callerId, receiverId } = req.body;
    const newCall = new Call({ callerId, receiverId });
    await newCall.save();
    res.status(201).json({ message: "Call initiated", call: newCall });
});

// POST /call/accept
router.post("/accept", async (req, res) => {
    const { callId } = req.body;
    const call = await Call.findByIdAndUpdate(callId, { status: "accepted" }, { new: true });
    res.status(200).json({ message: "Call accepted", call });
});

// POST /call/reject
router.post("/reject", async (req, res) => {
    const { callId } = req.body;
    const call = await Call.findByIdAndUpdate(callId, { status: "rejected" }, { new: true });
    res.status(200).json({ message: "Call rejected", call });
});

// POST /call/end
router.post("/end", async (req, res) => {
    const { callId } = req.body;
    const call = await Call.findByIdAndUpdate(callId, { status: "ended" }, { new: true });
    res.status(200).json({ message: "Call ended", call });
});

// GET /call/history/:userId
router.get("/history/:userId", async (req, res) => {
    const { userId } = req.params;
    const history = await Call.find({
        $or: [{ callerId: userId }, { receiverId: userId }]
    }).sort({ timestamp: -1 });

    res.status(200).json({ history });
});

module.exports = router;
