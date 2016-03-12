const ntpClient = require('ntp-client');
var gReq = 0;
var gReqInProgress = false;

const kDefaultLocalClockService = {
    Now: () => {
        return Date.now();
    }
};

const kDefaultServerCarousel = [
    "0.pool.ntp.org",
    "1.pool.ntp.org",
    "2.pool.ntp.org",
    "3.pool.ntp.org",
    "0.us.pool.ntp.org",
    "1.us.pool.ntp.org",
    "2.us.pool.ntp.org",
    "3.us.pool.ntp.org",
    "0.europe.pool.ntp.org",
    "1.europe.pool.ntp.org",
    "2.europe.pool.ntp.org",
    "3.europe.pool.ntp.org"
];

const kDefaultTimeoutLatencyMS = 500;

/**
 * Creates a promise that resolves with an Date object after a successful NTP server query
 * @param {ClockService} iLocalClockService: an Object with a Now() function that returns
 * current local time in Unix milliseconds. Usually just a wrapper for Date.now();
 * @param {Array} iServerCarousel: an Array of Strings, IP Addresses of a server pool
 * @param {Number} iTimeoutLatencyMS: a timeout in milliseconds, when to bail on an NTP request
 * and move on to next server
 * @return {Promise} Promise that either resolves with successful Date object or an NTP server communication
 * error
 */
function ntpDatePromise(iRunCount,
    iLocalClockService,
    iServerCarousel,
    iTimeoutLatencyMS) {
    // TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client
    const clockService = iLocalClockService || kDefaultLocalClockService;
    const serverCarousel = iServerCarousel || kDefaultServerCarousel;
    const timeoutLatency = iTimeoutLatencyMS || kDefaultTimeoutLatencyMS;

    return new Promise((iResolveFunc, iRejectFunc) => {

        // See http://www.pool.ntp.org/en/ for usage information
        // http://www.ntp.org/ About NTP protocol
        // Or just google for "gps clock time server"
        const serverAddress = serverCarousel[iRunCount % serverCarousel.length];
        // console.log(`NTP Req ${gReq}: Pinging ${serverAddress}`);

        // const startedReq = gReq;
        gReq += 1;
        const localClockStart = clockService.Now();

        if (gReqInProgress === true) {
            console.error("ERROR: Simultaneous requests running!");
            iRejectFunc("ERROR: Simultaneous requests running!");
            return;
        }

        gReqInProgress = true;
        ntpClient.ntpReplyTimeout = timeoutLatency;
        ntpClient.getNetworkTime(serverAddress, 123, (iError, iDate) => {

            gReqInProgress = false;

            if (iError) {
                iRejectFunc(iError);
                return;
            }

            const localClockNow = clockService.Now();
            const latency = localClockNow - localClockStart;

            iResolveFunc({
                localClockNow: localClockNow,
                ntpRaw: iDate.getTime(),
                ntpLatency: latency
            });

        });
    });
}

module.exports = {
    ntpDatePromise
};
