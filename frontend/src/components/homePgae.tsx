import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
// import { setLocalStream } from "../utils/callContext"; // Add this
// import { setRemoteStream } from "../utils/callContext"; // Add this

export const HomePage = () => {
  const [username, setUserName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [incomingCallOffer, setIncomingCallOffer] = useState<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const iceCandidatesBuffer = useRef<any[]>([]);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
const localVideoRef = useRef<HTMLVideoElement | null>(null);



  // const navigate = useNavigate();

  useEffect(() => {
 
    // Socket event listeners
    socket.on("users", (userList: any) => {
      console.log("Received users list:", userList); // Debug log
      setUsers(userList);
    });

    socket.on("incoming-call", async ({ from, offer }: any) => {
      console.log(`Incoming call from ${from}`);
      console.log(`Offer in incoming call :-  ${offer}`);
      if (!peerConnectionRef.current) {
        createPeer(from); // 🛠️ Make sure we have a peer ready!
      }
    
      setIncomingCall({ from, offer });
      setIncomingCallOffer(offer);
    });

    socket.on("call-answered", async ({ answer }: any) => {
      const peer = peerConnectionRef.current;
      if (peer) {
        
        if (peer.remoteDescription && peer.remoteDescription.type === "answer") {
          console.warn("Remote description already set as answer. Skipping.");
          return;
        }
        
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));

          // Flush buffered ICE candidates HERE
iceCandidatesBuffer.current.forEach(async (cand) => {
  try {
    await peer.addIceCandidate(new RTCIceCandidate(cand));
  } catch (e) {
    console.error("Failed to add buffered candidate", e);
  }
});
iceCandidatesBuffer.current = [];
        } catch (err) {
          console.error("Failed to set remote answer:", err);
        }
      }
    });
    

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("ICE add failed:", err);
        }
      } else {
        iceCandidatesBuffer.current.push(candidate);
      }
    });

    return () => {
      socket.off("users");
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
    };
  }, []);

  

  const createPeer = (remoteUserId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ]
    });

    const remoteStream = new MediaStream();
    

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: remoteUserId, candidate: event.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("Connection state:", peer.connectionState);
    };
    
    peer.onsignalingstatechange = () => {
      console.log("Signaling state:", peer.signalingState);
    };
    

    peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track)=>{
        remoteStream.addTrack(track);
      })
    
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("✅ Remote video attached");
      }
    
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = 1;
    
        setTimeout(() => {
          remoteAudioRef.current?.play().catch((err) => console.warn("⚠️ Audio play issue:", err));
        }, 300);
      }
    
      const audioTracks = remoteStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log("🎤 Remote audio track label:", audioTracks[0].label);
      } else {
        console.warn("🚫 No audio tracks in remote stream!");
      }
    
      // setRemoteStream(remoteStream);
    };
    
    

    peerConnectionRef.current = peer;
    return peer;
  };

  const handleRegister = () => {
    if (!username.trim()) {
      alert("Enter a valid Scholar ID");
      return;
    }
    socket.emit("register-user", username);
    console.log("name sent")
  };

  useEffect(()=>{
     const setLocalMedia = async () => {
    try {
      const stream = await setupMedia();

       if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

       if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Prevent echo
        localAudioRef.current.play().catch(err => console.warn("Local audio play failed", err));
      }
    } catch (err) {
      console.error("❌ Failed to access microphone:", err);
      alert("Please allow microphone access");
      throw err;
    }// 👈 Do not attach it to an <audio> element
  };
 
    setLocalMedia();
  },[])

  const setupMedia = async () => {
    if (!navigator.mediaDevices) {
      alert("Your browser does not support audio calls.");
      throw new Error("MediaDevices API not supported");
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({  video: true, audio: true});
      // setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("❌ Failed to access microphone:", err);
      alert("Please allow microphone access");
      throw err;
    }// 👈 Do not attach it to an <audio> element
  };
  

  const callUser = async (id: string) => {
    try {
      const stream = await setupMedia();
      const peer = createPeer(id);

         // 👉 Flush buffered ICE candidates
    iceCandidatesBuffer.current.forEach(async (cand) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.error("Failed to add buffered candidate", e);
      }
    });
    iceCandidatesBuffer.current = [];
  
    stream.getAudioTracks().forEach(track => peer.addTrack(track, stream));
    stream.getVideoTracks().forEach(track => peer.addTrack(track, stream));
      
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      socket.emit("call-user", { to: id, offer });
      console.log("call request emitted");
      // navigate("/onCall");
    } catch (err) {
      console.error("Failed to make call:", err);
    }
  };
  
  const acceptCall = async (callerId: string) => {
    if (!incomingCallOffer) return;
  
    try {
      const stream = await setupMedia();
      const peer = createPeer(callerId);

      stream.getAudioTracks().forEach(track => peer.addTrack(track, stream));
stream.getVideoTracks().forEach(track => peer.addTrack(track, stream));


      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Prevent echo
        localAudioRef.current.play().catch(err => console.warn("Local audio play failed", err));
      }

      console.log("Adding tracks for stream:", stream);

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCallOffer));

      // Flush buffered ICE candidates HERE
iceCandidatesBuffer.current.forEach(async (cand) => {
  try {
    await peer.addIceCandidate(new RTCIceCandidate(cand));
  } catch (e) {
    console.error("Failed to add buffered candidate", e);
  }
});
iceCandidatesBuffer.current = [];
      

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("accept-call", { to: incomingCall.from, answer });
      // navigate("/onCall");
      setIncomingCall(null); 
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };
  

  return (
    <div className="bg-black min-h-screen overflow-hidden">
      <img src="cat.png" alt="" className="absolute right-6 top-10" />
      <div className="bg-black text-white p-4 text-lg font-bold shadow-md">
        <div className="text-2xl">LAN VOICE CALLS</div>
      </div>
      <div className="border-white border-6 rounded-md w-1/3 absolute left-40 top-30">
        <div className="p-4">
          <input
            type="text"
            placeholder="Enter Scholar Id"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            className="bg-white border p-1"
          />
          <button onClick={handleRegister} className="bg-white ml-2 rounded-md p-1">
            Register
          </button>
        </div>

        <h2 className="bg-white p-1 font-bold text-lg">Connected Users</h2>
        <ul className="text-white py-3 px-4 flex flex-col gap-3">
          {users.length > 0 ? (
            users.map((userId) => (
              <li key={userId} className="flex justify-between p-2 bg-gray-100 rounded-md font-serif text-purple-400">
                {userId}
                {incomingCall && incomingCall.from === userId ? (
                  <div className="flex gap-2">
                  <button onClick={() => acceptCall(userId)} className="font-bold bg-blue-400 text-black rounded-md px-2 py-1">
                    Answer
                  </button>
                 
                </div>
                  
                ) : 
                <div className="flex">
                  <button onClick={() => callUser(userId)} className="font-bold bg-green-400 text-black rounded-md px-2 py-1">
                    Call
                  </button>
                </div>
                }
              </li>
            ))
          ) : (
            <li>No users connected</li>
          )}
        </ul>
      </div>
      <>
<audio ref={remoteAudioRef} autoPlay hidden  />
<audio ref={localAudioRef} autoPlay hidden muted />
<div className="flex gap-4 absolute top-80">
  <div className="flex flex-col gap-2 bg-white p-2 rounded-md">
    <div className="text-center font-bold">Local</div>
  <video ref={localVideoRef} autoPlay  playsInline className="w-full h-auto" />
  </div>
  <div className="flex flex-col gap-2 bg-white p-2 rounded-">
    <div className="text-center font-bold ">Remote</div>
    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-auto" />
  </div>
</div>
</>
    </div>
  );
};
