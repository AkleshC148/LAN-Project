# 📞 LAN Video Call App

A **LAN-based real-time voice and video calling web application** using **React**, **TypeScript**, **Socket.IO**, and **WebRTC**. This project enables users connected to the same local network to register, initiate, and receive calls without using the internet.

## 🚀 Features

- 🔒 Scholar ID-based user registration  
- 🔗 Peer-to-peer audio/video calls using WebRTC  
- ⚡ Real-time socket communication using Socket.IO  
- 📡 Local LAN hosting support (offline operation)  
- 🖥️ Clean and responsive React UI  
- 🔧 Backend signaling server for WebRTC handshake  

## 📂 Folder Structure

```bash
.
├── client/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── socket.ts   # Socket.IO client setup
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/
├── server/             # Node.js + Socket.IO backend
│   ├── index.ts        # WebSocket signaling server
│   └── users.ts        # User management logic
└── README.md
```

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS (optional)
- **Backend:** Node.js, Express, Socket.IO
- **Real-time Comm:** WebRTC (for media), Socket.IO (for signaling)
- **Deployment:** LAN server / Raspberry Pi (optional)


## 🖥️ How It Works

1. User registers using Scholar ID.
2. Frontend connects to the backend via Socket.IO.
3. When a call is initiated, the backend facilitates WebRTC signaling between peers.
4. Once WebRTC negotiation is complete, a direct P2P connection is established for audio/video streaming.

## 🛡️ Security Notes

- This project is LAN-only by design (no internet exposure).
- Scholar ID is used for user identity within the local network.
- No user data is stored persistently by default.

## ⚙️ Future Features

- 📱 Mobile browser support
- 🧑‍🤝‍🧑 Group calls
- 🧾 Chat during calls
- 🧪 Network quality monitoring
- 💾 Optional call recording (local)

## 🧑‍💻 Author

**MD Gohar Khan**  
3rd year student at NIT Silchar  

