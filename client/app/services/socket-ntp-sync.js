/* global gApp */

gApp.factory('SocketNTPSync', ['$window',
    function($window) {

        var socket = $window.io.connect();

        $window.ntp.init(socket);

        var myNTPSync = {
            GetOffset: function() {
                return $window.ntp.offset();
            }
        };
        
        return myNTPSync;
    }
]);