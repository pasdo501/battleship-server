const io = require("socket.io")();
io.origins("*:*");

const emptyPlayer = { socket: null, board: null, ready: false };
let playerOne;
let playerTwo;

function reset() {
  playerOne = { ...emptyPlayer };
  playerTwo = { ...emptyPlayer };
}

io.on("connection", (socket) => {
  console.log("Connection attempt");

  if (playerOne.socket === null) {
    playerOne.socket = socket;
    socket.emit("connected", "playerOne");
  } else if (playerTwo.socket === null) {
    playerTwo.socket = socket;
    socket.emit("connected", "playerTwo");
  } else {
    socket.disconnect();
  }

  if (playerOne.socket !== null && playerTwo.socket !== null) {
    io.emit("playersReady");
  }

  socket.on("disconnect", () => {
    if (socket === playerOne.socket) {
      console.log("Player One disconnected");
      playerOne = { ...emptyPlayer };
    } else {
      console.log("Player two disconnected");
      playerTwo = { ...emptyPlayer };
    }
  });

  socket.on("initialise_board", (board) => {
    if (socket === playerOne.socket) {
      playerOne.board = board;
      playerOne = { ...playerOne, board, ready: true };
    } else {
      playerTwo = { ...playerTwo, board, ready: true };
    }

    if (playerOne.ready && playerTwo.ready) {
      io.emit("redirect");
    }
  });

  socket.on("shoot", ({ row, column }) => {
    let success;
    let otherSocket;
    if (socket === playerOne.socket) {
      // Player One shot
      success = playerTwo.board[row][column].type ? true : false;
      otherSocket = playerTwo.socket;
    } else {
      // Player Two shot
      success = playerOne.board[row][column].type ? true : false;
      otherSocket = playerOne.socket;
    }
    socket.emit("shotResult", row, column, success);
    otherSocket.emit("receiveShot", row, column);
  });
});

reset();
const port = 8080;
io.listen(port);
console.log(`Server listening on port ${port}...`);
