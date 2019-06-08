'use strict'

const del = require('del'),
  {dest, series, src, task, watch} = require('gulp'),
  plumber = require('gulp-plumber'),
  rename = require('gulp-rename'),
  connect = require('gulp-connect'),
  browserify = require('browserify'),
  ghpages = require('gulp-gh-pages'),
  uglify = require('gulp-uglify'),
  pug = require('gulp-pug'),
  stylus = require('gulp-stylus'),
  autoprefixer = require('gulp-autoprefixer'),
  csso = require('gulp-csso'),
  through = require('through'),
  opn = require('open'),
  streamify = require('gulp-streamify'),
  source = require('vinyl-source-stream'),
  isDist = process.argv.indexOf('serve') === -1

function reload(done) {
  connect.reload();
  done();
}

task('clean', function(done) {
  del(['public']).then(function(){
     done()
  })
})

task('clean:html', function(done) {
  del(['public/index.html']).then(function(){
     done()
  })
})

task('clean:js', function(done) {
  del(['public/build/*.js']).then(function(){
     done()
  })
})

task('clean:css', function(done) {
  del(['public/build/build.css']).then(function(){
     done()
  })
})

task('clean:images', function(done) {
  del(['public/images/patterns']).then(function(){
    del(['public/images']).then(function(){
       done()
    })
  })

})

task('js', series('clean:js', function() {
  var b = browserify({ transform: ['brfs'] })
  b.add('src/scripts/main.js')

  return b.bundle()
    .pipe(isDist ? through() : plumber())
    .pipe(source('build.js'))
    .pipe(isDist ? streamify(uglify()) : through())
    .pipe(dest('public/build'))
    .pipe(connect.reload())
}))

task('html', series('clean:html', function() {
  return src('src/index.pug')
    .pipe(isDist ? through() : plumber())
    .pipe(pug({ pretty: true }))
    .pipe(rename('index.html'))
    .pipe(dest('public'))
    .pipe(connect.reload())
}))

task('css', series('clean:css', function() {
  return src('src/styles/main.styl')
    .pipe(isDist ? through() : plumber())
    .pipe(stylus({
      // Allow CSS to be imported from node_modules
      'include css': true,
      'paths': ['./node_modules']
    }))
    .pipe(autoprefixer('last 2 versions', { map: false }))
    .pipe(isDist ? csso() : through())
    .pipe(rename('build.css'))
    .pipe(dest('public/build'))
}))

task('x-gif', function() {
  return src([
    'node_modules/x-gif/dist/*'
  ])
    .pipe(dest('public/x-gif'))
})

task('images', series('clean:images', function() {
  return src('src/images/**/*')
    .pipe(dest('public/images'))
}))

task('build', series('js', 'html', 'css', 'images', 'x-gif'))

task('connect', series('build', function(done) {
  connect.server({
    root: 'public',
    port: 8071,
    livereload: true
  })
  done()
}))

task('deploy', () => src('./public/**/*').pipe(ghpages()))

task('serve', series('connect', function (done) {
  opn('http://localhost:8071')
  done()
}, function(done) {
  watch('src/*.pug', series('html', reload))
  watch('src/styles/*.styl', series('css', reload))
  watch('src/images/**/*', series('images', reload))
  watch([
    'src/scripts/*.js',
    'bespoke-theme-*/dist/*.js', // Allow themes to be developed in parallel
    'node_modules/bespoke-theme-*/dist/*.js' // Allow themes to be developed in parallel
  ], series('js', reload))
  done()
}))

task('default', series('build'))
