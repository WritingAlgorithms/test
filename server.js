'use strict';
//https://stackoverflow.com/questions/32606403/how-to-create-a-shadow-pixi-js

const express = require('express');
const socketIO = require('socket.io');
var bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

var app = express();
app.use(express.static(__dirname + '/public'));
console.log(__dirname + '/public');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


const WAIT_N_PLAYERS = 2;
var tanks = {};
var balls = {};
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(server);

io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);

  tanks[socket.id] = { tankId: socket.id, x: 150, y: 150, rotation: 0, moveForward: false, rotateLeft: false, rotateRight: false };
  if (Object.keys(tanks).length === WAIT_N_PLAYERS) {
    setTimeout(function() {
      io.emit('initTankData', tanks);
      console.log('sent init data');
      setTimeout(function() {
        io.emit('initBallsData', [
          { ballId: 'ball1', color: 'purple', startX: 500, startY: 250 }
        ]);
        console.log('init balls');
      }, 1500);
    }, 1500);
  }


  socket.on('keyboardPress', function(keyData) {
    tanks[keyData.tankId][keyData.property] = keyData.value;
    io.emit('updateKeyPress', keyData);
  });

  socket.on('keyboardRelease', function(keyData) {
    tanks[keyData.tankId][keyData.property] = keyData.value;
    io.emit('updateKeyRelease', keyData);
  });

  socket.on('changeBallState', function(stateData) {
    io.emit('setBallState', stateData);
  });

  socket.on('disconnect', function() {
    console.log('Client disconnected ' + socket.id);
    delete tanks[socket.id];
    io.emit('disconnected', { tankId: socket.id });
  });

});





