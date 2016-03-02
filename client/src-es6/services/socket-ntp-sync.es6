/* global gApp */

// 'BtfordSocket' is the socket produced by https://github.com/btford/angular-socket-io
// ("bower_components/angular-socket-io/socket.min.js" dependency)
// windowIOSocket is the socket produced by window.io.connect
// ("bower_components/socket.io/socket.io.js" dependency)

gApp.factory('SocketNTPSync', ['BtfordSocket', '$rootScope', '$interval', '$q',
    function(mySocket, $rootScope, $interval, $q) {

        const socket = mySocket;

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

        var kMaxSampleCount = 20;
        var kSampleDelayMS = 1000;

        var socketPingPromise = () => {
            var deferred = $q.defer();

            socket.emit('ntp:client_sync', {
                t0: Date.now()
            });

            socket.on('ntp:server_sync', (iReturnedServerData) => {
                var nowTime = iReturnedServerData.t0; // Date.now(); // Shameless plug to allow unit tests to work.
                var latency = nowTime - iReturnedServerData.t0;
                // When the packet got sent back, t1 was time on server
                // Since then, the time of latency/2 (approximate) has passed
                var predictedNowTimeOnServer =
                    iReturnedServerData.t1 + (latency * 0.5);
                var diff = nowTime - predictedNowTimeOnServer;

                var pingSample = {
                    fOffset: diff,
                    fLatency: latency
                };

                deferred.resolve(pingSample);
            });

            return deferred.promise;
        }; /* socketPing() */

        class NTP {
            constructor() {
                this.fPingSamples = [];
            } /* constructor */

            doThePing() {

                // var samples = this.fPingSamples;
                socketPingPromise().then((iPingSample) => {
                    this.fPingSamples.unshift(iPingSample);

                    if (this.fPingSamples.length > kMaxSampleCount) {
                        this.fPingSamples.pop();
                    }
                }).catch(function() {

                });
            }

            getOffsetLatency() {

                if (this.fPingSamples.length === 0) {
                    return null;
                }

                var averageOffset = 0.0;
                var averageLatency = 0.0;

                for (var i = 0; i < this.fPingSamples.length; i += 1) {
                    averageOffset += this.fPingSamples[i].fOffset;
                    averageLatency += this.fPingSamples[i].fLatency;
                }

                averageOffset /= this.fPingSamples.length;
                averageLatency /= this.fPingSamples.length;

                return {
                    fAverageOffset: averageOffset,
                    fAverageLatency: averageLatency,
                    fNumberOfSamples: this.fPingSamples.length
                };
            } /* getOffsetLatency */

            startPinging() {
                var classObj = this;
                var intervalHandler = $interval(function() {
                    classObj.doThePing();
                }, kSampleDelayMS);

                $rootScope.stopNTPPings = () => {
                    if (angular.isDefined(intervalHandler)) {
                        $interval.cancel(intervalHandler);
                        intervalHandler = undefined;
                    }
                };

                $rootScope.$on('$destroy', () => {
                    // Make sure that the interval is destroyed too
                    $rootScope.stopNTPPings();
                });
            }

        }

        var ntp = new NTP();
        ntp.startPinging();

        var myNTPSync = {
            getOffsetAndLatency: () => {
                return ntp.getOffsetLatency();
            },
            DebugSocket: () => socket
        };

        return myNTPSync;
    }
]);
