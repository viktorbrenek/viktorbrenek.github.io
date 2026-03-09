const mvb = require("gulp-mvb");
const highlightjs = require("highlight.js");
const gulp = require("gulp");
const pug = require("gulp-pug");
const less = require("gulp-less");
const cleanCSS = require("gulp-clean-css");
const browserSync = require("browser-sync").create();
const string = require("string");

const slugify = (s) => string(s).slugify().toString();

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
  jsonstocopy: ["Core/*.json"],
  cnametocopy: ["Core/CNAME"]
};

const mvbConf = {
  // glob that locates the article markdown files
  glob: paths.articles,
  // the template for an article page
  template: paths.articleTemplate, 
  // callback function for generating an article permalink.
  // see docs below for info on the article properties.
  plugins: [
    ['markdown-it-toc-done-right', { listType: "ol", slugify } ],
    ['markdown-it-anchor', { tabIndex: false, slugify, permalink: true, permalinkSymbol: '' } ],
  ],
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
    .pipe(pug({ pretty: false }))
    .pipe(gulp.dest(paths.pugcompile))
);

gulp.task("lesscompiler", () =>
  gulp.src(paths.lesstocompile)
    .pipe(less())
    .pipe(cleanCSS({ level: 2 }))
    .pipe(gulp.dest(paths.lesscompile))
);

gulp.task('js', () =>
  gulp.src(paths.scriptstocompile)
      .pipe(gulp.dest(paths.scriptscompile))
);

gulp.task('json', () =>
  gulp.src(paths.jsonstocopy)
      .pipe(gulp.dest(paths.scriptscompile))
);

gulp.task('cname', () =>
  gulp.src(paths.cnametocopy)
      .pipe(gulp.dest(paths.scriptscompile))
);

gulp.task("build", gulp.series("pugcompiler", "lesscompiler", "articles", "js", "json", "cname"));

gulp.task("watch", () => {
  gulp.watch(paths.pugstocompile, gulp.series("pugcompiler"));
  gulp.watch(["src/templates/*.pug", paths.articles], gulp.series("articles", "pugcompiler"));
  gulp.watch(paths.lesstocompile, gulp.series("lesscompiler"));
  gulp.watch(paths.scriptstocompile, gulp.series("js"));
  gulp.watch(paths.jsonstocopy, gulp.series("json"));
  gulp.watch(paths.cnametocopy, gulp.series("cname"));
});

gulp.task("serve", gulp.series("build", () => {
  browserSync.init({
    server: { baseDir: "docs" },
    notify: false,
    open: false
  });

  gulp.watch("docs/**/*").on("change", browserSync.reload);
  gulp.watch(paths.pugstocompile, gulp.series("pugcompiler"));
  gulp.watch(["src/templates/*.pug", paths.articles], gulp.series("articles", "pugcompiler"));
  gulp.watch(paths.lesstocompile, gulp.series("lesscompiler"));
  gulp.watch(paths.scriptstocompile, gulp.series("js"));
  gulp.watch(paths.jsonstocopy, gulp.series("json"));
  gulp.watch(paths.cnametocopy, gulp.series("cname"));
}));

gulp.task("default", gulp.series("build"));
