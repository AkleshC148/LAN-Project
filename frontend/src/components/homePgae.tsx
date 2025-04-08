import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://192.168.102.99:3000", {
  transports: ["websocket"],
});


export const HomePage = () => {
  const [username, setUserName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
  const [incomingCallOffer, setIncomingCallOffer] = useState<any>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
 
    // Socket event listeners
    socket.on("users", (userList: any) => {
      console.log("Received users list:", userList); // Debug log
      setUsers(userList);
    });

    socket.on("incoming-call", async ({ from, offer }: any) => {
      console.log(`Incoming call from ${from}`);
      setIncomingCallFrom(from);
      setIncomingCallOffer(offer);
    });

    socket.on("call-answered", async ({ answer }: any) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate }: any) => {
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    return () => {
      socket.off("users");
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.disconnect();
      if (peerConnection) peerConnection.close();
    };
  }, [peerConnection]);

  

  const createPeer = (remoteUserId: string) => {
    const peer = new RTCPeerConnection();

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: remoteUserId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    setPeerConnection(peer);
    return peer;
  };

  const handleRegister = () => {
    if (!username.trim()) {
      alert("Enter a valid Scholar ID");
      return;
    }
    socket.emit("register", username);
  };

  const callUser = async (id: string) => {
    console.log(`Calling user ${id}...`);
    const peer = createPeer(id);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("call-user", { to: id, offer });
    navigate("/onCall");
  };

  const acceptCall = async (callerId: string) => {
    if (!incomingCallOffer) return;
    console.log(`Accepting call from ${callerId}...`);

    const peer = createPeer(callerId);
    await peer.setRemoteDescription(new RTCSessionDescription(incomingCallOffer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("accept-call", { to: callerId, answer });
    navigate("/onCall");
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
            users.map((user) => (
              <li key={user.id} className="flex justify-between p-2 bg-gray-100 rounded-md font-serif text-purple-400">
                {user.username}
                {incomingCallFrom === user.id ? (
                  <button onClick={() => acceptCall(user.id)} className="font-bold bg-blue-400 text-black rounded-md px-2 py-1">
                    Answer
                  </button>
                ) : 
                  <button onClick={() => callUser(user.id)} className="font-bold bg-green-400 text-black rounded-md px-2 py-1">
                    Call
                  </button>
                }
              </li>
            ))
          ) : (
            <li>No users connected</li>
          )}
        </ul>

        <h2>Audio</h2>
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
};
