let myVideoStream;
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const socket = io({ transports: ["polling"] });

const peerOptions = {
    path: "/peerjs",
    host: location.hostname,
    port: location.port || (location.protocol === "https:" ? 443 : 3030),
};
if (location.protocol === "https:") peerOptions.secure = true;
var peer = new Peer(undefined, peerOptions);

const peers = {};
peer.on("open", (id) => {
    function doJoin() {
        socket.emit("join-room", ROOM_ID, id);
    }
    if (socket.connected) {
        doJoin();
    } else {
        socket.once("connect", doJoin);
    }
});

peer.on("error", (err) => {
    console.error(err);
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.autoplay = true;
    video.addEventListener("loadedmetadata", () => {
        video.play();

        video.classList.add("video-element");
        if (video === myVideo) {
            video.classList.add("video-self");
            video.muted = true;
        } else {
            video.classList.add("video-remote");
        }
        videoGrid.appendChild(video);
    });
}

function connectToNewUser(userId, stream) {
    setTimeout(() => {
        try {
            const call = peer.call(userId, stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                video.dataset.userId = userId;
                peers[userId] = call;
                addVideoStream(video, userVideoStream);
            });
            call.on("error", (err) => console.error(err));
            call.on("close", () => {
                removeVideoByUserId(userId);
                delete peers[userId];
            });
        } catch (err) {
            console.error(err);
        }
    }, 500);
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
                video.dataset.userId = call.peer;
                peers[call.peer] = call;
                addVideoStream(video, userVideoStream);
            });
            call.on("close", () => {
                removeVideoByUserId(call.peer);
                delete peers[call.peer];
            });
        });
        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
        socket.on("user-disconnected", (userId) => {
            if (peers[userId]) peers[userId].close();
            removeVideoByUserId(userId);
        });
    })
    .catch((err) => {
        console.error("Error getting local media:", err);
    });

// Chat UI
const messageInput = document.getElementById("chat_message");
const sendButton = document.getElementById("send");
const messagesContainer = document.querySelector(".messages");

function appendMessage(text, fromSelf = false) {
    const div = document.createElement("div");
    div.className = fromSelf ? "message self" : "message";
    div.innerText = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeVideoByUserId(userId) {
    const videos = document.querySelectorAll("#video-grid video");
    for (const v of videos) {
        if (v.dataset.userId === userId) {
            v.pause();
            if (v.srcObject) {
                v.srcObject.getTracks().forEach((t) => t.stop());
            }
            v.remove();
        }
    }
}

sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (!message) return;
    appendMessage(`You: ${message}`, true);
    socket.emit("message", ROOM_ID, message);
    messageInput.value = "";
});


socket.on("createMessage", (msg) => {
    appendMessage(msg, false);
});
