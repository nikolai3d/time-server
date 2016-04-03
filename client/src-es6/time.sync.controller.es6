/* global gApp */
/* global AngularInstallIntervalFunction */
const kHeartBeatFrequencyMS = 10; // How often we update the screen, pretty much

gApp.controller("TimeSyncController", ['$interval',
    '$scope',
    'TrueTimeService',
    'LocalClockService',
    function($interval,
        $scope,
        TrueTimeService,
        LocalClockService) {

        this.fRealTimeSyncCount = 0;
        this.fTimeData = null;

        const trueTimeFunc = TrueTimeService.TrueNowTimeMS;
        const localTimeFunc = LocalClockService.Now;

        const heartBeat = () => {

            this.fRealTimeSyncCount += 1.0;

            const clientNow = localTimeFunc();
            const adjustedClientNow = trueTimeFunc();
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
