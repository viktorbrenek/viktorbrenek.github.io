"use strict";

var mvb = require('gulp-mvb');

var highlightjs = require('highlight.js');

var rename = require("gulp-rename");

var gulp = require('gulp');

var paths = {
  articles: ['src/articles/*.md'],
  //feedTemplate: 'src/templates/atom.pug',
  articleTemplate: 'src/templates/article.pug',
  articlesBasepath: 'articles'
};
var mvbConf = {
  // glob that locates the article markdown files
  glob: paths.articles,
  // the template for an article page
  template: paths.articleTemplate,
  // callback function for generating an article permalink.
  // see docs below for info on the article properties.
  permalink: function permalink(article) {
    return "/".concat(paths.articlesBasepath, "/").concat(article.id, ".html");
  },
  // callback function to further modify an article after it has been loaded.

  /*loaded(article) {
    article.calculatedData = doSomething();
  },*/
  highlight: function highlight(code, lang) {
    var languages = lang != null ? [lang] : undefined;
    return highlightjs.highlightAuto(code, languages).value;
  },
  // callback function for generating custom article groups.
  // access the return value via the groupedArticles property, so that you can
  // either return an array if you only have one group or return an object with
  // named groups in case you want to use multiple groups (by date, by tag, ...)
  grouping: function grouping(articles) {
    var byYear = {};
    articles.forEach(function (article) {
      var year = article.date.toISOString().replace(/-.*/, "");
      byYear[year] || (byYear[year] = []);
      return byYear[year].push(article);
    });
    return {
      byYear: byYear
    };
  }
};
gulp.task('articles', function () {
  return gulp.src(paths.articles).pipe(mvb(mvbConf)).pipe(pug()).pipe(gulp.dest(paths.articlesBasepath));
});
//# sourceMappingURL=gulpfile.dev.js.map
