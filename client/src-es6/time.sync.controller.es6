/* global gApp */
/* global AngularInstallIntervalFunction */
const kHeartBeatFrequencyMS = 10; // How often we update the screen, pretty much
const kServerNTPDeltaRequestFrequencyMS = 15000; // How often we request server for its Server <-> NTP delta

class TimeController {
    constructor(iHTTPService, iIntervalService, iScope, iSocketNTPSyncService, iClockService) {

        // iIntervalService and iScope are only needed to establish a heartBeat, so they are only needed
        // in the constructor, and are not stored in the class.

        this.fHTTPService = iHTTPService;
        this.fClockService = iClockService;
        this.fSocketNTPSyncService = iSocketNTPSyncService;

        this.fServerData = null;
        this.fTitle = "UberTimeSync";
        this.fStringData = "No Data";
        this.fClientData = null;
        this.fLastServerErrorResponse = null;
        this.fRealTimeSyncCount = 0;

        this.clientToServerTimeSync();

        AngularInstallIntervalFunction(() => {
            this.heartBeat();
        }, kHeartBeatFrequencyMS, iIntervalService, iScope);

        AngularInstallIntervalFunction(() => {
            this.clientToServerTimeSync();
        }, kServerNTPDeltaRequestFrequencyMS, iIntervalService, iScope);
    }

    heartBeat() {

        this.fSocketNTPData = this.fSocketNTPSyncService.getOffsetAndLatency();
        if (this.fSocketNTPData === null) {
            this.fSocketNTPData = {
                fAverageOffset: "No Data Yet",
                fAverageLatency: "No Data Yet",
                fNumberOfSamples: 0
            };
        }

        this.fRealTimeSyncCount += 1.0;

        const clientNow = this.fClockService.Now();
        const adjustedClientNow = this.TrueNowTimeMS();
        this.fClientData = {
            fSystemTime: clientNow,
            fMostPreciseTime: adjustedClientNow
        };
    }

    clientToServerTimeSync() {
        var timeRequest = this.fHTTPService({
            method: 'GET',
            url: '/getNTPSyncData'
        });

        timeRequest
            .then((response) => {
                this.fServerData = response.data;
                this.fClientData = {
                    fSystemTime: null,
                    fAdjustedSystemTime: null
                };
                this.fStringData = JSON.stringify(this.fServerData);
            }).catch((response) => {
                this.fLastServerErrorResponse = response;
            });
    }

    TrueNowTimeMS() {
        var clientNow = this.fClockService.Now();

        var clientToServerDelta = 0;
        var serverToNTPDelta = 0;

        if (this.fSocketNTPData !== null) {
            clientToServerDelta = this.fSocketNTPData.fAverageOffset;
        }

        if (this.fServerData !== null) {
            serverToNTPDelta = this.fServerData.fDeltaData.fServerNTPDelta;
        }

        var calculatedNowTime = clientNow - clientToServerDelta - serverToNTPDelta;

        return calculatedNowTime;
    }

}

gApp.controller("TimeSyncController", ['$http', '$interval', '$scope', 'SocketNTPSync', 'LocalClockService',
    function($http, $interval, $scope, SocketNTPSync, iClockService) {

        const timeControllerInstance = new TimeController($http, $interval, $scope, SocketNTPSync,
            iClockService);

        this.fTC = timeControllerInstance;

        this.TrueNowTimeMS = () => {
            return timeControllerInstance.TrueNowTimeMS();
        };

    }
]);
