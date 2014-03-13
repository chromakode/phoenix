var fs = require('fs')
var express = require('express')

var Q = require('q')
Q.longStackSupport = true
var getRawBody = Q.denodeify(require('raw-body'))

var request = require('request')
var setupZefram = require('zefram/server').setup

require('./app/lib/minify_handlebars')
require('handlebars')

var phoenix = require('./app')


var app = express()

app.configure(function(){
  app.use(express.static(__dirname + '/build'))
})


setupZefram(app, {
    routes: phoenix.routes,
    layouts: phoenix.layouts,
    models: phoenix.models,
    pageStart: require('./app/views/page_start.hbs'),
    pageEnd: require('./app/views/page_end.hbs'),
    initCSS: fs.readFileSync(__dirname + '/build/static/init.css'),
    initJS: fs.readFileSync(__dirname + '/build/static/init.js')
})


app.all(/^\/proxy(\/.+)/, function(req, res) {
  getRawBody(req, {encoding: 'utf8'}).done(function(body) {
    var proxyReq = phoenix.models.makeRedditRequest({
      url: req.params[0],
      method: req.method,
      body: body,
      headers: {
        'Content-Type': req.headers['content-type'],
        'User-Agent': 'phoenix by chromakode'
      }
    })
    console.log('proxying', proxyReq)
    request(proxyReq).pipe(res)
  })
})


app.listen(8080)
