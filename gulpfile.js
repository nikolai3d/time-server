var gulp = require('gulp'),
    gutil = require('gulp-util');
    
    

var socketNTPJSPath = ["node_modules/socket-ntp/client/ntp.js"];
var socketIOJSPath = ["node_modules/socket.io/node_modules/socket.io-client/socket.io.js"];

var externalJSDepsPath = "client/bower_components/";

gulp.task('copy-ntpjs', function() {

    var destPath = externalJSDepsPath+"socket-ntp/";

    gutil.log("Copying " + socketNTPJSPath + " to " + destPath);
    var srcNode = gulp.src(socketNTPJSPath);
    var destNode = gulp.dest(destPath);

    srcNode.pipe(destNode);

});

gulp.task('copy-socketiojs', function() {
    var destPath = externalJSDepsPath+"socket.io/";
    
    gutil.log("Copying " + socketIOJSPath + " to " + destPath);
    var srcNode = gulp.src(socketIOJSPath);
    var destNode = gulp.dest(destPath);

    srcNode.pipe(destNode);

});


gulp.task('copy-js', ['copy-ntpjs', 'copy-socketiojs']);

gulp.task('default', ['copy-js']);