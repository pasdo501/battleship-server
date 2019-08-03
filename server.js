const io = require("socket.io")()
io.origins("*:*")

io.on("connection", (socket) => {
    console.log('Connection attempt')
    socket.disconnect()
})

const port = 8080
io.listen(port)
console.log(`Server listening on port ${port}...`)