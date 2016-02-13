var createTimeServer = function(expressServer) {

    expressServer.get('/doSynchronize.json', function(ireq, iResponse) {
        
        console.log("doSynchronize Request");

        var result = {
            deltaData: keeper.fDeltaData,
        }

        iResponse.send(JSON.stringify(result));

    });
}


module.exports = {
    createTimeServer: createTimeServer,
};



function Chronos() {

    this.fDeltaData = {
        fLastServerNTPDelta: 0.0,
        fAverageServerNTPDelta: 0.0,
        fSampleCount: 0.0
    };


    this.fTotalDelta = 0.0;

    var chronosObject = this;

    this.Synchronize = function() {
        //TIME-server query via ntp: https://github.com/moonpyk/node-ntp-client

        var ntpClient = require('ntp-client');

        ntpClient.getNetworkTime("pool.ntp.org", 123, function(err, date) {
            if (err) {
                console.error(err);
                return;
            }


            var ntpMilliseconds = date.getMilliseconds();
            var serverNow = new Date();
            var serverMilliseconds = serverNow.getMilliseconds();
            var serverNTPDelta = serverMilliseconds - ntpMilliseconds;

            chronosObject.fDeltaData.fLastServerNTPDelta = serverNTPDelta;
            chronosObject.fTotalDelta += serverNTPDelta;
            chronosObject.fDeltaData.fSampleCount++;
            chronosObject.fDeltaData.fAverageServerNTPDelta = chronosObject.fTotalDelta / chronosObject.fDeltaData.fSampleCount;


            console.log("Current (ServerTime - NTP Time) : " + serverNTPDelta + " ms");
            //  console.log(date); // Mon Jul 08 2013 21:31:31 GMT+0200 (Paris, Madrid (heure d’été)) 
        });
    };

    this.Synchronize();

    this.TickInterval = setInterval(this.Synchronize, 10000);
}


var keeper = new Chronos();
