// backend/services/webrtcService.js

// WebRTC signaling service (simplified)
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

exports.createPeerConnection = () => {
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add your TURN servers here for production
      // {
      //   urls: 'turn:your-turn-server.com',
      //   username: 'username',
      //   credential: 'password'
      // }
    ]
  };

  return new RTCPeerConnection(configuration);
};

exports.generateOffer = async (peerConnection) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

exports.handleAnswer = async (peerConnection, answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

exports.addIceCandidate = async (peerConnection, candidate) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};