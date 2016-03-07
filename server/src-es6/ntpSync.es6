const ntpSingleRequest = require('./ntpSingleRequest');
const ntpBurstRequest = require('./ntpBurstRequest');

const LocalClock = {
    Now: () => {
        return Date.now();
    }
};

function ntpLocalClockDeltaPromise() {
    return new Promise((iResolve, iReject) => {
        var burstDataPromise = ntpBurstRequest.ntpDatePromiseBurst(LocalClock, ntpSingleRequest.ntpDatePromise);

        burstDataPromise.then((iBurstDataArray) => {
            let latency = 0;
            console.log("SUCCESS: " + JSON.stringify(iBurstDataArray));
            iResolve(latency);
        }).catch((err) => {
            iReject(err);
        });
    });
}

module.exports = {
    ntpLocalClockDeltaPromise
};
