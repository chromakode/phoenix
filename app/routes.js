var _ = require('lodash')

var routes = {
  '': {layout: 'frontpage', params: {sort: 'hot'}},
  'new': {layout: 'frontpage', params: {sort: 'new'}},
  'rising': {layout: 'frontpage', params: {sort: 'rising'}},
  'top': {layout: 'frontpage', params: {sort: 'top'}}
}

var title = "reddit: the front page of the internet"
_.each(routes, function(route) {
  route.title = title
})

module.exports = routes
