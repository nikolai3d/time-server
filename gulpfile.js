var gulp = require('gulp'),
    gutil = require('gulp-util');
    
    
var ntpJSsource = ["node_modules/socket-ntp/client/ntp.js"]

var externalJSDependencies = "client/bower_components/";
    
gulp.task('copy-ntpjs', function() {
//Since socket-ntp does not have a bower package, got to copy it from node-modules.
    gutil.log("COPY-NTP: source path: " + ntpJSsource[0]);
    var srcNode = gulp.src(ntpJSsource);
    var destNode = gulp.dest(externalJSDependencies + "/socket-ntp/");

    srcNode.pipe(destNode);

});

gulp.task('default', ['copy-ntpjs']);//, 'js', 'compass', 'html', 'json', 'images', 'connect', 'watch']);