describe('Angular Availability', function() { // describe specifies a "spec" : logical grouping of tests
    it('Angular Available', function() {
        var angularCheck = ((typeof angular) !== "undefined");
        expect(angularCheck).toBe(true);
    });
    it('Angular Mock Available', function() {
        var angularMockCheck = (typeof angular.mock !== "undefined");
        expect(angularMockCheck).toBe(true);
    });
});

describe('Component Availability', function() { // describe specifies a "spec" : logical grouping of tests

    beforeEach(angular.mock.module('timesync'));

    it('SocketNTPSync is Available', function() {
        var instanceOfSocketNTPSyncService;
        angular.mock.inject(function(_SocketNTPSync_) {
            instanceOfSocketNTPSyncService = _SocketNTPSync_;
        });

        expect(instanceOfSocketNTPSyncService).toBeDefined();
    });

    it('TimeSyncController is Available', function() {

        var instanceOfSocketNTPSyncService;
        var controllerService;

        var injectedHTTP;
        var injectedINTERVAL;

        var operatingScope;

        angular.mock.inject(function(_SocketNTPSync_, _$controller_, _$http_, _$interval_,
            _$rootScope_) {
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
        expect(tsController.fTC).toBeDefined();
        expect(tsController.fTC.fTitle).toEqual('UberTimeSync');

    });
});

var MockClockService = {
    Now: function() {

        var clientNow = new Date();
        return clientNow.getTime();
    }
};

var FrozenClockService = {
    Now: function() {

        var frozenTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');
        return frozenTime.getTime();
    }
};

var CustomFrozenClockService = function() {
    this.fCustomFrozenTime = 0;
    var CFCS = this;
    this.Now = function() {
        return CFCS.fCustomFrozenTime;
    };

};

const kGetNTPSyncDataURL = '/getNTPSyncData';

describe('TimeSyncController Empty Server Communication', function() {
    // This tests local time synchronization, the server, when synchronized, does not throw an error,
    // but does not return anything else either.

    beforeEach(angular.mock.module('timesync'));

    var injectedControllerService;
    var localScope;
    var injectedIntervalService;
    var injectedHTTP;
    var SocketNTPSync;
    var injectedHTTPBackend;
    // var injectedRootScope;

    beforeEach(angular.mock.inject(
        function(_$controller_,
            _$rootScope_,
            _$interval_,
            _$http_,
            _$httpBackend_,
            _SocketNTPSync_) {

            injectedControllerService = _$controller_;
            //            injectedRootScope = _$rootScope_;
            localScope = _$rootScope_.$new();
            injectedIntervalService = _$interval_;
            injectedHTTP = _$http_;
            injectedHTTPBackend = _$httpBackend_;
            SocketNTPSync = _SocketNTPSync_;

        }));

    beforeEach(function() {
        var urlValidator = function(url) {
            return url === kGetNTPSyncDataURL;
        };

        injectedHTTPBackend.expectGET(urlValidator).respond(200);
    });

    afterEach(function() {
        expect(injectedHTTPBackend.flush).not.toThrow(); // Another check
        // This verifies that all calls came through.
        injectedHTTPBackend.verifyNoOutstandingExpectation();
        // Extra assert to make sure we flush all backend requests stuff
        injectedHTTPBackend.verifyNoOutstandingRequest();

    });

    it('TimeSyncController Attempts A Sync with Server', function() {

        /* var tsController = */
        injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: MockClockService
        });

    });

    it('TimeSyncController Local Time Sampling In Order, Frozen Time', function() {

        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        // Client Data is initialized with null
        expect(tsController.fTC.fClientData).toBeDefined();
        expect(tsController.fTC.fClientData).toBe(null);
        // And Server Data is Empty
        expect(tsController.fTC.fServerData).toBeDefined();
        expect(tsController.fTC.fServerData).toEqual(null);

        injectedIntervalService.flush(5000);
        // After 5 seconds, the clientData should not be NULL since some local time sampling did occur
        // Since we are using FrozenClockService, the time should stand still.

        var sampleFrozenTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');
        expect(tsController.fTC.fClientData).not.toBe(null);
        expect(tsController.fTC.fClientData.fSystemTime).toBeDefined();
        expect(tsController.fTC.fClientData.fSystemTime).not.toBe(null);
        expect(tsController.fTC.fClientData.fSystemTime).toEqual(sampleFrozenTime.getTime());

        // However, since we are not flushing backend here, fServerData is still the same, empty
        expect(tsController.fTC.fServerData).toBeDefined();
        expect(tsController.fTC.fServerData).toEqual(null);

    });

    it('TimeSyncController Interval Argument Check', function() {

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

        // Client Data is initialized with null
        expect(tsController.fTC.fClientData).toBeDefined();
        expect(tsController.fTC.fClientData).toBe(null);
        // And Server Data is Empty
        expect(tsController.fTC.fServerData).toBeDefined();
        expect(tsController.fTC.fServerData).toEqual(null);

        //
        var calls = $intervalSpy.calls.all();
        var args0 = calls[0].args;

        //
        var heardBeatDelay = args0[1]; // Second argument is milliseconds delay
        // For interval to fire with at least 30 fps, delay needs to be less
        // than 1000/30

        expect(heardBeatDelay).toEqual(10);

    });

    it('TimeSyncController Interval Count Check', function() {

        var tsController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });
        // injectedRootScope.$apply();
        injectedIntervalService.flush(5000);

        // console.log(tsController.fRealTimeSyncCount);
        expect(tsController.fTC.fRealTimeSyncCount).toEqual(500);
    });
});

describe('TimeSyncController Initial Server Synchronization', function() {

    beforeEach(angular.mock.module('timesync'));

    var injectedControllerService;
    var localScope;
    var injectedIntervalService;
    var injectedHTTP;
    var SocketNTPSync;
    var injectedHTTPBackend;
    //    var injectedRootScope;

    var synchronizeURLValidator = function(url) {
        return url === kGetNTPSyncDataURL;
    };

    beforeEach(angular.mock.inject(
        function(_$controller_,
            _$rootScope_,
            _$interval_,
            _$http_,
            _$httpBackend_,
            _SocketNTPSync_) {

            injectedControllerService = _$controller_;
            // injectedRootScope = _$rootScope_;
            localScope = _$rootScope_.$new();
            injectedIntervalService = _$interval_;
            injectedHTTP = _$http_;
            injectedHTTPBackend = _$httpBackend_;
            SocketNTPSync = _SocketNTPSync_;
        }));

    afterEach(function() {
        // This verifies that all calls came through.
        injectedHTTPBackend.verifyNoOutstandingExpectation();
        // Extra assert to make sure we flush all backend requests
        injectedHTTPBackend.verifyNoOutstandingRequest();

    });

    it('Parses The Response if Server Response is OK', function() {

        var timeSyncController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        var sampleServerResponse = {
            "fDeltaData": {
                "fServerNTPDelta": 60000,
                "fServerNTPLatency": 20,
                "fSampleCount": 3
            }
        };

        injectedHTTPBackend.expectGET(synchronizeURLValidator).respond(function() {
            return [200, sampleServerResponse];
        });
        // This for simplerResponse code:
        //    injectedHTTPBackend.expectGET(urlValidator).respond(sampleServerResponse);
        expect(injectedHTTPBackend.flush).not.toThrow();
        expect(timeSyncController.fTC.fServerData).toBeDefined();
        expect(timeSyncController.fTC.fServerData).not.toEqual(null);
        expect(timeSyncController.fTC.fServerData.fDeltaData).toBeDefined();
        expect(timeSyncController.fTC.fServerData.fDeltaData.fServerNTPDelta).toBeDefined();
        expect(timeSyncController.fTC.fServerData.fDeltaData.fServerNTPDelta).toEqual(
            60000);
        expect(timeSyncController.fTC.fServerData.fDeltaData.fServerNTPLatency).toBeDefined();
        expect(timeSyncController.fTC.fServerData.fDeltaData.fServerNTPLatency).toEqual(
            20);
    });

    // var codeArray = [300, 400, 404, 451, 501, 502, 500];
    it('Sets Error State If Server Error ' + 501, function() {

        var timeSyncController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: FrozenClockService
        });

        injectedHTTPBackend.expectGET(synchronizeURLValidator).respond(501);
        expect(injectedHTTPBackend.flush).not.toThrow();
        expect(timeSyncController.fTC.fLastServerErrorResponse).toBeDefined();
        expect(timeSyncController.fTC.fLastServerErrorResponse.status).toBeDefined();
        expect(timeSyncController.fTC.fLastServerErrorResponse.status).toEqual(501);
    });

});

describe('Send/Receive NTP Sockets, Timing Calculation Checks', function() {

    beforeEach(angular.mock.module('timesync'));

    var injectedControllerService;
    var localScope;
    var injectedIntervalService;
    var injectedHTTP;
    var SocketNTPSync;
    var injectedHTTPBackend;
    var injectedRootScope;

    var synchronizeURLValidator = function(url) {
        return url === kGetNTPSyncDataURL;
    };
    var $q;
    var $timeout;

    var ntpTimeMS;
    var serverTimeMS;
    var clientTimeMS;
    var usedSocket;
    var thisTimeSyncController;

    beforeEach(angular.mock.inject(
        function(_$controller_,
            _$rootScope_,
            _$interval_,
            _$http_,
            _$httpBackend_,
            _SocketNTPSync_,
            _$q_,
            _$timeout_) {

            injectedControllerService = _$controller_;
            injectedRootScope = _$rootScope_;
            localScope = _$rootScope_.$new();
            injectedIntervalService = _$interval_;
            injectedHTTP = _$http_;
            injectedHTTPBackend = _$httpBackend_;
            SocketNTPSync = _SocketNTPSync_;
            $q = _$q_;
            $timeout = _$timeout_;
        }));

    beforeEach(function() {
        // This is NTP time, considered the True Time. At start, it's unknown at the client nor server.
        var ntpTime = new angular.mock.TzDate(0, '2015-07-01T00:00:00.000Z');

        // This is Server time, At start, it's unknown at the client, but known at server.
        // In our example, let our server time be ahead of True Time by 1 minute.
        var serverTime = new angular.mock.TzDate(0, '2015-07-01T00:01:00.000Z');

        // This is Client time. Known at client
        // In our example, let our client time be ahead of True Time by 3 minutes.
        var clientTime = new angular.mock.TzDate(0, '2015-07-01T00:03:00.000Z');

        ntpTimeMS = ntpTime.getTime();

        serverTimeMS = serverTime.getTime();

        clientTimeMS = clientTime.getTime();

        var mockServerNTPDelta = serverTimeMS - ntpTimeMS;

        var sampleServerResponse = {
            "fDeltaData": {
                "fServerNTPDelta": mockServerNTPDelta,
                "fServerNTPLatency": 20,
                "fSampleCount": 3
            }
        };

        injectedHTTPBackend.whenGET(synchronizeURLValidator).respond(function() {
            return [200, sampleServerResponse];
        });

        var cfcs = new CustomFrozenClockService();

        cfcs.fCustomFrozenTime = clientTimeMS;

        thisTimeSyncController = injectedControllerService('TimeSyncController', {
            $http: injectedHTTP,
            $interval: injectedIntervalService,
            $scope: localScope,
            SocketNTPSync: SocketNTPSync,
            LocalClockService: cfcs
        });

        usedSocket = SocketNTPSync.DebugSocket();
        expect(usedSocket).toBeDefined();
        expect(SocketNTPSync.getOffsetAndLatency()).toEqual(null);
    });

    afterEach(function() {

        // After each test, for no-latency case, the TrueNowTimeMS, using clientTime,
        // should be able to precisely calculate NTP Time

        var calculatedTrueTimeMS = thisTimeSyncController.TrueNowTimeMS();

        expect(calculatedTrueTimeMS).toEqual(ntpTimeMS);

        injectedHTTPBackend.verifyNoOutstandingExpectation();
        injectedHTTPBackend.verifyNoOutstandingRequest(); // Extra assert to make sure we flush all backend requests

    });

    // it(
    //     'Forces NTP Socket without listening to its Emit, and correctly calculates time for Zero Latency Case',
    //     function() {
    //         var mockT0 = clientTimeMS;
    //         var mockT1 = serverTimeMS;
    //
    //         injectedIntervalService.flush(1500);
    //
    //         usedSocket.receive('ntp:server_sync', {
    //             t0: mockT0,
    //             t1: mockT1
    //         });
    //
    //         injectedIntervalService.flush(10); // This flush makes sure heartbeat runs, and the
    //         // SocketNTPSync.getOffsetAndLatency(); is called by the controller,
    //         // thus filling the TC.fSocketNTPData, needed for calculation.
    //
    //         expect(injectedHTTPBackend.flush).not.toThrow();
    //
    //         injectedRootScope.$apply(); // Turn the crank
    //     });
    //
    // it('Emits/Receives NTP Socket and Correctly Calculates Time for Zero Latency case', function() {
    //
    //     var promise;
    //     var deferred;
    //     var responseScheduled = false;
    //
    //     var fakeNTPPingResponder = function(a, b) {
    //
    //         // Ensuring our ping packet format is what we expect.
    //         expect(a).toBeDefined();
    //         expect(b).toBeDefined();
    //
    //         expect(a).toEqual('ntp:client_sync');
    //         expect(b.t0).toBeDefined();
    //
    //         // Preparing a response
    //         var mockT0 = clientTimeMS; // NOTE: Response currently ignores the incoming t0 value
    //         var mockT1 = serverTimeMS;
    //
    //         var sendNTPResponse = function() {
    //             $timeout(function() {
    //                 // If we call it outside timeout, things don't work.
    //                 // We get nested digest/apply errors.
    //                 usedSocket.receive('ntp:server_sync', {
    //                     t0: mockT0,
    //                     t1: mockT1
    //                 });
    //             });
    //             responseScheduled = true;
    //         };
    //
    //         // Scheduling the response;
    //         deferred = $q.defer();
    //
    //         promise = deferred.promise;
    //
    //         promise.then(sendNTPResponse);
    //
    //     };
    //
    //     spyOn(usedSocket, 'emit').and.callFake(fakeNTPPingResponder);
    //
    //     // There are two intervals at play, that's why it's tricky here: one is for NTPSync (slow, every 1000 ms)
    //
    //     // Another is fast at 10 ms (heartbeat of the client app)
    //     expect(deferred).not.toBeDefined(); // 'emit' hasn't fired yet, promise is not created.
    //
    //     injectedIntervalService.flush(10); // This flush makes sure 'emit' is firing during NTP.sendNTPPing
    //     injectedRootScope.$apply(); // Turn the crank
    //
    //     expect(deferred).toBeDefined();
    //     expect(deferred.promise).toBeDefined();
    //     expect(deferred.promise).toBe(promise);
    //
    //     expect(responseScheduled).toEqual(false); // Promise not resolved yet
    //
    //     deferred.resolve();
    //
    //     expect(responseScheduled).toEqual(false);
    // Promise is resolved but the crank of AngularJS has not been turned.
    //
    //     injectedRootScope.$apply(); // Turn the crank
    //
    //     expect(responseScheduled).toEqual(true); // Promise is resolved
    //
    //     // Promise should be resolved at this point, but our response to socket is sent in a timeout.
    //
    //     expect(SocketNTPSync.getOffsetAndLatency()).toEqual(null); // No data should have been received yet
    //
    //     $timeout.flush(); // This will ensure the usedSocket.receive is firing and the data gets to the SocketNTPSync
    //
    //     expect(SocketNTPSync.getOffsetAndLatency()).not.toEqual(null);
    //
    //     expect(injectedHTTPBackend.flush).not.toThrow();
    //
    //     injectedIntervalService.flush(1000); // This flush makes sure heartbeat runs, and the
    //     // SocketNTPSync.getOffsetAndLatency(); is called by the controller,
    //     // thus filling the TC.fSocketNTPData, needed for calculation.
    //
    // });
});
