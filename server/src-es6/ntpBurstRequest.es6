const delay = require('delay');

/**
 * Creates a promise that resolves with an Date object after a successful burst of X NTP server queries
 * @param {ClockService} iLocalClockService: an Object with a Now() function that returns
 * current local time in Unix milliseconds. Usually just a wrapper for Date.now();
 * @param {NTPService} iNTPSingleRequestPromiseFunc: an Object with a Now() function that returns
 * current local time in Unix milliseconds. Usually just a wrapper for Date.now();
 * @return {Promise} Promise that either resolves with  array of NTP dates, latencies and local times
 * or an NTP server communication
 * error
 */
// function ntpDatePromiseBurst(iNTPSingleRequestPromiseFunc) {
//
//     return new Promise((iResolve, iReject) => {
//         var burstArray = [];
//         var p = Promise.resolve();
//         for (let i = 0; i < 6; i += 1) {
//             // Chain the promises interleaved with the 'delay' passthrough promise, that resolves after X ms
//             // https://github.com/sindresorhus/delay
//             p = p
//                 .then(delay(10))
//                 .then((iRes) => {
//                     if (typeof iRes !== 'undefined' && iRes !== null) {
//                         burstArray.push(iRes);
//                     }
//                     console.log(
//                         `OK ${burstArray.length} samples so far`);
//                     return iNTPSingleRequestPromiseFunc();
//                 }).catch(( /* err */ ) => {
//                     console.log(
//                         `ERR ${burstArray.length} samples so far`);
//                     return iNTPSingleRequestPromiseFunc();
//                 });
//         }
//
//         p.then((iRes) => {
//             if (typeof iRes !== 'undefined' && iRes !== null) {
//                 burstArray.push(iRes);
//             }
//             console.log(
//                 `OK ${burstArray.length} samples in the end`);
//             iResolve(burstArray);
//         }).catch((err) => {
//             console.log("Last chain link Timeout, moving on! " + err);
//             console.log(
//                 `ERR ${burstArray.length} samples in the end`);
//             iResolve(burstArray);
//         });
//
//     });
// }
const Q = require("q");

function ntpDatePromiseBurst(iNTPSingleRequestPromiseFunc) {
    var done = Q.defer();

    let counter = 0;
    let burstArray = [];
    const body = () => {
        return new Promise((iResolve, iReject) => {

            console.log("counter : " + counter);
            counter += 1;

            iNTPSingleRequestPromiseFunc(counter).then((data) => {
                // Success: add the result to samples
                console.log("OK " + JSON.stringify(data));
                burstArray.push(data);
                iResolve();
            }).catch((err) => {
                // Failure: Move on to the next one
                console.log("ERR " + JSON.stringify(err));
                iResolve();
            });

        });
    };

    const condition = () => {
        return burstArray.length < 10;
    };

    function loop() {
        // When the result of calling `condition` is no longer true, we are
        // done.
        if (!condition()) {
            return done.resolve(["DONE!"]);
        }
        // Use `when`, in case `body` does not return a promise.
        // When it completes loop again otherwise, if it fails, reject the
        // done promise
        Q.when(body(), loop, done.reject);
    }

    // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `body` was called
    // synchronously the first time.
    Q.nextTick(loop);

    // The promise
    return done.promise;
}

module.exports = {
    ntpDatePromiseBurst
};
