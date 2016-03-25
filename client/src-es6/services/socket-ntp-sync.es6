/* global gApp */

/**
 * Creates the promise that resolves with an {offset, latency} object after a successful server ping
 * @param {Socket} iSocket: a socket.io socket that's used to connect to https://www.npmjs.com/package/socket-ntp
 * running on server side.
 * @param {Service} iAsyncService: Deferred Instance Promise Provider
 * (e.g. $q in Angular https://docs.angularjs.org/api/ng/service/$q )
 * @param {Service} iTimeoutService: Timeout Instance Promise Provider
 * (e.g. $timeout in Angular https://docs.angularjs.org/api/ng/service/$timeout )
 * @return {Promise} Promise that either resolves with successful {offset, latency} object or a server communication
 * error
 */
function getSocketPingPromiseService(iSocket, iAsyncService, iTimeoutService) {

    const timedNTPPingPromise = (iSocket, iAsyncService, iLocalClockService, iTimeoutService, iTimeoutMS) => {
        const deferred = iAsyncService.defer();

        iSocket.emit('ntp:client_sync', {
            t0: iLocalClockService.Now()
        });

        iSocket.on('ntp:server_sync', (iReturnedServerData) => {
            const nowTime = iLocalClockService.Now();
            const latency = nowTime - iReturnedServerData.t0;

            const pingSample = {
                localClockNow: nowTime,
                ntpRaw: iReturnedServerData.t1,
                ntpLatency: latency
            };

            deferred.resolve(pingSample);
        });

        iTimeoutService.setTimeout(() => {
            deferred.reject(`Timeout ${iTimeoutMS} ms elapsed`);
        }, iTimeoutMS);

        return deferred.promise;
    };

    return {
        ntpDatePromise: (iNTPSingleRequestConfig) => {
            const customClockService = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fLocalClockService;

            const kDefaultLocalClockService = {
                Now: () => {
                    return Date.now();
                }
            };

            const clockService = customClockService || kDefaultLocalClockService;

            const customTimeoutService = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fTimeoutService;
            const kDefaultTimeoutService = {
                setTimeout: iTimeoutService
            };
            const timeoutService = customTimeoutService || kDefaultTimeoutService;

            const customTimeoutLatencyMS = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fTimeoutLatencyMS;
            const kDefaultTimeoutLatencyMS = 100;
            const timeoutLatency = customTimeoutLatencyMS || kDefaultTimeoutLatencyMS;

            const ourNTPDatePromise = new Promise((iResolveFunc, iRejectFunc) => {
                timedNTPPingPromise(iSocket, iAsyncService, clockService, timeoutService,
                        timeoutLatency)
                    .then((iData) => {
                        console.log(JSON.stringify(iData));
                        iResolveFunc(iData);
                    })
                    .catch((iError) => {
                        iRejectFunc(iError);
                    });
            });

            return ourNTPDatePromise;
        }
    };
}

// 'BtfordSocket' is the socket produced by https://github.com/btford/angular-socket-io
// ("bower_components/angular-socket-io/socket.min.js" dependency)
// windowIOSocket is the socket produced by window.io.connect
// ("bower_components/socket.io/socket.io.js" dependency)

gApp.factory('SocketNTPSync', ['BtfordSocket', '$rootScope', '$interval', '$q', '$timeout',
    function(mySocket, $rootScope, $interval, $q, iTimeoutService) {

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

        // const kMaxSampleCount = 20;

        const socketPingPromise = getSocketPingPromiseService(socket, $q, iTimeoutService).ntpDatePromise;

        class NTP {
            constructor() {
                this.fPingSample = null;
                this.startPinging();
            } /* constructor */

            doThePing() {

                socketPingPromise(socket, $q).then((iPingSample) => {
                    this.fPingSample = iPingSample;
                }).catch(function(err) {
                    console.log(`ERROR: ${err}`);
                });
            } /* doThePing */

            getOffsetLatency() {

                if (this.fPingSample === null) {
                    return null;
                }

                const ntpTimestampApproximation =
                    this.fPingSample.ntpRaw + this.fPingSample.ntpLatency * 0.5;
                const clockOffsetMS = this.fPingSample.localClockNow - ntpTimestampApproximation;
                const ntpPingLatencyMS = this.fPingSample.ntpLatency;
                return {
                    fAverageOffset: clockOffsetMS,
                    fAverageLatency: ntpPingLatencyMS,
                    fNumberOfSamples: 1
                };
            } /* getOffsetLatency */

            startPinging() {
                // Set up an interval and cancel it once rootScope is going down

                const kSampleDelayMS = 1000;

                // Send the ping every kSampleDelayMS ms
                let intervalHandler = $interval(() => {
                    this.doThePing();
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
            } /* startPinging */

        }

        const ntp = new NTP();

        const myNTPSync = {
            getOffsetAndLatency: () => {
                return ntp.getOffsetLatency();
            },
            DebugSocket: () => socket
        };

        return myNTPSync;
    }
]);
