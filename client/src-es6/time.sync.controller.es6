/* global gApp */
gApp.controller("TimeSyncController", ['$http', '$interval', '$scope', 'SocketNTPSync', 'LocalClockService',
    function($http, $interval, $scope, SocketNTPSync, iClockService) {

        //  injection: we need an $http service!
        var TC = this; // Extra variable so we can refer to store from the callback.

        TC.fServerData = []; // We need to initialize before request so page has something to show while loading.
        TC.fTitle = "UberTimeSync";
        TC.fStringData = "No Data";
        TC.fClientData = null;
        TC.fRealTimeSyncCount = 0;

        var clientToServerTimeSync = function() {
            var timeRequest = $http({
                method: 'GET',
                url: '/doSynchronize.json'
            });
            //  Using Angular $http service to make async request to the server.

            //  Other way would be:
            //  var gemsPromise = $http.get('/products.json', {apiKey: 'myApiKey'});

            //  BOTH return a promise object

            //  Since we told $http to fetch JSON, the result will be automatically decoded into
            //  Javascript objects and arrays

            timeRequest
                .then(function(response) {
                    TC.fServerData = response.data;
                    TC.fClientData = {
                        fSystemTime: null,
                        fAdjustedSystemTime: null
                    };
                    TC.fStringData = JSON.stringify(TC.fServerData);
                }).catch(function(response) {
                    TC.fServerData = "Server Communication Error";
                    TC.fServerErrorResponse = response;
                });
        };

        // Using $interval: https://docs.angularjs.org/api/ng/service/$interval

        var realtimeTimeSync = function() {
            var clientNow = iClockService.Now();

            TC.fClientData = {
                fSystemTime: clientNow,
                fMostPreciseTime: clientNow
            };

            TC.fSocketNTPData = SocketNTPSync.getOffsetAndLatency();
            if (TC.fSocketNTPData === null) {
                TC.fSocketNTPData = {
                    fAverageOffset: "No Data Yet",
                    fAverageLatency: "No Data Yet",
                    fNumberOfSamples: 0
                };
            }

            TC.fRealTimeSyncCount += 1.0;
        };

        clientToServerTimeSync();

        var intervalHandler;

        intervalHandler = $interval(realtimeTimeSync, 10);

        $scope.stopSync = function() {
            if (angular.isDefined(intervalHandler)) {
                $interval.cancel(intervalHandler);
                intervalHandler = undefined;
            }
        };

        $scope.$on('$destroy', function() {
            // Make sure that the interval is destroyed too
            $scope.stopSync();
        });

        this.TrueNowTimeMS = function() {
            var clientNow = iClockService.Now();

            var clientToServerDelta = 0;
            var serverToNTPDelta = 0;

            if (TC.fSocketNTPData !== null) {
                clientToServerDelta = TC.fSocketNTPData.fAverageOffset;
            }

            if (TC.fServerData !== null) {
                serverToNTPDelta = TC.fServerData.fDeltaData.fAverageServerNTPDelta;
            }

            var calculatedNowTime = clientNow - clientToServerDelta - serverToNTPDelta;

            return calculatedNowTime;
        };

    }
]);
