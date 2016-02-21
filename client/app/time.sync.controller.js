gApp.controller("TimeSyncController", ['$http', '$interval', '$scope', 'SocketNTPSync',
    function($http, $interval, $scope, SocketNTPSync) {

        //Dependency injection: we need an $http service!
        var TC = this; //Extra variable so we can refer to store from the callback.

        TC.fServerData = []; //We need to initialize before request so page has something to show while loading.
        TC.fTitle = "UberTimeSync";
        TC.fStringData = "No Data";

        var clientToServerTimeSync = function() {

            var timeRequest = $http({
                method: 'GET',
                url: '/doSynchronize.json'
            });
            //Using Angular $http service to make async request to the server.

            //Other way would be:
            //var gemsPromise = $http.get('/products.json', {apiKey: 'myApiKey'});

            //BOTH return a promise object

            //Since we told $http to fetch JSON, the result will be automatically decoded into
            //Javascript objects and arrays

            timeRequest.then(function(response) {
                    TC.fServerData = response.data;
                    TC.fClientData = {
                        fSystemTime: null,
                        fAdjustedSystemTime: null,
                    };
                    TC.fStringData = JSON.stringify(TC.fServerData);
                },
                function(response) {
                    // var data = response.data,
                    //     status = response.status,
                    //     header = response.header,
                    //     config = response.config;
                    // error handler
                    alert("JSON Fetch Error!");
                });

        };

        //Using $interval: https://docs.angularjs.org/api/ng/service/$interval


        var realtimeTimeSync = function() {

            var clientNow = new Date();
            TC.fClientData = {
                fSystemTime: clientNow.getTime(),
                fMostPreciseTime: clientNow.getTime()
            };


            TC.fSocketNTPData = SocketNTPSync.GetOffsetAndLatency();
            if (TC.fSocketNTPData === null) {
                TC.fSocketNTPData = {
                    fAverageOffset: "No Data Yet",
                    fAverageLatency: "No Data Yet",
                    fNumberOfSamples: 0
                };
            }

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







    }
]);
