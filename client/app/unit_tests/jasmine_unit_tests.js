/* global expect */
/* global angular */
/* global jasmine */


describe('Angular Availability', function() { //describe specifies a "spec" : logical grouping of tests
    it('Angular Available', function() {
        var angularCheck = (typeof(angular) != "undefined");
        expect(angularCheck).toBe(true);
    });
    it('Angular Mock Available', function() {
        var angularMockCheck = (typeof(angular.mock) != "undefined");
        expect(angularMockCheck).toBe(true);
    });
});

describe('TimeSyncController', function() { //describe specifies a "spec" : logical grouping of tests

    beforeEach(angular.mock.module('timesync'));

    var $controller;
    var $scope;
    var $interval;
    var $http;
    var SocketNTPSync;

    beforeEach(angular.mock.inject(function(_$controller_, _$rootScope_) {
        $controller = _$controller_;
        $scope = _$rootScope_.$new();

    }));

    beforeEach(angular.mock.inject(function(_$interval_) {
        $interval = _$interval_;
    }));

    beforeEach(angular.mock.inject(function(_$http_) {
        $http = _$http_;
    }));

    beforeEach(angular.mock.inject(function(_SocketNTPSync_) {
        SocketNTPSync = _SocketNTPSync_;
    }));


    it('Controller is there', function() {

        //var $intervalSpy = jasmine.createSpy('$interval', $interval);

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $interval,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync
        });

        expect(tsController.fTitle).toEqual('UberTimeSync');

    }); // it specifies a single test within a spec

    it('Controller establishes heartbeat at > 30 fps', function() {

        //This references stuff in http://www.bradoncode.com/blog/2015/06/15/unit-testing-interval-angularls/

        var $intervalSpy = jasmine.createSpy('$interval', $interval);

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $intervalSpy,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync
        });

        expect(tsController.fTitle).toEqual('UberTimeSync');
    
        expect($intervalSpy).toHaveBeenCalled();

        var calls = $intervalSpy.calls.all();
        var args0 = calls[0].args;

        var heartbeatAtLeast30fps = args0[1] < 1000.0 / 30.0; //Second argument is milliseconds delay
        //For interval to fire with at least 30 fps, delay needs to be less
        //than 1000/30

        expect(heartbeatAtLeast30fps).toBe(true);

    });


    //Other matchers (trutherizers)

    // expect(true).toBe(true);
    // expect(false).not.toBe(true);
    // expect(1).toEqual(1);
    // expect('foo').toEqual('foo');
    // expect('foo').not.toEqual('bar');

});
