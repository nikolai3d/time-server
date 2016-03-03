//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

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

var htmlRootPath = path.resolve(__dirname, 'client');
router.use(express.static(htmlRootPath));

var ntp = require('socket-ntp');

console.log("NTP server started!");

io.sockets.on('connection', function(socket) {
    console.log("NTP SYNC start!");
    ntp.sync(socket);
    console.log("NTP SYNC done!");
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Chat server listening at", addr.address + ":" + addr.port);
});

var timeServer = require('./timeServer');

timeServer.createTimeServer(router);
