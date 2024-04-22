const Reversi = require("./reversi");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/"));

const matchmakingQueue = [];
const onlineRooms = [];

io.on("connection", (socket) => {
  let color;
  let room_uuid;
  let game;

  socket.on("checkRoom", () => {
    let room = onlineRooms.find(
      (item) =>
        item.player1 === socket.handshake.address ||
        item.player2 === socket.handshake.address,
    );
    if (room != undefined) {
      socket.emit("roomFound", room.room_uuid);
    }
  });

  socket.on("join", () => {
    let room = onlineRooms.find(
      (item) =>
        item.player1 === socket.handshake.address ||
        item.player2 === socket.handshake.address,
    );
    if (room !== undefined) {
      room_uuid = room.room_uuid;
      socket.join(room_uuid);
      game = room.reversi;
      if (room.player1 === socket.handshake.address) {
        color = "white";
      } else {
        color = "black";
      }
      io.to(room_uuid).emit("updateGame", game.mat, game.currentPlayer);
    }
  });

  socket.on("button_pressed", (row, col) => {
    if (color === game.currentPlayer) {
      game.handleMove(row, col);
      io.to(room_uuid).emit("updateGame", game.mat, game.currentPlayer);
      if (game.isGameOver) {
        io.to(room_uuid).emit("gameover");
      }
    }
  });

  socket.on("disconnect", async () => {
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
  matchmakingQueue.push(req.ip);
  res.sendFile("lobby.html", { root: __dirname });
  if (matchmakingQueue.length >= 2) {
    let player1 = matchmakingQueue.shift();
    let player2 = matchmakingQueue.shift();
    const room_uuid = uuidv4();
    onlineRooms.push({
      room_uuid: room_uuid,
      reversi: new Reversi(),
      player1: player1,
      player2: player2,
    });
  }
});

app.get("/game/:roomId", (req, res) => {
  const room = onlineRooms.find((item) => item.room_uuid === req.params.roomId);
  if (room.player1 === req.ip || room.player2 === req.ip) {
    res.sendFile(__dirname + "/reversi.html");
  } else {
    res.status(404).send("Room not found");
  }
});

app.get("/result/:roomId", (req, res) => {
  const room = onlineRooms.find((item) => item.room_uuid === req.params.roomId);
  if (room.player1 === req.ip || room.player2 === req.ip) {
    if (room.reversi.isGameOver) {
      res.send(game.reversi.getCurrentPcs);
    }
    onlineRooms.delete(room);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
