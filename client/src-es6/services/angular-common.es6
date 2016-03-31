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
