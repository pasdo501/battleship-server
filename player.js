const numShipTypes = 5;

export default class Player {
  constructor() {
    this.socket = null;
    this.board = null;
    this.ready = null;
    this.hitsTaken = Array(numShipTypes).fill(0);
    this.shipsLeft = numShipTypes;
  }

  isReady() {
    return this.ready;
  }

  setReady(bool) {
    this.ready = bool;
  }

  getSocket() {
    return this.socket;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  getBoard() {
    return this.board;
  }

  setBoard(board) {
    this.board = board;
  }

  recordHitAndCheckDestroyed(ship) {
    this.hitsTaken[ship.type - 1]++;

    if (this.hitsTaken[ship.type - 1] >= ship.size) {
      this.shipsLeft--;
      return true;
    } else {
      return false;
    }
  }

  isDefeated() {
    return this.shipsLeft <= 0;
  }
}
