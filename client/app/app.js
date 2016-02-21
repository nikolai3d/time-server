/* global angular */

//(function() { //We no longer have the anon enclosure, since we need a gApp reference is socket-ntp-sync.js file.

var gApp = angular.module('timesync', ['btford.socket-io']);

gApp.factory('mySocket', function (socketFactory) {
  return socketFactory();
});

//})();
