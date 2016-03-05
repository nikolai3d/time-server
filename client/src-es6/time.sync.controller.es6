/* global gApp */

class TimeController {
    constructor(iHTTPService, iIntervalService, iScope, iSocketNTPSyncService, iClockService) {

        // iIntervalService and iScope are only needed to establish a heartBeat, so they are only needed
        // in the constructor, and are not stored in the class.

        this.fHTTPService = iHTTPService;
        this.fClockService = iClockService;
        this.fSocketNTPSyncService = iSocketNTPSyncService;

        this.fServerData = [];
        this.fTitle = "UberTimeSync";
        this.fStringData = "No Data";
        this.fClientData = null;
        this.fServerErrorResponse = null;
        this.fRealTimeSyncCount = 0;

        this.clientToServerTimeSync();

        var intervalHandler;

        intervalHandler = iIntervalService(() => {
            this.heartBeat();
        }, 10);

        iScope.stopSync = function() {
            if (angular.isDefined(intervalHandler)) {
                iIntervalService.cancel(intervalHandler);
                intervalHandler = undefined;
            }
        };

        iScope.$on('$destroy', function() {
            // Make sure that the interval is destroyed too
            iScope.stopSync();
        });
    }

    heartBeat() {
        var clientNow = this.fClockService.Now();

        this.fClientData = {
            fSystemTime: clientNow,
            fMostPreciseTime: clientNow
        };

        this.fSocketNTPData = this.fSocketNTPSyncService.getOffsetAndLatency();
        if (this.fSocketNTPData === null) {
            this.fSocketNTPData = {
                fAverageOffset: "No Data Yet",
                fAverageLatency: "No Data Yet",
                fNumberOfSamples: 0
            };
        }

        this.fRealTimeSyncCount += 1.0;
    }

    TrueNowTimeMS() {
        var clientNow = this.fClockService.Now();

        var clientToServerDelta = 0;
        var serverToNTPDelta = 0;

        if (this.fSocketNTPData !== null) {
            clientToServerDelta = this.fSocketNTPData.fAverageOffset;
        }

        if (this.fServerData !== null) {
            serverToNTPDelta = this.fServerData.fDeltaData.fAverageServerNTPDelta;
        }

        var calculatedNowTime = clientNow - clientToServerDelta - serverToNTPDelta;

        return calculatedNowTime;
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
                this.fServerData = "Server Communication Error";
                this.fServerErrorResponse = response;
            });
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
