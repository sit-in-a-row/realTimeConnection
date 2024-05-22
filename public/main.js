const socket = io();
const startCallButton = document.getElementById('startCall');
const remoteAudio = document.getElementById('remoteAudio');
let localStream;
let peerConnection;

const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

startCallButton.onclick = async () => {
    startCallButton.disabled = true;

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
};

socket.on('offer', async (offer) => {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(config);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', event.candidate);
            }
        };

        peerConnection.ontrack = (event) => {
            remoteAudio.srcObject = event.streams[0];
        };

        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});