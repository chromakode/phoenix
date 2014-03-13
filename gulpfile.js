var gulp = require('gulp')
var browserify = require('gulp-browserify')
var less = require('gulp-less')
var uglify = require('gulp-uglify')

require('handlebars')
require('zefram/lib/backbone.handlebars')
require('./app/lib/minify_handlebars')

paths = {
  js: './app/**/*.js',
  templates: './app/**/*.hbs',
  less: './app/views/*.less',
  public: './public/**/*'
}

gulp.task('js', function() {
  gulp.src('app/index.js')
    .pipe(browserify({
      insertGlobals: true,
      transform: ['hbsfy'],
      ignore: ['cheerio']
    }))
    .on('prebundle', function(bundle) {
        bundle.require('lodash', {expose: 'underscore'})
        bundle.require('hbsfy/runtime', {expose: 'handlebars'})
    })
    .pipe(uglify())
    .pipe(gulp.dest('./build/static'))

  gulp.src('app/views/init.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/static'))
})

// XXX minify SVG before embedding
gulp.task('less', function() {
  gulp.src(paths.less)
    .pipe(less({compress: true}))
    .pipe(gulp.dest('./build/static'))
})

gulp.task('watch', function () {
  gulp.watch(paths.js, ['js'])
  gulp.watch(paths.templates, ['js'])
  gulp.watch(paths.less, ['less'])
})

gulp.task('default', ['js', 'less', 'watch'])
