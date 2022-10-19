var mvb = require('gulp-mvb');
var highlightjs = require('highlight.js');
var rename = require("gulp-rename");
var gulp = require('gulp');
var pug = require("gulp-pug");
var less = require("gulp-less");
const glsl = require("gulp-glsl");

const paths = {
  articles: ['src/articles/*.md'],
  //feedTemplate: 'src/templates/atom.pug',
  articleTemplate: 'src/templates/article.pug',
  articlesBasepath: 'articles',
  articlesdist: "docs/articles",
  pugstocompile: ['Core/*.pug'],
  pugcompile: "docs",
  lesstocompile: ['Core/*.less'],
  lesscompile: "docs",
  scriptstocompile: ["Core/scripty/*.js"],
  scriptscompile: "docs",
  shaderstocompile: ["Core/*.glsl"]
};

const mvbConf = {
  // glob that locates the article markdown files
  glob: paths.articles,
  // the template for an article page
  template: paths.articleTemplate, 
  // callback function for generating an article permalink.
  // see docs below for info on the article properties.
  permalink(article) {
    return `/${paths.articlesBasepath}/${article.id}.html`;
  },
  // callback function to further modify an article after it has been loaded.
  /*loaded(article) {
    article.calculatedData = doSomething();
  },*/
  highlight(code, lang) {
    const languages = (lang != null) ? [lang] : undefined;
    return highlightjs.highlightAuto(code, languages).value;
  },
  // callback function for generating custom article groups.
  // access the return value via the groupedArticles property, so that you can
  // either return an array if you only have one group or return an object with
  // named groups in case you want to use multiple groups (by date, by tag, ...)
  grouping (articles) {
    const byYear = {}
    const byTag = {}

    articles.forEach(function (article) {
      const year = article.date.toISOString().replace(/-.*/, '')
      if (!byYear[year]) { byYear[year] = [] }
      byYear[year].push(article)

      return (article.tags || []).forEach(function (tag) {
        if (!byTag[tag]) { byTag[tag] = [] }
        return byTag[tag].push(article)
      })
    })

    // year
    const articlesByYear = []
    Object.keys(byYear).reverse().forEach(year => articlesByYear.push({ year, articles: byYear[year] }))

    // tag
    const articlesByTag = byTag

    // groups
    return {
      byTag: articlesByTag,
      byYear: articlesByYear
    }
  }
}

gulp.task('articles', () =>
  gulp.src(paths.articles)
    .pipe(mvb(mvbConf))
    .pipe(pug())
    .pipe(gulp.dest(paths.articlesdist))
);

gulp.task("pugcompiler", () =>
  gulp.src(paths.pugstocompile)
    .pipe(mvb(mvbConf))
    .pipe(pug({ pretty: true}))
    .pipe(gulp.dest(paths.pugcompile))
);

gulp.task("lesscompiler", () =>
  gulp.src(paths.lesstocompile)
    .pipe(less())
    .pipe(gulp.dest(paths.lesscompile))
);

gulp.task('js', () =>
  gulp.src(paths.scriptstocompile)
      .pipe(gulp.dest(paths.scriptscompile))
);

gulp.task("shaders", () =>
  gulp.src(paths.shaderstocompile)
      .pipe(glsl())
      //.pipe(rename(path => {path.extname = ".module.min.js"}))
      .pipe(gulp.dest(paths.scriptscompile))
);

gulp.task("default",gulp.series("pugcompiler", "lesscompiler", "articles", "js", "shaders"));


//task na spuštění všeho najednou 