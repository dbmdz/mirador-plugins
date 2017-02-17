(function() {

function currentView(window) {
    switch (window.viewType) {
      case 'ImageView':
        console.log('Go to previous image');
        return window.focusModules.ImageView;
      break;
      case 'BookView':
        console.log('Go to previous image');
        return window.focusModules.ImageView;
      break;
    }
    return null;
}

function windowIsZoomed(window) {
    var view = currentView(window);
    if (view) {
      return 1 < view.osd.viewport.getZoom(true);  
    }
    return false;
}

function anyViewIsZoomed(workspace) {
  return workspace.windows.some(windowIsZoomed);
}

function forEveryActiveView(workspace, func) {
  workspace.windows.forEach(function(w) {
    var view = currentView(w);
    if (view) {
      func(view);
    }
  });
}

var KeyboardNavigation = {
  initialized: false,
  init: function () {
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function() {
      origFunc.apply(this);
      var this_ = this;
      Mousetrap.bind(['left'], function(){
        console.log('Got key ←');
        var workspace = this_.workspace;
        if (anyViewIsZoomed(workspace)) {
          return;
        }
        forEveryActiveView(workspace, function(view){
          view.previous();
        });
      });
      Mousetrap.bind(['right', 'space'], function(){
        console.log('Got key → or ␣');
        var workspace = this_.workspace;
        if (anyViewIsZoomed(workspace)) {
          return;
        }
        forEveryActiveView(workspace, function(view){
          view.next();
        })
      });
    }
  }
}

$(document).ready(function() {
  console.log('Loading Keyboard Navigation...');
  KeyboardNavigation.init();
})

})()