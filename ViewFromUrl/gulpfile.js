var gulp = require('gulp');
var clean = require('gulp-clean');
var linter = require('gulp-jshint');
var minifyJS = require('gulp-minify');
var rename = require('gulp-rename');

gulp.task('clean', function(){
  return gulp.src(
    '*.min.js', { read: false }
  ).pipe(
    clean()
  );
});

gulp.task('lint', gulp.series(function(){
  return gulp.src(['*.js', '!*.min.js', '!gulpfile.js']).pipe(
    linter()
  ).pipe(
    linter.reporter('default')
  ).pipe(
    linter.reporter('fail')
  );
}));

gulp.task('minify-js', gulp.series('clean', function(){
  return gulp.src(['*.js', '!gulpfile.js']).pipe(
    minifyJS({
      ext:{
        min:'.min.js'
      },
      noSource: true
    })
  ).pipe(
    gulp.dest('.')
  );
}));

gulp.task('minify', gulp.series('clean', 'minify-js'));
