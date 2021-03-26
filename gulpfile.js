const { src, dest, watch } = require('gulp');
const server = require('browser-sync').create();
const glob = require('glob');
const csso = require('gulp-csso');
const gzip = require('gulp-gzip');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');

const config = {
  src: {
    scss: './src/scss/*.scss',
  },
  build: {
    css: './dist/css',
  },
  deploy: {
    css: './gfx/pol/css',
  },
  assets: {
    css: ['css/**/*.css'],
    scss: ['scss/**/*.scss'],
  },
}


// SCSS
const scssCompiler = () => {
  return src(config.src.scss).pipe(sass());
};

const scssBuilder = () => {
  return scssCompiler().pipe(dest(config.build.css)).pipe(server.stream());
};

const scssDeploy = () => {
  return scssCompiler()
    .pipe(csso({ restructure: false }))
    .pipe(gzip({ extension: 'gzip' }))
    .pipe(dest(config.deploy.css, { overwrite: true }));
};


// Deploy
exports.deploy = async () => {
 return scssDeploy();
}


// Server
exports.server = async () => {
  scssBuilder();

  server.init({
    ghostMode: false,
    watchTask: true,
    notify: false,
    server: './',
    serveStatic: [
      {
        route: ['/dist', '/static'],
        dir: ['./dist', './static'],
      },
    ],
    rewriteRules: [
      {
        match: /(\/dist\/css)(.*)(css)/gi,
        fn: function (req, res, match) {
          let style = '';
          for (let index = 0; index < config.assets.css.length; index++) {
            const files = glob.sync(config.assets.css[index], {
              cwd: config.build.css.replace('/css', ''),
            });
            
            for (const file in files) {
              const reg = new RegExp(files[file].replace('css/', ''));
              if (reg.test(match)) {
                style = config.build.css.replace('.', '') + '/' + files[file].replace('css/', '');
              }
            }
          }
          return style ? style : match;
        },
      },
    ],
  });

  watch(['**/*.html'], { interval: 1000, usePolling: true }).on('change', server.reload);
  watch('src/**/*.scss', { interval: 1000, usePolling: true }, scssBuilder);
}