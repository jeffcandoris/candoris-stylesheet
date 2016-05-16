var concat = require('gulp-concat');
var del = require('del');
var es = require('event-stream');
var gulp = require('gulp');
var html2js = require('gulp-ng-html2js');
var cssnano = require('gulp-cssnano');
var htmlmin = require('gulp-htmlmin');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var wiredep = require('wiredep');

function handleError(error) {
  console.log(error.toString());
  this.emit('end');
}

var pkg = {
  name: 'candoris-stylesheet',
  bower: 'bower_components/',
  dist: 'dist'
};

var wiredepConfig = {
  directory: 'bower_components',
  bowerJson: require('./bower.json')
};

var paths = {
  js: 'src/**/*.js',
  baseSass: 'src/scss/app.scss',
  sass: ['src/scss/*.scss'],
  images: 'src/images/**',
  fonts: [
    pkg.bower + 'bootstrap/fonts/*',
    pkg.bower + 'font-awesome/fonts/*',
    'src/fonts/**'
  ],
  cssMaps: [
    pkg.bower + 'bootstrap/dist/css/bootstrap.css.map'
  ],
  jsMaps: [
    pkg.bower + 'angular-resource/angular-resource.min.js.map'
  ],
  dist: {
    css: pkg.dist + '/css',
    fonts: pkg.dist + '/fonts',
    images: pkg.dist + '/images',
    js: pkg.dist + '/js'
  },
  baseHtml: ['src/index.html'],
  templates: 'src/app/**/*.html'
};

gulp.task('clean', function () {
  return del([pkg.dist]);
});

gulp.task('clean-base-dependencies', function () {
  return del(['node_modules']);
});

gulp.task('build-js', function () {
  var templateStream = gulp.src(paths.templates)
    .pipe(htmlmin())
    .pipe(html2js({
      moduleName: pkg.name + '.templates',
      prefix: 'views/',
      stripPrefix: 'app/'
    }));

  var jsStream = gulp.src(paths.js);

  return es.merge(templateStream, jsStream)
    .pipe(ngAnnotate())
    .pipe(concat(pkg.name + '.js'))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(rename(pkg.name + '.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist.js));
});

gulp.task('build-vendor-js', function () {
  return gulp.src(wiredep(wiredepConfig).js)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(rename('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist.js));
});

gulp.task('build-css', function () {
  return gulp.src(paths.baseSass)
    .pipe(sass({
      errLogToConsole: true
    }))
    .on('error', handleError)
    .pipe(rename(pkg.name + '.css'))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(cssnano())
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest(paths.dist.css));
});

gulp.task('build-vendor-css', function () {
  console.log(wiredep(wiredepConfig));
  return gulp.src(wiredep(wiredepConfig).css)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(rename('vendor.min.css'))
    .pipe(cssnano())
    .pipe(gulp.dest(paths.dist.css));
});

// In the future, it should change things based on environment that's being run
gulp.task('copy-base-html', function () {
  return gulp.src(paths.baseHtml)
    .pipe(gulp.dest(pkg.dist));
});

gulp.task('copy-js-maps', function () {
  return gulp.src(paths.jsMaps)
    .pipe(gulp.dest(paths.dist.js));
});

gulp.task('copy-css-maps', function () {
  return gulp.src(paths.cssMaps)
    .pipe(gulp.dest(paths.dist.css));
});

gulp.task('copy-fonts', function () {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.dist.fonts));
});

gulp.task('copy-images', function () {
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.dist.images));
});

gulp.task('watches', function () {
  gulp.watch([paths.js, paths.templates], ['build-js']);
  gulp.watch([paths.baseHtml], ['copy-base-html']);
  gulp.watch([paths.sass], ['build-css']);
});

gulp.task('build', ['build-js', 'build-css', 'build-vendor-js', 'build-vendor-css']);
gulp.task('copies', ['copy-js-maps', 'copy-css-maps', 'copy-fonts', 'copy-images', 'copy-base-html']);
gulp.task('deploy', ['build', 'copies']);
gulp.task('default', ['build', 'copies', 'watches']);
