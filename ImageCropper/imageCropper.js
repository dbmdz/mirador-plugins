var ImageCropper = {
  /* some needed flags and variables */
  croppingActive: false,
  dragging: false,
  imageDimensions: {},
  imageUrlParams: {},
  resizing: false,

  /* options of the plugin */
  options: {},

  /* all of the needed locales */
  locales: {
    'de': {
      'bitonal': 'bitonal',
      'color': 'in Farbe',
      'default': 'Voreinstellung',
      'gray': 'in Graustufen',
      'license-message': 'Bitte beachten Sie die Lizenzinformationen',
      'options': 'Optionen',
      'preview': 'Vorschau',
      'preview-image-error': 'Die ausgewählten Parameter werden für diese Ressource leider nicht unterstützt!',
      'preview-image-link': '<a href="#" id="preview-image-link" target="_blank">In oben ausgewählter Größe anzeigen</a>',
      'quality': 'Qualität',
      'region-link': 'Link zum ausgewählten Ausschnitt',
      'rotation': 'Rotation',
      'selected-size': 'Ausgewählte Größe',
      'size': 'Größe',
      'toggle-cropping': 'Auswahl eines Bildausschnitts aktivieren'
    },
    'en': {
      'bitonal': 'bitonal',
      'color': 'in color',
      'default': 'default',
      'gray': 'in gray scale',
      'license-message': 'Please note the license information',
      'options': 'Options',
      'preview': 'Preview',
      'preview-image-error': 'The selected parameters are not supported for this resource!',
      'preview-image-link': '<a href="#" id="preview-image-link" target="_blank">Show in size selected above</a>',
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
    '{{imageBaseUrl}}/pct:{{region.x}},{{region.y}},{{region.w}},{{region.h}}/{{size}}/{{rotation}}/{{quality}}.jpg'
  ),

  /* the template for the modal containing the image url for the selection */
  modalTemplate: Mirador.Handlebars.compile([
    '<div id="image-cropper-modal" class="modal fade" tabindex="-1" role="dialog">',
    '<div class="modal-dialog" role="document">',
    '<div class="modal-content">',
    '<div class="modal-header">',
    '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
    '<h4 class="modal-title">{{t "region-link"}}</h4>',
    '</div>',
    '<div class="modal-body">',
    '<input id="image-url" type="text">',
    '<button type="button" class="btn btn-default" id="copy-to-clipboard" title="{{t "copy-to-clipboard"}}">',
    '<i class="fa fa-clipboard" aria-hidden="true"></i>',
    '</button>',
    '<h4 class="options">{{t "options"}}</h4>',
    '<div class="option-type size">{{t "size"}}:</div>',
    '<input id="size-selector" type="range" min="1" name="size" value="100">',
    '<span id="size-label">{{t "selected-size"}}: <span>100%</span></span>',
    '<div class="option-type rotation">{{t "rotation"}}:</div>',
    '<label class="radio-inline"><input type="radio" name="rotation" data-rotation="0" checked>0°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" data-rotation="90">90°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" data-rotation="180">180°</label>',
    '<label class="radio-inline"><input type="radio" name="rotation" data-rotation="270">270°</label>',
    '<div class="option-type quality">{{t "quality"}}:</div>',
    '<label class="radio-inline"><input type="radio" name="quality" data-quality="default" checked>{{t "default"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" data-quality="color">{{t "color"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" data-quality="gray">{{t "gray"}}</label>',
    '<label class="radio-inline"><input type="radio" name="quality" data-quality="bitonal">{{t "bitonal"}}</label>',
    '<hr>',
    '<h4 class="options">{{t "preview"}} <i class="fa fa-spinner" aria-hidden="true"></i></h4>',
    '<h5>{{t "preview-image-link"}}</h5>',
    '<img id="preview-image" alt="{{t "preview-image-error"}}">',
    '<div id="license-message" role="alert">',
    '{{t "license-message"}}:',
    '<a href="#" id="license-link" target="_blank"></a>',
    '</div>',
    '</div>',
    '<div class="modal-footer">',
    '<button type="button" class="btn btn-default" data-dismiss="modal">{{t "close"}}</button>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')),

  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function(){
    for(var language in this.locales){
      i18next.addResources(
        language, 'translation',
        this.locales[language]
      );
    }
  },

  /* adds event handlers to the modal */
  addModalEventHandlers: function(){
    $(document.body).on('click', '#image-cropper-modal #copy-to-clipboard', function(){
      $('#image-cropper-modal #image-url').select();
      document.execCommand('copy');
    });
    $(document.body).on('change', 'input[name="size"], input[name="rotation"], input[name="quality"]', function(event){
      var buttonName = $(event.target).attr('name');
      if(buttonName === 'size'){
        var size = $(event.target).val();
        this.imageUrlParams.size = 'pct:'.concat(size);
        $('#image-cropper-modal #size-label > span').text(size.concat('%'));
      }else if(buttonName === 'rotation'){
        this.imageUrlParams.rotation = $(event.target).data('rotation');
      }else if(buttonName === 'quality'){
        this.imageUrlParams.quality = $(event.target).data('quality');
      }
      $('#image-cropper-modal #image-url').attr(
        'value', this.imageUrlTemplate(this.imageUrlParams)
      ).select();
      $('#image-cropper-modal #preview-image-link').attr(
        'href', this.imageUrlTemplate(this.imageUrlParams)
      );
      $('#image-cropper-modal .fa-spinner').addClass('fa-spin').show();
      $('#image-cropper-modal #preview-image').attr(
        'src', this.imageUrlTemplate($.extend({}, this.imageUrlParams, {'size': 'full'}))
      ).on('error load', function(){
        $('#image-cropper-modal .fa-spinner').hide().removeClass('fa-spin');
      });
    }.bind(this));
  },

  /* calculates the image bounds as window coordinates */
  calculateImageBounds: function(osdViewport, windowId){
    var windowTopLeft = osdViewport.imageToWindowCoordinates(new OpenSeadragon.Point(0, 0));
    var windowTopRight = osdViewport.imageToWindowCoordinates(new OpenSeadragon.Point(
      this.imageDimensions[windowId].width, 0
    ));
    var windowBottomLeft = osdViewport.imageToWindowCoordinates(new OpenSeadragon.Point(
      0, this.imageDimensions[windowId].height
    ));
    return {
      'topLeft': windowTopLeft,
      'topRight': windowTopRight,
      'bottomLeft': windowBottomLeft
    };
  },

  /* converts web to image coordinates */
  calculateImageCoordinates: function(dimensions, osdViewport, validate, relative, windowId){
    var webTopLeft = new OpenSeadragon.Point(dimensions.left, dimensions.top);
    var webTopRight = new OpenSeadragon.Point(dimensions.left + dimensions.width, dimensions.top);
    var webBottomLeft = new OpenSeadragon.Point(dimensions.left, dimensions.top + dimensions.height);

    var imageTopLeft = osdViewport.viewportToImageCoordinates(
      osdViewport.pointFromPixelNoRotate(webTopLeft)
    );
    var imageTopRight = osdViewport.viewportToImageCoordinates(
      osdViewport.pointFromPixelNoRotate(webTopRight)
    );
    var imageBottomLeft = osdViewport.viewportToImageCoordinates(
      osdViewport.pointFromPixelNoRotate(webBottomLeft)
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
      imageCoordinates.x = parseFloat(((imageCoordinates.x / this.imageDimensions[windowId].width) * 100).toFixed(roundingPrecision));
      imageCoordinates.y = parseFloat(((imageCoordinates.y / this.imageDimensions[windowId].height) * 100).toFixed(roundingPrecision));
      imageCoordinates.w = parseFloat(((imageCoordinates.w / this.imageDimensions[windowId].width) * 100).toFixed(roundingPrecision));
      imageCoordinates.h = parseFloat(((imageCoordinates.h / this.imageDimensions[windowId].height) * 100).toFixed(roundingPrecision));
    }

    return imageCoordinates;
  },

  /* calculates the positions of the given element and the cursor */
  calculatePositions: function(element, event){
    return {
      'element': element.offset(),
      'mouse': { 'top': event.pageY, 'left': event.pageX }
    };
  },

  /* changes the overlay dimensions depending on the resize element */
  changeOverlayDimensions: function(type, mousePosition, offsets, element, osdViewport, windowId){
    var imageBounds = this.calculateImageBounds(osdViewport, windowId);
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
  changeOverlayPosition: function(positions, offsets, overlay, parent, osdViewport, windowId){
    var newElementTop = positions.mouse.top - offsets.canvas.top - offsets.mouse.y;
    var newElementLeft = positions.mouse.left - offsets.canvas.left - offsets.mouse.x;
    var elementHeight = overlay.height();
    var elementWidth = overlay.width();

    var imageCoordinates = this.calculateImageCoordinates({
      'top': newElementTop,
      'left': newElementLeft,
      'height': elementHeight,
      'width': elementWidth
    }, osdViewport, false, false);
    var imageBounds = this.calculateImageBounds(osdViewport, windowId);

    if(imageCoordinates.y < 0){
      newElementTop = imageBounds.topLeft.y - offsets.canvas.top;
    }
    if(newElementTop < 0){
      newElementTop = 0;
    }
    if(imageCoordinates.x < 0){
      newElementLeft = imageBounds.topLeft.x - offsets.canvas.left;
    }
    if(newElementLeft < 0){
      newElementLeft = 0;
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

  /* extracts the license link from the manifest entry */
  getLicenseInformation: function(license){
    if(typeof license !== 'undefined'){
      return $(Mirador.MetadataView.prototype.addLinksToUris(license)).attr('href');
    }
    return false;
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
    this.injectWindowEventHandler();
    this.injectOverlayToCanvas();
    this.injectModalToDom();
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
      this.element.on('mousedown', '.cropping-overlay > .resize-frame', function(event){
        if(event.which === 1){
          this_.dragging = true;
          currentPositions = this_.calculatePositions($(this).parent(), event);
          offsets.canvas = $(this).closest('.mirador-osd').offset();
          offsets.mouse = {
            'x': currentPositions.mouse.left - currentPositions.element.left,
            'y': currentPositions.mouse.top - currentPositions.element.top
          };
        }
      }).on('mousemove', '.mirador-osd', function(event){
        if(this_.dragging){
          event.preventDefault();
          currentPositions = this_.calculatePositions(this.croppingOverlay, event);
          this_.changeOverlayPosition(
            currentPositions, offsets, this.croppingOverlay,
            event.currentTarget, this.osd.viewport, this.windowId
          );
        }
      }.bind(this)).on('mouseup', '.cropping-overlay > .resize-frame', function(){
        this_.dragging = false;
      });
    };
  },

  /* injects the modal to the dom */
  injectModalToDom: function(){
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function(){
      origFunc.apply(this);
      var options = this.state.getStateProperty('imageCropper');
      if($.isPlainObject(options)){
        this_.options = options;
      }
      document.body.insertAdjacentHTML('beforeend', this_.modalTemplate());
    };
    this.addModalEventHandlers();
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
      this.element.on('mousedown', '.resize-anchor, .resize-bar', function(event){
        if(event.which === 1){
          typeOfResizeElement = event.target.className.split(' ').pop();
          this_.resizing = true;
          offsets.canvas = $(this).closest('.mirador-osd').offset();
          offsets.element = $(this).parent().offset();
        }
      }).on('mousemove', '.mirador-osd', function(event){
        if(this_.resizing){
          event.preventDefault();
          currentMousePosition = this_.calculatePositions(this.croppingOverlay, event).mouse;
          this_.changeOverlayDimensions(
            typeOfResizeElement, currentMousePosition, offsets,
            this.croppingOverlay, this.osd.viewport, this.windowId
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
      this.element.on('click', '.cropping-overlay > .share-button', function(event){
        var currentImage = this.imagesList[this.currentImgIndex];
        var service = currentImage.images[0].resource.service || currentImage.images[0].resource.default.service;
        var currentOverlayDimensions = $.extend(
          $(event.target).closest('.cropping-overlay').position(), {
            'height': $(event.target).closest('.cropping-overlay').height(),
            'width': $(event.target).closest('.cropping-overlay').width()
        });
        var license = false;
        if(this_.options.showLicense){
          license = this_.getLicenseInformation(this.manifest.jsonLd.license);
        }
        this_.imageUrlParams = {
          'imageBaseUrl': Mirador.Iiif.getImageUrl(currentImage),
          'region': this_.calculateImageCoordinates(
            currentOverlayDimensions, this.osd.viewport, true, true, this.windowId
          ),
          'size': 'full',
          'rotation': 0,
          'quality': Mirador.Iiif.getVersionFromContext(service['@context']) === '2.0' ? 'default' : 'native'
        };
        $('#image-cropper-modal #image-url').attr(
          'value', this_.imageUrlTemplate(this_.imageUrlParams)
        );
        $('#image-cropper-modal #preview-image-link').attr(
          'href', this_.imageUrlTemplate(this_.imageUrlParams)
        );
        $('#image-cropper-modal .fa-spinner').addClass('fa-spin').show();
        $('#image-cropper-modal #preview-image').attr(
          'src', this_.imageUrlTemplate(this_.imageUrlParams)
        ).on('error load', function(){
          $('#image-cropper-modal .fa-spinner').hide().removeClass('fa-spin');
        });
        $($('#image-cropper-modal').find('.quality + label > input')).attr(
          'data-quality', this_.imageUrlParams.quality
        );
        $($('#image-cropper-modal').find('.quality + label > span')).text(
          this_.imageUrlParams.quality
        );
        $('#image-cropper-modal').modal('show');
        $('#image-cropper-modal').on('shown.bs.modal', function(){
          $('#image-cropper-modal #image-url').select();
        });
        $('#image-cropper-modal').on('hidden.bs.modal', function(){
          $($('#image-cropper-modal').find('.option-type + label > input')).prop(
            'checked', true
          );
          $('#image-cropper-modal .option-type + input[name="size"]').val(100);
          $('#image-cropper-modal #size-label > span').text('100%');
        });
        if(license){
          $('#license-link').attr('href', license).text(license);
          $('#license-message').show();
        }else{
          $('#license-message').hide();
          $('#license-link').attr('href', '#').text('');
        }
      }.bind(this));
    };
  },

  /* injects an event handler for saving the image dimensions in the windows */
  injectWindowEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Window.prototype.listenForActions;
    Mirador.Window.prototype.listenForActions = function(){
      origFunc.apply(this);
      this.eventEmitter.subscribe('windowUpdated', function(event, data){
        if (this.id !== data.id || !data.viewType) {
          return;
        }
        if (data.viewType === 'ImageView') {
          this_.imageDimensions[this.id] = {
            'height': this.canvases[data.canvasID].canvas.height,
            'width': this.canvases[data.canvasID].canvas.width
          };
        }

      }.bind(this));
    };
  }
};

$(document).ready(function(){
  ImageCropper.init();
});
