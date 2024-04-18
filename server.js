const Reversi = require("./reversi");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

const matchmakingQueue = [];
const onlineRooms = [];

io.on("connection", (socket) => {
  let color;
  let room_uuid;
  let game;

  socket.on("join", () => {
    matchmakingQueue.push(socket);
    if (matchmakingQueue.length >= 2) {
      let player1 = matchmakingQueue.shift();
      let player2 = matchmakingQueue.shift();
      room_uuid = uuidv4();
      onlineRooms.push({
        room_uuid: room_uuid,
        reversi: new Reversi(),
        player: [player1, player2],
      });
      player1.join(room_uuid);
      player2.join(room_uuid);
      game = onlineRooms.find((item) => item.room_uuid === room_uuid);
      setTimeout(() => {
        io.to(room_uuid).emit("matched", "/game/" + room_uuid);
      }, 3000);
    }
  });

  socket.on("button_pressed", (row, col) => {
    console.log(game);
    if (color == game.currentPlayer) {
      game.handleMove(row, col);
      socket.to(room_uuid).emit("updateGame", game.getMat(), game.getTurn());
      if (game.isGameOver()) {
        socket.to(room_uuid).emit("gameover");
      }
      socket.emit("turn_info", game.currentPlayer);
    }
  });

  socket.on("disconnect", async () => {
    console.log("leave");
    socket.emit("player_leave");
    setTimeout(() => {
      let index = -1;
      for (let i = 0; i < onlineRooms.length; i++) {
        if (onlineRooms[i].id === game) {
          index = i;
          break;
        }
      }

      if (index !== -1) {
        onlineRooms.splice(index, 1);
      }
    }, 10000);
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/lobby.html");
});

app.get("/game/:roomId", (req, res) => {
  const room_uuid = req.params.roomId;
  const room = onlineRooms.find((item) => item.room_uuid === room_uuid);
  let game;
  if (
    onlineRooms.includes(room) &&
    (room.player[0].handshake.address === req.ip ||
      room.player[1].handshake.address === req.ip)
  ) {
    res.sendFile(__dirname + "/public/reversi.html");
    game = room.reversi;
    color = game.currentPlayer;
    io.to(room_uuid).emit("turn_info", game.currentPlayer);
  } else {
    res.status(404).send("Room not found");
  }
});

app.get("/result/:roomId", (req, res) => {
  let room_uuid;
  if (
    onlineRooms.has(room_uuid) &&
    (room.player[0].handshake.address === req.ip ||
      room.player[1].handshake.address === req.ip)
  ) {
    room_uuid = req.params.roomId;
    let game = onlineRooms.get(room_uuid);
    if (game.reversi.isGameOver()) {
      res.send(game.reversi.getCurrentPcs);
    }
    game.player[0].leave();
    game.player[1].leave();
    onlineRooms.delete(room_uuid);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
