/* global gApp */

// 'BtfordSocket' is the socket produced by https://github.com/btford/angular-socket-io
// ("bower_components/angular-socket-io/socket.min.js" dependency)
// windowIOSocket is the socket produced by window.io.connect
// ("bower_components/socket.io/socket.io.js" dependency)

gApp.factory('SocketNTPSync', ['BtfordSocket', '$rootScope', '$interval', '$q',
    function(mySocket, $rootScope, $interval, $q) {

        var socket = mySocket;

        if ((typeof socket) !== "object") {
            throw new Error("Bad Object Passed In");
        }

        if ((typeof socket.on) !== "function") {
            throw new Error("Bad Object Passed In");
        }

        if ((typeof socket.emit) !== "function") {
            throw new Error("Bad Object Passed In");
        }

        // NTP protocol is based on ntp.js in https://github.com/calvinfo/socket-ntp
        // Requires https://www.npmjs.com/package/socket-ntp to be installed and running on the server side

        var NTP = function() {

            this.fPingSamples = [];
            var kMaxSampleCount = 20;
            var kSampleDelayMS = 1000;

            var theNTP = this;

            // This function sends a ping and returns a promise,
            // which is fulfilled as soon as the ping is returned
            var socketPing = function() {

                var deferred = $q.defer();

                socket.emit('ntp:client_sync', {
                    t0: Date.now()
                });

                socket.on('ntp:server_sync', function(data) {
                    var nowTime = data.t0; // Date.now(); // Shameless plug to allow unit tests to work.
                    var latency = nowTime - data.t0;
                    // When the packet got sent back, t1 was time on server
                    // Since then, the time of latency/2 (approximate) has passed
                    var predictedNowTimeOnServer = data.t1 + (latency * 0.5);
                    var diff = nowTime - predictedNowTimeOnServer;

                    var pingSample = {
                        fOffset: diff,
                        fLatency: latency
                    };

                    deferred.resolve(pingSample);
                });

                return deferred.promise;
            };

            var doThePing = function() {
                socketPing().then(function(iPingSample) {
                    theNTP.fPingSamples.unshift(iPingSample);

                    if (theNTP.fPingSamples.length > kMaxSampleCount) {
                        theNTP.fPingSamples.pop();
                    }
                }).catch(function() {

                });
            };

            var intervalHandler = $interval(doThePing, kSampleDelayMS);

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

            this.GetOffsetLatency = function() {

                if (theNTP.fPingSamples.length === 0) {
                    return null;
                }

                var averageOffset = 0.0;
                var averageLatency = 0.0;

                for (var i = 0; i < theNTP.fPingSamples.length; i += 1) {
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

        };

        var ntp = new NTP();

        var myNTPSync = {
            GetOffsetAndLatency: function() {
                return ntp.GetOffsetLatency();
            },
            DebugSocket: function() {
                return socket;
            }
        };

        return myNTPSync;
    }
]);
