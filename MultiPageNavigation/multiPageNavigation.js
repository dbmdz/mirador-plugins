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
  template: Mirador.Handlebars.compile([
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
    '<span>3</span><i class="fa fa-chevron-right"></i>',
    '</a>',
    '<a class="mirador-osd-next-5 hud-control">',
    '<span>5</span><i class="fa fa-chevron-right"></i>',
    '</a>',
    '<a class="mirador-osd-next-10 hud-control">',
    '<span>10</span><i class="fa fa-chevron-right"></i>',
    '</a>',
    '<a class="mirador-osd-last hud-control">',
    '<span>{{t "lastPage"}}</span><i class="fa fa-chevron-right"></i>',
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
        var functionAndParameter = event.currentTarget.classList[0].split('-').slice(2);
        this[functionAndParameter[0]].call(this, functionAndParameter[1]-1);
      }.bind(this));
    };
    var extendedListenForActions = function(){
      originalListenForActions.apply(this, arguments);
      this.eventEmitter.subscribe('windowUpdated', function(event, data){
        if(data.viewType){
          this.handleExtendedNavigation(data.viewType);
        }
      }.bind(this));
    };
    Mirador[viewType].prototype.bindEvents = extendedBindEvents;
    Mirador[viewType].prototype.listenForActions = extendedListenForActions;
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
        var slotID = workspace.getSlotFromAddress(data.slotAddress).slotID;
        if (data.viewType === 'ImageView') {
          hudSelector = 'div[data-layout-slot-id="' + slotID + '"] .image-view > .mirador-hud';
        } else if (data.viewType === 'BookView') {
          hudSelector = 'div[data-layout-slot-id="' + slotID + '"] .book-view > .mirador-hud';
        }
        if (hudSelector) {
          this_.injectToViewer(hudSelector, data.viewType);
        }
      });
      origFunc.apply(this);
    };
  },

  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function(){
    for(var language in this.locales){
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
    Mirador.BookView.prototype.next = Mirador.ImageView.prototype.next = this.next;
    Mirador.BookView.prototype.previous = Mirador.ImageView.prototype.previous = this.previous;
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
  next: function(skip){
    // calculate the offset to the next canvas
    var offset = this.currentImgIndex + 1 + (skip ? skip : 0);
    if(this instanceof Mirador.BookView){
      offset += 1 + (skip ? skip : 0);
    }

    // jump to the canvas, if it is in the range
    if(offset < this.imagesList.length){
      this.eventEmitter.publish(
        'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
      );
    }else{
      this.last();
    }
  },

  /* turns to the previous canvas (overwritten) */
  previous: function(skip){
    var offset = this.currentImgIndex - 1 - (skip ? skip : 0);
    if(this instanceof Mirador.BookView){
      offset = offset - 1 - (skip ? skip : 0);
    }

    // jump to the canvas, if it is in the range
    if(offset >= 0){
      this.eventEmitter.publish(
        'SET_CURRENT_CANVAS_ID.' + this.windowId, this.imagesList[offset]['@id']
      );
    }else{
      this.first();
    }
  },

  // shows respectively hides the skip x buttons corresponding to the current image index
  handleExtendedNavigation: function(viewType){
    var currentImgIndex = this.currentImgIndex;
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
