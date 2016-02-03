var  createTimeServer = function(expressServer) {
 
    expressServer.get('/doSynchronize.json', function(ireq, iResponse) {
        console.log("LALARequest\n");

        var result = {
            fLastDelay: keeper.serverNTPDelta,
            fAverageDelay: keeper.averageDelta,
            fNumberOfSamples: keeper.sampleCount,
        }

        iResponse.send(JSON.stringify(result));

    });
}


module.exports = {
    createTimeServer: createTimeServer,
};



function Chronos() {

    this.serverNTPDelta = 0.0;
    this.averageDelta = 0.0;
    this.sampleCount = 0;

    this.totalDelta = 0.0;

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

            chronosObject.serverNTPDelta = serverNTPDelta;
            chronosObject.totalDelta += serverNTPDelta;
            chronosObject.sampleCount++;
            chronosObject.averageDelta = chronosObject.totalDelta / chronosObject.sampleCount;


            console.log("Current (ServerTime - NTP Time) : " + serverNTPDelta + " ms");
            //  console.log(date); // Mon Jul 08 2013 21:31:31 GMT+0200 (Paris, Madrid (heure d’été)) 
        });
    };
    this.TickInterval = setInterval(this.Synchronize, 1000);
}


var keeper = new Chronos();
