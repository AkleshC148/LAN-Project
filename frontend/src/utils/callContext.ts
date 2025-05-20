export let peerConnection: RTCPeerConnection | null = null;
// callContext.ts
export const localStream: { current: MediaStream | null } = { current: null };
export const remoteStream: { current: MediaStream | null } = { current: null };

export const setLocalStream = (stream: MediaStream) => {
  localStream.current = stream;
};

export const setRemoteStream = (stream: MediaStream) => {
  remoteStream.current = stream;
};


