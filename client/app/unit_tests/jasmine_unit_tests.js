/* global expect */
/* global angular */


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

describe('Synchronizer', function() { //describe specifies a "spec" : logical grouping of tests

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

    it('Controller establishes heartbeat', function() {
    
    var $intervalSpy = jasmine.createSpy('$interval', $interval);

        var tsController = $controller('TimeSyncController', {
            $http: $http,
            $interval: $intervalSpy,
            $scope: $scope,
            SocketNTPSync: SocketNTPSync
        });


    expect($intervalSpy).toHaveBeenCalled();

        
    });


    //Other matchers (trutherizers)

    // expect(true).toBe(true);
    // expect(false).not.toBe(true);
    // expect(1).toEqual(1);
    // expect('foo').toEqual('foo');
    // expect('foo').not.toEqual('bar');

});
