/* global expect */
/* global angular */
/* global jasmine */


describe('Angular Availability', function () { //describe specifies a "spec" : logical grouping of tests
    it('Angular Available', function () {
        var angularCheck = (typeof (angular) != "undefined");
        expect(angularCheck).toBe(true);
    });
    it('Angular Mock Available', function () {
        var angularMockCheck = (typeof (angular.mock) != "undefined");
        expect(angularMockCheck).toBe(true);
    });
});

describe('Component Availability', function () { //describe specifies a "spec" : logical grouping of tests

    beforeEach(angular.mock.module('timesync'));


    it('SocketNTPSync is Available', function () {
        var instanceOfSocketNTPSyncService;
        angular.mock.inject(function (_SocketNTPSync_) {
            instanceOfSocketNTPSyncService = _SocketNTPSync_;
        });

        expect(instanceOfSocketNTPSyncService).toBeDefined();
    });

    it('TimeSyncController is Available', function () {

        var instanceOfSocketNTPSyncService;
        var controllerService;

        var injectedHTTP;
        var injectedINTERVAL;

        var operatingScope;


        angular.mock.inject(function (_SocketNTPSync_, _$controller_, _$http_, _$interval_, _$rootScope_) {
            instanceOfSocketNTPSyncService = _SocketNTPSync_;
            controllerService = _$controller_;
            injectedHTTP = _$http_;
            injectedINTERVAL = _$interval_;
            operatingScope = _$rootScope_.$new();
        });

        var tsController = controllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedINTERVAL,
            $scope: operatingScope,
            SocketNTPSync: instanceOfSocketNTPSyncService
        });

        expect(tsController).toBeDefined();
        expect(tsController.fTitle).toEqual('UberTimeSync');

    });
});


var MockClockService = {
    Now: function () {

        var clientNow = new Date();
        return clientNow.getTime();
    }
};

var FrozenClockService = {
    Now: function () {

        var frozenTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');
        return frozenTime.getTime();
    }
};

var CustomFrozenClockService = function () {
    this.fCustomFrozenTime = 0;
    var CFCS = this;
    this.Now = function () {
        return CFCS.fCustomFrozenTime;
    };

};

describe('TimeSyncController Empty Server Communication', function () {
    //This tests local time synchronization, the server, when synchronized, does not throw an error, but does not return //anything else either.

    beforeEach(angular.mock.module('timesync'));

    var injectedControllerService;
    var localScope;
    var injectedIntervalService;
    var injectedHTTP;
    var SocketNTPSync;
    var injectedHTTPBackend;
    var injectedRootScope;


    beforeEach(angular.mock.inject(
        function (_$controller_,
            _$rootScope_,
            _$interval_,
            _$http_,
            _$httpBackend_,
            _SocketNTPSync_) {

            injectedControllerService = _$controller_;
            injectedRootScope = _$rootScope_;
            localScope = _$rootScope_.$new();
            injectedIntervalService = _$interval_;
            injectedHTTP = _$http_;
            injectedHTTPBackend = _$httpBackend_;
            SocketNTPSync = _SocketNTPSync_;

        }));

    beforeEach(function () {
        var urlValidator = function (url) {
            return url === '/doSynchronize.json';
        };

        injectedHTTPBackend.expectGET(urlValidator).respond(200);
    });


    afterEach(function () {
        expect(injectedHTTPBackend.flush).not.toThrow(); //Another check
        //This verifies that all calls came through.
        injectedHTTPBackend.verifyNoOutstandingExpectation();
        injectedHTTPBackend.verifyNoOutstandingRequest(); //Extra assert to make sure we flush all backend requests stuff
    });


    it('TimeSyncController Attempts A Sync with Server', function () {

        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: MockClockService
        });

    });

    it('TimeSyncController Local Time Sampling In Order, Frozen Time', function () {

        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        //Client Data is initialized with null
        expect(tsController.fClientData).toBeDefined();
        expect(tsController.fClientData).toBe(null);
        //And Server Data is Empty
        expect(tsController.fServerData).toBeDefined();
        expect(tsController.fServerData).toEqual([]);

        injectedIntervalService.flush(5000);
        //After 5 seconds, the clientData should not be NULL since some local time sampling did occur
        //Since we are using FrozenClockService, the time should stand still.

        var sampleFrozenTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');
        expect(tsController.fClientData).not.toBe(null);
        expect(tsController.fClientData.fSystemTime).toBeDefined();
        expect(tsController.fClientData.fSystemTime).not.toBe(null);
        expect(tsController.fClientData.fSystemTime).toEqual(sampleFrozenTime.getTime());


        //However, since we are not flushing backend here, fServerData is still the same, empty
        expect(tsController.fServerData).toBeDefined();
        expect(tsController.fServerData).toEqual([]);

    });

    it('TimeSyncController Interval Argument Check', function () {

        var $intervalSpy = jasmine.createSpy('$interval', injectedIntervalService);

        expect($intervalSpy).not.toHaveBeenCalled();


        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: $intervalSpy,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        expect($intervalSpy).toHaveBeenCalled();

        //Client Data is initialized with null
        expect(tsController.fClientData).toBeDefined();
        expect(tsController.fClientData).toBe(null);
        //And Server Data is Empty
        expect(tsController.fServerData).toBeDefined();
        expect(tsController.fServerData).toEqual([]);

        //
        var calls = $intervalSpy.calls.all();
        var args0 = calls[0].args;

        //
        var heardBeatDelay = args0[1]; //Second argument is milliseconds delay
        //For interval to fire with at least 30 fps, delay needs to be less
        //than 1000/30

        expect(heardBeatDelay).toEqual(10);

    });

    it('TimeSyncController Interval Count Check', function () {

        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });
        //injectedRootScope.$apply();
        injectedIntervalService.flush(5000);

        //console.log(tsController.fRealTimeSyncCount);
        expect(tsController.fRealTimeSyncCount).toEqual(500);
    });
});

describe('TimeSyncController Initial Server Synchronization', function () {

    beforeEach(angular.mock.module('timesync'));

    var injectedControllerService;
    var localScope;
    var injectedIntervalService;
    var injectedHTTP;
    var SocketNTPSync;
    var injectedHTTPBackend;
    var injectedRootScope;

    var timeSyncController;

    var synchronizeURLValidator = function (url) {
        return url === '/doSynchronize.json';
    };


    beforeEach(angular.mock.inject(
        function (_$controller_,
            _$rootScope_,
            _$interval_,
            _$http_,
            _$httpBackend_,
            _SocketNTPSync_) {

            injectedControllerService = _$controller_;
            injectedRootScope = _$rootScope_;
            localScope = _$rootScope_.$new();
            injectedIntervalService = _$interval_;
            injectedHTTP = _$http_;
            injectedHTTPBackend = _$httpBackend_;
            SocketNTPSync = _SocketNTPSync_;



            timeSyncController = injectedControllerService('TimeSyncController', {
                $http: injectedHTTP,
                $interval: injectedIntervalService,
                $scope: localScope,
                SocketNTPSync: SocketNTPSync,
                LocalClockService: FrozenClockService
            });

        }));

    afterEach(function () {
        //This verifies that all calls came through.
        injectedHTTPBackend.verifyNoOutstandingExpectation();
        injectedHTTPBackend.verifyNoOutstandingRequest(); //Extra assert to make sure we flush all backend requests stuff
    });



    it('Parses The Response if Server Response is OK', function () {

        var sampleServerResponse = {
            "fDeltaData": {
                "fLastServerNTPDelta": 15,
                "fAverageServerNTPDelta": 15.333333333333334,
                "fSampleCount": 3,
                "fServerTimeMS": 1456284825334
            }
        };

        injectedHTTPBackend.expectGET(synchronizeURLValidator).respond(function () {
            return [200, sampleServerResponse];
        });
        // This for simplerResponse code:
        //    injectedHTTPBackend.expectGET(urlValidator).respond(sampleServerResponse);
        expect(injectedHTTPBackend.flush).not.toThrow();
        expect(timeSyncController.fServerData).toBeDefined();
        expect(timeSyncController.fServerData).not.toEqual([]);
        expect(timeSyncController.fServerData.fDeltaData).toBeDefined();
        expect(timeSyncController.fServerData.fDeltaData.fServerTimeMS).toBeDefined();
        expect(timeSyncController.fServerData.fDeltaData.fServerTimeMS).toEqual(1456284825334);
    });

    var codeArray = [300, 400, 404, 451, 501, 502, 500];
    for (i in codeArray) {
        it('Sets Error State If Server Error ' + codeArray[i], function () {
            injectedHTTPBackend.expectGET(synchronizeURLValidator).respond(codeArray[i]);
            expect(injectedHTTPBackend.flush).not.toThrow();
            expect(timeSyncController.fServerData).toBeDefined();
            expect(timeSyncController.fServerData).not.toEqual([]);
            expect(timeSyncController.fServerData).toEqual("Server Communication Error");
            expect(timeSyncController.fServerErrorResponse).toBeDefined();
            expect(timeSyncController.fServerErrorResponse.status).toBeDefined();
            expect(timeSyncController.fServerErrorResponse.status).toEqual(codeArray[i]);
        });

    }

    it('Time Calculations Are Correct For Zero Latency', function () {


        //This is NTP time, considered the True Time. At start, it's unknown at the client nor server.
        var ntpTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');

        //This is Server time, At start, it's unknown at the client, but known at server.
        //In our example, let our server time be ahead of True Time by 1 minute.
        var serverTime = new angular.mock.TzDate(0, '2015-07-01T00:01:00.000Z');

        //This is Client time. Known at client
        //In our example, let our client time be ahead of True Time by 3 minutes.
        var clientTime = new angular.mock.TzDate(0, '2015-07-01T00:03:00.000Z');

        var ntpTimeMS = ntpTime.getTime();

        var serverTimeMS = serverTime.getTime();

        var clientTimeMS = clientTime.getTime();


        //If the server runs correctly, it's going to calculate delta between serverTime and ntpTime.
        var mockServerNTPDelta = serverTimeMS - ntpTimeMS;

        var sampleServerResponse = {
            "fDeltaData": {
                "fLastServerNTPDelta": mockServerNTPDelta,
                "fAverageServerNTPDelta": mockServerNTPDelta,
                "fSampleCount": 1,
                "fServerTimeMS": serverTimeMS
            }
            //fServerTimeMS is not really needed, since SocketNTPSync will do its own calculations.
        };

        injectedHTTPBackend.whenGET(synchronizeURLValidator).respond(function () {
            return [200, sampleServerResponse];
        });


        //Go time:
        var cfcs = new CustomFrozenClockService();

        cfcs.fCustomFrozenTime = clientTimeMS;

        var thisTimeSyncController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: cfcs
        });

        //During the intervals, client should synchronize with a server and calculate the delta between
        //clientTime and serverTime.

        //Since the mock of SocketNTP service is not implemented yet, the controller code right now just uses the
        //hardcoded delta of clientTime - serverTime = 120000 ms (2 minutes)

        injectedIntervalService.flush(5000);

        expect(injectedHTTPBackend.flush).not.toThrow();

        //For no-latency case, the TrueNowTimeMS, using clientTime,
        // should now be able to calculate NTP Time, unknown at first, but calculatable via all the deltas.

        var calculatedTrueTimeMS = thisTimeSyncController.TrueNowTimeMS();

        expect(calculatedTrueTimeMS).toEqual(ntpTimeMS);

    });

});
