const ntpSingleRequest = require('./ntpSingleRequest');
const ntpBurstRequest = require('./ntpBurstRequest');

/**
 * Creates a promise
 * @return {Promise} Promise that either resolves with an average number of milliseconds
 * local clock (Date.now())  is ahead of NTP or an NTP server communication error
 */
function ntpLocalClockDeltaPromise() {
    return new Promise((iResolve, iReject) => {
        // var burstDataPromise = ntpBurstRequest.ntpDatePromiseBurst(ntpSingleRequest.ntpDatePromise);
        const burstDataPromise = ntpBurstRequest.ntpDatePromiseBurstTimeout(ntpSingleRequest.ntpDatePromise,
            3000);

        burstDataPromise.then((iBurstDataArray) => {

            console.log("SUCCESS: " + JSON.stringify(iBurstDataArray));
            let totalServerNTPDelta = 0;
            let totalServerNTPLatency = 0;
            let totalSampleCount = 0;

            let minimalNTPLatency = 1000000000;
            let minimalNTPLatencyDelta = 0;

            for (let b of iBurstDataArray) {
                const ntpAdjustedTime = b.ntpRaw + b.ntpLatency * 0.5;
                totalServerNTPDelta += (b.localClockNow - ntpAdjustedTime);
                totalSampleCount += 1;
                totalServerNTPLatency += b.ntpLatency;

                if (b.ntpLatency < minimalNTPLatency) {
                    minimalNTPLatency = b.ntpLatency;
                    minimalNTPLatencyDelta = (b.localClockNow - ntpAdjustedTime);
                }
            }

            if (totalSampleCount === 0) {
                iReject("No Samples");
            }

            const averageNTPDelta = totalServerNTPDelta / totalSampleCount;
            const averageNTPLatency = totalServerNTPLatency / totalSampleCount;

            console.log(
                `Average Server - NTP Delta is ${averageNTPDelta} ms, ${totalSampleCount} samples,` +
                `${averageNTPLatency} ms average latency`
            );
            console.log(
                `Minimal Latency Server - NTP Delta is ${minimalNTPLatencyDelta} ms, ${totalSampleCount} samples,` +
                `${minimalNTPLatency} ms minimum latency`
            );
            iResolve({
                averageNTPDelta,
                averageNTPLatency,
                minimalNTPLatencyDelta,
                minimalNTPLatency,
                totalSampleCount
            });
        }).catch((err) => {
            iReject(err);
        });
    });
}

module.exports = {
    ntpLocalClockDeltaPromise
};
