/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const path = require('path');
const log = require('fancy-log');
const gulp = require('gulp');
const babel = require('gulp-babel');
const jasmine = require('gulp-jasmine');
const eslint = require('gulp-eslint');
const git = require('gulp-git');
const bump = require('gulp-bump');
const runSequence = require('run-sequence');
const del = require('del');

const ROOT = __dirname;
const PKG_JSON = path.join(ROOT, 'package.json');
const SRC = path.join(ROOT, 'src');
const TEST = path.join(ROOT, 'test');
const DIST = path.join(ROOT, 'dist');

gulp.task('clean', () => {
  return del(DIST);
});

gulp.task('lint', () => {
  const src = [
    path.join(SRC, '**', '*.js'),
    path.join(TEST, '**', '*.js'),
    path.join(ROOT, '*.js'),
  ];

  return gulp.src(src)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('test', ['build'], () => {
  const specs = path.join(TEST, '**', '*-spec.js');
  return gulp.src(specs).pipe(jasmine());
});

gulp.task('build', ['lint', 'clean'], () => {
  return gulp.src(path.join(SRC, '**', '*.js'))
      .pipe(babel())
      .pipe(gulp.dest(DIST));
});

gulp.task('pretag', () => {
  return gulp.src([PKG_JSON, DIST])
      .pipe(git.add({args: '-f'}))
      .pipe(git.commit('release: release version'));
});

gulp.task('posttag', () => {
  return gulp.src(DIST)
      .pipe(git.rm({args: '-r'}))
      .pipe(git.commit('release: prepare next release'));
});

gulp.task('tag', (done) => {
  const pkg = require(PKG_JSON);
  const version = pkg.version;
  git.tag(`v${version}`, `release: tag version ${version}`, done);
});

['major', 'minor', 'patch'].forEach((type) => {
  gulp.task(`bump:${type}`, () => {
    return gulp.src(PKG_JSON)
        .pipe(bump({type}))
        .on('error', (e) => log.error(e))
        .pipe(gulp.dest(ROOT));
  });

  gulp.task(`release:${type}`, ['build'], () => {
    return runSequence(`bump:${type}`, 'pretag', 'tag', 'posttag');
  });
});

gulp.task('release', ['release:minor']);
gulp.task('default', ['build']);
