const Reversi = require("./reversi");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/"));

const matchmakingQueue = [];
const onlineRooms = new Map();

io.on("connection", (socket) => {
  let gameroom;
  console.log(`Client connected: ${socket.id}`);

  socket.on('queue', () => {
    matchmakingQueue.push(socket.id);
    if (matchmakingQueue.length >= 2) {
      let newRoom = {
        room_uuid: uuidv4(),
        black_player: "",
        white_player: "",
        reversi: new Reversi(),
      };
      onlineRooms.set(newRoom.room_uuid, newRoom);
      io.to(matchmakingQueue.shift()).emit("roomFound", newRoom.room_uuid);
      io.to(matchmakingQueue.shift()).emit("roomFound", newRoom.room_uuid);
      io.of("/admin").emit('onlineRoomUpdate', onlineRooms);
    }
  });

  socket.on("reconnectAttempt", (uuid) => {
    console.log(`Client reconnected: ${socket.id}`);
    game = onlineRooms.get(uuid);
    if (game.black_player === '') {
      game.black_player = socket.id;
    } else {
      game.white_player = socket.id;
    }
    onlineRooms.set(uuid, game)
  });

  socket.on("button_pressed", (row, col) => {
    console.log("Button pressed")
    if (gameroom !== undefined) {
      const game = onlineRooms.get(gameroom.room_uuid)
      if ((game.reversi.currentPlayer === "black" && game.black_player == socket.id) ||
        (game.reversi.currentPlayer === "white" && game.white_player == socket.id)) {
        if (!game.reversi.isGameOver) {
          game.handleMove(row, col);
          io.to(game.room_uuid).emit("updateGame", game.mat, game.currentPlayer);
        }
        else {
          socket.to(game.room_uuid).emit("gameover", game.reversi.getCurrentPcs);
        }
      }
    }

  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`);
    io.to(socket.rooms).emit("opponentDisconnected");
    if (gameroom !== undefined) {
      gameroom.black_player === socket.id ? gameroom.black_player = "" : gameroom.white_player = ""
      onlineRooms.set(gameroom.room_uuid, gameroom)
      setTimeout(() => {
        onlineRooms.delete(gameroom.room_uuid)
        socket.emit("player_leave");
      }, 30000);
    }
  });

  app.get("/game/:roomId", (req, res) => {
    gameroom = onlineRooms.get(req.params.roomId);
    if (gameroom !== undefined) {
      const socketRoom = io.sockets.adapter.rooms.get(req.params.roomId);
      if (socketRoom == undefined) socket.join(req.params.roomId)
      else if (socketRoom.size < 2) socket.join(req.params.roomId)
      else {
        if (Math.random() >= 0.5) {
          gameroom.black_player = Array.from(socketRoom)[0]
          gameroom.white_player = Array.from(socketRoom)[1]
        } else {
          gameroom.white_player = Array.from(socketRoom)[1]
          gameroom.black_player = Array.from(socketRoom)[0]
        }
        onlineRooms.set(req.params.roomId, gameroom)
        io.of("/admin").emit('onlineRoomUpdate', onlineRooms);
      }
      res.sendFile(__dirname + "/reversi.html");
      io.to(req.params.roomId).emit('updateGame', gameroom.reversi.mat, gameroom.reversi.currentPlayer)
      io.to(gameroom.black_player).emit('color', 'black')
      io.to(gameroom.white_player).emit('color', 'white')
    }
    else {
      res.status(404).send("Room not found");
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/lobby.html")
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/admin.html");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});