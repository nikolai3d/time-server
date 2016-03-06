var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var timeServer = require('./timeServer');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var htmlRootPath = path.resolve(process.cwd(), 'client');

console.log(htmlRootPath);

router.use(express.static(htmlRootPath));

var ntp = require('socket-ntp');

console.log("NTP server starting!");

io.sockets.on('connection', function(socket) {
    ntp.sync(socket);
    console.log("NTP SYNC Initiated");
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Chat server listening at", addr.address + ":" + addr.port);
});

router.get('/getNTPSyncData', timeServer.timeServerEndpointHandler);
