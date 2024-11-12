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
  let game;

  app.get("/game/:roomId", (req, res) => {
    if (game.black_player === socket.id || game.white_player === socket.id) {
      res.sendFile(__dirname + "/reversi.html");
    } else {
      res.status(404).send("Room not found");
    }
  });

  app.get("/result/:roomId", (req, res) => {
    if (game.black_player === socket.id || game.white_player === socket.id) {
      if (game.reversi.isGameOver) {
        res.send(game.reversi.getCurrentPcs);
      }
      onlineRooms.delete(game);
    }
  });

  socket.on("queue", () => {
    matchmakingQueue.push(socket.id);
    //console.log(matchmakingQueue);
    if (matchmakingQueue.length >= 2) {
      let room_uuid = uuidv4();
      let newRoom = {
        room_uuid: room_uuid,
        reversi: new Reversi(),
      };
      if (Math.random() >= 0.5) {
        newRoom.black_player = matchmakingQueue.shift();
        newRoom.white_player = matchmakingQueue.shift();
      } else {
        newRoom.white_player = matchmakingQueue.shift();
        newRoom.black_player = matchmakingQueue.shift();
      }
      onlineRooms.push(newRoom);
      socket.join(room_uuid);
      //console.log(onlineRooms);
      game = onlineRooms.find(
        (item) =>
          item.black_player === socket.id || item.white_player === socket.id,
      );
      //console.log(game);
      io.to(newRoom.black_player).emit("roomFound", room_uuid);
      io.to(newRoom.white_player).emit("roomFound", room_uuid);
    }
  });

  socket.on("button_pressed", (row, col) => {
    if (
      (game.reversi.currentPlayer === "black" &&
        game.black_player == socket.id) ||
      (game.reversi.currentPlayer === "white" && game.white_player == socket.id)
    ) {
      game.handleMove(row, col);
      socket
        .to(game.room_uuid)
        .emit("updateGame", game.mat, game.currentPlayer);
      if (game.reversi.isGameOver) {
        socket.to(game.room_uuid).emit("gameover");
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
  res.sendFile("lobby.html", { root: __dirname });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
