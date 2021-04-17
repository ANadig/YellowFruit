var gulp = require('gulp'),
    bro = require('gulp-bro'),
    babelify = require('babelify');
    concatCss = require('gulp-concat-css'),
    run = require('gulp-run'),
    ts = require("gulp-typescript");
    tsProject = ts.createProject("tsconfig.json");

var src = './process',
    app = './app';

gulp.task("ts", function() {
  return tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(gulp.dest(src + '/js'));
});

gulp.task('js', function() {
  return gulp.src( src + '/js/render.js' )
    .pipe(bro({
      extensions: 'browserify-css',
      debug: true
    }))
    .on('error', function (err) {
      console.error('Error!', err.message);
    })
    .pipe(gulp.dest(app + '/js'));
});

gulp.task('html', function(cb) {
  gulp.src( src + '/**/*.html');
  cb();
});

gulp.task('css', function() {
  return gulp.src( src + '/css/*.css')
  .pipe(concatCss('app.css'))
  .pipe(gulp.dest(app + '/css'));
});

gulp.task('fonts', function() {
    return gulp.src('node_modules/material-icons/iconfont/*')
    .pipe(gulp.dest(app + '/fonts'));
});

gulp.task('build', gulp.parallel('html', 'ts', 'js', 'css', 'fonts'));

gulp.task('serve', gulp.series('build', (cb) => {
  run('electron .').exec();
  cb();
}));

gulp.task('watch', gulp.series('serve', (cb) => {
  gulp.watch( src + '/ts/**/*', gulp.series('ts'));
  gulp.watch( src + '/js/**/*', gulp.series('js'));
  gulp.watch( src + '/css/**/*.css', gulp.series('css'));
  gulp.watch([ app + '/**/*.html'], gulp.series('html'));
  cb();
}));

exports.default = gulp.series('watch');
