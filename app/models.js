var _ = require('lodash')
var Q = require('q')
var Qrequest = Q.denodeify(require('request'))
var querystring = require('querystring')
var Backbone = require('backbone')

module.exports = {}

var config = require('../config')

var makeRedditRequest = module.exports.makeRedditRequest = function(params) {
  params.headers = params.headers || {}

  if (typeof window != 'undefined') {
    params.url = '/proxy' + params.url
  } else {
    params.url = 'http://www.reddit.com' + params.url
    params.headers['Cookie'] = config.mockCookie
    params.headers['X-Modhash'] = config.mockModhash
  }

  // browser-request doesn't support form :/
  if (params.form) {
    params.body = querystring.stringify(params.form)
    params.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    delete params.form
  }

  return params
}

var redditRequest = module.exports.redditRequest = function(params) {
  return Qrequest(makeRedditRequest(params))
    .then(function(response) {
      return response[1]
    })
}

var Account = module.exports.Account = Backbone.Model.extend({
  parse: function(resp) {
    return resp.data
  }
})

module.exports.MyAccount = Account.extend({
  sync: function(method, model, options) {
    if (method == 'read') {
      return redditRequest({
        url: '/api/me.json',
        json: true
      }).then(options.success)
    } else {
      return Backbone.sync.call(this, method, model, options)
    }
  }
})

module.exports.Link = Backbone.Model.extend({
  parse: function(resp) {
    var data = resp.data
    _.each(['title', 'selftext'], function(prop) {
      if (data[prop]) {
        data[prop] = _.unescape(data[prop])
      }
    })
    return data
  },

  vote: function(dir) {
    this.set('likes', [false, null, true][dir + 1])
    return redditRequest({
      url: '/api/vote',
      method: 'POST',
      form: {
        dir: dir,
        id: this.get('name')
      }
    })
  }
})

var LinkListing = module.exports.LinkListing = Backbone.Collection.extend({
  model: module.exports.Link,

  initialize: function(attrs, options) {
    this.sort = options.sort
  },

  parse: function(resp) {
    return resp.data.children
  }
})

module.exports.FrontPage = LinkListing.extend({
  sync: function(method, model, options) {
    if (method == 'read') {
      var sort = model.sort
      if (!sort || sort == 'hot') {
        sort = ''
      }
      return redditRequest({
        url: '/' + sort + '.json',
        json: true
      }).then(options.success)
    } else {
      return Backbone.sync.call(this, method, model, options)
    }
  }
})
