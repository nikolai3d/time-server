var ntpClient = require('ntp-client');

/**
 * Creates a promise that resolves with an Date object after a successful NTP server query
 * @return {Promise} Promise that either resolves with successful Date object or an NTP server communication
 * error
 */
function ntpDatePromise() {
    // TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client

    return new Promise((resolve, reject) => {
        ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {

            if (err) {
                console.error(err);
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

        this.Synchronize();

        this.TickInterval = setInterval(() => {
            this.Synchronize();
        }, 10000);
    }

    Synchronize() {

        ntpDatePromise().then((date) => {
            var ntpMilliseconds = date.getTime();
            var serverNow = new Date();
            var serverMilliseconds = serverNow.getTime();
            var serverNTPDelta = serverMilliseconds - ntpMilliseconds;

            this.fDeltaData.fLastServerNTPDelta = serverNTPDelta;

            this.fTotalDelta += serverNTPDelta;

            this.fDeltaData.fSampleCount += 1;

            this.fDeltaData.fAverageServerNTPDelta = this.fTotalDelta /
                this.fDeltaData.fSampleCount;

            this.fDeltaData.fServerTimeMS = serverNow.getTime();

            console.log("Current (ServerTime) : " + serverNow.getTime() + " ms");
            console.log("Current (ServerTime - NTP Time) : " + serverNTPDelta + " ms");
        }).catch((err) => {
            console.error(err);
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
