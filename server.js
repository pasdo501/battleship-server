const io = require("socket.io")();
io.origins("*:*");

const emptyPlayer = { id: null, board: null, ready: false };
let playerOne;
let playerTwo;

function reset() {
  playerOne = { ...emptyPlayer };
  playerTwo = { ...emptyPlayer };
}

io.on("connection", (socket) => {
  console.log("Connection attempt");

  if (playerOne.id === null) {
    playerOne.id = socket;
    socket.emit("connected", "playerOne");
  } else if (playerTwo.id === null) {
    playerTwo.id = socket;
    socket.emit("connected", "playerTwo");
  } else {
    socket.disconnect();
  }

  if (playerOne.id !== null && playerTwo.id !== null) {
      io.emit('playersReady')
  }

  socket.on("disconnect", () => {
    if (socket === playerOne.id) {
      playerOne = { ...emptyPlayer };
    } else {
      playerTwo = { ...emptyPlayer };
    }
  });

  socket.on("initialise_board", (board) => {
    if (socket === playerOne.id) {
      playerOne.board = board;
      playerOne = {...playerOne, board, ready: true }
    } else {
      playerTwo = { ...playerTwo, board, ready: true }
    }

    if (playerOne.ready && playerTwo.ready) {
        io.emit('redirect')
    }
  });
});

reset();
const port = 8080;
io.listen(port);
console.log(`Server listening on port ${port}...`);
