const Reversi = require("./reversi");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

const matchmakingQueue = [];
const onlineRooms = new Map();

io.on("connection", (socket) => {
  socket.on("join", () => {
    matchmakingQueue.push(socket);
    if (matchmakingQueue.length >= 2) {
      let player1 = matchmakingQueue.shift();
      let player2 = matchmakingQueue.shift();
      const room_uuid = uuidv4();
      onlineRooms.set(room_uuid, {
        reversi: new Reversi(),
        player: [player1, player2],
      });
      player1.join(room_uuid);
      player2.join(room_uuid);
      io.to(room_uuid).emit("matched", "/game/" + room_uuid);
      socket.on("disconnect", () => {
        onlineRooms.delete(room_uuid);
      });
    }
  });

  app.get("/game/:roomId", (req, res) => {
    const room_uuid = req.params.roomId;
    let color;
    let room = onlineRooms.get(room_uuid);
    const game = room.reversi;
    if (
      onlineRooms.has(room_uuid) &&
      (room.player[0].handshake.address === req.ip ||
        room.player[1].handshake.address === req.ip)
    ) {
      res.sendFile(__dirname + "/public/reversi.html");
      color = game.currentPlayer;

      socket.emit("turn_info", game.currentPlayer);
      console.log(game.currentPlayer);

      socket.on("button_pressed", (row, col) => {
        console.log("a");
        if (color == game.currentPlayer) {
          game.handleMove(row, col);
          socket
            .to(room_uuid)
            .emit("updateGame", game.getMat(), game.getTurn());
          if (game.isGameOver()) {
            socket.to(room_uuid).emit("gameover");
          }
          socket.emit("turn_info", game.currentPlayer);
        }
      });

      socket.on("disconnect", async () => {
        socket.emit("player_leave");
        setTimeout(() => {
          onlineRooms.delete(room_uuid);
        }, 10000);
      });
    } else {
      res.status(404).send("Room not found");
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/lobby.html");
});

app.get("/result/:roomId", (req, res) => {
  if (
    onlineRooms.has(room_uuid) &&
    (room.player[0].handshake.address === req.ip ||
      room.player[1].handshake.address === req.ip)
  ) {
    const room_uuid = req.params.roomId;
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
