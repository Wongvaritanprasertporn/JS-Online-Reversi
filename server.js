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
const connectedClient = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/lobby.html');
    matchmakingQueue.push(req.ip);
    if (matchmakingQueue.length >= 2) {
        let player1 = matchmakingQueue.shift();
        let player2 = matchmakingQueue.shift();
        for (i of connectedClient) {
            if (i.handshake.address == player1) {
                player1 = i
            }
        }
        for (j of connectedClient) {
            if (j.handshake.address == player2) {
                player2 = j
            }
        }
        const room_uuid = uuidv4();
        onlineRooms.set(room_uuid, { reversi: new Reversi, player: [player1, player2] });
        player1.join(room_uuid);
        player2.join(room_uuid);
        res.redirect("/game/" + room_uuid);
        //io.to(room_uuid).emit('matched', "http://localhost:3000/game/" + room_uuid);
        //
        player1.on('disconnect', () => {
            onlineRooms.delete(room_uuid);
        });
        player2.on('disconnect', () => {
            onlineRooms.delete(room_uuid);
        })
    }
});

app.get('/game/:roomId', (req, res) => {
    const room_uuid = req.params.roomId;
    let color, room, socket;
    if (onlineRooms.has(room_uuid) && onlineRooms.get(room_uuid).player.includes(req.ip)) {

        res.sendFile(__dirname + '/public/reversi.html');
        room = onlineRooms.get(room_uuid)
        color = room.reversi.currentPlayer;
        for (j of room.player) {
            if (j.handshake.address == req.ip) {
                socket = j
            }
        }
        socket.on('button_pressed', (row, col, room_uuid) => {
            const game = onlineRooms.get(room_uuid).reversi;
            if (color == game.currentPlayer) {
                game.handleMove(row, col);
                socket.to(room_uuid).emit("updateGame", game.getMat());
                if (game.isGameOver()) {
                    socket.to(room_uuid).emit("gameover");
                }
                socket.emit('turn_info', game.currentPlayer);
            }
        })

        socket.on('move', (data) => {
            const roomId = data.roomId;
            const room = rooms[roomId];
            if (!room || !room.game) {
                socket.emit('error', 'Invalid room');
                return;
            }
            if (socket.id !== room.game.getTurn()) {
                socket.emit('error', 'Not your turn');
                return;
            }

            const row = data.row;
            const col = data.col;
            room.game.handleMove(row, col);

            io.to(roomId).emit('update', room.game.getMat(), room.game.getTurn());

            if (room.game.isGameOver()) {
                io.to(roomId).emit('gameover');
            }
        });
        socket.on('disconnect', () => {
            onlineRooms.delete(room_uuid);
        })
    } else {
        res.status(404).send('Room not found');
    }

})

app.get('/result/:roomId', (req, res) => {
    res.send(onlineRooms.get(req.params.roomId).reversi_obj.getCurrentPcs)
    onlineRooms.delete(req.params.roomId)
})

io.on('connection', (socket) => {
    connectedClient.push(socket)
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});