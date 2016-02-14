/* global gApp */

gApp.factory('SocketNTPSync', ['$rootScope',
    function($rootScope){
    
    
    
    var myNTPSync = {
            GetOffset: function() {
                return window.ntp.offset();
            }
    };
    return myNTPSync;
    }]);