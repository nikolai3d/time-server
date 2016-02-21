/* global angular */

//(function() { //We no longer have the anon enclosure, since we need a gApp reference is socket-ntp-sync.js file.

var gApp = angular.module('timesync', ['btford.socket-io']);

gApp.factory('BtfordSocket', function (socketFactory) {
    //socketFactory is a btford.socket-io socket creator
    //NOTE: needs ("bower_components/socket.io/socket.io.js" dependency)

    //For Unit tests, mock socket-io implementation will come from
    //"bower_components/angular-socket.io-mock/angular-socket.io-mock.js"
  return socketFactory();
});

//Just wrapping $window.io socket in an Angular Service
//An option just for the heck of it.
//NOTE: needs ("bower_components/socket.io/socket.io.js" dependency)
gApp.factory('windowIOSocket',['$window', function (iWindow) {
  return iWindow.io.connect();
}]);

//})();
