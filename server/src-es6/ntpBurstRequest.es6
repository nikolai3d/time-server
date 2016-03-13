// Using a pattern described here: http: //stackoverflow.com/questions/17217736/while-loop-with-promises
const Q = require("q");

/**
 * Creates a promise that resolves with an Date object after a successful burst of X NTP server queries
 * @param {NTPService} iNTPSingleRequestPromiseFunc: an asynchronous NTP ping. A function that
 * takes an optional config object (see ntpDatePromise() spec) and returns a promise that resolves
 * with NTP date or fails with an error.
 * @param {Object} iNTPSingleRequestConfig: single request config
 * @param {Number} iRequestedSuccessfulSampleCount:
 * @return {Promise} Promise that resolves with array of X elements of NTP dates , latencies and local times
 * after a successful completion of X NTP pings.
 * NOTE: Promise does not reject/fail, its inner function runs indefinitely until successful NTP pings are completed.
 */
function ntpDatePromiseBurst(iNTPSingleRequestPromiseFunc,
    iNTPSingleRequestConfig,
    iRequestedSuccessfulSampleCount) {
    var deferred = Q.defer();

    let burstArray = [];
    const singleNTPRequest = () => {
        return new Promise((iResolve /* , iReject */ ) => {

            // This inner Promise function does not reject any promises, nor does it resolve with any data.
            // When an NTP request completes, if successful, the result is added to burstArray.
            // the iResolve() callback is only used to signal the outer mechanism
            // (see below) that the operation is complete.

            iNTPSingleRequestPromiseFunc(iNTPSingleRequestConfig).then((data) => {
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

    const needMoreNTPRequests = () => {
        return burstArray.length < iRequestedSuccessfulSampleCount;
    };

    const loop = () => {
        // When the result of calling `needMoreNTPRequests` is no longer true, we are
        // done.
        if (!needMoreNTPRequests()) {
            return deferred.resolve(burstArray);
        }
        // Use `when`, in case `body` does not return a promise.
        // When it completes loop again otherwise, if it fails, reject the
        // done promise
        Q.when(singleNTPRequest(), loop, deferred.reject);
    };

    // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `singleNTPRequest` was called
    // synchronously the first time.
    Q.nextTick(loop);

    // The promise is returned
    return deferred.promise;
}
/**
 * Creates a promise that resolves whenever iTimeMS milliseconds pass.
 * @param {Number} iTimeMS: Time To Pass.
 * @return {Promise} Promise that resolves with nothing, after iTimeMS milliseconds after instantiation
 * NOTE: Promise does not reject.
 */
function delay(iTimeMS) {
    return new Promise(function(iResolve) {
        setTimeout(iResolve, iTimeMS);
    });
}

const kDefaultRequestedSuccessfulSampleCount = 10;
const kDefaultBurstTimeoutMS = 4000;
/**
 * Same as ntpDatePromiseBurst, but with added timeout for rejection.
 * Creates a promise that resolves with an Date object after a successful burst of X NTP server queries, or
 * rejects if operation does not complete in the alloted time.
 * @param {NTPService} iNTPSingleRequestPromiseFunc: an asynchronous NTP ping. A function that
 * takes an optional config object (see ntpDatePromise() spec) and returns a promise that resolves
 * with NTP date or fails with an error.
 * @param {Object} iMultiNTPRequestConfig: an optional config object
 * @return {Promise} Promise that resolves with array of X elements of NTP dates , latencies and local times
 * after a successful completion of X NTP pings.
 * Promise rejects, rejects if the burst operation does not complete in the alloted time (iTimeoutMS milliseconds).
 */
function ntpDatePromiseBurstTimeout(iNTPSingleRequestPromiseFunc, iMultiNTPRequestConfig) {

    const singleRequestConfig = {
        fLocalClockService: iMultiNTPRequestConfig && iMultiNTPRequestConfig.fLocalClockService,
        fServerCarousel: iMultiNTPRequestConfig && iMultiNTPRequestConfig.fServerCarousel,
        fTimeoutLatencyMS: iMultiNTPRequestConfig && iMultiNTPRequestConfig.fTimeoutLatencyMS
    };

    const customRequestedSuccessfulSampleCount = iMultiNTPRequestConfig &&
        iMultiNTPRequestConfig.fRequestedSuccessfulSampleCount;

    const requestedSuccessfulSampleCount = customRequestedSuccessfulSampleCount ||
        kDefaultRequestedSuccessfulSampleCount;

    const customBurstTimeoutMS = iMultiNTPRequestConfig && iMultiNTPRequestConfig.fBurstTimeoutMS;

    const burstTimeoutMS = customBurstTimeoutMS || kDefaultBurstTimeoutMS;

    const indefinitentpDatePromiseBurst = ntpDatePromiseBurst(iNTPSingleRequestPromiseFunc,
        singleRequestConfig,
        requestedSuccessfulSampleCount);

    const throwTimeoutErrorFunc = () => {
        throw new Error('Operation timed out');
    };

    return Promise.race([indefinitentpDatePromiseBurst, delay(burstTimeoutMS).then(throwTimeoutErrorFunc)]);
}

module.exports = {
    ntpDatePromiseBurstTimeout
};
