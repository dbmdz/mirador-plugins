var CanvasLink = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'cite-share-page': 'Diese Seite zitieren/teilen',
      'copy-to-clipboard': 'In die Zwischenablage kopieren',
      'share-on-facebook': 'Auf Facebook teilen',
      'share-on-twitter': 'Auf Twitter teilen'
    },
    'en': {
      'cite-share-page': 'Cite/share this page',
      'copy-to-clipboard': 'Copy to clipboard',
      'share-on-facebook': 'Share on Facebook',
      'share-on-twitter': 'Share on Twitter'
    }
  },

  /* the template for the link button */
  buttonTemplate: Mirador.Handlebars.compile([
    '<a title="{{t "cite-share-page"}}" class="mirador-btn mirador-icon-canvas-cite-share">',
    '<i class="fa fa-lg fa-fw fa-share-alt"></i>',
    '</a>'
  ].join('')),

  /* the template for the modal containing the canvas link */
  modalTemplate: Mirador.Handlebars.compile([
    '<div id="canvas-link-modal" class="modal fade" tabindex="-1" role="dialog">',
    '<div class="modal-dialog" role="document">',
    '<div class="modal-content">',
    '<div class="modal-header">',
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
    '<h4 class="modal-title">{{t "cite-share-page"}}</h4>',
    '</div>',
    '<div class="modal-body">',
    '<p>',
    '<input id="canvas-link" type="text">',
    '<button type="button" class="btn btn-default" id="copy-to-clipboard" title="{{t "copy-to-clipboard"}}">',
    '<i class="fa fa-clipboard" aria-hidden="true"></i>',
    '</button>',
    '</p>',
    '</div>',
    '<div class="modal-footer">',
    '{{#if showSocialMediaButtons}}',
    '<a type="button" class="btn btn-default pull-left" id="share-on-facebook" title="{{t "share-on-facebook"}}" target="_blank">',
    '<i class="fa fa-facebook" aria-hidden="true"></i>',
    '</a>',
    '<a type="button" class="btn btn-default pull-left" id="share-on-twitter" title="{{t "share-on-twitter"}}" target="_blank">',
    '<i class="fa fa-twitter" aria-hidden="true"></i>',
    '</a>',
    '{{/if}}',
    '<button type="button" class="btn btn-default" data-dismiss="modal">{{t "close"}}</button>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')),

  /* initializes the plugin */
  init: function(){
    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));
    this.injectModalToDom();
    this.injectWorkspaceEventHandler();
    this.injectWindowEventHandler();
  },

  /* injects the button to the window menu */
  injectButtonToMenu: function(windowButtons){
    $(windowButtons).prepend(this.buttonTemplate());
  },

  /* injects the modal to the dom */
  injectModalToDom: function(){
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function(){
      origFunc.apply(this);
      var options = this.state.getStateProperty('canvasLink');
      if($.isPlainObject(options)){
        this_.options = options;
      }
      document.body.insertAdjacentHTML('beforeend', this_.modalTemplate({
        'showSocialMediaButtons': this_.options.showSocialMediaButtons || false
      }));
    };
    this.addEventHandlers();
  },

  /* adds event handlers to the modal */
  addEventHandlers: function(){
    $(document.body).on('click', '#canvas-link-modal #copy-to-clipboard', function(){
      $('#canvas-link-modal #canvas-link').select();
      document.execCommand('copy');
    }.bind(this));
  },

  /* injects the needed workspace event handler */
  injectWorkspaceEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Workspace.prototype.bindEvents;
    Mirador.Workspace.prototype.bindEvents = function(){
      origFunc.apply(this);
      this.eventEmitter.subscribe('WINDOW_ELEMENT_UPDATED', function(event, data){
        var windowButtons = data.element.find('.window-manifest-navigation');
        this_.injectButtonToMenu(windowButtons);
      });
    };
  },

  /* injects the needed window event handler */
  injectWindowEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Window.prototype.bindEvents;
    Mirador.Window.prototype.bindEvents = function(){
      origFunc.apply(this);
      this.element.find('.mirador-icon-canvas-cite-share').on('click', function(){
        var canvasLink = this.canvasID + '/view';
        $('#canvas-link-modal #canvas-link').attr('value', canvasLink);
        if(this_.options.showSocialMediaButtons){
          $('#canvas-link-modal #share-on-facebook').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + canvasLink);
          $('#canvas-link-modal #share-on-twitter').attr('href', 'https://twitter.com/intent/tweet?text=' + canvasLink);
        }
        $('#canvas-link-modal').modal('show');
        $('#canvas-link-modal').on('shown.bs.modal', function(){
          $('#canvas-link-modal #canvas-link').select();
        });
      }.bind(this));
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
};

$(document).ready(function(){
  CanvasLink.init();
});
