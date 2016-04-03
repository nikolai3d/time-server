/* global gApp */
/* global AngularInstallIntervalFunction */
const kHeartBeatFrequencyMS = 10; // How often we update the screen, pretty much

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

gApp.controller("TimeSyncController", ['$http',
    '$interval',
    '$scope',
    'SocketNTPSync',
    'Server2NTPDelta',
    'LocalClockService',
    function($http,
        $interval,
        $scope,
        SocketNTPSync,
        Server2NTPDelta,
        iClockService) {

        this.fRealTimeSyncCount = 0;
        this.fTimeData = null;

        const trueTimeCalculator = new TrueTimeCalculator($http, SocketNTPSync, Server2NTPDelta,
            iClockService);

        const heartBeat = () => {

            this.fRealTimeSyncCount += 1.0;

            const clientNow = iClockService.Now();
            const adjustedClientNow = trueTimeCalculator.TrueNowTimeMS();
            this.fClientData = {
                fSystemTime: clientNow,
                fMostPreciseTime: adjustedClientNow
            };
        };

        AngularInstallIntervalFunction(() => {
            heartBeat();
        }, kHeartBeatFrequencyMS, $interval, $scope);
    }
]);
