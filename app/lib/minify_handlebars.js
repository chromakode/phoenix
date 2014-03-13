var _ = require('lodash')
var Handlebars = require('handlebars')
//var minifyHTML = require('html-minifier').minify

function minify(f, html) {
  /*html = minifyHTML(html, {
    collapseWhitespace: true
  })*/
  html = html.replace(/(>|}})\s*(<|{{)/gm, '$1$2')
  html = html.trim()

  return f.apply(this, [html].concat(_.rest(arguments, 2)))
}

// monkeypatch handlebars to minify HTML
Handlebars.precompile = _.wrap(Handlebars.precompile, minify)
Handlebars.compile = _.wrap(Handlebars.compile, minify)

