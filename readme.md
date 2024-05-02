## Why it Cannot Place the Disc 

The bug lies in the `if` condition within the button_pressed event [#1](https://github.com/Wongvaritanprasertporn/JS-Online-Reversi/blob/3031784a14fa2ddedf5fc329aec7c21c4c50a053/server.js#L50)



``` JavaScript
socket.on("button_pressed", (row, col) => {
    if (color === game.currentPlayer) { 
        game.handleMove(row, col);
        io.to(room_uuid).emit("updateGame", game.mat, game.currentPlayer);
        if (game.isGameOver) {
            io.to(room_uuid).emit("gameover");
        }
    }
});
```

**If `color` and `game.currentPlayer` have difference values, the `game.handlerMove()` function never be called, and `game.currentPlayer` is not be updated.**

## Sometimes you can move
During the first turn, if `color` and `game.currentPlayer` are equal, Player 1 can place the disc. However, on the second turn, Player 2 encounters issues and cannot place the disc.

There are two reasons for this.
- `color` is not updated.
- Some logic within the `button_pressed` event is invalid.

## Color is not Updated

### Consider:

Let `color` be "white" and `game.currentPlayer` be "white" at the initial state.

Since the condition is true, the function `game.handleMove()` will be called.

After executing some logic, `game.currentPlayer` updates (to "black") at this line:

``` JavaScript
// Switch to the other player's turn
this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
```

However, `color` remains unchanged; it still reads "white". Consequently, the condition becomes false, and `game.currentPlayer is not updated. It will cause the program to be unable to move again, similar to the first bug we encountered.

## Invalid Logic in button_pressed Event

In the video, the value of `game.currentPlayer` remains "black" regardless of which window, window1 or window2, you click on.

``` JavaScript
function move(row, col) {
    socket.emit("button_pressed", row, col);
}
```
Because the `move()` function only emits the row and column, the program cannot discern whether the values originate from window1 or window2.

## How to fix it

I have created two new variables.

``` JavaScript
let socket_id_list = []; 
let player = {}

// Example data that will be store in player:
// RANDOM_SOCKET_ID can get from socket.id
player = {
    "RANDOM_SOCKET_ID_1": "black",
    "RANDOM_SOCKET_ID_2": "white",
}
```
`socket_id_list` is used to store the socket IDs of player 1 and player 2.

`player` will store the socket ID and color in key-value format.

In the `join` event, I added new logic to randomly assign colors to players and map the color with their socket ID:

``` JavaScript
socket_id_list.push(socket.id)

// Check there are 2 player in the game
if (socket_id_list.length === 2) {
    
    // Shuffle the array
    socket_id_list.sort(() => Math.random() - 0.5);

    // Assign colors
    player[socket_id_list[0]] = "black";
    player[socket_id_list[1]] = "white";

}
```

Finally, I removed `color` from the condition and used `player` instead, The program will determine whether the move comes from a black or white player based on the socket ID.

```JavaScript
if (player[socket.id] === game.currentPlayer) {
    game.handleMove(row, col);
    io.to(room_uuid).emit("updateGame", game.mat, game.currentPlayer);
    if (game.isGameOver) {
        io.to(room_uuid).emit("gameover");
    }
}
```







