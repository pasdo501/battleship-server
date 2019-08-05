import socketServer from "socket.io";
import Player from "./Player";

const io = socketServer();
io.origins("*:*");

let playerOne;
let playerTwo;
let turn;

function reset() {
  playerOne = new Player();
  playerTwo = new Player();
}

io.on("connection", (socket) => {
  console.log("Connection attempt");

  if (playerOne.getSocket() === null) {
    console.log("Player One Connected");
    playerOne.setSocket(socket);
    socket.emit("connected", "playerOne");
  } else if (playerTwo.getSocket() === null) {
    console.log("Player Two connected");
    playerTwo.setSocket(socket);
    socket.emit("connected", "playerTwo");
  } else {
    socket.disconnect();
  }

  if (playerOne.getSocket() !== null && playerTwo.getSocket() !== null) {
    io.emit("playersReady");
  }

  socket.on("disconnect", () => {
    if (socket === playerOne.getSocket()) {
      console.log("Player One disconnected");
      playerOne = new Player();
      if (playerTwo.getSocket() !== null) {
        playerTwo.getSocket().emit("opponentDisconnect");
      }
    } else {
      console.log("Player Two disconnected");
      playerTwo = new Player();
      if (playerOne.getSocket() !== null) {
        playerOne.getSocket().emit("opponentDisconnect");
      }
    }
  });

  socket.on("name", (name) => {
    if (socket === playerOne.getSocket()) {
      playerOne.setName(name);
    } else {
      playerTwo.setName(name);
    }

    if (playerOne.getName() !== "" && playerTwo.getName() !== "") {
      io.emit("names", {
        playerOne: playerOne.getName(),
        playerTwo: playerTwo.getName(),
      });
    }
  });

  socket.on("initialise_board", (board) => {
    if (socket === playerOne.getSocket()) {
      playerOne.setBoard(board);
      playerOne.setReady(true);
    } else {
      playerTwo.setBoard(board);
      playerTwo.setReady(true);
    }

    if (playerOne.isReady() && playerTwo.isReady()) {
      io.emit("redirect");
      playerOne.setReady(false);
      playerTwo.setReady(false);
    }
  });

  socket.on("gameReady", () => {
    if (socket === playerOne.getSocket()) {
      playerOne.setReady(true);
    } else {
      playerTwo.setReady(true);
    }

    if (playerOne.isReady() && playerTwo.isReady()) {
      let playerString;
      if (Math.floor(Math.random() * 2)) {
        playerString = "playerOne";
        turn = playerOne.getSocket();
      } else {
        playerString = "playerTwo";
        turn = playerTwo.getSocket();
      }

      io.emit("startGame", playerString);
    }
  });

  socket.on("shoot", ({ row, column }) => {
    // Shouldn't need this, but in case people play around with
    // the client side variables
    if (socket !== turn) return;

    let destroyed = false;
    const player = socket === playerOne.getSocket() ? playerOne : playerTwo;
    const otherPlayer =
      socket === playerOne.getSocket() ? playerTwo : playerOne;

    const type = otherPlayer.getBoard()[row][column].type;
    const hit = type ? true : false;
    if (hit) {
      destroyed = otherPlayer.recordHitAndCheckDestroyed(type);
    }

    const shooterMessage = destroyed
      ? `You sunk ${otherPlayer.getName()}'s ${type.name}!`
      : "";
    const shooteeMessage = destroyed
      ? `${player.getName()} sunk your ${type.name}!`
      : "";

    const defeated = otherPlayer.isDefeated();

    socket.emit("shotResult", row, column, hit, shooterMessage, defeated);
    otherPlayer
      .getSocket()
      .emit("receiveShot", row, column, shooteeMessage, defeated);
    turn = otherPlayer.getSocket();
  });
});

reset();
const port = 8080;
io.listen(port);
console.log(`Server listening on port ${port}...`);