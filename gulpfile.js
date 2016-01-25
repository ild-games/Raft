var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('gulp-merge');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var chmod = require('gulp-chmod');
var watch = require('gulp-watch');

var LIB_FILES = "Src/Raft/**/*.ts"
var CLI_FILES = "Src/CLI/RaftCLI.js"
var TYPINGS = "TSD/typings.d.ts"

function compileTS(override) {
    var project = {
        declaration: true,
        module : 'commonjs',
        noImplicitAny: true,
        target : 'ES5'
    };

    for (var key in override) {
        project[key] = override[key];
    }

    return ts(ts.createProject(project));
}

gulp.task('lib', function() {
    return gulp
        .src([LIB_FILES, TYPINGS])
        .pipe(compileTS())
        .js
        .pipe(gulp.dest('release/lib/Raft/'));
});

gulp.task('bin', function() {
    return gulp
        .src(CLI_FILES)
        .pipe(rename("raft"))
        .pipe(chmod(711))
        .pipe(gulp.dest('release/bin'));
    });

gulp.task('watch', function(cb) {
    watch(CLI_FILES, function (files) {
        gulp.start('bin', cb);
    });

    watch(LIB_FILES, function (files) {
        gulp.start('lib', cb);
    });

    gulp.start('bin', cb);
    gulp.start('lib', cb);
});

gulp.task('default', ['lib', 'bin']);
