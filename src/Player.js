/**
 * @var {int} How many ship types there are
 */
const numShipTypes = 5;

/**
 * Player class for game of Battleship
 */
export default class Player {
  /**
   * Constructor
   */
  constructor() {
    this.socket = null;
    this.board = null;
    this.ready = null;
    this.hitsTaken = Array(numShipTypes).fill(0);
    this.shipsLeft = numShipTypes;
    this.name = ''
  }

  /**
   * Is the player ready?
   * 
   * @return {boolean} Whether or not the player is ready
   */
  isReady() {
    return this.ready;
  }

  /**
   * Set the player's readiness state
   * 
   * @param {boolean} bool New ready state
   */
  setReady(bool) {
    this.ready = bool;
  }

  /**
   * Get the player's socket
   * 
   * @return {object} The socket
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Set the player's socket to the given socket
   * 
   * @param {object} socket The socket to be used by the player
   */
  setSocket(socket) {
    this.socket = socket;
  }

  /**
   * Get the player's board.
   * 
   * @return {array} The board (array of ints)
   */
  getBoard() {
    return this.board;
  }

  /**
   * Sets the player's board to the given board.
   * 
   * @param {array} board The board (array of ints)
   */
  setBoard(board) {
    this.board = board;
  }

  /**
   * Get the player's name
   * 
   * @return {string} The player's name
   */
  getName() {
      return this.name
  }

  /**
   * Set the player's name to the given name
   * 
   * @param {string} name The name
   */
  setName(name) {
      this.name = name;
  }

  /**
   * Hit a player's ship.
   * 
   * Records the hit to the particular type of ship. If the number
   * of hits to this particular type of ship is higher than its size,
   * record it as destroyed.
   * 
   * @param {object} ship The ship type that was hit
   * 
   * @return {boolean} Whether or not the ship type was destroyed
   */
  recordHitAndCheckDestroyed(ship) {
    this.hitsTaken[ship.type - 1]++;

    if (this.hitsTaken[ship.type - 1] >= ship.size) {
      this.shipsLeft--;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check if the player has been defeated (no ships left)
   * 
   * @return {boolean} Whether or not the player is defeated
   */
  isDefeated() {
    return this.shipsLeft <= 0;
  }
}
