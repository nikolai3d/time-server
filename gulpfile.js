var gulp = require('gulp'),
    gutil = require('gulp-util');
    
    
    gulp.task('coffee', function() {

    var srcNode = gulp.src(coffeeSources);
    var processNode = gcoffee({
        bare: true
    }).on('error', gutil.log);
    var destNode = gulp.dest('components/scripts');

    srcNode.pipe(processNode).pipe(destNode);

});