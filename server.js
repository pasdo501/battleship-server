const io = require("socket.io")()
io.origins("*:*")

const emptyPlayer = {
    id: null,
    board: null
}
let playerOne;
let playerTwo;

function reset () {
    playerOne = { ...emptyPlayer }
    playerTwo = { ...emptyPlayer }
}

io.on("connection", (socket) => {
    console.log('Connection attempt')
    
    if (playerOne.id === null) {
        playerOne.id = socket
        socket.emit('connected', 'playerOne')
    } else if (playerTwo.id === null) {
        playerTwo.id = socket
        socket.emit('connected', 'playerTwo')
    } else {
        socket.disconnect()
    }

    socket.on('disconnect', () => {
        if (socket === playerOne.id) {
            playerOne =  { ...emptyPlayer }
        } else {
            playerTwo = { ...emptyPlayer }
        }
    })

    socket.on('initialise_board', (board) => {
        if (socket === playerOne.id) {
            playerOne.board = board
            console.log('Player One\'s board:')
            console.log(playerOne.board)
        } else {
            playerTwo.board = board
            console.log('Player Two\'s board:');
            console.log(playerTwo.board)
        }
    })
})

reset()
const port = 8080
io.listen(port)
console.log(`Server listening on port ${port}...`)