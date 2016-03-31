/* global gApp */
/* global AngularInstallIntervalFunction */

const kServerNTPDeltaRequestFrequencyMS = 15000; // How often we request server for its Server <-> NTP delta
/**
 * Creates the promise that resolves with an fDeltaData object as received from the server
 * @param {Service} iAsyncService: Deferred Instance Promise Provider
 * (e.g. $q in Angular https://docs.angularjs.org/api/ng/service/$q )
 * @param {Service} iHTTPService: Timeout Instance Promise Provider
 * (e.g. $http in Angular https://docs.angularjs.org/api/ng/service/$http )
 * @return {Promise} Promise that either resolves with successful fDeltaData object or a server communication
 * error
 */
function clientToServerTimeSync(iAsyncService, iHTTPService) {

    const deferred = iAsyncService.defer();

    var timeRequest = iHTTPService({
        method: 'GET',
        url: '/getNTPSyncData'
    });

    timeRequest
        .then((response) => {
            deferred.resolve(response.data);
        }).catch((iErr) => {
            deferred.reject(iErr);
        });

    return deferred.promise;
}

gApp.factory('Server2NTPDelta', ['$rootScope', '$http', '$interval', '$scope', '$q',
    function($rootScope, $http, $interval, $scope, $q) {

        class SERVER2NTP {
            constructor() {
                this.fServerData = null;
                this.startPinging();
            } /* constructor */

            doThePing() {

                clientToServerTimeSync($q, $http).then((iPingSample) => {
                    this.fServerData = iPingSample;
                }).catch(function(err) {
                    console.log(`Server2NTP ERROR: ${err}`);
                });
            } /* doThePing */

            getServerToNTPLatency() {

                return this.fServerData;
            } /* getServerToNTPLatency */

            startPinging() {
                // Set up an interval and cancel it once rootScope is going down

                AngularInstallIntervalFunction(() => {
                    this.doThePing();
                }, kServerNTPDeltaRequestFrequencyMS, $interval, $rootScope);
            } /* startPinging */
        }

        const server2ntp = new SERVER2NTP();

        const myServer2NTPSync = {
            getServerToNTPLatency: () => {
                return server2ntp.getServerToNTPLatency();
            }
        };

        return myServer2NTPSync;

    }
]);
