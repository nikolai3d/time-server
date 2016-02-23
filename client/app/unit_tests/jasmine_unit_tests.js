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

describe('TimeSyncController Empty Server Communication', function () {
    //This tests local time synchronization, the server, when synchronized, does not throw an error, but does not return //anything else either.

    beforeEach(angular.mock.module('timesync'));

    var $controller;
    var $scope;
    var $interval;
    var $http;
    var SocketNTPSync;
    var $httpBackend;
    var injectedRootScope;


    beforeEach(angular.mock.inject(function (_$controller_, _$rootScope_, _$interval_, _$http_, _$httpBackend_, _SocketNTPSync_) {
        $controller = _$controller_;
        injectedRootScope = _$rootScope_;
        $scope = _$rootScope_.$new();
        $interval = _$interval_;
        $http = _$http_;
        $httpBackend = _$httpBackend_;
        SocketNTPSync = _SocketNTPSync_;
    }));

    beforeEach(function () {
        var urlValidator = function (url) {
            return url === '/doSynchronize.json';
        };

        $httpBackend.expectGET(urlValidator).respond(200);
    })


    afterEach(function () {
        expect($httpBackend.flush).not.toThrow(); //Another check
        //This verifies that all calls came through.
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest(); //Extra assert to make sure we flush all backend requests stuff
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

    it('TimeSyncController Attempts A Sync with Server', function () {

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $interval,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: MockClockService
        });

    });

    it('TimeSyncController Local Time Sampling In Order, Frozen Time', function () {

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $interval,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        //Client Data is initialized with null
        expect(tsController.fClientData).toBeDefined();
        expect(tsController.fClientData).toBe(null);
        //And Server Data is Empty
        expect(tsController.fServerData).toBeDefined();
        expect(tsController.fServerData).toEqual([]);

        $interval.flush(5000);
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

        var $intervalSpy = jasmine.createSpy('$interval', $interval);

        expect($intervalSpy).not.toHaveBeenCalled();


        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $intervalSpy,
            $scope: $scope,
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
        var heardBeatDelay = args0[1] ; //Second argument is milliseconds delay
        //For interval to fire with at least 30 fps, delay needs to be less
        //than 1000/30

        expect(heardBeatDelay).toEqual(10);

    });

    it('TimeSyncController Interval Count Check', function () {

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $interval,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });
        //injectedRootScope.$apply();
        $interval.flush(5000);

        console.log(tsController.fRealTimeSyncCount);
        expect(tsController.fRealTimeSyncCount).toEqual(500);
    });
});

describe('TimeSyncController Initial Server Synchronization', function () {
var sampleServerResponse= {"fDeltaData":{"fLastServerNTPDelta":1369,"fAverageServerNTPDelta":1362.0383631713555,"fSampleCount":782,"fServerTime":"Tue, 23 Feb 2016 05:39:10 GMT","fServerTimeMS":1456205950959,"fAdjustedServerTime":"Tue, 23 Feb 2016 05:39:09 GMT"}};


});
