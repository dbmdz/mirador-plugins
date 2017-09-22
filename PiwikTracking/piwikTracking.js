(function(mirador) {
var MiradorPiwikTracker = {
  eventMap: {
    'add-window': 'Added a new window',
    'change-page': 'Changed the page',
    'zoom': 'Zoomed into the image',
    'enable-annotations': 'Viewed annotations',
    'add-annotation': 'Added an annotation'
  },

  options: {
    // Only set trackerUrl and siteId if you did not use the Piwik
    // JavaScript snippet
    trackerUrl: undefined,
    siteId: undefined,

    // Can be 'event' or 'content', what kind of interaction to record
    // in Piwik. 'event' will trigger an Event, 'content' a Content Interaction.
    method: 'event',
    events: [
      'change-page',
      'enable-annotations',
      'add-annotation',
      'add-window'
    ]
  },

  /** Initialize the plugin and enable tracking of Mirador events in Piwik **/
  init: function() {
    var _this = this;
    var origFunc = Mirador.Workspace.prototype.init;
    Mirador.Workspace.prototype.init = function() {
      origFunc.apply(this);
      _this.config = _this.options;
      jQuery.extend(_this.config, this.state.getStateProperty("piwikTracking"));
      if (window.Piwik) {
        _this.tracker = Piwik.getTracker(_this.config.trackerUrl, _this.config.siteId);
      } else {
        console.error("Piwik ist not defined, disabling Piwik Mirador integration");
      }
      this._initialWindowLoaded = false;
      this._annotationsEnabled = false;
    };
    this.injectWindowEventHandler();
  },

  /** Inject our own event handlers into the Window widget **/
  injectWindowEventHandler: function() {
    var origFunc = Mirador.Window.prototype.init;
    var _this = this;
    Mirador.Window.prototype.init = function() {
      var config = _this.config;

      if (config.events.indexOf('add-window') > -1 &&
          this.manifest && this.manifest.jsonLd['@id']) {
        if (!_this._initialWindowLoaded) {
          _this._initialWindowLoaded = true;
        } else {
          _this.trackingCallback('add-window', this.manifest.jsonLd['@id']);
        }
      }

      this.eventEmitter.subscribe("SET_CURRENT_CANVAS_ID." + this.id, function(evt, canvasId) {
        _this.trackingCallback.apply(_this, ['change-page', canvasId]);
      });

      if (config.events.indexOf('zoom') > -1) {
        this.eventEmitter.subscribe("imageBoundsUpdated", function(evt, data) {
          if (data.id === this.id && this.canvasID) {
            _this.trackingCallback.apply(_this, ['zoom', this.canvasID]);
          }
        }.bind(this));
      }

      if (config.events.indexOf('enable-annotations') > -1) {
        this.eventEmitter.subscribe("annotationsRendered." + this.id, function(evt) {
          if (this.manifest && this.manifest.jsonLd['@id'] && !_this._annotationsEnabled) {
            _this.trackingCallback.apply(_this, ['enable-annotations', this.manifest.jsonLd['@id']]);
            _this._annotationsEnabled = true;
          }
        }.bind(this));
      }
      if (config.events.indexOf('add-annotation') > -1) {
        this.eventEmitter.subscribe("annotationCreated." + this.id, function(evt) {
          _this.trackingCallback.apply(_this, ['add-annotation']);
        });
      }

      origFunc.apply(this);
    };
  },

  /** Fire off a tracking event to Piwik **/
  trackingCallback: function(interaction, target) {
    if (this.tracker) {
      this.tracker.trackEvent("Mirador", this.eventMap[interaction], target);
    }
  }
};


MiradorPiwikTracker.init();
}(Mirador));
