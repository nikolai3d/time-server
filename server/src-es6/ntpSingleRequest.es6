const ntpClient = require('ntp-client');
var gReq = 0;
var gReqInProgress = false;
/**
 * Creates a promise that resolves with an Date object after a successful NTP server query
 * @param {ClockService} iLocalClockService: an Object with a Now() function that returns
 * current local time in Unix milliseconds. Usually just a wrapper for Date.now();
 * @return {Promise} Promise that either resolves with successful Date object or an NTP server communication
 * error
 */
function ntpDatePromise(iLocalClockService) {
    // TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client

    return new Promise((iResolveFunc, iRejectFunc) => {

        // See http://www.pool.ntp.org/en/ for usage information
        // http://www.ntp.org/ About NTP protocol
        // Or just google for "gps clock time server"
        console.log(`NTP Req ${gReq} start`);
        const startedReq = gReq;
        gReq += 1;
        const localClockStart = iLocalClockService.Now();
        if (gReqInProgress === true) {
            console.error("ERROR: Simultaneous requests running!");
        }
        gReqInProgress = true;
        ntpClient.getNetworkTime("2.pool.ntp.org", 123, (err, date) => {
            console.log(`NTP Req ${startedReq} end`);
            gReqInProgress = false;
            if (err) {
                iRejectFunc(err);
                return;
            }
            const localClockNow = iLocalClockService.Now();
            const latency = localClockNow - localClockStart;

            iResolveFunc({
                localClockNow: localClockNow,
                ntpRaw: date.getTime(),
                ntpLatency: latency
            });

        });
    });
}

module.exports = {
    ntpDatePromise
};
