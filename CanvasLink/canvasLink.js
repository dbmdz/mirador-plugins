var CanvasLink = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'cite-share-page': 'Diese Seite zitieren/teilen',
      'copy-to-clipboard': 'In die Zwischenablage kopieren',
      'share-buttons-info': 'Beim Klick auf einen der Teilen-Buttons verlassen Sie diese Webseite!',
      'share-on-envelope': 'Per Mail teilen',
      'share-on-facebook': 'Auf Facebook teilen',
      'share-on-pinterest': 'Auf Pinterest teilen',
      'share-on-tumblr': 'Auf Tumblr teilen',
      'share-on-twitter': 'Auf Twitter teilen',
      'share-on-whatsapp': 'Per Whatsapp teilen'
    },
    'en': {
      'cite-share-page': 'Cite/share this page',
      'copy-to-clipboard': 'Copy to clipboard',
      'share-buttons-info': 'By clicking on one of the share buttons, you will leave this website!',
      'share-on-envelope': 'Share via mail',
      'share-on-facebook': 'Share on Facebook',
      'share-on-pinterest': 'Share on Pinterest',
      'share-on-tumblr': 'Share on Tumblr',
      'share-on-twitter': 'Share on Twitter',
      'share-on-whatsapp': 'Share via Whatsapp'
    }
  },

  linkPrefixes: {
    'envelope': 'mailto:?body=',
    'facebook': 'https://www.facebook.com/sharer/sharer.php?u=',
    'pinterest': 'http://pinterest.com/pin/create/link/?url=',
    'tumblr': 'http://www.tumblr.com/share/link?url=',
    'twitter': 'https://twitter.com/intent/tweet?text=',
    'whatsapp': 'whatsapp://send?text='
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
    '{{#if showShareButtons}}',
    '{{#if showShareButtonsInfo}}',
    '<div id="share-buttons-info" role="alert">{{t "share-buttons-info"}}</div>',
    '{{/if}}',
    '{{#each shareButtons}}',
    '<a type="button" class="pull-left share-button" id="share-on-{{this}}" title="{{t (concat this)}}" target="_blank" data-target="{{this}}">',
    '<span class="fa-stack fa-lg">',
    '<i class="fa fa-circle fa-stack-2x"></i>',
    '<i class="fa fa-{{this}} fa-stack-1x" aria-hidden="true"></i>',
    '</span>',
    '</a>',
    '{{/each}}',
    '{{/if}}',
    '<button type="button" class="btn btn-default" data-dismiss="modal">{{t "close"}}</button>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')),

  /* initializes the plugin */
  init: function(){
    Mirador.Handlebars.registerHelper('concat', function(target){
      return 'share-on-' + target;
    });
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
        'shareButtons': ['facebook', 'twitter', 'pinterest', 'tumblr', 'envelope', 'whatsapp'],
        'showShareButtons': this_.options.showShareButtons || false,
        'showShareButtonsInfo': this_.options.showShareButtonsInfo || false
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
        var canvasLink = this.canvasID + (this_.options.urlExtension || '/view');
        $('#canvas-link-modal #canvas-link').attr('value', canvasLink);
        if(this_.options.showShareButtons){
          $('#canvas-link-modal .share-button').attr('href', function(){
            return this_.linkPrefixes[$(this).data('target')] + canvasLink
          });
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
