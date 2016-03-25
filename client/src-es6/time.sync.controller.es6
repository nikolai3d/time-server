/* global gApp */

const kHeartBeatFrequencyMS = 10; // How often we update the screen, pretty much
const kServerNTPDeltaRequestFrequencyMS = 15000; // How often we request server for its Server <-> NTP delta
/**
 * AngularInstallIntervalFunction() Attaches An Interval to fire every time each iIntervalTimeMS,
 * and makes sure it's destroyed when the scope goes down
 * @param {function}    iFunction: A function to run
 * @param {Number}      iIntervalTimeMS: Number of milliseconds between function runs
 * @param {Service}     iIntervalService: An Interval Service. Most probably $interval
 * (https://docs.angularjs.org/api/ng/service/$interval) or could be some other wrapper of window.setInterval
 * @param {Service}     iScope: a $scope or $rootScope service, something we can attach to so we can properly uninstall
 * the interval when the containers go down. https://docs.angularjs.org/api/ng/service/$rootScope
 */
function AngularInstallIntervalFunction(iFunction, iIntervalTimeMS, iIntervalService, iScope) {

    var intervalHandler = iIntervalService(() => {
        iFunction();
    }, iIntervalTimeMS);

    iScope.stopSync = function() {
        if (angular.isDefined(intervalHandler)) {
            iIntervalService.cancel(intervalHandler);
            intervalHandler = undefined;
        }
    };

    iScope.$on('$destroy', function() {
        iScope.stopSync();
    });

}

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
