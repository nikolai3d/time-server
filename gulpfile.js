var gulp = require('gulp'),
    gutil = require('gulp-util');
    
    

var socketNTPJSPath = ["node_modules/socket-ntp/client/ntp.js"];

var externalJSDepsPath = "client/bower_components/";
gulp.task('copy-ntpjs', function() {

    var srcNode = gulp.src(socketNTPJSPath);
    var destNode = gulp.dest(externalJSDepsPath+"socket-ntp/");

    srcNode.pipe(destNode);

});

gulp.task('default', ['copy-ntpjs']);
