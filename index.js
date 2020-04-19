const express = require('express');
const http = require('http');
var io = require('socket.io')({
  path: '/io/webrtc'
})

// declaration of app
const app = express();

//set server port
const port = process.env.PORT || 8080;
//create server
const server = http.createServer(app);

// listening to server
server.on('listening', function(){
    console.log(`Node Server is running on port ${port}`);
});
server.listen(port);

// socket listening to server
io.listen(server)

// default message after connection held
io.on('connection', socket => {
  console.log('connected')
})

// namespace for peers
const peers = io.of('/streamPeer');

// list of all socket connections
let connectedPeers = new Map();

peers.on('connection', socket => {

  // open connection and emit id
  socket.emit('open', { success: socket.id })

  // set connect into peer
  connectedPeers.set(socket.id, socket)

  // on disconnect delete socket connect from peers
  socket.on('disconnect', () => {
    connectedPeers.delete(socket.id)
  })

  // on call or answer from user
  socket.on('action', (data) => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        socket.emit('action', data.payload)
      }
    }
  })

  socket.on('candidate', (data) => {
    // send candidate to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        socket.emit('candidate', data.payload)
      }
    }
  })

})
