var gulp = require('gulp');
var clean = require('gulp-clean');
var linter = require('gulp-jshint');
var minifyCSS = require('gulp-clean-css');
var minifyJS = require('gulp-minify');

gulp.task('clean', function(){
  return gulp.src(
    'dist', {read: false}
  ).pipe(clean());
});

gulp.task('lint', function(){
  return gulp.src('*.js').pipe(
    linter()
  ).pipe(
    linter.reporter('default')
  );
});

gulp.task('minify-css', function(){
  return gulp.src('*.css').pipe(
    minifyCSS()
  ).pipe(
    gulp.dest('dist')
  );
});

gulp.task('minify-js', function(){
  return gulp.src(['*.js', '!gulpfile.js']).pipe(
    minifyJS({
      exclude: ['dist'],
      ext:{
        min:'.js'
      },
      noSource: true
    })
  ).pipe(
    gulp.dest('dist')
  );
});

gulp.task('default', ['clean', 'minify-css', 'minify-js']);
