var ImageCropper = {
  /* some needed flags and variables */
  croppingActive: false,
  dragging: false,
  imageDimensions: {},
  imageUrlParams: {},
  manifestAttribution: null,
  manifestLabel: null,
  resizing: false,

  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'approx': 'ca.',
      'bitonal': 'bitonal',
      'color': 'in Farbe',
      'default': 'Voreinstellung',
      'gray': 'in Graustufen',
      'license-message': 'Bitte beachten Sie die Lizenzinformationen',
      'options': 'Optionen',
      'pixel': 'Pixel',
      'preview': 'Vorschau',
      'preview-image-error': 'Die ausgewählten Parameter werden für diese Ressource leider nicht unterstützt!',
      'preview-image-link': 'In oben ausgewählter Größe anzeigen',
      'quality': 'Qualität',
      'region-link': 'Link zum ausgewählten Ausschnitt',
      'rotation': 'Rotation',
      'selected-size': 'Ausgewählte Größe',
      'size': 'Größe',
      'toggle-cropping': 'Auswahl eines Bildausschnitts aktivieren'
    },
    'en': {
      'approx': 'approx.',
      'bitonal': 'bitonal',
      'color': 'in color',
      'default': 'default',
      'gray': 'in gray scale',
      'license-message': 'Please note the license information',
      'options': 'Options',
      'pixel': 'pixels',
      'preview': 'Preview',
      'preview-image-error': 'The selected parameters are not supported for this resource!',
      'preview-image-link': 'Show in size selected above',
      'quality': 'Quality',
      'region-link': 'Link to the selected region',
      'rotation': 'Rotation',
      'selected-size': 'Selected size',
      'size': 'Size',
      'toggle-cropping': 'Toggle image cropping'
    }
  },

  /* the template for the cropping toggle button */
  buttonTemplate: Mirador.Handlebars.compile([
    '<div class="cropping-controls">',
    '<a class="cropping-toggle hud-control{{#if active}} active{{/if}}" role="button" title="{{t "toggle-cropping"}}" aria-label="{{t "toggle-cropping"}}">',
    '<i class="fa fa-lg fa-crop"></i>',
    '</a>',
    '</div>'
  ].join('')),

  /* the template for the cropping overlay */
  croppingOverlayTemplate: Mirador.Handlebars.compile([
    '<div class="cropping-overlay">',
    '<span class="fa-stack share-button"><i class="fa fa-square-o fa-stack-2x"></i>',
    '<i class="fa fa-share-alt fa-stack-1x"></i></span>',
    '<div class="resize-frame"></div>',
    '{{#each resizeControls.anchors}}',
    '<div class="resize-anchor {{this}}"></div>',
    '{{/each}}',
    '{{#each resizeControls.bars}}',
    '<div class="resize-bar {{this}}"></div>',
    '{{/each}}',
    '</div>'
  ].join('')),

  /* the template for the image url */
  imageUrlTemplate: Mirador.Handlebars.compile(
    '{{imageBaseUrl}}/pct:{{region.relative.x}},{{region.relative.y}},{{region.relative.w}},{{region.relative.h}}/{{size}}/{{rotation}}/{{quality}}.jpg'
  ),

  /* the template for the modal containing the image url for the selection */
  modalTemplate: Mirador.Handlebars.compile([
    '<div id="image-cropper-modal" class="modal fade" tabindex="-1" role="dialog" data-backdrop="false">',
    '<div class="modal-dialog" role="document">',
    '<div class="modal-content">',
    '<div class="modal-header">',
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
    '<h4 class="modal-title">{{t "region-link"}}</h4>',
    '</div>',
    '<div class="modal-body">',
    '<input id="image-url" type="text" value="{{imageUrl}}">',
    '<button type="button" class="btn btn-default" id="copy-to-clipboard" title="{{t "copy-to-clipboard"}}">',
    '<i class="fa fa-clipboard" aria-hidden="true"></i>',
    '</button>',
    '<div id="options">',
    '<h4 class="block-title">{{t "options"}}</h4>',
    '<div class="option-type size">{{t "size"}}:</div>',
    '<input id="size-selector" type="range" min="1" name="size" value="100">',
    '<span id="size-label">{{t "selected-size"}}:<span id="relative">100%</span>',
    '({{t "approx"}}<span id="absolute">{{imageUrlParams.region.w}}x{{imageUrlParams.region.h}}</span>{{t "pixel"}})</span>',
    '<div class="option-type rotation">{{t "rotation"}}:</div>',
    '<label class="radio-inline"><input type="radio" name="rotation" value="0" checked>0°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" value="90">90°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" value="180">180°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" value="270">270°</label>',
    '<div class="option-type quality">{{t "quality"}}:</div>',
    '<label class="radio-inline"><input type="radio" name="quality" value="{{imageUrlParams.quality}}" checked>{{t "default"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" value="color">{{t "color"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" value="gray">{{t "gray"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" value="bitonal">{{t "bitonal"}}</label>',
    '<hr>',
    '</div>',
    '<div id="preview">',
    '<h4 class="block-title">{{t "preview"}} <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></h4>',
    '<h5><a href="{{imageUrl}}" id="preview-image-link" target="_blank">{{t "preview-image-link"}}</a></h5>',
    '<img id="preview-image" alt="{{t "preview-image-error"}}" src="{{imageUrl}}">',
    '</div>',
    '{{#if licenseUrl}}',
    '<div id="license-message" class="alert alert-warning" role="alert">',
    '{{t "license-message"}}:',
    '<a href="{{licenseUrl}}" id="license-link" target="_blank">{{licenseUrl}}</a>',
    '</div>',
    '{{/if}}',
    '</div>',
    '<div class="modal-footer">',
    '<button type="button" class="btn btn-default" data-dismiss="modal">{{t "close"}}</button>',
    '</div>',
    '</div>',
    '</div>',
    '</div>',
    '<div class="modal-backdrop fade in"></div>'
  ].join('')),

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

  /* adds event handlers to the modal */
  addModalEventHandlers: function(){
    $(document.body).on('click', '#image-cropper-modal #copy-to-clipboard', function(){
      $('#image-cropper-modal #image-url').select();
      document.execCommand('copy');
    });
    $(document.body).on('change', 'input[name="size"], input[name="rotation"], input[name="quality"]', function(evt){
      var buttonName = $(evt.target).attr('name');
      var scaleFactor = $(evt.target).closest('#options').find('#size-selector').val();
      if(buttonName === 'size'){
        this.imageUrlParams.size = 'pct:' + scaleFactor;
        $('#image-cropper-modal #size-label > #relative').text(scaleFactor + '%');
      }else if(buttonName === 'rotation'){
        this.imageUrlParams.rotation = $(evt.target).val();
      }else if(buttonName === 'quality'){
        this.imageUrlParams.quality = $(evt.target).val();
      }
      if(['size', 'rotation'].indexOf(buttonName) !== -1){
        var absoluteWidth = Math.ceil(scaleFactor / 100 * this.imageUrlParams.region.w);
        var absoluteHeight = Math.ceil(scaleFactor / 100 * this.imageUrlParams.region.h);
        $('#image-cropper-modal #size-label > #absolute').text(
          [0, 180].indexOf(parseInt(this.imageUrlParams.rotation)) !== -1 ?
          absoluteWidth + 'x' + absoluteHeight :
          absoluteHeight + 'x' + absoluteWidth
        );
      }
      var imageUrl = this.imageUrlTemplate(this.imageUrlParams);
      $('#image-cropper-modal #image-url').val(imageUrl).select();
      $('#image-cropper-modal #preview-image-link').attr('href', imageUrl);
      $('#image-cropper-modal .fa-spinner').addClass('fa-spin').show();
      $('#image-cropper-modal #preview-image').attr(
        'src', this.imageUrlTemplate($.extend({}, this.imageUrlParams, {'size': 'full'}))
      ).on('error load', function(){
        $('#image-cropper-modal .fa-spinner').hide().removeClass('fa-spin');
      });
      if(window.ShareButtons !== undefined){
        ShareButtons.updateButtonLinks({
          'attribution': this.manifestAttribution,
          'label': this.manifestLabel,
          'link': imageUrl,
          'thumbnailUrl': this.imageUrlTemplate(
            $.extend({}, this.imageUrlParams, {'size': '280,'})
          )
        });
      }
    }.bind(this));
  },

  /* calculates the image bounds as window coordinates */
  calculateImageBounds: function(tiledImage, windowId){
    var windowTopLeft = tiledImage.imageToWindowCoordinates(new OpenSeadragon.Point(0, 0));
    var windowTopRight = tiledImage.imageToWindowCoordinates(new OpenSeadragon.Point(
      this.imageDimensions[windowId].width, 0
    ));
    var windowBottomLeft = tiledImage.imageToWindowCoordinates(new OpenSeadragon.Point(
      0, this.imageDimensions[windowId].height
    ));
    return {
      'topLeft': windowTopLeft,
      'topRight': windowTopRight,
      'bottomLeft': windowBottomLeft
    };
  },

  /* converts web to image coordinates */
  calculateImageCoordinates: function(dimensions, tiledImage, validate, relative, windowId){
    if(validate){
      dimensions.top += 5;
      dimensions.left += 5;
      dimensions.height -= 5;
      dimensions.width -= 5;
    }

    var webTopLeft = new OpenSeadragon.Point(dimensions.left, dimensions.top);
    var webTopRight = new OpenSeadragon.Point(dimensions.left + dimensions.width, dimensions.top);
    var webBottomLeft = new OpenSeadragon.Point(dimensions.left, dimensions.top + dimensions.height);

    var imageTopLeft = tiledImage.viewportToImageCoordinates(
      tiledImage.viewport.pointFromPixelNoRotate(webTopLeft)
    );
    var imageTopRight = tiledImage.viewportToImageCoordinates(
      tiledImage.viewport.pointFromPixelNoRotate(webTopRight)
    );
    var imageBottomLeft = tiledImage.viewportToImageCoordinates(
      tiledImage.viewport.pointFromPixelNoRotate(webBottomLeft)
    );

    var imageCoordinates = {
      'x': Math.floor(imageTopLeft.x),
      'y': Math.floor(imageTopLeft.y),
      'w': Math.ceil(imageTopRight.x - imageTopLeft.x),
      'h': Math.ceil(imageBottomLeft.y - imageTopLeft.y)
    };

    if(validate){
      imageCoordinates.x = Math.max(0, imageCoordinates.x);
      imageCoordinates.y = Math.max(0, imageCoordinates.y);
      imageCoordinates.w = Math.min(imageCoordinates.w, this.imageDimensions[windowId].width);
      imageCoordinates.h = Math.min(imageCoordinates.h, this.imageDimensions[windowId].height);
    }

    if(relative){
      var roundingPrecision = this.options.roundingPrecision;
      if(typeof roundingPrecision !== 'number' || roundingPrecision < 0 || roundingPrecision > 20){
        roundingPrecision = 5;
      }
      imageCoordinates.relative = {};
      imageCoordinates.relative.x = parseFloat(((imageCoordinates.x / this.imageDimensions[windowId].width) * 100).toFixed(roundingPrecision));
      imageCoordinates.relative.y = parseFloat(((imageCoordinates.y / this.imageDimensions[windowId].height) * 100).toFixed(roundingPrecision));
      imageCoordinates.relative.w = parseFloat(((imageCoordinates.w / this.imageDimensions[windowId].width) * 100).toFixed(roundingPrecision));
      imageCoordinates.relative.h = parseFloat(((imageCoordinates.h / this.imageDimensions[windowId].height) * 100).toFixed(roundingPrecision));
    }

    return imageCoordinates;
  },

  /* calculates the positions of the given element and the cursor */
  calculatePositions: function(element, evt){
    return {
      'element': element.offset(),
      'mouse': { 'top': evt.pageY, 'left': evt.pageX }
    };
  },

  /* changes the overlay dimensions depending on the resize element */
  changeOverlayDimensions: function(type, mousePosition, offsets, element, tiledImage, windowId){
    var imageBounds = this.calculateImageBounds(tiledImage, windowId);
    if(mousePosition.top < imageBounds.topLeft.y || mousePosition.left < imageBounds.topLeft.x ||
       mousePosition.top > imageBounds.bottomLeft.y || mousePosition.left > imageBounds.topRight.x){
      this.resizing = false;
      return;
    }

    var position = element.position();
    var height = element.height();
    var width = element.width();
    if(type === 'top-left' || type === 'top' || type === 'top-right'){
      position.top = mousePosition.top - offsets.canvas.top;
      height = element.height() + (element.position().top - position.top);
    }
    if(type === 'top-right' || type === 'right' || type === 'bottom-right'){
       width = mousePosition.left - offsets.element.left;
    }
    if(type === 'bottom-left' || type === 'bottom' || type === 'bottom-right'){
       height = mousePosition.top - offsets.element.top;
    }
    if(type === 'bottom-left' || type === 'left' || type === 'top-left'){
      position.left = mousePosition.left - offsets.canvas.left;
      width = element.width() + (element.position().left - position.left);
    }
    if(height >= 60 && width >= 60){
      element.css({
        'top': position.top,
        'left': position.left,
        'height': height,
        'width': width
      });
    }else{
      this.resizing = false;
    }
  },

  /* changes the overlay position */
  changeOverlayPosition: function(positions, offsets, overlay, parent, tiledImage, windowId){
    var newElementTop = positions.mouse.top - offsets.canvas.top - offsets.mouse.y;
    var newElementLeft = positions.mouse.left - offsets.canvas.left - offsets.mouse.x;
    var elementHeight = overlay.height();
    var elementWidth = overlay.width();

    var imageCoordinates = this.calculateImageCoordinates({
      'top': newElementTop,
      'left': newElementLeft,
      'height': elementHeight,
      'width': elementWidth
    }, tiledImage, false, false);
    var imageBounds = this.calculateImageBounds(tiledImage, windowId);

    if(imageCoordinates.y < -5){
      newElementTop = imageBounds.topLeft.y - offsets.canvas.top - 5;
    }
    if(newElementTop < -5){
      newElementTop = -5;
    }
    if(imageCoordinates.x < -5){
      newElementLeft = imageBounds.topLeft.x - offsets.canvas.left - 5;
    }
    if(newElementLeft < -5){
      newElementLeft = -5;
    }

    if(imageCoordinates.y + imageCoordinates.h > this.imageDimensions[windowId].height){
      newElementTop = imageBounds.bottomLeft.y - offsets.canvas.top - elementHeight;
    }
    if(newElementTop + elementHeight > $(parent).height()){
      newElementTop = $(parent).height() - elementHeight;
    }
    if(imageCoordinates.x + imageCoordinates.w > this.imageDimensions[windowId].width){
      newElementLeft = imageBounds.topRight.x - offsets.canvas.left - elementWidth;
    }
    if(newElementLeft + elementWidth > $(parent).width()){
      newElementLeft = $(parent).width() - elementWidth;
    }
    overlay.css({
      'top': newElementTop,
      'left': newElementLeft
    });
  },

  /* generates the image url to the given params */
  generateImageUrl: function(viewerWindow, eventTarget){
    var currentImage = viewerWindow.imagesList[viewerWindow.currentImgIndex];
    var service = currentImage.images[0].resource.service || currentImage.images[0].resource.default.service;
    var currentOverlayDimensions = $.extend(
      $(eventTarget).closest('.cropping-overlay').position(), {
        'height': $(eventTarget).closest('.cropping-overlay').height(),
        'width': $(eventTarget).closest('.cropping-overlay').width()
      }
    );
    var currentTiledImage = viewerWindow.canvases[viewerWindow.canvasID].getVisibleImages()[0].osdTiledImage;
    this.imageUrlParams = {
      'imageBaseUrl': Mirador.Iiif.getImageUrl(currentImage),
      'region': this.calculateImageCoordinates(
        currentOverlayDimensions, currentTiledImage, true, true, viewerWindow.windowId
      ),
      'size': 'full',
      'rotation': 0,
      'quality': Mirador.Iiif.getVersionFromContext(service['@context']) === '2.0' ? 'default' : 'native'
    };
    return this.imageUrlTemplate(this.imageUrlParams);
  },

  /* extracts the license link from the manifest entry */
  getLicenseInformation: function(viewerWindow){
    var license = viewerWindow.manifest.jsonLd.license;
    if(!this.options.showLicense || typeof license === 'undefined'){
      return null;
    }
    return $(Mirador.MetadataView.prototype.addLinksToUris(license)).attr('href');
  },

  /* initializes the plugin */
  init: function(){
    i18next.on('initialized', function(){
      this.addLocalesToViewer();
    }.bind(this));
    this.injectShareButtonEventHandler();
    this.injectButtonToCanvasControls();
    this.injectDraggingEventHandlers();
    this.injectResizingEventHandlers();
    this.injectViewerEventHandler();
    this.injectWindowEventHandler();
    this.injectOverlayToCanvas();
  },

  /* injects the button to the canvas controls */
  injectButtonToCanvasControls: function(){
    var this_ = this;
    var origFunc = Mirador.Hud.prototype.init;
    Mirador.Hud.prototype.init = function(){
      origFunc.apply(this);
      if(this.appendTo.hasClass('image-view')){
        this_.croppingActive = this_.options.activeOnStart || false;
        var button = $(this_.buttonTemplate({
          'active': this_.croppingActive
        }));
        button.appendTo(this.appendTo.find('.mirador-osd-context-controls'));
        $('.cropping-toggle', button).click(function(){
          $(this).toggleClass('active');
          $(this).closest('.image-view').find('.cropping-overlay').toggle();
        });
      }
    };
  },

  /* adds some event handlers for dragging purposes */
  injectDraggingEventHandlers: function(){
    var this_ = this;
    var currentPositions;
    var offsets = {};

    var origFunc = Mirador.ImageView.prototype.listenForActions;
    Mirador.ImageView.prototype.listenForActions = function(){
      origFunc.apply(this);
      this.element.on('mousedown', '.cropping-overlay > .resize-frame', function(evt){
        if(evt.which === 1){
          this_.dragging = true;
          currentPositions = this_.calculatePositions($(this).parent(), evt);
          offsets.canvas = $(this).closest('.mirador-osd').offset();
          offsets.mouse = {
            'x': currentPositions.mouse.left - currentPositions.element.left,
            'y': currentPositions.mouse.top - currentPositions.element.top
          };
        }
      }).on('mousemove', '.mirador-osd', function(evt){
        if(this_.dragging){
          evt.preventDefault();
          currentPositions = this_.calculatePositions(this.croppingOverlay, evt);
          var currentTiledImage = this.canvases[this.canvasID].getVisibleImages()[0].osdTiledImage;
          this_.changeOverlayPosition(
            currentPositions, offsets, this.croppingOverlay,
            evt.currentTarget, currentTiledImage, this.windowId
          );
        }
      }.bind(this)).on('mouseup', '.cropping-overlay > .resize-frame', function(){
        this_.dragging = false;
      });
    };
  },

  /* injects the modal to the dom */
  injectModalToViewerWindow: function(viewerWindow, eventTarget){
    var imageUrl = this.generateImageUrl(viewerWindow, eventTarget);
    var licenseUrl = this.getLicenseInformation(viewerWindow);
    viewerWindow.element[0].insertAdjacentHTML('beforeend', this.modalTemplate({
      'imageUrl': imageUrl,
      'imageUrlParams': this.imageUrlParams,
      'licenseUrl': licenseUrl
    }));
    $('#image-cropper-modal').on('show.bs.modal', function(){
      if(window.ShareButtons !== undefined){
        this.setManifestData(viewerWindow.manifest.jsonLd);
        ShareButtons.injectButtonsToDom('#image-cropper-modal .modal-footer', 'afterbegin');
        ShareButtons.updateButtonLinks({
          'attribution': this.manifestAttribution,
          'label': this.manifestLabel,
          'link': imageUrl,
          'thumbnailUrl': this.imageUrlTemplate(
            $.extend({}, this.imageUrlParams, {'size': '280,'})
          )
        });
      }
    }.bind(this));
    $('#image-cropper-modal').on('shown.bs.modal', function(){
      $('#image-cropper-modal #image-url').select();
    });
    $('#image-cropper-modal').on('hidden.bs.modal', function(){
      $(this).siblings('.modal-backdrop').remove();
      $(this).remove();
    });
    $('#image-cropper-modal').on('click', function(e){
      if(e.target === this){
        $(this).modal('hide');
      }
    });
    $('#image-cropper-modal #preview-image').on('error load', function(){
      $('#image-cropper-modal .fa-spinner').hide().removeClass('fa-spin');
    });
    $('#image-cropper-modal').modal('show');
  },

  /* injects the cropping overlay to the canvas */
  injectOverlayToCanvas: function(){
    var this_ = this;
    var origFunc = Mirador.ImageView.prototype.init;
    Mirador.ImageView.prototype.init = function(){
      origFunc.apply(this);
      var croppingOverlay = $(this_.croppingOverlayTemplate({
        'resizeControls': {
          'anchors': ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
          'bars': ['top', 'right', 'bottom', 'left']
        }
      }));
      croppingOverlay.appendTo(this.appendTo.find('.mirador-osd'));
      this.croppingOverlay = croppingOverlay;
      if(this_.croppingActive){
        croppingOverlay.show();
      }else{
        croppingOverlay.hide();
      }
    };
  },

  /* adds some event handlers for resizing purposes */
  injectResizingEventHandlers: function(){
    var this_ = this;
    var typeOfResizeElement;
    var currentMousePosition;
    var offsets = {};

    var origFunc = Mirador.ImageView.prototype.listenForActions;
    Mirador.ImageView.prototype.listenForActions = function(){
      origFunc.apply(this);
      this.element.on('mousedown', '.resize-anchor, .resize-bar', function(evt){
        if(evt.which === 1){
          typeOfResizeElement = evt.target.className.split(' ').pop();
          this_.resizing = true;
          offsets.canvas = $(this).closest('.mirador-osd').offset();
          offsets.element = $(this).parent().offset();
        }
      }).on('mousemove', '.mirador-osd', function(evt){
        if(this_.resizing){
          evt.preventDefault();
          currentMousePosition = this_.calculatePositions(this.croppingOverlay, evt).mouse;
          var currentTiledImage = this.canvases[this.canvasID].getVisibleImages()[0].osdTiledImage;
          this_.changeOverlayDimensions(
            typeOfResizeElement, currentMousePosition, offsets,
            this.croppingOverlay, currentTiledImage, this.windowId
          );
        }
      }.bind(this)).on('mouseup', '.mirador-osd', function(){
        this_.resizing = false;
      });
    };
  },

  /* injects an event handler for the share button */
  injectShareButtonEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.ImageView.prototype.bindEvents;
    Mirador.ImageView.prototype.bindEvents = function(){
      origFunc.apply(this);
      this.element.on('click', '.cropping-overlay > .share-button', function(evt){
        this_.injectModalToViewerWindow(this, evt.target);
      }.bind(this));
    };
  },

  /* injects the needed viewer event handler */
  injectViewerEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function(){
      origFunc.apply(this);
      var options = this.state.getStateProperty('imageCropper');
      if($.isPlainObject(options)){
        this_.options = options;
      }
      if(window.ShareButtons !== undefined){
        ShareButtons.init(this_.options.showShareButtonsInfo);
      }
    };
    this.addModalEventHandlers();
  },

  /* injects an event handler for saving the image dimensions in the windows */
  injectWindowEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Window.prototype.listenForActions;
    Mirador.Window.prototype.listenForActions = function(){
      origFunc.apply(this);
      this.eventEmitter.subscribe('windowUpdated', function(evt, data){
        if(this.id !== data.id || !data.viewType){
          return;
        }
        if(data.viewType === 'ImageView'){
          this_.imageDimensions[this.id] = {
            'height': this.canvases[data.canvasID].canvas.height,
            'width': this.canvases[data.canvasID].canvas.width
          };
        }
      }.bind(this));
    };
  },

  /* sets the label and attribution of the given manifest */
  setManifestData: function(manifest){
    this.manifestAttribution = manifest.attribution;
    this.manifestLabel = manifest.label;
  }
};

$(document).ready(function(){
  ImageCropper.init();
});
