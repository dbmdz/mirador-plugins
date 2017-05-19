var UpdateUrlFromView = {
  updateUrl: false,

  init: function() {
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function() {
      if (window.location.search) {
        var params = this_.parseRequestParams(window.location.search);
        this.data.unshift({'manifestUri': params.manifest});
        var windowObj = {
          viewType: params.view || 'ImageView',
          loadedManifest: params.manifest,
          canvasID: params.canvas
        };
        this.state.currentConfig.windowObjects = [
          $.extend(true, {}, this.state.currentConfig.windowObjects[0], windowObj)
        ];
      }
      this.eventEmitter.subscribe('slotsUpdated', this_.onSlotsUpdated.bind(this_));
      this.eventEmitter.subscribe('windowUpdated', this_.onWindowUpdated.bind(this_));
      origFunc.apply(this);
    }
  },

  parseRequestParams: function(qstr) {
    var query = {};
    var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
    for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
  },

  onSlotsUpdated: function(_, data) {
    this.updateUrl = data.slots.length === 1;
    if (!this.updateUrl) {
      window.history.replaceState({}, null, "?");
    } else if (data.slots[0].window !== null) {
      window.history.replaceState({}, null, "?" + this.constructSearchParams(data.slots[0].window));
    }
  },

  onWindowUpdated: function(_, data) {
    if (!this.updateUrl || !data.viewType) {
      return;
    }
    window.history.replaceState({}, null, "?" + this.constructSearchParams(data));
  },

  constructSearchParams: function(data) {
    var newParams = new URLSearchParams();
    newParams.set('view', data.viewType);
    if (data.loadedManifest) {
      newParams.set('manifest', data.loadedManifest);
    } else {
      newParams.set('manifest', data.manifest.uri);
    }
    if (data.canvasID) {
      newParams.set('canvas', data.canvasID);
    }
    return newParams.toString();
  }
}

$(document).ready(function() {
  UpdateUrlFromView.init();
});
