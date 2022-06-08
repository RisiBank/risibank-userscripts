const gulp = require("gulp");
const webpack = require('webpack-stream');
const concat = require('gulp-concat');


const userscripts = [
    'jvc',
];

for (const userscript of userscripts) {

    // JVC USERSCRIPT
    gulp.task(`build-userscript-${userscript}-webpack`, () => {
        const webpackConfig = require(`./webpack.config.js`);
        webpackConfig.output.filename = `${userscript}.user.js`;
        return gulp
            .src(`./src/${userscript}/index.js`)
            .pipe(webpack(webpackConfig))
                .on('error',function (err) {
                console.error('WEBPACK ERROR', err);
                this.emit('end'); // Don't stop the rest of the task
            })
            .pipe(gulp.dest(`./dist/${userscript}/`))
    });
    gulp.task(`build-userscript-${userscript}-concat`, () =>
        gulp.src([`./src/${userscript}/head.txt`, `./dist/${userscript}/*.user.js`])
            .pipe(concat(userscript + '.user.js'))
            .pipe(gulp.dest(`./dist/${userscript}/`))
    );
    gulp.task(`build-userscript-${userscript}`, gulp.series(`build-userscript-${userscript}-webpack`, `build-userscript-${userscript}-concat`));
}

const allTasks = gulp.parallel(...userscripts.map(userscript => `build-userscript-${userscript}`));

// [DEFAULT]
gulp.task('default', allTasks);
