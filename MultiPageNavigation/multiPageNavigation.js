var MultiPageNavigation = {
  /*
   * own variables
   */

  /* all of the needed locales */
  locales: {
    'de': {
      'firstPage': 'Anfang',
      'lastPage': 'Ende'
    },
    'en': {
      'firstPage': 'first',
      'lastPage': 'last'
    }
  },

  /*
   * own functions
   */

  /* the template for the navigation buttons */
  template: Handlebars.compile([
    '<div class="extendedNav skipPrevious">',
    '<a class="mirador-osd-first hud-control">',
    '<i class="fa fa-chevron-left"></i><span>{{t "firstPage"}}</span>',
    '</a>',
    '<a class="mirador-osd-previous-10 hud-control">',
    '<i class="fa fa-chevron-left"></i><span>10</span>',
    '</a>',
    '<a class="mirador-osd-previous-5 hud-control">',
    '<i class="fa fa-chevron-left"></i><span>5</span>',
    '</a>',
    '<a class="mirador-osd-previous-3 hud-control">',
    '<i class="fa fa-chevron-left"></i><span>3</span>',
    '</a>',
    '</div>',
    '<div class="extendedNav skipNext">',
    '<a class="mirador-osd-next-3 hud-control">',
    '<i class="fa fa-chevron-right"></i><span>3</span>',
    '</a>',
    '<a class="mirador-osd-next-5 hud-control">',
    '<i class="fa fa-chevron-right"></i><span>5</span>',
    '</a>',
    '<a class="mirador-osd-next-10 hud-control">',
    '<i class="fa fa-chevron-right"></i><span>10</span>',
    '</a>',
    '<a class="mirador-osd-last hud-control">',
    '<i class="fa fa-chevron-right"></i><span>{{t "lastPage"}}</span>',
    '</a>',
    '</div>'
  ].join('')),

  /* injects the navigation buttons into the viewer */
  injectToViewer: function(selector, viewType){
    var buttons = this.template();
    if($(selector + ' > .extendedNav').length === 0){
      $(buttons).appendTo(selector);
    }
  },

  /* adds event handlers for the injected buttons */
  addEventHandlersToViewer: function(viewType){
    // save original functions
    var originalBindEvents = Mirador[viewType].prototype.bindEvents;
    var originalListenForActions = Mirador[viewType].prototype.listenForActions;
    var extendedBindEvents = function(){
      originalBindEvents.apply(this, arguments);
      $(this.element[0]).on('click', '.extendedNav > .hud-control', function(event){
        switch(event.currentTarget.classList[0]){
          case 'mirador-osd-first':
            this.first();
            break;
          case 'mirador-osd-previous-10':
            this.previous(9);
            break;
          case 'mirador-osd-previous-5':
            this.previous(4);
            break;
          case 'mirador-osd-previous-3':
            this.previous(2);
            break;
          case 'mirador-osd-next-3':
            this.next(2);
            break;
          case 'mirador-osd-next-5':
            this.next(4);
            break;
          case 'mirador-osd-next-10':
            this.next(9);
            break;
          case 'mirador-osd-last':
            this.last();
            break;
        }
      }.bind(this));
    };
    var extendedListenForActions = function(){
      originalListenForActions.apply(this, arguments);
      this.eventEmitter.subscribe('windowUpdated', function(event, data){
        if(data.viewType){
          this.handleExtendedNavigation(data.viewType);
        }
      }.bind(this));
    }
    Mirador[viewType].prototype.bindEvents = extendedBindEvents;
    Mirador[viewType].prototype.listenForActions = extendedListenForActions;
  },

  /* subscribes to events */
  subscribeToEvents: function(){
    this.subscribeToViewerEvents();

  },

  /* subscribes to events fired by Mirador */
  injectWorkspaceEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Workspace.prototype.bindEvents;
    Mirador.Workspace.prototype.bindEvents = function() {
      var workspace = this;
      this.eventEmitter.subscribe('windowUpdated', function(event, data) {
        if (!data.viewType) {
          return;
        }
        var hudSelector = null;
        var slotId = workspace.getSlotFromAddress(data.slotAddress).slotID;
        if (data.viewType === 'ImageView') {
          hudSelector = 'div[data-layout-slot-id="' + slotId + '"] .image-view > .mirador-hud';
        } else if(data.viewType === 'BookView') {
          hudSelector = 'div[data-layout-slot-id="' + slotID + '"] .book-view > .mirador-hud';
        }
        if (hudSelector) {
          this_.injectToViewer(hudSelector, data.viewType);
        }
      })
      origFunc.apply(this);
    }
  },

  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function(){
    for(language in this.locales){
      i18next.addResources(
        language, 'translation',
        this.locales[language]
      );
    }
  },

  /* initializes the plugin */
  init: function(){
    // add new functions to Mirador
    Mirador.BookView.prototype.handleExtendedNavigation = this.handleExtendedNavigation;
    Mirador.ImageView.prototype.handleExtendedNavigation = this.handleExtendedNavigation;
    Mirador.BookView.prototype.first = Mirador.ImageView.prototype.first = this.first;
    Mirador.BookView.prototype.last = Mirador.ImageView.prototype.last = this.last;
    // overwrite functions in Mirador
    Mirador.BookView.prototype.next = this.next('BookView');
    Mirador.ImageView.prototype.next = this.next('ImageView');
    Mirador.BookView.prototype.previous = this.previous('BookView');
    Mirador.ImageView.prototype.previous = this.previous('ImageView');
    // add some event handlers to Mirador
    this.addEventHandlersToViewer('ImageView');
    this.addEventHandlersToViewer('BookView');
    this.injectWorkspaceEventHandler();
    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));
  },

  /*
   * functions to add to or overwrite in Mirador
   */

  /* turns to the first canvas */
  first: function(){
    this.eventEmitter.publish(
      'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[0]['@id']
    );
  },

  /* turns to the last canvas */
  last: function(){
    this.eventEmitter.publish(
      'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[this.imagesList.length-1]['@id']
    );
  },

  /* turns to the next canvas (overwritten) */
  next: function(viewType){
    switch(viewType){
      case 'BookView':
        return function(skip){
          // calculate the offset to the next canvas
          var offset = this.currentImgIndex + (this.currentImgIndex % 2 === 0 ? 1 : 2) + (skip ? skip * 2 : 0);

          // jump to the canvas, if it is in the range
          if(offset < this.imagesList.length){
            this.eventEmitter.publish(
              'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
            );
          }else{
            this.last();
          }
        };

      case 'ImageView':
        return function(skip){
          // calculate the offset to the next canvas
          var offset = this.currentImgIndex + 1 + (skip ? skip : 0);

          // jump to the canvas, if it is in the range
          if(offset < this.imagesList.length){
            this.eventEmitter.publish(
              'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
            );
          }else{
            this.last();
          }
        };
    }
  },

  /* turns to the previous canvas (overwritten) */
  previous: function(viewType){
    switch(viewType){
      case 'BookView':
        return function(skip){
          // calculate the offset to the previous canvas
          var offset = this.currentImgIndex - (this.currentImgIndex % 2 === 0 ? 1 : 2) - (skip ? skip * 2 : 0);

          // jump to the canvas, if it is in the range
          if(offset >= 0){
            this.eventEmitter.publish(
              'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
            );
          }else{
            this.first();
          }
        };

      case 'ImageView':
        return function(skip){
          // calculate the offset to the previous canvas
          var offset = this.currentImgIndex - 1 - (skip ? skip : 0);

          // jump to the canvas, if it is in the range
          if(offset >= 0){
            this.eventEmitter.publish(
              'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
            );
          }else{
            this.first();
          }
        };
    }
  },

  // shows respectively hides the skip x buttons corresponding to the current image index
  handleExtendedNavigation: function(viewType){
    var currentImgIndex = this.currentImgIndex;
    if(viewType === 'BookView' && currentImgIndex % 2 === 1){
      currentImgIndex += 1;
    }
    var lastImgIndex = this.imagesList.length - 1;
    var factor = viewType === 'ImageView' ? 1 : 2;

    // hide or show the button to the first canvas
    if(currentImgIndex === 0){
      this.element.find('.mirador-osd-first').hide();
    }else{
      this.element.find('.mirador-osd-first').show();
    }

    // hide or show the button to the last canvas
    if(currentImgIndex === lastImgIndex){
      this.element.find('.mirador-osd-last').hide();
    }else{
      this.element.find('.mirador-osd-last').show();
    }

    // calculate if step is possible and hide or show the corresponding button
    [3, 5, 10].forEach(function(step){
      // Back buttons
      if(currentImgIndex - (step * factor) >= 0){
        this.element.find('.mirador-osd-previous-' + step).show();
      }else{
        this.element.find('.mirador-osd-previous-' + step).hide();
      }

      // Forward buttons
      if(currentImgIndex + (step * factor) <= lastImgIndex){
        this.element.find('.mirador-osd-next-' + step).show();
      }else{
        this.element.find('.mirador-osd-next-' + step).hide();
      }
    }.bind(this));
  }
};

$(document).ready(function(){
  MultiPageNavigation.init();
});
