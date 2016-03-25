var ntpsync = require('ntpsync');

/**
 * A class that requests NTP time every 10 seconds
 * Its deltaData is sent back on every '/doSynchronize.json'
 */
class Chronos {

    constructor() {

        this.fDeltaData = {
            fServerNTPDelta: 0.0,
            fServerNTPLatency: 0.0,
            fSampleCount: 0.0
        };

        this.Synchronize();

        this.TickInterval = setInterval(() => {
            this.Synchronize();
        }, 30000);
    }

    Synchronize() {

        ntpsync.ntpLocalClockDeltaPromise().then((iNTPData) => {
            this.fDeltaData.fServerNTPDelta = iNTPData.minimalNTPLatencyDelta;
            this.fDeltaData.fServerNTPLatency = iNTPData.minimalNTPLatency;
            this.fDeltaData.fSampleCount = iNTPData.totalSampleCount;

            console.log(JSON.stringify(iNTPData));
        }).catch((err) => {
            console.log(err);
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
    console.log(`doSynchronize Request from client: Delta is ${keeper.fDeltaData.fServerNTPDelta} ms`);

    var result = {
        fDeltaData: keeper.fDeltaData
    };

    iResponse.send(JSON.stringify(result));

    next();
}

module.exports = {
    timeServerEndpointHandler
};
