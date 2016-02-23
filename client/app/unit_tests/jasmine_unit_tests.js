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

describe('TimeSyncController', function () { //describe specifies a "spec" : logical grouping of tests

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

    afterEach(function () {

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

        var urlValidator = function (url) {
            //dump(url);
            return url === '/doSynchronize.json';

        };

        $httpBackend.expectGET(urlValidator).respond(200);

        expect($httpBackend.flush).not.toThrow(); //Another check

    });

    it('TimeSyncController Local Time Sampling In Order, Frozen Time', function () {

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $interval,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });


        var urlValidator = function (url) {
            return url === '/doSynchronize.json';
        };

        $httpBackend.expectGET(urlValidator).respond(200);

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


        expect($httpBackend.flush).not.toThrow(); //Another check

    });


    // it('Controller is there', function() {
    //
    //     //var $intervalSpy = jasmine.createSpy('$interval', $interval);
    //
    //     var tsController = $controller('TimeSyncController', {
    //         $http: $http,
    //         $interval: $interval,
    //         $scope: $scope,
    //         SocketNTPSync: SocketNTPSync
    //     });
    //
    //     expect(tsController.fTitle).toEqual('UberTimeSync');
    //
    // }); // it specifies a single test within a spec
    //
    // it('Controller establishes heartbeat at > 30 fps', function() {
    //
    //     //This references stuff in http://www.bradoncode.com/blog/2015/06/15/unit-testing-interval-angularls/
    //
    //     var $intervalSpy = jasmine.createSpy('$interval', $interval);
    //
    //     var tsController = $controller('TimeSyncController', {
    //         $http: $http,
    //         $interval: $intervalSpy,
    //         $scope: $scope,
    //         SocketNTPSync: SocketNTPSync
    //     });
    //
    //     expect(tsController.fTitle).toEqual('UberTimeSync');
    //
    //     expect($intervalSpy).toHaveBeenCalled();
    //
    //     var calls = $intervalSpy.calls.all();
    //     var args0 = calls[0].args;
    //
    //     var heartbeatAtLeast30fps = args0[1] < 1000.0 / 30.0; //Second argument is milliseconds delay
    //     //For interval to fire with at least 30 fps, delay needs to be less
    //     //than 1000/30
    //
    //     expect(heartbeatAtLeast30fps).toBe(true);
    //
    // });


    //Other matchers (trutherizers)

    // expect(true).toBe(true);
    // expect(false).not.toBe(true);
    // expect(1).toEqual(1);
    // expect('foo').toEqual('foo');
    // expect('foo').not.toEqual('bar');

});
