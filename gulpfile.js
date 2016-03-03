var gulp = require("gulp");
var babel = require("gulp-babel");
var nodemon = require("gulp-nodemon");
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
const kBabelClientSourcePath = "client/src-es6";
const kBabelClientDestinationPath = "client/app";

const kBabelServerSourcePath = "server/src-es6";
const kBabelServerDestinationPath = "server/app";

const kBabelSourcesRegexp = '/**/*.es6';
const kBabelDestinationExtension = '.js';

/**
 * Gets all the source folders in iBabelSourcePath, including './'
 * @param {String} iBabelSourcePath, root of a tree to scan
 * @return {Array} array of subfolders' basenames
 */
function getBabelSourceFolders(iBabelSourcePath) {
    var folders = getFolders(iBabelSourcePath);
    folders.push("./");
    return folders;
}

/**
 * Run the babel tasks on all *.es6 files in the directory,
 * replicating the folder structure in the destination directory
 * @param {String} iBabelSourcePath, root of a tree to scan
 * @param {String} iBabelDestinationPath, destination path
 * @return {Array} array of subfolders' basenames
 */
function babelFolderTree(iBabelSourcePath, iBabelDestinationPath) {

    var babelFileLogPrintFunction = function(filepath) {
        return "Babel Transcoding ES6: " + filepath;
    };

    var babelDestination = function(filepath) {
        return "Babel Result JS is at : " + filepath;
    };

    var tasks = getBabelSourceFolders(iBabelSourcePath).map(function(iFolder) {

        // See .babelrc for babel() configuration, we use es2015 profile.

        return gulp.src(path.join(iBabelSourcePath, iFolder, kBabelSourcesRegexp))
            .pipe(print(babelFileLogPrintFunction))
            .pipe(babel().on('error', swallowError))
            .pipe(rename(function(path) {
                // path.basename += "-babelprocessed";
                path.extname = kBabelDestinationExtension;
                return path;
            }))
            .pipe(gulp.dest(path.join(iBabelDestinationPath, iFolder)))
            .pipe(print(babelDestination));
    });

    return merge(tasks);

}
/**
 * Put the directory structure in an array, for a gulp watch task
 * @param {String} iBabelSourcePath, root of a tree to scan
 * @return {Array} array of subfolders' full path names + es6 regexp search, to feed into gulp.watch()
 */
function babelSourceFolderArray(iBabelSourcePath) {
    const foldersWatchArray = [];

    getBabelSourceFolders(iBabelSourcePath).forEach(function(iFolder) {
        foldersWatchArray.push(path.join(iBabelSourcePath, iFolder, kBabelSourcesRegexp));
    });

    return foldersWatchArray;
}

gulp.task("babel_client", function() {
    babelFolderTree(kBabelClientSourcePath, kBabelClientDestinationPath);
});

gulp.task("watch_client", function() {
    gulp.watch(babelSourceFolderArray(kBabelClientSourcePath), ['babel_client']);
});

gulp.task("babel_server", function() {
    babelFolderTree(kBabelServerSourcePath, kBabelServerDestinationPath);
});

gulp.task("watch_server", function() {
    gulp.watch(babelSourceFolderArray(kBabelServerSourcePath), ['babel_server']);
});

gulp.task("start", ["babel_server"], function() {
    nodemon({
        script: kBabelServerDestinationPath + '/server.js',
        ext: 'js',
        env: {
            'NODE_ENV': 'development'
        }
    }).on('crash', function() {
        util.log("^^^^ Node didn't run, some problem with the script. ^^^^ ");
    });
});

gulp.task('default', ['copy-js', 'babel_client', 'watch_client', 'babel_server', 'start', 'watch_server']);

gulp.task('install', ['copy-js', 'babel_client', 'babel_server']);
