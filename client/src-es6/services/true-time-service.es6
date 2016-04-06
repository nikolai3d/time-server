/* global gApp */
(() => {
    class TrueTimeCalculator {
        constructor(iHTTPService, iSocketNTPSyncService, iServer2NTPDeltaService, iClockService) {

            this.fHTTPService = iHTTPService;
            this.fClockService = iClockService;
            this.fSocketNTPSyncService = iSocketNTPSyncService;
            this.fServer2NTPDeltaService = iServer2NTPDeltaService;

        }

        TrueNowTimeMS() {
            var clientNow = this.fClockService.Now();

            var clientToServerDelta = 0;
            var serverToNTPDelta = 0;

            const clientServerNTPDeltaData = this.fSocketNTPSyncService.getOffsetAndLatency();
            const serverToNTPDeltaData = this.fServer2NTPDeltaService.getServerToNTPLatency();

            if (clientServerNTPDeltaData !== null) {
                clientToServerDelta = clientServerNTPDeltaData.fAverageOffset;
            }

            if (serverToNTPDeltaData !== null) {
                serverToNTPDelta = serverToNTPDeltaData.fDeltaData.fServerNTPDelta;
            }

            var calculatedNowTime = clientNow - clientToServerDelta - serverToNTPDelta;

            return calculatedNowTime;
        }

    }

    gApp.factory('TrueTimeService', ['$http',
        'SocketNTPSync',
        'Server2NTPDelta',
        'LocalClockService',
        function($http,
            SocketNTPSync,
            Server2NTPDelta,
            iClockService) {

            const trueTimeCalculator = new TrueTimeCalculator($http, SocketNTPSync,
                Server2NTPDelta,
                iClockService);

            return {
                TrueNowTimeMS: () => {
                    return trueTimeCalculator.TrueNowTimeMS();
                }
            };
        }
    ]);
})();
