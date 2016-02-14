/* global gApp */
/* global angular */
gApp.factory('SocketNTPSync', ['$window', '$rootScope', '$interval',
    function($window, $rootScope, $interval) {

        //TODO: check if IO is there, if SOCKET is there
        
        var socket = $window.io.connect();

        //NTP protocol is based on ntp.js in https://github.com/calvinfo/socket-ntp
        //Requires https://www.npmjs.com/package/socket-ntp to be installed and running on the server side

        var NTP = function(iSocket) {
            
            var kMaxSampleCount = 20;
            var kSampleDelayMS = 1000;
            
            var theNTP = this;
            var sendNTPPing = function() {
                theNTP.fSocket.emit('ntp:client_sync', {
                    t0: Date.now()
                });
            };

            var onReceiveNTPPing = function(data) {

                var nowTime = Date.now();
                var latency = nowTime - data.t0;
                //When the packet got sent back, t1 was time on server
                //Since then, the time of latency/2 (approximate) has passed
                var predictedNowTimeOnServer = data.t1 + (latency * 0.5);
                var diff = nowTime - predictedNowTimeOnServer;


                var pingSample = {
                    fOffset: diff,
                    fLatency: latency
                };
                theNTP.fPingSamples.unshift(pingSample);

                if (theNTP.fPingSamples.length > kMaxSampleCount) {
                    theNTP.fPingSamples.pop();
                }
            };


            this.offsetLatency = function() {

                if (theNTP.fPingSamples.length == 0) {
                    return null;
                }

                var averageOffset = 0.0;
                var averageLatency = 0.0;

                for (var i = 0; i < theNTP.fPingSamples.length; i++) {
                    averageOffset += theNTP.fPingSamples[i].fOffset;
                    averageLatency += theNTP.fPingSamples[i].fLatency;
                }

                averageOffset /= theNTP.fPingSamples.length;
                averageLatency /= theNTP.fPingSamples.length;

                return {
                    fAverageOffset: averageOffset,
                    fAverageLatency: averageLatency,
                    fNumberOfSamples: theNTP.fPingSamples.length
                };
            };

            this.fPingSamples = [];
            this.fSocket = iSocket;
            this.fSocket.on('ntp:server_sync', onReceiveNTPPing);

            var intervalHandler = $interval(sendNTPPing, kSampleDelayMS);

            $rootScope.stopNTPPings = function() {
                if (angular.isDefined(intervalHandler)) {
                    $interval.cancel(intervalHandler);
                    intervalHandler = undefined;
                }
            };

            $rootScope.$on('$destroy', function() {
                // Make sure that the interval is destroyed too
                $rootScope.stopNTPPings();
            });


        };






        var ntp = new NTP(socket);

        var myNTPSync = {
            GetOffsetAndLatency: function() {
                return ntp.offsetLatency();
            }
        };

        return myNTPSync;
    }
]);