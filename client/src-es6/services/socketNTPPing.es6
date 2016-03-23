// function delay(iTimeMS, iTimeoutService) {
//     return new Promise(function(iResolve) {
//         iTimeoutService.setTimeout(iResolve, iTimeMS);
//     });
// }

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

    const untimedNTPPingPromise = (iSocket, iAsyncService, iLocalClockService) => {
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

            // const customTimeoutLatencyMS = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fTimeoutLatencyMS;
            // const kDefaultTimeoutLatencyMS = 500;
            // const timeoutLatency = customTimeoutLatencyMS || kDefaultTimeoutLatencyMS;

            const ourNTPDatePromise = new Promise((iResolveFunc, iRejectFunc) => {
                untimedNTPPingPromise(iSocket, iAsyncService, clockService)
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
