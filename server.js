//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

router.get('/lala', function (req, res) {
  console.log("LALARequest\n");
  res.send('Hello World!');
});


var messages = [];
var sockets = [];
io.on('connection', function(socket) {
  messages.forEach(function(data) {
    socket.emit('message', data);
  });

  sockets.push(socket);

  socket.on('disconnect', function() {
    sockets.splice(sockets.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('message', function(msg) {
    var text = String(msg || '');

    if (!text)
      return;

    socket.get('name', function(err, name) {
      var data = {
        name: name,
        text: text
      };

      broadcast('message', data);
      messages.push(data);
    });
  });

  socket.on('identify', function(name) {
    socket.set('name', String(name || 'Anonymous'), function(err) {
      updateRoster();
    });
  });
});

function updateRoster() {
  async.map(
    sockets,
    function(socket, callback) {
      socket.get('name', callback);
    },
    function(err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function(socket) {
    socket.emit(event, data);
  });
}

var ntp = require('socket-ntp');

console.log("NTP server started!");

io.sockets.on('connection', function(socket) {
  console.log("NTP SYNC start!");
  ntp.sync(socket);
  console.log("NTP SYNC done!");
});

//TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client
var ntpClient = require('ntp-client');


function Chronos() {
  this.serverNTPDelta = 0.0;


  var chronosObject = this;

  this.Synchronize = function() {
    ntpClient.getNetworkTime("pool.ntp.org", 123, function(err, date) {
      if (err) {
        console.error(err);
        return;
      }


      var ntpMilliseconds = date.getMilliseconds();
      var serverNow = new Date();
      var serverMilliseconds = serverNow.getMilliseconds();
      var serverNTPDelta = serverMilliseconds - ntpMilliseconds;

      chronosObject.serverNTPDelta = serverNTPDelta;
      console.log("Current (ServerTime - NTP Time) : " + serverNTPDelta + " ms");
      //  console.log(date); // Mon Jul 08 2013 21:31:31 GMT+0200 (Paris, Madrid (heure d’été)) 
    });
  };
  this.TickInterval = setInterval(this.Synchronize, 1000);
}


var keeper = new Chronos();


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
