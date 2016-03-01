var gulp = require("gulp");
var babel = require("gulp-babel");
// var nodemon = require("gulp-nodemon");
var util = require('gulp-util');
var print = require('gulp-print');

var fs = require('fs');
var path = require('path');
var rename = require('gulp-rename');
var merge = require('merge-stream');

var socketIOJSPath = ["node_modules/socket.io/node_modules/socket.io-client/socket.io.js"];

var externalJSDepsPath = "client/bower_components/";

gulp.task('copy-socketiojs', function() {
    var destPath = externalJSDepsPath + "socket.io/";

    util.log("Copying " + socketIOJSPath + " to " + destPath);
    var srcNode = gulp.src(socketIOJSPath);
    var destNode = gulp.dest(destPath);

    srcNode.pipe(destNode);

});

gulp.task('copy-js', ['copy-socketiojs']);

/**
 * Gets all the folders in a current folder, synchronously
 * @param {String} dir : current folder
 * @return {Array} array of directory names
 */
function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

/**
 * A wrapper that prevents an error from stopping a watch
 * @param {error} error to print out.
 * (per http://stackoverflow.com/questions/23971388/prevent-errors-from-breaking-crashing-gulp-watch)
 */
function swallowError(error) {

    util.log("BABEL ERROR:" + error.toString());

    this.emit('end');
}

// Babel takes a source tree with *.es6 files,
// and replicates its folder structure in other directory full of .js files.
// Based on this example: https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
const kBabelSourcePath = "client/src-es6";
const kBabelDestinationPath = "client/app";
const kBabelSourcesRegexp = '/**/*.es6';
const kBabelDestinationExtension = '.js';
/**
 * Gets all the source folders in babelSourcePath, including './'
 * @return {Array} array of subfolders' basenames
 */
function getBabelSourceFolders() {
    var folders = getFolders(kBabelSourcePath);
    folders.push("./");
    return folders;
}

gulp.task("babel", function() {

    var babelFileLogPrintFunction = function(filepath) {
        return "Babel Transcoding ES6: " + filepath;
    };

    var babelDestination = function(filepath) {
        return "Babel Result JS is at : " + filepath;
    };

    var tasks = getBabelSourceFolders().map(function(iFolder) {
        return gulp.src(path.join(kBabelSourcePath, iFolder, kBabelSourcesRegexp))
            .pipe(print(babelFileLogPrintFunction))
            .pipe(babel().on('error', swallowError))
            .pipe(rename(function(path) {
                // path.basename += "-babelprocessed";
                path.extname = kBabelDestinationExtension;
                return path;
            }))
            .pipe(gulp.dest(path.join(kBabelDestinationPath, iFolder)))
            .pipe(print(babelDestination));
    });

    return merge(tasks);

});

gulp.task('watch', function() {

    const foldersWatchArray = [];

    getBabelSourceFolders().forEach(function(iFolder) {
        foldersWatchArray.push(path.join(kBabelSourcePath, iFolder, '/**/*.js'));
    });

    gulp.watch(foldersWatchArray, ['babel']);
});

gulp.task('default', ['copy-js', 'babel', 'watch']);

gulp.task('install', ['copy-js', 'babel']);
