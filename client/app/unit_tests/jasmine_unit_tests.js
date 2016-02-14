/* global expect */
/* global angular */

describe('Synchronizer', function() { //describe specifies a "spec" : logical grouping of tests
    it('Angular Available', function(){
        var angularCheck = (typeof(angular) != "undefined");
        expect(angularCheck).toBe(true);
    });

    //beforeEach(angular.mock.module('calculatorApp'));

    it('1 + 1 should equal 2', function() {
        expect(1 + 1).toBe(2);
    }); // it specifies a single test within a spec

//Other matchers (trutherizers)

// expect(true).toBe(true);
// expect(false).not.toBe(true);
// expect(1).toEqual(1);
// expect('foo').toEqual('foo');
// expect('foo').not.toEqual('bar');

});
