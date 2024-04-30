const Reversi = require("./reversi");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/"));

const onlineRooms = [];

io.on("connection", (socket) => {

  let game;


  socket.on("join", (roomId) => {
    if (roomId) {

      const room = onlineRooms.find((item) => item.roomId === roomId);

      // Join the room
      socket.join(roomId);
      game = room.reversi;
      io.to(roomId).emit("updateGame", game.mat, game.currentPlayer);
    }
  });

  socket.on("button_pressed", (row, col, roomId) => {
    if (game.isGameOver) {
      io.to(roomId).emit("gameover");
    }

    game.handleMove(row, col);
    io.to(roomId).emit("updateGame", game.mat, game.currentPlayer);
  });

  socket.on("disconnect", async () => {
    console.debug(socket.id)
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
  // Check if there are any online rooms
  if (onlineRooms.length) {
    // Filter online rooms to get only the ones that are not full and get the first one
    const room = onlineRooms.find((room) => room.player2.status !== 'JOINED');

    if (!room) {
      createRoom(res);
      return;
    }

    // If there is a room that is not full, join the room
    const { roomId } = room;
    const indexOfRoom = onlineRooms.indexOf(room);
    // Update the room
    onlineRooms[indexOfRoom].player2 = {
      status: 'JOINED',
      uuid: uuidv4(),
    }

    // Send the user to the first room that is not full
    res.redirect(`/game/${roomId}`);
  } else {
    createRoom(res);
  }
});

app.get("/game/:roomId", (req, res) => {
  const { roomId } = req.params;
  if (roomId) res.sendFile(__dirname + "/reversi.html");
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


/**
 *  Create a new room and send the user to the room
 * @param {Response} res 
 */
const createRoom = (res) => {
  const roomId = uuidv4(); // generate a random room id
  // Create a new room
  const room = {
    roomId: roomId,
    player1: { status: 'JOINED', uuid: uuidv4() },
    player2: { status: 'WAITING', uuid: null },
    reversi: new Reversi(),
  };

  onlineRooms.push(room);

  // Send the user to the room
  res.redirect(`/game/${roomId}`);
};

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
