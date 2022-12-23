const socket = io().connect("/");

var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: 443,
});

const peers = {};

let myVideoStream;

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video")
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        quality: 7
    },
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', (call) => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', (userId) => {
        console.log(`New user with ID: ${userId} is connected to the room...`)
        connectToNewUser(userId, stream);
    });
})

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play()
        videoGrid.append(video);
    })

    video.addEventListener("click", () => {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        }
        else if (video.mozRequestFullScreen) {
            video.mozRequestFullScreen();
        }
        else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        }
        else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    })
}

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);

    const video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
        console.log("New user is connected, add new video to FE...")
        addVideoStream(video, userVideoStream);
    })

    call.on("close", () => {
        video.remove();
    })

    peers[userId] = call;
}

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) {
        peers[userId].close();
    }
})

peer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id);
});