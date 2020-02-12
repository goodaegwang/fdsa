const gulp = require("gulp");
const terser = require('gulp-terser');
const gutil = require("gulp-util");
const debug = require("gulp-debug");
const del = require("del");
const prettyData = require("gulp-pretty-data");

const DIR = {
    SRC: "./src",
    DEST: "./dist",
};

gulp.task("clean", cb => del([`${DIR.DEST}/**/*`], {force: true}, cb));

gulp.task("copy", () => gulp.src([`${DIR.SRC}/**/*`], {base: DIR.SRC})
    .pipe(debug({title: "copy:"}))
    .pipe(gulp.dest(DIR.DEST)));

gulp.task("uglify", () => gulp.src([`${DIR.SRC}/**/*.js`, `${DIR.SRC}/bin/www`], {base: DIR.SRC})
    .pipe(debug({title: "uglify:"}))
    .pipe(terser())
    .on("error", err => {
        gutil.log(gutil.colors.red("[Error]"), err.toString());
    })
    .pipe(gulp.dest(DIR.DEST)));

gulp.task("minify", () => gulp.src(`${DIR.SRC}/**/*.{xml,json,xlf,svg,sql}`)
    .pipe(prettyData({
        type: "minify",
        preserveComments: false,
        extensions: {
            "xlf": "xml",
            "svg": "xml",
        },
    }))
    .pipe(gulp.dest(DIR.DEST)));

gulp.task("default",
    gulp.series("clean", "copy", gulp.parallel("uglify", "minify")),
);
