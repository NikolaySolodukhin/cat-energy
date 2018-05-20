'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'gulp.*',
    '@*/gulp{-,.}*',
    'postcss-*',
    'rollup-*',
    'css-*',
    'del',
    'precss',
    'autoprefixer',
    'browser-sync',
    'run-sequence',
    'stream-combiner2',
    'critical',
    'posthtml-include'
  ]
});

var isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

gulp.task('clean', function () {
  return plugins.del('build');
});

gulp.task('clean:css', function () {
  return plugins.del('build/css/style.css');
});

gulp.task('webp', function () {
  return gulp
    .src('source/img/**/*.{png,jpg}')
    .pipe(plugins.webp({
      quality: 90
    }))
    .pipe(gulp.dest('source/img'));
});

gulp.task('style', function () {
  return gulp
    .src('source/postcss/style.css')
    .pipe(plugins.changed('build/css'))
    .pipe(plugins.plumber())
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.identityMap()))
    .pipe(plugins.sass())
    .pipe(
      plugins.postcss([
        plugins.precss(),
        plugins.cssMqpacker({
          sort: true
        }),
        plugins.autoprefixer(),
        plugins.postcssFlexbugsFixes(),
        plugins.postcssSorting()
      ]),
      plugins.if(!isDevelopment,
        plugins.postcss(
          plugins.postcssUrl({
            url: 'rebase'
          })
        )
      )
    )
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write()))
    .pipe(plugins.if(!isDevelopment, plugins.cssnano()))
    .pipe(plugins.if(!isDevelopment, plugins.rev()))
    .pipe(
      plugins.if(!isDevelopment,
        plugins.revReplace({
          manifest: gulp.src('build/manifest/manifest.json')
        })
      )
    )
    .pipe(gulp.dest('build/css'))
    .pipe(plugins.if(isDevelopment, plugins.plumber.stop()))
    .pipe(
      plugins.if(!isDevelopment,
        plugins.rev.manifest('build/manifest/manifest.json', {
          base: 'build/manifest',
          merge: true
        })
      )
    )
    .pipe(plugins.if(!isDevelopment, gulp.dest('build/manifest')))
    .pipe(plugins.if(isDevelopment, plugins.browserSync.stream()));
});

gulp.task('scripts', function () {
  return gulp
    .src('source/js/main.js')
    .pipe(plugins.plumber())
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.init()))
    .pipe(
      plugins.betterRollup({
          plugins: [
            plugins.rollupPluginNodeResolve({
              browser: true
            }),
            plugins.rollupPluginCommonjs(),
            plugins.rollupPluginBabel({
              babelrc: false,
              exclude: 'node_modules/**',
              presets: [
                [
                  'env',
                  {
                    modules: false
                  }
                ]
              ],
              plugins: ['external-helpers']
            })
          ]
        },
        'iife'
      )
    )
    .pipe(plugins.if(!isDevelopment, plugins.uglify()))
    .pipe(plugins.if(isDevelopment, plugins.sourcemaps.write('')))
    .pipe(plugins.if(!isDevelopment, plugins.rev()))
    .pipe(gulp.dest('build/js'))
    .pipe(
      plugins.if(!isDevelopment,
        plugins.rev.manifest('build/manifest/manifest.json', {
          base: 'build/manifest',
          merge: true
        })
      )
    )
    .pipe(plugins.if(!isDevelopment, gulp.dest('build/manifest')));
});

gulp.task('symbols', function () {
  return gulp
    .src('source/img/icons/*.svg')
    .pipe(plugins.svgmin())
    .pipe(
      plugins.svgstore({
        inlineSvg: true
      })
    )
    .pipe(plugins.rename('sprite.svg'))
    .pipe(plugins.if(!isDevelopment, plugins.rev()))
    .pipe(gulp.dest('build/img'))
    .pipe(plugins.if(!isDevelopment, plugins.rev.manifest('manifest.json')))
    .pipe(plugins.if(!isDevelopment, gulp.dest('build/manifest')));
});

gulp.task('images', function () {
  return gulp
    .src('source/img/*.{png,jpg,gif,svg}')
    .pipe(
      plugins.imagemin([
        plugins.imagemin.optipng({
          optimizationLevel: 3
        }),
        plugins.imagemin.jpegtran({
          progressive: true
        }),
        plugins.imagemin.svgo()
      ])
    )
    .pipe(gulp.dest('source/img'));
});

gulp.task('htmlminify', function () {
  return gulp.src('build/*.html')
    .pipe(
      plugins.revReplace({
        manifest: gulp.src('build/manifest/manifest.json')
      })
    )
    .pipe(plugins.posthtml([plugins.posthtmlInclude()]))
    .pipe(
      plugins.htmlMinifier2({
        collapseWhitespace: true
      })
    )
    .pipe(gulp.dest('build/'));
});

gulp.task('copy', function () {
  return gulp
    .src(
      ['source/fonts/*.{woff,woff2}', 'source/img/*.{svg,png,jpg,gif,webp}'], {
        base: 'source'
      }
    )
    .pipe(plugins.if(!isDevelopment, plugins.rev()))
    .pipe(gulp.dest('build/'))
    .pipe(
      plugins.if(!isDevelopment,
        plugins.rev.manifest('build/manifest/manifest.json', {
          base: 'build/manifest',
          merge: true
        })
      )
    )
    .pipe(plugins.if(!isDevelopment, gulp.dest('build/manifest')));
});

gulp.task('html:copy', function () {
  return gulp
    .src('source/*.html')
    .pipe(plugins.changed('source/*.html'))
    .pipe(plugins.posthtml([plugins.posthtmlInclude()]))
    .pipe(gulp.dest('build'));
});

gulp.task('html:update', ['html:copy'], function (done) {
  plugins.browserSync.reload();
  done();
});

gulp.task('server', ['style'], function (fn) {
  plugins.browserSync.init({
    server: './build',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('source/postcss/**/*.css', function () {
    plugins.runSequence('clean:css', ['style']);
  });

  gulp.watch('source/*.html', ['html:update']);
});

gulp.task('build', function (fn) {
  plugins.runSequence(
    'clean', ['symbols'],
    'copy', ['style', 'scripts'],
    ['critical'],
    'htmlminify',
    fn
  );
});

gulp.task("critical", function () {
  return gulp
    .src("source/*.html")
    .pipe(
      plugins.critical.generate({
        base: "./",
        inline: true,
        css: "build/css/style.css",
        minify: true,
        ignore: ["@font-face", /url\(/],
        dimensions: [
          {
            height: 812,
            width: 375
          },
          {
            height: 1024,
            width: 768
          },
          {
            height: 768,
            width: 1024
          },
          {
            height: 900,
            width: 1200
          }
        ]
      })
    )
    .on("error", function (err) {
      gutil.log(gutil.colors.red(err.message));
    })
    .pipe(gulp.dest("build/"));
});

gulp.task('demo', function () {
  plugins.browserSync.init({
    server: './build',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
});

gulp.task('deploy', function () {
  return gulp.src('./build/**/*').pipe(plugins.ghPagesWill());
});

gulp.task('dev', function (fn) {
  plugins.runSequence(
    'clean',
    'symbols',
    'copy',
    'html:copy',
    'style',
    'scripts',
    'server',
    fn
  );
});
