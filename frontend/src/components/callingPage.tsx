import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://192.168.102.99:3000", {
    transports: ["websocket"],
  });
  



export const CallingPage = () => {
    const [muteClicked, setMuteClicked] = useState(false);
    const [speakerClicked, setSpeakerClicked] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const navigate = useNavigate();

    // STEP 1: Setup Media and PeerConnection
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);

        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
          }
        };

        peerConnection.current.ontrack = (event) => {
          const remoteStream = event.streams[0];
          const remoteAudio = new Audio();
          remoteAudio.srcObject = remoteStream;
          remoteAudio.autoplay = true;
          remoteAudio.play();
        };
      } catch (err) {
        console.error("Error accessing media:", err);
      }
    })();
  }, []);

    useEffect(() => {
        socket.on("incoming-call", () => {
            setIncomingCall(true);
        });
    }, []);


    useEffect(() => {
        socket.on("ice-candidate", async (candidate) => {
            if (peerConnection.current) {
              try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.error("Error adding received ICE candidate", err);
              }
            }
          });
    }, []);

   
      

    const toggleMute = () => {
        if (mediaStream) {
            const audioTrack = mediaStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setMuteClicked(!muteClicked);
        }
    };

   

    const toggleSpeaker = async () => {
        try {
          const audio = new Audio();
          if (mediaStream) audio.srcObject = mediaStream;
          await (audio as any).setSinkId(speakerClicked ? "default" : "speaker");
          setSpeakerClicked(!speakerClicked);
        } catch (err) {
          console.error("Error switching audio output:", err);
        }
      };

    const startVideoCall = async () => {
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);
      
        socket.emit("call-user", { offer });
      };
      

      const acceptCall = async () => {
        setIncomingCall(false);
        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer);
        socket.emit("accept-call", { answer });
        setShowVideoCall(true);
      };

    const rejectCall = () => {
        setIncomingCall(false);
    };

    const endCall = () => {
        mediaStream?.getTracks().forEach(track => track.stop());
        setShowVideoCall(false);
        if (peerConnection) {
            peerConnection.current?.close();;
          }
        navigate('/');
    };

    return (
        <div className="bg-black min-h-screen flex justify-center items-center">
            <div className="text-white p-6 w-96 rounded-2xl bg-blue-500 shadow-lg flex flex-col items-center gap-6">
                {incomingCall ? (
                    <div className="text-center">
                        <p className="text-xl font-bold">Incoming Video Call</p>
                        <div className="flex gap-4 mt-4">
                            <button onClick={acceptCall} className="bg-green-500 p-2 rounded-lg">Accept</button>
                            <button onClick={rejectCall} className="bg-red-500 p-2 rounded-lg">Reject</button>
                        </div>
                    </div>
                ) : showVideoCall ? (
                    <div className="text-center text-white font-bold text-2xl">Video Call Started</div>
                ) : (
                    <>
                        <img src="catPhone.jpg" alt="User Avatar" className="w-20 h-20 rounded-full border-2 border-white" />
                        <div className="text-center text-white font-bold text-2xl">Khan</div>

                        <div className="flex justify-around w-full">
                            <button 
                                onClick={toggleMute} 
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${muteClicked ? 'bg-gray-600' : 'bg-green-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06Z" />
                                </svg>
                                <span className="text-white text-sm">Mute</span>
                            </button>

                            <button 
                                onClick={toggleSpeaker} 
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${speakerClicked ? 'bg-gray-600' : 'bg-green-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06Z" />
                                </svg>
                                <span className="text-white text-sm">Speaker</span>
                            </button>
                        </div>

                        <button onClick={startVideoCall} className="bg-blue-700 w-14 h-14 rounded-full flex justify-center items-center shadow-lg hover:bg-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-6-4H5zM8 8h8v8H8V8z" />
                            </svg>
                        </button>
                    </>
                )}
                <button onClick={endCall} className="bg-red-600 w-14 h-14 rounded-full flex justify-center items-center shadow-lg hover:bg-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
