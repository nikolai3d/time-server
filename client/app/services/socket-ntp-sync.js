/* global gApp */

gApp.factory('SocketNTPSync', ['$window',
    function($window) {

        //TODO: check if IO is there, if SOCKET is there
        var socket = $window.io.connect();

        //NTP protocol is based on ntp.js in https://github.com/calvinfo/socket-ntp
        //Requires https://www.npmjs.com/package/socket-ntp to be installed and running on the server side

        var NTP = function(sock) {

            var theNTP = this;
            var sync = function() {
                theNTP.fSocket.emit('ntp:client_sync', {
                    t0: Date.now()
                });
            };

            var onSync = function(data) {

                var diff = Date.now() - data.t1 + ((Date.now() - data.t0) / 2);

                theNTP.offsets.unshift(diff);

                if (theNTP.offsets.length > 10)
                    theNTP.offsets.pop();
            };


            this.offset = function() {

                if (theNTP.offsets.length == 0) {
                    return null;
                }
                var sum = 0;
                for (var i = 0; i < theNTP.offsets.length; i++)
                    sum += theNTP.offsets[i];

                sum /= theNTP.offsets.length;

                return sum;
            };

            this.offsets = [];
            this.fSocket = sock;
            this.fSocket.on('ntp:server_sync', onSync);
            setInterval(sync, 1000);

        };






        var ntp = new NTP(socket);

        var myNTPSync = {
            GetOffset: function() {
                return ntp.offset();
            }
        };

        return myNTPSync;
    }
]);