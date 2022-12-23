const fs = require('fs');
const express = require('express')
const { createServer } = require('https');
//const { createServer } = require('http')
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

const app = express();
const httpSever = createServer({ key: key, cert: cert }, app);
const io = new Server(httpSever, {
    cors: {
        origin: "*",
    },
});

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(httpSever, {
    debug: true,
    port: 443
});

app.set(`view engine`, `ejs`)

app.use("/peerjs", peerServer);

app.use(express.static('public'));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

app.get("/:roomId", (req, res) => {
    res.render("room", { roomId: req.params.roomId })
})

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        console.log(`New user connected with ID: ${userId} at ROOM_ID: ${roomId}`)
        socket.broadcast.to(roomId).emit("user-connected", userId)

        socket.on("disconnect", (data) => {
            console.log("Someone is disconnected:  ", userId)
            socket.broadcast.to(roomId).emit("user-disconnected", userId)
        })
    })
})

httpSever.listen(443, () => {
    console.log("Server started at port 443")
});