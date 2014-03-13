var zefram = require('zefram')
var _ = zefram._
var $ = zefram.$
var Backbone = zefram.Backbone

var moment = require('moment')
moment.lang('en', {
    relativeTime : {
        future: "in %s",
        past:   "%s ago",
        s:  "%ds",
        m:  "1m",
        mm: "%dm",
        h:  "1h",
        hh: "%dh",
        d:  "1d",
        dd: "%dd",
        M:  "1mo",
        MM: "%dmo",
        y:  "1y",
        yy: "%dy"
    }
})


var Handlebars = require('handlebars')
require('zefram/lib/backbone.handlebars')


page.on('init', function() {
  var Hammer = require('./lib/hammer')
  Hammer(document.documentElement, {
    drag_min_distance: 0
  })
})


Handlebars.registerHelper('json', function(data) {
  return new Handlebars.SafeString(JSON.stringify(data))
})


Handlebars.registerHelper('timestamp_ago', function(unix_timestamp) {
  var date = moment.unix(unix_timestamp)
  var result = '<time datetime="' + date.toISOString() + '" title="' + date.format('MMMM Do YYYY, h:mm:ss a') + '">' + date.fromNow() + '</time>'
  return new Handlebars.SafeString(result)
})


var IsoView = module.exports.IsoView = Backbone.HandlebarsView.extend({
  viewIndex: module.exports,
  clientPresent: function() {}
})


var HeaderView = module.exports.HeaderView = IsoView.extend({
  tagName: 'header',
  template: require('./views/header.hbs')
})


var LinkView = module.exports.LinkView = IsoView.extend({
  className: 'link',
  attributes: function() {
    return {'data-fullname': this.model.get('name')}
  },

  template: require('./views/link.hbs'),
  events: {
    'touch .arrow': 'vote'
  },

  initialize: function() {
    this.listenTo(this.model, 'change', this.render)
  },

  render: function() {
    IsoView.prototype.render.call(this)

    var classes = [this.className]
    var likes = this.model.get('likes')

    this.$('.arrow.active').removeClass('active')
    if (likes == true) {
      classes.push('upvoted')
      this.$('.arrow.up').addClass('active')
    } else if (likes == false) {
      classes.push('downvoted')
      this.$('.arrow.down').addClass('active')
    } else {
      classes.push('unvoted')
    }
    this.$el.attr('class', classes.join(' '))
    return this
  },

  vote: function(ev) {
    navigator.vibrate(50)

    var $target = $(ev.target)
    var dir
    if ($target.is('.active')) {
      dir = 0
    } else if ($target.is('.up')) {
      dir = 1
    } else if ($target.is('.down')) {
      dir = -1
    }

    this.model.vote(dir)
  }
})


var LinkListingView = module.exports.LinkListingView = IsoView.extend({
  className: 'link-listing',

  initialize: function() {
    this.nestedViews = []
    this.listenTo(this.collection, 'reset', this.render)
  },

  render: function() {
    _.each(this.nestedViews, function(view) {
      view.remove()
    })
    this.nestedViews = []
    if (!page.clientLoaded) {
      this.collection.each(function(link) {
        var view = new LinkView({model: link})
        this.nestedViews.push(view)
        this.$el.append(view.render().el)
      }, this)
    } else {
      this._renderIncremental()
    }
  },

  _renderIncremental: function(toRender, step) {
    if (toRender == undefined) {
      toRender = _.clone(this.collection.models)
    }

    if (step == undefined) {
      step = 3
    }

    var count = 0
    var nodes = []
    while (toRender.length && count < step) {
      var link = toRender.shift()
      var view = new LinkView({model: link})
      this.nestedViews.push(view)
      nodes.push(view.render().el)
      count++
    }
    this.$el.append(nodes)
    if (toRender.length) {
      requestAnimationFrame(_.bind(this._renderIncremental, this, toRender, step * 2))
    }
  }
})


var ListPaneView = module.exports.ListPaneView = IsoView.extend({
  id: 'list-pane',
  template: require('./views/list_pane.hbs'),
  events: {
    'touch': 'touch',
    'release': 'release',
    'drag': 'drag'
  },

  clientPresent: function() {
    _.defer(_.bind(function() {
      this.pullHeight = this.$('.pull-down').height()
    }, this))
  },

  touch: function(ev) {
    this._touching = true
    this._dragDelta = 0
    this.$el.addClass('touching')
    requestAnimationFrame(_.bind(this._updateDrag, this))
  },

  release: function(ev) {
    ev = ev.originalEvent
    this._touching = false
    this.$el.removeClass('touching')
    this.$el.css('-webkit-transform', '')
    if (ev.gesture.deltaY > this.pullHeight / 3) {
      ev.gesture.preventDefault()
      this.$el.addClass('refreshing')
      this.collection.fetch({reset: true})
        .done(_.bind(function() {
          this.$el.removeClass('refreshing')
        }, this))
    }
  },

  drag: function(ev) {
    ev = ev.originalEvent
    if ($('body').scrollTop() < 5 && !this.$el.is('.refreshing')) {
      this._dragDelta = Math.max(Math.min(ev.gesture.deltaY, this.pullHeight), 0)
      if (ev.gesture.deltaY > 0) {
        ev.gesture.preventDefault()
      }
    }
  },

  _updateDrag: function() {
    if (this._touching) {
      this.$el.css('-webkit-transform', 'translate3d(0,' + this._dragDelta + 'px,0)')
      requestAnimationFrame(_.bind(this._updateDrag, this))
    }
  }
})


var ListPaneBarView = module.exports.ListPaneBarView = IsoView.extend({
  id: 'list-pane-bar',
  template: require('./views/list_pane_bar.hbs'),

  titles: {
    'hot': 'front page',
    'new': 'newest posts',
    'rising': 'rising posts',
    'top': 'top posts'
  },

  initialize: function(options) {
    this.sort = options.sort
  },

  context: function() {
    return {
      listing_title: this.titles[this.sort]
    }
  },

  render: function() {
    IsoView.prototype.render.call(this)
    this.$('[data-sort="' + this.sort + '"]').addClass('selected')
    return this
  }
})
