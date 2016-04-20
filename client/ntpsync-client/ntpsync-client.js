(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * _AngularInstallIntervalFunction() Attaches An Interval to fire every time each iIntervalTimeMS,
 * and makes sure it's destroyed when the scope goes down
 * @param {function}    iFunction: A function to run
 * @param {Number}      iIntervalTimeMS: Number of milliseconds between function runs
 * @param {Service}     iIntervalService: An Interval Service. Most probably $interval
 * (https://docs.angularjs.org/api/ng/service/$interval) or could be some other wrapper of window.setInterval
 * @param {Service}     iScope: a $scope or $rootScope service, something we can attach to so we can properly uninstall
 * the interval when the containers go down. https://docs.angularjs.org/api/ng/service/$rootScope
 */
function _AngularInstallIntervalFunction(iFunction, iIntervalTimeMS, iIntervalService, iScope) {

    var intervalHandler = iIntervalService(function () {
        iFunction();
    }, iIntervalTimeMS);

    iScope.stopSync = function () {
        if (angular.isDefined(intervalHandler)) {
            iIntervalService.cancel(intervalHandler);
            intervalHandler = undefined;
        }
    };

    iScope.$on('$destroy', function () {
        iScope.stopSync();
    });
}
var AngularInstallIntervalFunction = exports.AngularInstallIntervalFunction = _AngularInstallIntervalFunction;
},{}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global gApp */

(function () {

    var kDefaultNTPPingTimeoutLatencyMS = 100; // Timeout value for calculating Client <-> Server NTP delta
    var kNTPPingIntervalMS = 10000; // How often we request server for to calculate Client <-> Server NTP delta

    /**
     * Creates the promise that resolves with an {offset, latency} object after a successful server ping
     * @param {Socket} iSocket: a socket.io socket that's used to connect to https://www.npmjs.com/package/socket-ntp
     * running on server side.
     * @param {Service} iAsyncService: Deferred Instance Promise Provider
     * (e.g. $q in Angular https://docs.angularjs.org/api/ng/service/$q )
     * @param {Service} iTimeoutService: Timeout Instance Promise Provider
     * (e.g. $timeout in Angular https://docs.angularjs.org/api/ng/service/$timeout )
     * @return {Promise} Promise that either resolves with successful {offset, latency} object or a server communication
     * error
     */
    function getSocketPingPromiseService(iSocket, iAsyncService, iTimeoutService) {

        var timedNTPPingPromise = function timedNTPPingPromise(iSocket, iAsyncService, iLocalClockService, iTimeoutService, iTimeoutMS) {
            var deferred = iAsyncService.defer();

            iSocket.emit('ntp:client_sync', {
                t0: iLocalClockService.Now()
            });

            iSocket.on('ntp:server_sync', function (iReturnedServerData) {
                var nowTime = iLocalClockService.Now();
                var latency = nowTime - iReturnedServerData.t0;

                var pingSample = {
                    localClockNow: nowTime,
                    ntpRaw: iReturnedServerData.t1,
                    ntpLatency: latency
                };

                deferred.resolve(pingSample);
            });

            iTimeoutService.setTimeout(function () {
                deferred.reject('Timeout ' + iTimeoutMS + ' ms elapsed');
            }, iTimeoutMS);

            return deferred.promise;
        };

        return {
            ntpDatePromise: function ntpDatePromise(iNTPSingleRequestConfig) {
                var customClockService = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fLocalClockService;

                var kDefaultLocalClockService = {
                    Now: function Now() {
                        return Date.now();
                    }
                };

                var clockService = customClockService || kDefaultLocalClockService;

                var customTimeoutService = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fTimeoutService;
                var kDefaultTimeoutService = {
                    setTimeout: iTimeoutService
                };
                var timeoutService = customTimeoutService || kDefaultTimeoutService;

                var customTimeoutLatencyMS = iNTPSingleRequestConfig && iNTPSingleRequestConfig.fTimeoutLatencyMS;

                var timeoutLatency = customTimeoutLatencyMS || kDefaultNTPPingTimeoutLatencyMS;

                var ourNTPDatePromise = new Promise(function (iResolveFunc, iRejectFunc) {
                    timedNTPPingPromise(iSocket, iAsyncService, clockService, timeoutService, timeoutLatency).then(function (iData) {
                        // console.log(JSON.stringify(iData));
                        iResolveFunc(iData);
                    }).catch(function (iError) {
                        iRejectFunc(iError);
                    });
                });

                return ourNTPDatePromise;
            }
        };
    }

    // 'BtfordSocket' is the socket produced by https://github.com/btford/angular-socket-io
    // ("bower_components/angular-socket-io/socket.min.js" dependency)
    // windowIOSocket is the socket produced by window.io.connect
    // ("bower_components/socket.io/socket.io.js" dependency)

    gApp.factory('SocketNTPSync', ['BtfordSocket', '$rootScope', '$interval', '$q', '$timeout', function (mySocket, $rootScope, $interval, $q, iTimeoutService) {

        var socket = mySocket;

        if ((typeof socket === 'undefined' ? 'undefined' : _typeof(socket)) !== "object") {
            throw new Error("Bad Object Passed In");
        }

        if (typeof socket.on !== "function") {
            throw new Error("Bad Object Passed In");
        }

        if (typeof socket.emit !== "function") {
            throw new Error("Bad Object Passed In");
        }

        // NTP protocol is based on ntp.js in https://github.com/calvinfo/socket-ntp
        // Requires https://www.npmjs.com/package/socket-ntp to be installed and running on the server side

        // const kMaxSampleCount = 20;

        var socketPingPromise = getSocketPingPromiseService(socket, $q, iTimeoutService).ntpDatePromise;

        var NTP = function () {
            function NTP() {
                _classCallCheck(this, NTP);

                this.fPingSample = null;
                this.startPinging();
            } /* constructor */

            _createClass(NTP, [{
                key: 'doThePing',
                value: function doThePing() {
                    var _this = this;

                    socketPingPromise(socket, $q).then(function (iPingSample) {
                        _this.fPingSample = iPingSample;
                    }).catch(function (err) {
                        console.log('ERROR: ' + err);
                    });
                } /* doThePing */

            }, {
                key: 'getOffsetLatency',
                value: function getOffsetLatency() {

                    if (this.fPingSample === null) {
                        return null;
                    }

                    var ntpTimestampApproximation = this.fPingSample.ntpRaw + this.fPingSample.ntpLatency * 0.5;
                    var clockOffsetMS = this.fPingSample.localClockNow - ntpTimestampApproximation;
                    var ntpPingLatencyMS = this.fPingSample.ntpLatency;
                    return {
                        fAverageOffset: clockOffsetMS,
                        fAverageLatency: ntpPingLatencyMS,
                        fNumberOfSamples: 1
                    };
                } /* getOffsetLatency */

            }, {
                key: 'startPinging',
                value: function startPinging() {
                    var _this2 = this;

                    // Set up an interval and cancel it once rootScope is going down

                    iTimeoutService(function () {
                        _this2.doThePing();
                    }, 100);

                    // Send the ping every kSampleDelayMS ms
                    var intervalHandler = $interval(function () {
                        _this2.doThePing();
                    }, kNTPPingIntervalMS);

                    $rootScope.stopNTPPings = function () {
                        if (angular.isDefined(intervalHandler)) {
                            $interval.cancel(intervalHandler);
                            intervalHandler = undefined;
                        }
                    };

                    $rootScope.$on('$destroy', function () {
                        // Make sure that the interval is destroyed too
                        $rootScope.stopNTPPings();
                    });
                } /* startPinging */

            }]);

            return NTP;
        }();

        var ntp = new NTP();

        var myNTPSync = {
            getOffsetAndLatency: function getOffsetAndLatency() {
                return ntp.getOffsetLatency();
            },
            DebugSocket: function DebugSocket() {
                return socket;
            }
        };

        return myNTPSync;
    }]);
})();
},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global gApp */


var _angularCommon = require('./angular-common');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {

    var kServerNTPDeltaRequestFrequencyMS = 15000; // How often we request server for its Server <-> NTP delta
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

        var deferred = iAsyncService.defer();

        var timeRequest = iHTTPService({
            method: 'GET',
            url: '/getNTPSyncData'
        });

        timeRequest.then(function (response) {
            deferred.resolve(response.data);
        }).catch(function (iErr) {
            deferred.reject(iErr);
        });

        return deferred.promise;
    }

    gApp.factory('Server2NTPDelta', ['$rootScope', '$http', '$interval', '$q', function ($rootScope, $http, $interval, $q) {
        var SERVER2NTP = function () {
            function SERVER2NTP() {
                _classCallCheck(this, SERVER2NTP);

                this.fServerData = null;
                this.startPinging();
            } /* constructor */

            _createClass(SERVER2NTP, [{
                key: 'doThePing',
                value: function doThePing() {
                    var _this = this;

                    clientToServerTimeSync($q, $http).then(function (iPingSample) {
                        _this.fServerData = iPingSample;
                    }).catch(function (err) {
                        console.log('Server2NTP ERROR: ' + err);
                    });
                } /* doThePing */

            }, {
                key: 'getServerToNTPLatency',
                value: function getServerToNTPLatency() {

                    return this.fServerData;
                } /* getServerToNTPLatency */

            }, {
                key: 'startPinging',
                value: function startPinging() {
                    var _this2 = this;

                    // Set up an interval and cancel it once rootScope is going down
                    this.doThePing();
                    (0, _angularCommon.AngularInstallIntervalFunction)(function () {
                        _this2.doThePing();
                    }, kServerNTPDeltaRequestFrequencyMS, $interval, $rootScope);
                } /* startPinging */

            }]);

            return SERVER2NTP;
        }();

        var server2ntp = new SERVER2NTP();

        var myServer2NTPSync = {
            getServerToNTPLatency: function getServerToNTPLatency() {
                return server2ntp.getServerToNTPLatency();
            }
        };

        return myServer2NTPSync;
    }]);
})();
},{"./angular-common":1}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global gApp */
(function () {
    var TrueTimeCalculator = function () {
        function TrueTimeCalculator(iHTTPService, iSocketNTPSyncService, iServer2NTPDeltaService, iClockService) {
            _classCallCheck(this, TrueTimeCalculator);

            this.fHTTPService = iHTTPService;
            this.fClockService = iClockService;
            this.fSocketNTPSyncService = iSocketNTPSyncService;
            this.fServer2NTPDeltaService = iServer2NTPDeltaService;
        }

        _createClass(TrueTimeCalculator, [{
            key: 'TrueNowTimeMS',
            value: function TrueNowTimeMS() {
                var clientNow = this.fClockService.Now();

                var clientToServerDelta = 0;
                var serverToNTPDelta = 0;

                var clientServerNTPDeltaData = this.fSocketNTPSyncService.getOffsetAndLatency();
                var serverToNTPDeltaData = this.fServer2NTPDeltaService.getServerToNTPLatency();

                if (clientServerNTPDeltaData !== null) {
                    clientToServerDelta = clientServerNTPDeltaData.fAverageOffset;
                }

                if (serverToNTPDeltaData !== null) {
                    serverToNTPDelta = serverToNTPDeltaData.fDeltaData.fServerNTPDelta;
                }

                var calculatedNowTime = clientNow - clientToServerDelta - serverToNTPDelta;

                return calculatedNowTime;
            }
        }]);

        return TrueTimeCalculator;
    }();

    gApp.factory('TrueTimeService', ['$http', 'SocketNTPSync', 'Server2NTPDelta', 'LocalClockService', function ($http, SocketNTPSync, Server2NTPDelta, iClockService) {

        var trueTimeCalculator = new TrueTimeCalculator($http, SocketNTPSync, Server2NTPDelta, iClockService);

        return {
            TrueNowTimeMS: function TrueNowTimeMS() {
                return trueTimeCalculator.TrueNowTimeMS();
            }
        };
    }]);
})();
},{}]},{},[1,2,3,4]);
