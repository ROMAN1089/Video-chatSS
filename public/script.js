let myVideoStream;
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});
peer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.autoplay = true;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.appendChild(video);
    });
}

function connectToNewUser(userId, stream) {
      const call = peer.call(userId, stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
      });
}

navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);
        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });
        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
    })
    .catch((err) => {
        console.error("Error getting local media:", err);
    });
