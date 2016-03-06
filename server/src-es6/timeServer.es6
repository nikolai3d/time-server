var ntpClient = require('ntp-client');

/**
 * Creates a promise that resolves with an Date object after a successful NTP server query
 * @return {Promise} Promise that either resolves with successful Date object or an NTP server communication
 * error
 */
function ntpDatePromise() {
    // TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client

    return new Promise((resolve, reject) => {

        // See http://www.pool.ntp.org/en/ for usage information
        // http://www.ntp.org/ About NTP protocol
        // Or just google for "gps clock time server"
        ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {

            if (err) {
                reject(err);
            }

            resolve(date);
        });
    });
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

        this.Synchronize();

        this.TickInterval = setInterval(() => {
            this.Synchronize();
        }, 1000);
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
            const ntpTimeRaw = iNTPDate.getTime();

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
            console.log("Latency  : " + ntpRequestElapsed + " ms");
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
