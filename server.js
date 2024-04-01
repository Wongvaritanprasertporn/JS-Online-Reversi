const Reversi = require('./reversi');
const express = require('express');
const { EventEmitter } = require('stream');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

const matchmakingQueue = [];
const onlineRooms = new Map();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/lobby.html');
    io.on("connection", (socket) => {
        EventEmitter.setMaxListeners(3); // Increase the limit to 15 listeners
        console.log(socket.id);
        matchmakingQueue.push(socket.id);
        if (matchmakingQueue.length >= 2) {
            const player1 = matchmakingQueue.shift();
            const player2 = matchmakingQueue.shift();
            const room_uuid = uuidv4();
            onlineRooms.set(room_uuid, { reversi: new Reversi, player: [player1, player2] });
            io.to(player1).emit('matched', { room_uuid, opponent: player2 });
            io.to(player2).emit('matched', { room_uuid, opponent: player1 });
        }
    });
});

app.get('/game/:roomId', (req, res) => {
    const room_uuid = req.params.roomId;
    console.log(room_uuid)
    if (onlineRooms.has(room_uuid)) {
        const color = onlineRooms.get(room_uuid).reversi.currentPlayer;
        io.on('connection', (socket) => {
            EventEmitter.setMaxListeners(3);
            socket.join(room_uuid)
            socket.emit('turn_info', onlineRooms.get(room_uuid).currentPlayer)
            socket.on('button_pressed', (row, col) => {
                if (color == onlineRooms.get(room_uuid).currentPlayer) {
                    onlineRooms.get(room_uuid).handleMove(row, col)
                    socket.to(room_uuid).emit("updateGame", onlineRooms.get(room_uuid).getMat())
                    if (onlineRooms.get(room_uuid).isGameOver()) {
                        socket.to(room_uuid).emit("gameover")
                    }
                }
            })
            io.on('disconnect', () => {
                io.to(room_uuid).emit('disconnect', 30);
            })
        });
    } else {
        res.status(404).send('Room not found');
    }
})

app.get('/result/:roomId', (req, res) => {
    res.send(onlineRooms.get(req.params.roomId).reversi_obj.getCurrentPcs)
    onlineRooms.delete(req.params.roomId)
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});