const ntpClient = require('ntp-client');
const delay = require('delay');

var gReq = 0;
var gReqInProgress = false;
/**
 * Creates a promise that resolves with an Date object after a successful NTP server query
 * @return {Promise} Promise that either resolves with successful Date object or an NTP server communication
 * error
 */
function ntpDatePromise() {
    // TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client

    return new Promise((iResolveFunc, iRejectFunc) => {

        // See http://www.pool.ntp.org/en/ for usage information
        // http://www.ntp.org/ About NTP protocol
        // Or just google for "gps clock time server"
        console.log(`NTP Req ${gReq} start`);
        const startedReq = gReq;
        gReq += 1;
        var startTime = Date.now();
        if (gReqInProgress === true) {
            console.error("ERROR: Simultaneous requests running!");
        }
        gReqInProgress = true;
        ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
            console.log(`NTP Req ${startedReq} end`);
            gReqInProgress = false;
            if (err) {
                iRejectFunc(err);
            }

            const latency = Date.now() - startTime;

            iResolveFunc({
                date,
                latency
            });

        });
    });
}

/**
 * Creates a promise that resolves with an Date object after a successful burst of X NTP server queries
 * @return {Promise} Promise that either resolves with successful average Date object or an NTP server communication
 * error
 */
function ntpDatePromiseBurst() {
    // See http://stackoverflow.com/questions/28683071/how-do-you-synchronously-resolve-a-chain-of-es6-promises

    // ntpDatePromise().then(() => {
    //     return ntpDatePromise();
    // }).then(() => {
    //     return ntpDatePromise();
    // }).then(() => {
    //     return ntpDatePromise();
    // });

    // Prepare promise chain
    var p = Promise.resolve();
    for (let i = 0; i < 10; i += 1) {
        // Chain the promises interleaved with the 'delay' passthrough promise, that resolves after X ms
        // https://github.com/sindresorhus/delay
        p = p
            .then(delay(1000))
            .then((iRes) => {
                console.log(JSON.stringify(iRes));
                return ntpDatePromise();
            });
    }
    p.then(() => {
        console.log("NTP CHAIN DONE");
    }).catch((err) => {
        console.log(`NTP CHAIN Broke with "${err}"`);
    });

    return p;
}
/**
 * A class that requests NTP time every 10 seconds
 * Its deltaData is sent back on every '/doSynchronize.json'
 */
class Chronos {

    constructor() {

        this.fDeltaData = {
            fLastServerNTPDelta: 0.0,
            fAverageServerNTPDelta: 0.0,
            fSampleCount: 0.0,
            fServerTimeMS: null
        };

        this.fTotalDelta = 0.0;
        this.fLastNTPRequestStarted = null;

        // this.Synchronize();

        // this.TickInterval = setInterval(() => {
        //     this.Synchronize();
        // }, 1000);
    }

    Synchronize() {
        const ntpRequestStart = Date.now();
        if (this.fLastNTPRequestStarted !== null) {
            const elapsedSinceLastRequestStarted = ntpRequestStart - this.fLastNTPRequestStarted;

            console.log(
                `No NTP Request possible, since last one is still processing
                 (${elapsedSinceLastRequestStarted} ms elapsed)`
            );

            return;
        }

        this.fLastNTPRequestStarted = ntpRequestStart;

        ntpDatePromise().then((iNTPDate) => {
            const serverNow = new Date();
            const ntpTimeRaw = iNTPDate.date.getTime();

            if (ntpTimeRaw < 0) {
                console.error("ERROR: NEGATIVE TIME RECEIVED, BAD SAMPLE");
                return;
            }
            if (this.fLastNTPRequestStarted === null) {
                console.error(
                    "ERROR: Received the response but do not know when it started! SHOULDN'T HAPPEN!"
                );
                return;
            }
            const ntpRequestElapsed = serverNow.getTime() - this.fLastNTPRequestStarted;

            const ntpTimeAdjusted = ntpTimeRaw + ntpRequestElapsed / 2; // Adjust for latency

            const serverMilliseconds = serverNow.getTime();
            const serverNTPDelta = serverMilliseconds - ntpTimeAdjusted;
            this.fDeltaData.fLastServerNTPDelta = serverNTPDelta;

            this.fTotalDelta += serverNTPDelta;

            this.fDeltaData.fSampleCount += 1;

            this.fDeltaData.fAverageServerNTPDelta = this.fTotalDelta /
                this.fDeltaData.fSampleCount;

            this.fDeltaData.fServerTimeMS = serverNow.getTime();

            console.log("===>");
            console.log("NTPTime RAW : " + ntpTimeRaw + " ms");
            console.log("NTP Request started: " + this.fLastNTPRequestStarted + " ms");
            console.log("Latency  1: " + ntpRequestElapsed + " ms");
            console.log("Latency  2: " + iNTPDate.latency + " ms");
            console.log("NTPTime Adjusted) : " + ntpTimeAdjusted + " ms");
            console.log("Current (ServerTime) : " + serverMilliseconds + " ms");
            console.log("Current (ServerTime - NTP Time) : " + serverNTPDelta + " ms");
            this.fLastNTPRequestStarted = null;
        }).catch((err) => {
            console.error("NTP Error (Promise Rejected):" + err);
            const serverNow = new Date();
            const ntpRequestElapsed = serverNow.getTime() - this.fLastNTPRequestStarted;
            console.error(`NTP Request Failed after :${ntpRequestElapsed} ms`);
            this.fLastNTPRequestStarted = null;
        });

    } /* Synchronize */

}
ntpDatePromiseBurst();
const keeper = new Chronos();
/**
 * Express middleware to log requests
 * @param {Object} iReq: standard Express request
 * @param {Object} iResponse: standard Express response
 * @param {Function} next: standard Express next() handler
 */
function timeServerEndpointHandler(iReq, iResponse, next) {
    console.log("doSynchronize Request");

    var result = {
        fDeltaData: keeper.fDeltaData
    };

    iResponse.send(JSON.stringify(result));

    next();
}

module.exports = {
    timeServerEndpointHandler
};
