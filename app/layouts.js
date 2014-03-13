var views = require('./views')

module.exports = {}

module.exports.frontpage = function(load, present, params) {
  var listPaneBar = new views.ListPaneBarView({sort: params.sort})
  present(listPaneBar)

  return [
    load('MyAccount').then(function(me) {
      var header = new views.HeaderView({model: me})
      present(header)
    }),

    load('FrontPage', {sort: params.sort}).then(function(listing) {
      var linkList = new views.ListPaneView({collection: listing})
      present(linkList)
    })
  ]
}
