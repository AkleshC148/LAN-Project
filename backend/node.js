const http = require('http');
const socketIo = require('socket.io');

// Create HTTP server
const server = http.createServer();
const io = socketIo(server, {
    cors: { origin: '*' }
});

let users = {}; // Store connected users

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // ✅ Register user
    socket.on('register', (username) => {
        console.log(`${username} registered`);
        users[socket.id] = { username, id: socket.id };
        io.emit('users', Object.values(users)); // Send updated user list
    });

    // ✅ Handle voice call initiation
    socket.on('call-user', ({ to, offer }) => {
        console.log(`Call Request from ${socket.id} to ${to}`);
        console.log("Users List:", users);

        if (users[to]) {
            io.to(to).emit('incoming-call', { from: socket.id, offer });
        } else {
            console.log(`User ${to} not found in users list!`);
        }
    });

    // ✅ Handle video call initiation
    socket.on('start-video-call', ({ to, offer }) => {
        console.log(`Video Call Request from ${socket.id} to ${to}`);

        if (users[to]) {
            io.to(to).emit('incoming-video-call', { from: socket.id, offer });
        } else {
            console.log(`User ${to} not found in users list!`);
        }
    });

    // ✅ Handle call acceptance
    socket.on('accept-call', ({ to, answer }) => {
        if (users[to]) {
            console.log(`Call accepted by ${to}`);
            io.to(to).emit('call-answered', { from: socket.id, answer });
        }
    });

    // ✅ Handle call rejection
    socket.on('reject-call', ({ to }) => {
        if (users[to]) {
            console.log(`Call rejected by ${socket.id}`);
            io.to(to).emit('call-rejected', { from: socket.id });
        }
    });

    // ✅ Handle ICE Candidates (for WebRTC Peer Connections)
    socket.on('ice-candidate', ({ to, candidate }) => {
        if (users[to]) {
            console.log(`ICE candidate received: ${candidate}`);
            io.to(to).emit('ice-candidate', { from: socket.id, candidate });
        }
    });

    // ✅ Handle user disconnections
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.removeAllListeners(); // Prevent memory leaks

        delete users[socket.id];
        io.emit('users', Object.values(users)); // Update the user list
    });
});

// Start server on port 3000 and allow LAN access
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebSocket Server running on ws://0.0.0.0:${PORT}`);
});
