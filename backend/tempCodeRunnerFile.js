const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
require("./config/db"); // Importing Database Connection

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: `http://${process.env.LAN_IP}:${process.env.PORT}`, // Use env variables
        methods: ["GET", "POST"],
    }
    
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());app.get("/", (req, res) => {
    res.send("Server is working");
  });



// Import Routes
const authRoutes = require("./routes/authRoutes");

  
app.use("/auth", authRoutes);

// const callRoutes = require("./routes/callRoutes");
// app.use("/auth", authRoutes);

// WebSocket Handling (Call Signaling)
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-call", (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", socket.id);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
