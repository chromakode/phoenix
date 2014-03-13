var zefram = require('zefram')

// if script loaded after HTML loaded
var initPage = zefram.page && page._initPage
page = new zefram.Page()
if (initPage) {
  page.init.apply(this, initPage)
}

module.exports = {
  routes: require('./routes'),
  layouts: require('./layouts'),
  models: require('./models')
}
page.setup(module.exports)
