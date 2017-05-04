var gulp = require('gulp');
var rename = require('gulp-rename');
var chmod = require('gulp-chmod');

var LIB_FILES = "build/**/*.js"
var CLI_FILES = "src/cli/raft-cli.js"


gulp.task('lib', function() {
    return gulp
        .src([LIB_FILES])
        .pipe(gulp.dest('release/lib/raft/'));
});

gulp.task('bin', function() {
    return gulp
        .src(CLI_FILES)
        .pipe(rename("raft"))
        .pipe(chmod(711))
        .pipe(gulp.dest('release/bin'));
    });

gulp.task('default', ['lib', 'bin']);
