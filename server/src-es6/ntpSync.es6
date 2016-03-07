const ntpSingleRequest = require('./ntpSingleRequest');
const ntpBurstRequest = require('./ntpBurstRequest');

const LocalClock = {
    Now: () => {
        return Date.now();
    }
};
/**
 * Creates a promise
 * @return {Promise} Promise that either resolves with an average number of milliseconds
 * local clock (Date.now())  is ahead of NTP or an NTP server communication error
 */
function ntpLocalClockDeltaPromise() {
    return new Promise((iResolve, iReject) => {
        var burstDataPromise = ntpBurstRequest.ntpDatePromiseBurst(LocalClock, ntpSingleRequest.ntpDatePromise);

        burstDataPromise.then((iBurstDataArray) => {
            let serverNTPDelta = 0;
            console.log("SUCCESS: " + JSON.stringify(iBurstDataArray));
            let totalServerNTPDelta = 0;
            let totalSampleCount = 0;
            for (let b of iBurstDataArray) {
                const ntpAdjustedTime = b.ntpRaw + b.ntpLatency * 0.5;
                totalServerNTPDelta += b.localClockNow - ntpAdjustedTime;
                totalSampleCount += 1;
            }

            serverNTPDelta = totalServerNTPDelta / totalSampleCount;
            console.log(`Average Server - NTP Delta is ${serverNTPDelta} ms`);
            iResolve(serverNTPDelta);
        }).catch((err) => {
            iReject(err);
        });
    });
}

module.exports = {
    ntpLocalClockDeltaPromise
};
