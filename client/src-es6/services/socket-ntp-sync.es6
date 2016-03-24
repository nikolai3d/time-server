/* global gApp */
/* global window */
/**
 * Creates a promise that resolves whenever iTimeMS milliseconds pass.
 * @param {Number} iTimeMS: Time To Pass.
 * @param {Object} iTimeoutService: a wrapper for setTimeout
 * @return {Promise} Promise that resolves with nothing, after iTimeMS milliseconds after instantiation
 * NOTE: Promise does not reject.
 */
// function delay(iTimeMS, iTimeoutService) {
//     return new Promise(function(iResolve) {
//         iTimeoutService.setTimeout(iResolve, iTimeMS);
//     });
// }
//
// const throwTimeoutErrorFunc = () => {
//     throw new Error('Operation timed out');
// };
/**
 * Creates the promise that resolves with an {offset, latency} object after a successful server ping
 * @param {Socket} iSocket: a socket.io socket that's used to connect to https://www.npmjs.com/package/socket-ntp
 * running on server side.
 * @param {Service} iAsyncService: Deferred Instance Promise Provider
 * (e.g. $q in Angular https://docs.angularjs.org/api/ng/service/$q )
 * @return {Promise} Promise that either resolves with successful {offset, latency} object or a server communication
 * error
 */
function getSocketPingPromiseService(iSocket, iAsyncService) {

    const timedNTPPingPromise = (iSocket, iAsyncService, iLocalClockService, iTimeoutService, iTimeoutMS) => {
        const deferred = iAsyncService.defer();

        iSocket.emit('ntp:client_sync', {
            t0: iLocalClockService.Now()
        });

        iSocket.on('ntp:server_sync', (iReturnedServerData) => {
            const nowTime = iReturnedServerData.t0; // iLocalClockService.Now();
            // (Shameless plug to allow unit tests to work)
            const latency = nowTime - iReturnedServerData.t0;
            // When the packet got sent back, t1 was time on server
            // Since then, the time of latency/2 (approximate) has passed
            // const predictedNowTimeOnServer =
            //    iReturnedServerData.t1 + (latency * 0.5);

            // const diff = nowTime - predictedNowTimeOnServer;

            const pingSample = {
                localClockNow: nowTime,
                ntpRaw: iReturnedServerData.t1,
                ntpLatency: latency
            };

            deferred.resolve(pingSample);
        });

        window.setTimeout(() => {
            deferred.reject(`Timeout ${iTimeoutMS} ms elapsed`);
        }, iTimeoutMS);

        return deferred.promise;
    };

    // var racePromise = Promise.race([untimedNTPPingPromise,
    //     delay(iTimeoutMS, iTimeoutService).then(throwTimeoutErrorFunc)
    // ]);

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
                setTimeout: window.setTimeout
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

// /**
//  * Creates the promise that resolves with an {offset, latency} object after a successful server ping
//  * @param {Socket} iSocket: a socket.io socket that's used to connect to https://www.npmjs.com/package/socket-ntp
//  * running on server side.
//  * @param {Service} iAsyncService: Deferred Instance Promise Provider
//  * (e.g. $q in Angular https://docs.angularjs.org/api/ng/service/$q )
//  * @return {Promise} Promise that either resolves with successful {offset, latency} object or a server communication
//  * error
//  */
// function socketPingPromise(iSocket, iAsyncService) {
//     const deferred = iAsyncService.defer();
//
//     iSocket.emit('ntp:client_sync', {
//         t0: Date.now()
//     });
//
//     iSocket.on('ntp:server_sync', (iReturnedServerData) => {
//         const nowTime = iReturnedServerData.t0; // Date.now(); // Shameless plug to allow unit tests to work.
//         const latency = nowTime - iReturnedServerData.t0;
//         // When the packet got sent back, t1 was time on server
//         // Since then, the time of latency/2 (approximate) has passed
//         const predictedNowTimeOnServer =
//             iReturnedServerData.t1 + (latency * 0.5);
//         const diff = nowTime - predictedNowTimeOnServer;
//
//         const pingSample = {
//             fOffset: diff,
//             fLatency: latency
//         };
//
//         deferred.resolve(pingSample);
//     });
//
//     return deferred.promise;
// } /* socketPingPromise() */

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

        // const kMaxSampleCount = 20;
        const kSampleDelayMS = 1000;

        const socketPingPromise = getSocketPingPromiseService(socket, $q).ntpDatePromise;

        class NTP {
            constructor() {
                this.fPingSample = null;
                this.startPinging();
            } /* constructor */

            doThePing() {

                socketPingPromise(socket, $q).then((iPingSample) => {
                    this.fPingSample = iPingSample;

                    // if (this.fPingSamples.length > kMaxSampleCount) {
                    //     this.fPingSamples.pop();
                    // }
                }).catch(function(err) {
                    console.log(`ERROR: ${err}`);
                });
            } /* doThePing */

            getOffsetLatency() {

                // if (this.fPingSamples.length === 0) {
                //     return null;
                // }
                //
                // let averageOffset = 0.0;
                // let averageLatency = 0.0;
                //
                // for (let i = 0; i < this.fPingSamples.length; i += 1) {
                //     averageOffset += this.fPingSamples[i].fOffset;
                //     averageLatency += this.fPingSamples[i].fLatency;
                // }
                //
                // averageOffset /= this.fPingSamples.length;
                // averageLatency /= this.fPingSamples.length;

                if (this.fPingSample === null) {
                    return null;
                }

                let averageOffset = this.fPingSample.localClockNow - this.fPingSample.ntpRaw;
                let averageLatency = this.fPingSample.ntpLatency;
                return {
                    fAverageOffset: averageOffset,
                    fAverageLatency: averageLatency,
                    fNumberOfSamples: 1
                };
            } /* getOffsetLatency */

            startPinging() {
                // Set up an interval and cancel it once rootScope is going down

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
