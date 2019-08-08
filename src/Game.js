import Player from "./Player";

/**
 * Game controller class for Battleship
 */
export default class Game {
  /**
   * Constructor
   *
   * @param {object} io The socket server object
   * @param {string} room The room ID for this game
   * @param {function} endGame Callback function to be called when both players disconnect
   */
  constructor(io, room, endGame) {
    this.io = io;
    this.room = room;
    this.endGame = endGame;
    this.playerOne = null;
    this.playerTwo = null;
    this.turn = null;
  }

  /**
   * Connect a player to the server, then set up event
   * listeners on the socket to respond to game events.
   *
   * @param {object} socket The player's socket
   */
  connectPlayer(socket) {
    // Two players already in this game, disconnect.
    // Logic in the server already prevents this, but just in case
    if (this.playerOne !== null && this.playerTwo !== null) {
      socket.disconnect();
      return;
    }

    const player = this.playerOne === null ? "playerOne" : "playerTwo";
    this[player] = new Player();
    this[player].setSocket(socket);

    console.log(`${this.room}: ${player} connected`);
    socket.emit("connected", player);

    // Set up socket event listeners
    socket.on("disconnect", () => this.playerDisconnected(player));
    socket.on("name", (name) => this.setPlayerName(player, name));
    socket.on("initialise_board", (board) =>
      this.initialiseBoard(player, board)
    );
    socket.on("gameReady", () => this.gameReady(player));
    socket.on("shoot", ({ row, column }) =>
      this.shoot(socket, player, row, column)
    );
    socket.on("chat", (message) => this.relayMessage(this[player], message));

    // If neither is null, both must be set now
    if (this.playerOne !== null && this.playerTwo !== null) {
      this.io.to(this.room).emit("playersReady");
    }
  }

  /**
   * Function handling player disconnection events.
   *
   * Informs the other player that their opponent has disconnected
   * (if they are still connected). If both players are now disconnected,
   * run the end game callback function to clean up the game state.
   *
   * @param {string} player Which player disconnected
   */
  playerDisconnected(player) {
    console.log(`${this.room}: ${player} disconnected`);
    this[player] = null;
    const otherPlayer =
      player === "playerOne" ? this.playerTwo : this.playerOne;
    if (otherPlayer !== null && otherPlayer.getSocket() !== null) {
      otherPlayer.getSocket().emit("opponentDisconnect");
    } else if (otherPlayer === null) {
      this.endGame();
    }
  }

  /**
   * Set a given player's name.
   *
   * If after this function runs both players have a name set, inform
   * the room of their names.
   *
   * @param {string} player The player for which the name is being set
   * @param {string} name The player's name
   */
  setPlayerName(player, name) {
    this[player].setName(name);

    if (
      this.playersSet() &&
      this.playerOne.getName() !== "" &&
      this.playerTwo.getName() !== ""
    ) {
      this.io.to(this.room).emit("names", {
        playerOne: this.playerOne.getName(),
        playerTwo: this.playerTwo.getName(),
      });
    }
  }

  /**
   * Set a given player's board.
   *
   * If after this function runs both players' boards are set,
   * inform the room of this event with a directive to redirect.
   *
   * @param {string} player The player whose board is being initialised
   * @param {array} board The board
   */
  initialiseBoard(player, board) {
    this[player].setBoard(board);
    this[player].setReady(true);

    if (this.playersSet() && this.playersReady()) {
      this.io.to(this.room).emit("redirect");
      this.playerOne.setReady(false);
      this.playerTwo.setReady(false);
    }
  }

  /**
   * Handle a player being ready to start the game.
   *
   * If both players are ready, choose a random player, then
   * inform the room the game is ready and who will start.
   *
   * @param {string} player The player stating readiness
   */
  gameReady(player) {
    this[player].setReady(true);

    if (this.playersSet() && this.playersReady()) {
      // Choose random player to start the game
      const playerString = Math.floor(Math.random() * 2)
        ? "playerOne"
        : "playerTwo";
      this.turn = this[playerString].getSocket();

      this.io.to(this.room).emit("startGame", playerString);
      this.broadcastSystemMessage(
        `Game started, ${this[playerString].getName()} goes first.`
      );
    }
  }

  /**
   * Simulate a shot at the opponent's board.
   *
   * Check if anything is hit, an if so, a boat is destroyed, and if the other
   * player is defeated after this. Individually inform both players of the outcome,
   * then toggle whose turn it is.
   *
   * @param {object} socket The socket initiating the shot
   * @param {string} player The initiating player
   * @param {int} row Row to shoot at
   * @param {int} column Column to shoot at
   */
  shoot(socket, player, row, column) {
    // Out of turn shot -- shouldn't happen but just in case people
    // play with client side variables
    if (socket !== this.turn) return;

    let destroyed = false;
    const otherPlayer =
      player === "playerOne" ? this.playerTwo : this.playerOne;

    const type = otherPlayer.getBoard()[row][column].type;
    const hit = type ? true : false;
    if (hit) {
      destroyed = otherPlayer.recordHitAndCheckDestroyed(type);
    }

    const defeated = otherPlayer.isDefeated();

    socket.emit("shotResult", row, column, hit, defeated);
    otherPlayer.getSocket().emit("receiveShot", row, column, defeated);

    if (destroyed) {
      this.sendSystemMessage(
        this[player],
        `You sunk ${otherPlayer.getName()}'s ${type.name}!`
      );
      this.sendSystemMessage(
        otherPlayer,
        `${this[player].getName()} sunk your ${type.name}!`
      );
    }
    this.turn = otherPlayer.getSocket();
  }

  /**
   * Deal with player chat events.
   *
   *
   * @param {Player} player Sending player
   * @param {string} message The message
   */
  relayMessage(player, message) {
    const otherPlayer =
      this.playerOne === player ? this.playerTwo : this.playerOne;
    const timestamp = Date.now();

    const commonContents = { timestamp, message };

    player.getSocket().emit("message", { ...commonContents, sender: "You" });
    otherPlayer
      .getSocket()
      .emit("message", { ...commonContents, sender: player.getName() });
  }

  /**
   * Send a message from the System to a given player
   *
   * @param {Player} player The player to send the message to
   * @param {string} message The message
   */
  sendSystemMessage(player, message) {
    player.getSocket().emit("message", {
      sender: "[SYSTEM]",
      timestamp: Date.now(),
      message,
    });
  }

  /**
   * Send a message from the System to both players
   *
   * @param {string} message The message
   */
  broadcastSystemMessage(message) {
    this.io.to(this.room).emit("message", {
      sender: "[SYSTEM]",
      timestamp: Date.now(),
      message,
    });
  }

  /**
   * Check if both players have been set. Utility method
   *
   * @return {boolean} False if either player is null
   */
  playersSet() {
    return this.playerOne !== null && this.playerTwo !== null;
  }

  /**
   * Check if both players are ready. Utility method
   *
   * @return {boolean} True if both players are ready.
   */
  playersReady() {
    return this.playerOne.isReady() && this.playerTwo.isReady();
  }
}
