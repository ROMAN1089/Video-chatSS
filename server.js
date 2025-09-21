const express = require("express");
const app = express();
const server = require("http").Server(app);
const { randomUUID } = require('crypto');
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.set('view engine', 'ejs')
app.use('/peerjs', peerServer);
app.use(express.static('public'));


app.get("/", (req, res) => {
    res.render("index");
});

app.get('/new', (req, res) => {
    res.redirect(`/${randomUUID()}`);
});

app.get('/api/rooms', (req, res) => {
    const rooms = [];
    const roomsMap = io.sockets.adapter.rooms;
    const sids = io.sockets.adapter.sids;
    for (const [roomName, socketsSet] of roomsMap) {
        if (sids.has(roomName)) continue;
        rooms.push({ roomId: roomName, participants: socketsSet.size });
    }
    res.json(rooms);
});

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);

        socket.roomId = roomId;
        socket.userId = userId;

        socket.broadcast.to(roomId).emit('user-connected', userId);
    });

    socket.on('message', (roomId, message) => {

        socket.broadcast.to(roomId).emit('createMessage', message);
    });
    socket.on('disconnect', () => {

        if (socket.roomId && socket.userId) {
            socket.broadcast.to(socket.roomId).emit('user-disconnected', socket.userId);
        }
    });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

