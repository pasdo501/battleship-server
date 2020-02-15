import socketServer from "socket.io";
import Game from "./Game";

const io = socketServer();
io.origins("*:*");

let games = {};

function reset() {
  games = {};
}

io.on("connection", (socket) => {
  const { query } = socket.handshake;
  console.log("Connection attempt...");
  if (query.type !== "battleship") {
    console.log("Incorrect connection type");
    socket.disconnect();
  }

  let { roomId } = query;
  if (roomId !== "null") {
    socket.join(roomId);
    const roomSize = socket.adapter.rooms[roomId].length;
    if (roomSize !== 2) {
      console.log(`${roomId}: invalid connection`);
      // Too many players in room, or only one in which case
      // you didn't actually join a new room
      socket.emit(
        "invalidRoom",
        roomSize > 2
          ? "Sorry, that game is full."
          : "That is not a valid game ID"
      );
      socket.disconnect();
      return;
    }
    games[roomId].connectPlayer(socket);
  } else {
    roomId = socket.id.substr(0, 5);
    // Let the client know the room ID
    socket.emit("roomAllocation", roomId);
    socket.join(roomId);
    if (games[roomId] !== undefined) {
      // Game already exists, but the player tried to start a new one
      // = ID overlap, just disconnect and try again
      socket.disconnect();
    }
    games[roomId] = new Game(io, roomId, () => delete games[roomId]);
    games[roomId].connectPlayer(socket);
  }
});

reset();
const port = process.env.PORT || 3000;
io.listen(port);
console.log(`Server listening on port ${port}...`);
