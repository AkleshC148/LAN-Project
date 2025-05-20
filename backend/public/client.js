console.log("✅ client.js loaded");
const socket = io();

let peerConnection;
let localStream;
let yourId, receiverId;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

socket.on("connect", () => {
    console.log("🔗 Socket connected:", socket.id);
});

// Register user
function register() {
    yourId = document.getElementById("yourId").value;
    receiverId = document.getElementById("receiverId").value;
    socket.emit("register-user", yourId);
    console.log(`✅ Registered as ${yourId}`);
}

// Start call (caller only)
async function startCall() {
    receiverId = document.getElementById("receiverId").value;
    await setupMedia();
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", {
        from: yourId,
        targetId: receiverId,
        offer: peerConnection.localDescription
    });

    console.log(`📞 Sent offer to ${receiverId}`);
}

// Accept call (receiver only)
async function acceptCall() {
    yourId = document.getElementById("yourId").value;
    receiverId = document.getElementById("receiverId").value;

    await setupMedia();
    createPeerConnection();
    console.log("✅ Ready to accept call...");
}

// End call
function endCall() {
    if (peerConnection) peerConnection.close();
    peerConnection = null;
    console.log("🔚 Call ended");
}

// Setup mic
async function setupMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("🎤 Microphone access granted");
}

// Peer connection setup
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", {
                targetId: receiverId,
                candidate: event.candidate
            });
        }
    };

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteAudio").srcObject = event.streams[0];
    };
}

// 🔄 Socket Events
socket.on("incomingCall", ({ callerId }) => {
    receiverId = callerId;
    alert(`📥 Incoming call from ${callerId}`);
});

socket.on("offer", async ({ from, offer }) => {
    receiverId = from;
    await setupMedia();
    createPeerConnection();

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", {
        targetId: from,
        answer: peerConnection.localDescription
    });
    console.log("✅ Sent answer to caller");
});

socket.on("answer", async ({ answer }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("✅ Received answer");
});

socket.on("candidate", async ({ candidate }) => {
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("🌐 ICE Candidate added");
    }
});

// 🔇 Speaker & 🎙️ Mic Toggles
let micEnabled = true;
function toggleMic() {
    if (!localStream) return alert("⚠️ Microphone not initialized yet!");
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        micEnabled = track.enabled;
    });
    console.log(`🎙️ Mic ${micEnabled ? 'ON' : 'OFF'}`);
}

let speakerEnabled = true;
function toggleSpeaker() {
    const remoteAudio = document.getElementById("remoteAudio");
    speakerEnabled = !speakerEnabled;
    remoteAudio.muted = !speakerEnabled;
    console.log(`🔈 Speaker ${speakerEnabled ? 'ON' : 'OFF'}`);
}
