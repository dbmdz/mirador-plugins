var CanvasLink = {
  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'copy-to-clipboard': 'In die Zwischenablage kopieren',
      'share-page': 'Link auf diese Seite teilen'
    },
    'en': {
      'copy-to-clipboard': 'Copy to clipboard',
      'share-page': 'Share link to this page'
    }
  },

  /* the template for the link button */
  buttonTemplate: Mirador.Handlebars.compile([
    '<a title="{{t "share-page"}}" class="mirador-btn mirador-icon-canvas-cite-share">',
    '<i class="fa fa-lg fa-fw fa-share-alt"></i>',
    '</a>'
  ].join('')),

  /* the template for the modal containing the canvas link */
  modalTemplate: Mirador.Handlebars.compile([
    '<div id="canvas-link-modal" class="modal fade" tabindex="-1" role="dialog" data-backdrop="false">',
    '<div class="modal-dialog" role="document">',
    '<div class="modal-content">',
    '<div class="modal-header">',
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
    '<h4 class="modal-title">{{t "share-page"}}</h4>',
    '</div>',
    '<div class="modal-body">',
    '<p>',
    '<input id="canvas-link" type="text" value="{{canvasLink}}">',
    '<button type="button" class="btn btn-default" id="copy-to-clipboard" title="{{t "copy-to-clipboard"}}">',
    '<i class="fa fa-clipboard" aria-hidden="true"></i>',
    '</button>',
    '</p>',
    '</div>',
    '<div class="modal-footer">',
    '<button type="button" class="btn btn-default" data-dismiss="modal">{{t "close"}}</button>',
    '</div>',
    '</div>',
    '</div>',
    '</div>',
    '<div class="modal-backdrop fade in"></div>'
  ].join('')),

  /* adds event handlers to the modal */
  addEventHandlers: function(){
    $(document.body).on('click', '#canvas-link-modal #copy-to-clipboard', function(){
      $('#canvas-link-modal #canvas-link').select();
      document.execCommand('copy');
    }.bind(this));
  },

  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function(){
    var currentLocales = {};
    for(var language in this.locales){
      currentLocales = this.locales[language];
      if(window.ShareButtons !== undefined && ShareButtons.locales[language]){
        $.extend(currentLocales, ShareButtons.locales[language]);
      }
      i18next.addResources(
        language, 'translation',
        currentLocales
      );
    }
  },

  /* extracts information like label and attribution from a window object */
  extractInformationFromWindow: function(viewerWindow){
    var currentImage = viewerWindow.imagesList[viewerWindow.focusModules[viewerWindow.viewType].currentImgIndex];
    var service = currentImage.images[0].resource.service || currentImage.images[0].resource.default.service;
    return {
      'attribution': viewerWindow.manifest.jsonLd.attribution || false,
      'canvasLink': viewerWindow.canvasID + (this.options.urlExtension || '/view'),
      'label': viewerWindow.manifest.jsonLd.label,
      'thumbnailUrl': Mirador.Iiif.getImageUrl(currentImage).concat('/full/280,/0/').concat((
        Mirador.Iiif.getVersionFromContext(service['@context']) === '2.0' ? 'default.jpg' : 'native.jpg'
      ))
    };
  },

  /* initializes the plugin */
  init: function(){
    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));
    this.injectViewerEventHandler();
    this.injectWorkspaceEventHandler();
    this.injectWindowEventHandler();
  },

  /* injects the button to the window menu */
  injectButtonToMenu: function(windowButtons){
    $(windowButtons).prepend(this.buttonTemplate());
  },

  /* injects the modal to the dom */
  injectModalToViewerWindow: function(viewerWindow){
    var windowInformation = this.extractInformationFromWindow(viewerWindow);
    var canvasLinkModal = this.modalTemplate({
      'canvasLink': windowInformation.canvasLink
    });
    viewerWindow.element[0].insertAdjacentHTML('beforeend', canvasLinkModal);
    $('#canvas-link-modal').on('show.bs.modal', function(){
      if(window.ShareButtons !== undefined){
        ShareButtons.injectButtonsToDom('#canvas-link-modal .modal-footer', 'afterbegin');
        ShareButtons.updateButtonLinks({
          'attribution': windowInformation.attribution,
          'label': windowInformation.label,
          'link': windowInformation.canvasLink,
          'thumbnailUrl': windowInformation.thumbnailUrl
        });
      }
    });
    $('#canvas-link-modal').on('shown.bs.modal', function(){
      $('#canvas-link', this).select();
    });
    $('#canvas-link-modal').on('hidden.bs.modal', function(){
      $(this).siblings('.modal-backdrop').remove();
      $(this).remove();
    });
    $('#canvas-link-modal').on('click', function(e){
      if(e.target === this){
        $(this).modal('hide');
      }
    });
    $('#canvas-link-modal').modal('show');
  },

  /* injects the needed viewer event handler */
  injectViewerEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function(){
      origFunc.apply(this);
      var options = this.state.getStateProperty('canvasLink');
      if($.isPlainObject(options)){
        this_.options = options;
      }
      if(window.ShareButtons !== undefined){
        ShareButtons.init(this_.options.showShareButtonsInfo);
      }
    };
    this.addEventHandlers();
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
        this_.injectModalToViewerWindow(this);
      }.bind(this));
    };
  }
};

$(document).ready(function(){
  CanvasLink.init();
});
