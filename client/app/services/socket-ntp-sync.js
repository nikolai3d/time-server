/* global gApp */

gApp.factory('SocketNTPSync', ['$window',
    function($window) {

        //TODO: check if IO is there, if SOCKET is there
        var socket = $window.io.connect();

        //NTP protocol is based on ntp.js in https://github.com/calvinfo/socket-ntp
        //Requires https://www.npmjs.com/package/socket-ntp to be installed and running on the server side
        var ntp = {},
            offsets = [],
            fSocket;

        ntp.init = function(sock) {

            fSocket = sock;
            fSocket.on('ntp:server_sync', onSync);
            setInterval(sync, 1000);
        };

        var sync = function() {
            socket.emit('ntp:client_sync', {
                t0: Date.now()
            });
        };


        var onSync = function(data) {

            var diff = Date.now() - data.t1 + ((Date.now() - data.t0) / 2);

            offsets.unshift(diff);

            if (offsets.length > 10)
                offsets.pop();
        };


        ntp.offset = function() {
            
            if (offsets.length == 0)
                {
                return null;
                }
            var sum = 0;
            for (var i = 0; i < offsets.length; i++)
                sum += offsets[i];

            sum /= offsets.length;

            return sum;
        };

        ntp.init(socket);

        var myNTPSync = {
            GetOffset: function() {
                return ntp.offset();
            }
        };

        return myNTPSync;
    }
]);