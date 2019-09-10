/** TODO:
 * - Get rid of the scale{X,Y}(-1) mucking, which makes parsing the whole
 *   positioning logic unneccesarily complicated
 * - Add option to change the ruler visibility during runtime
 * - Clear up variable naming, there are far too many different confusingly
 *   named "factors" involved
 * - General heavy refactoring
 * - Evaluate using SVG for drawing the rulers
 */

// Array.prototype.find polyfill
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var thisArg = arguments[1];
      var k = 0;
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        k++;
      }
      return undefined;
    }
  });
}

// Hook up OpenSeadragon plugin
(function(osd) {
  // ChildNode.remove() polyfill
  // from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
  (function (arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          this.parentNode.removeChild(this);
        }
      });
    });

  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);


  osd.Viewer.prototype.enableDocumentRuler = function(options, tiledImage) {
    if (!this.rulerInstance) {
      options = options || {};
      options.viewer = this;
      this.rulerInstance = new osd.DocumentRuler(options);
    }
    if (tiledImage) {
      this.rulerInstance.refresh(tiledImage);
    }
  };

  osd.Viewer.prototype.hideDocumentRuler = function() {
    this.rulerInstance.hide();
  };

  osd.Viewer.prototype.showDocumentRuler = function() {
    this.rulerInstance.show();
  };

  osd.Viewer.prototype.disableDocumentRuler = function() {
    if (!this.rulerInstance) {
      return;
    }
    this.rulerInstance.unregister();
    this.rulerInstance = null;
  };

  /** Construct a new ruler.
   *
   * Options are:
   *  location:   'top-left', 'top-right', 'bottom-left', 'bottom-right'
   *  smallDashSize: Size of small unit dashes in pixels
   *  largeDashSize: Size of large unit dashes in pixels
   *  pixelsPerMillimeter: How many pixels per millimeter?
   *  imperialUnits: Use imperial units instead of metric?
   *  color: RGB color to use for the rulers,
   *  labelPrecision: Numboer of decimal places to use for labels
   */
  osd.DocumentRuler = function(options) {
    options = options || {};
    if (!options.viewer) {
      throw new Error("A viewer must be specified.");
    }

    // Set up instance state
    this.viewer = options.viewer;
    this.location = osd.DocumentRuler.LOCATION_MAPPING[options.location || 'bottom-left'];
    this.smallDashSize = options.smallDashSize || 10;
    this.largeDashSize = options.largeDashSize || 15;
    this.pixelsPerMillimeter = options.pixelsPerMillimeter;
    this.labelsEvery = options.labelsEvery || 5;
    this.imperialUnits = options.imperialUnits || false;
    this.color = options.color || "#ffffff";
    this.labelPrecision = options.labelPrecision || 3;

    // Offscreen canvas for measuring text size
    this._canvas = document.createElement('canvas');

    // Create DOM elements and add them to OSD
    this.elems = {
      horizontal: this.makeRulerElements('horizontal'),
      vertical: this.makeRulerElements('vertical'),
      unit: this.makeUnitElement()
    };
    this.parentElement = document.createElement('div');
    this.parentElement.style.visibility = options.show ? 'visible': 'hidden';
    this.parentElement.appendChild(this.elems.horizontal.ruler);
    this.parentElement.appendChild(this.elems.unit);
    this.parentElement.appendChild(this.elems.vertical.ruler);
    this.viewer.container.appendChild(this.parentElement);

    // Register OSD callbacks
    var self = this;
    this._handlers = [
      this.viewer.addHandler("open", function() {
        self.refresh();
        self.updateSize();
      }),
      this.viewer.addHandler("animation", function() {
        self.refresh();
      }),
      this.viewer.addHandler("resize", function() {
        self.refresh();
        self.updateSize();
      })
    ];
  };

  osd.DocumentRuler.Location = {
    TOP_LEFT: [0, 0],
    TOP_RIGHT: [1, 0],
    BOTTOM_LEFT: [0, 1],
    BOTTOM_RIGHT: [1, 1],
  };

  osd.DocumentRuler.LOCATION_MAPPING = {
    'top-left': osd.DocumentRuler.Location.TOP_LEFT,
    'top-right': osd.DocumentRuler.Location.TOP_RIGHT,
    'bottom-left': osd.DocumentRuler.Location.BOTTOM_LEFT,
    'bottom-right': osd.DocumentRuler.Location.BOTTOM_RIGHT
  };

  /**
  * { conversionFactor: factor to multiply mm with to arrive at 1 <unit>,
  *   labelFactors: array of label factors to support for this unit, i.e.
  *                 [1, 10] will dynamically choose between 1<unit> and 10<unit>
  *                 labels, depending on the scale,
  *   unit: String representation of the unit
  **/
  osd.DocumentRuler.UNITS = {
    metric: [
      { conversionFactor: 1e-6,
        labelFactors: [0.1, 1, 10, 1000, 1e4],
        unit: 'nm' },
      { conversionFactor: 0.001,
        labelFactors: [1, 10],
        unit: 'μm' },
      { conversionFactor: 0.1,
        labelFactors: [0.1, 1],
        unit: 'mm' },
      { conversionFactor: 10,
        labelFactors: [1, 10],
        unit: 'cm' },
      { conversionFactor: 1000,
        labelFactors: [1, 10, 100],
        unit: 'm' },
      { conversionFactor: 1e6,
        labelFactors: [0.1, 1, 10, 100, 1000, 1000],
        unit: 'km' },
      { conversionFactor: 94607304725808000,
        labelFactors: [1e-9, 1e-6, 1e-3, 1, 1e3, 1e6, 1e9],
        unit: 'ly' }],
    imperial: [
      { conversionFactor: 25.4,
        labelFactors: [1e-9, 1e-6, 1e-3, 0.01, 1],
        unit: 'in' },
      { conversionFactor: 25.4 * 12,
        labelFactors: [1],
        unit: 'ft' },
      { conversionFactor: 25.4 * 12 * 5280,
        labelFactors: [1e-6, 1e-3, 0.1, 1, 10, 100, 1e3, 1e6],
        unit: 'ml' }]
  };


  osd.DocumentRuler.prototype = {
    // DOM elements used for the ruler
    elems: {
      large: undefined,
      small: undefined,
      unit: undefined,
    },

    // Other instance state
    location: undefined,
    pointsPerMillimeter: undefined,
    smallDashSize: undefined,
    largeDashSize: undefined,

    unregister: function() {
      this.viewer.container.removeChild(this.parentElement);
      this._handlers.forEach(function(h) {
        this.viewer.removeHandler(h);
      }.bind(this));
    },

    hide: function() {
      this.parentElement.style.visibility = 'hidden';
    },

    show: function() {
      this.parentElement.style.visibility = 'visible';
    },

    /** Create the DOM element used for displaying the scale unit **/
    makeUnitElement: function() {
      var elem = document.createElement('span');
      elem.className = 'ruler-unit';
      var margin = (this.largeDashSize * 1.25) + 'px';
      elem.style.position = "absolute";
      if (this.location[0] === 0) {
        elem.style.left = margin;
      } else {
        elem.style.right = margin;
      }
      if (this.location[1] === 0) {
        elem.style.top = margin;
      } else {
        elem.style.bottom = margin;
      }
      elem.style.color = this.color;
      return elem;
    },

    /** Create the ruler DOM elements for the given direction (horizontal
     *  or vertical) */
    makeRulerElements: function(direction) {
      // Basic styling for parent element
      var rulerElem = document.createElement('div');
      rulerElem.style.position = 'absolute';
      rulerElem.style.transition = 'all 0.1s ease-in';

      var smallScale = document.createElement('div');
      smallScale.style.position = "absolute";
      smallScale.style.backgroundRepeat = 'repeat';

      var largeScale = document.createElement('div');
      largeScale.style.position = "absolute";
      largeScale.style.backgroundRepeat = 'repeat';

      // Positioning
      if (this.location[0] === 0) {  // left?
        if (direction === 'horizontal') {
          rulerElem.style.marginLeft = this.largeDashSize + 'px';
        }
        rulerElem.style.left = 0;
      } else {
        if (direction === 'horizontal') {
          rulerElem.style.marginRight = this.largeDashSize + 'px';
          rulerElem.style.transform += " scaleX(-1)";
        } else {
          smallScale.style.right = 0;
          largeScale.style.right = 0;
        }
        rulerElem.style.right = 0;
      }
      if (this.location[1] === 0) { // top?
        if (direction === 'vertical') {
          rulerElem.style.marginTop = this.largeDashSize + 'px';
        }
        rulerElem.style.top = 0;
      } else {
        if (direction === 'vertical') {
          rulerElem.style.marginBottom = this.largeDashSize + 'px';
        }
        rulerElem.style.bottom = 0;
        rulerElem.style.transform += ' scaleY(-1)';
      }

      if (direction == 'horizontal') {
        smallScale.style.height = this.smallDashSize + 'px';
        smallScale.style.backgroundImage = 'linear-gradient(to left, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        smallScale.style.backgroundImage = '-moz-linear-gradient(left, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        smallScale.style.backgroundImage = '-webkit-linear-gradient(left, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.height = this.largeDashSize + 'px';
        largeScale.style.backgroundImage = 'linear-gradient(to left, ' + this.color + ' 2px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(left, ' + this.color + ' 2px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(left, ' + this.color + ' 2px, rgba(0, 0, 0, 0) 0px)';
      } else {
        smallScale.style.width = this.smallDashSize + 'px';
        smallScale.style.backgroundImage = 'linear-gradient(to top, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        smallScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        smallScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color + ' 1px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.width = this.largeDashSize + 'px';
        largeScale.style.backgroundImage = 'linear-gradient(to top, ' + this.color + ' 2px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 2px, rgba(0, 0, 0, 0) 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color +  ' 2px, rgba(0, 0, 0, 0) 0px)';
      }
      rulerElem.appendChild(smallScale);
      rulerElem.appendChild(largeScale);
      return {
        ruler: rulerElem,
        small: smallScale,
        large: largeScale,
        labels: []
      };
    },

    /** Calculate the new pixels<->physicalUnit factor and update the scales  **/
    refresh: function(tiledImage) {
      if (tiledImage instanceof OpenSeadragon.TiledImage && tiledImage != this.tiledImage) {
        this.tiledImage = tiledImage;
      }
      if (this.tiledImage) {
        var viewport = this.viewer.viewport;
        var zoom = this.tiledImage.viewportToImageZoom(viewport.getZoom(true));
        var currentPixelsPerMillimeter = zoom * this.pixelsPerMillimeter;
        this.updateScales(currentPixelsPerMillimeter);
      }
    },

    /** Update the scales with the new pixelsPerMillimeter value **/
    updateScales: function(pixelsPerMillimeter) {
      var scaleInfo = this.getScalesInfo(pixelsPerMillimeter);
      this.elems.horizontal.small.style.backgroundSize = Math.round(scaleInfo.small) + 'px 100%';
      this.elems.horizontal.large.style.backgroundSize = Math.round(scaleInfo.small) * scaleInfo.largeFactor + 'px 100%';
      this.elems.vertical.small.style.backgroundSize = '100% ' + Math.round(scaleInfo.small) + 'px';
      this.elems.vertical.large.style.backgroundSize = '100% ' + Math.round(scaleInfo.small) * scaleInfo.largeFactor + 'px';
      if (this.elems.unit.text !== scaleInfo.unit) {
        this.elems.unit.textContent = scaleInfo.unit;
      }
      this.updateLabels('horizontal', scaleInfo);
      this.updateLabels('vertical', scaleInfo);
    },


    /** Update the labels on the given scale **/
    updateLabels: function(direction, scaleInfo) {
      var numLabels;
      if (direction === 'vertical') {
        numLabels = Math.ceil(this.viewer.viewport.containerSize.y / (Math.round(scaleInfo.small) * scaleInfo.largeFactor) / this.labelsEvery);
      } else {
        numLabels = Math.ceil(this.viewer.viewport.containerSize.x / (Math.round(scaleInfo.small) * scaleInfo.largeFactor) / this.labelsEvery);
      }
      var labelDistance = this.labelsEvery * (scaleInfo.small / scaleInfo.largeFactor);
      var currentLabels = this.elems[direction].labels;
      if (currentLabels.length < numLabels) {
        while (currentLabels.length < numLabels) {
          var labelElem = document.createElement("span");
          labelElem.className = "ruler-label";
          labelElem.style.color = this.color;
          labelElem.style.position = "absolute";
          if (this.location[0] === 1 && direction === 'horizontal') {
            labelElem.style.transform += " scaleX(-1)";
          }
          if (this.location[1] === 1) {
            labelElem.style.transform += " scaleY(-1)";
          }
          currentLabels.push(labelElem);
          this.elems[direction].ruler.appendChild(labelElem);
        }
      } else if (currentLabels.length > numLabels) {
        var numToRemove = currentLabels.length - numLabels;
        currentLabels.slice(-numToRemove).forEach(function(elem) {
          elem.remove();
        });
        this.elems[direction].labels = currentLabels.slice(0, numLabels);
      }
      var textMeasureContext = this._canvas.getContext("2d");
      textMeasureContext.font = "'Open Sans', 'Lucida Grande', Verdana, Arial, sans-serif";
      currentLabels.forEach(function(label, idx) {
        if (idx === 0) {
          return;
        }
        var labelNumber = idx * scaleInfo.labelFactor * this.labelsEvery;
        var text;
        if (labelNumber < 1e-4 || labelNumber > 1e4) {
          label.style.whiteSpace = "nowrap";
          text = labelNumber.toExponential(this.labelPrecision);
        } else {
          text = Number(labelNumber.toFixed(this.labelPrecision));
        }
        if (direction === 'vertical') {
          var textHeight = 17;
          if (this.location[0] === 0) {
            label.style.left = this.largeDashSize * 1.5 + 'px';
          } else {
            label.style.right = this.largeDashSize * 1.5 + 'px';
          }
          var verticalMargin = (this.labelsEvery * idx * Math.round(scaleInfo.small) * scaleInfo.largeFactor - (textHeight / 2)) + 'px';
          label.style.top = verticalMargin;
        } else {
          var textWidth = textMeasureContext.measureText(text).width;
          var horizontalMargin = (this.labelsEvery * idx * Math.round(scaleInfo.small) * scaleInfo.largeFactor - (textWidth / 1)) + 'px';
          label.style.top = this.largeDashSize * 1.5 + 'px';
          label.style.left = horizontalMargin;
        }
        label.textContent = text;
      }, this);
    },

    /** Update the size (width or height, depending on direction) of the rulers **/
    updateSize: function() {
      this.elems.horizontal.small.style.width = this.viewer.viewport.containerSize.x + 'px';
      this.elems.horizontal.large.style.width = this.viewer.viewport.containerSize.x + 'px';
      this.elems.vertical.small.style.height = this.viewer.viewport.containerSize.y + 'px';
      this.elems.vertical.large.style.height = this.viewer.viewport.containerSize.y + 'px';
    },

    /** Return the pixel steps for the small and large scales, the factor
     *  used for the labels on the large scale as well as the unit to display. */
    getScalesInfo: function(pixelsPerMillimeter) {
      function getPixelsPerSmallDash(conversionFactor, largeFactor, labelFactor) {
        return (conversionFactor * pixelsPerMillimeter * labelFactor) / largeFactor;
      }

      function getLargeFactor(unitDef, labelFactor) {
        if (this.imperialUnits && unitDef.unit === 'in' && labelFactor === 1) {
          return 8;
        } else {
          return 10;
        }
      }

      var units = this.imperialUnits ? osd.DocumentRuler.UNITS.imperial : osd.DocumentRuler.UNITS.metric;

      var unitDefinition = units.find(function(unitDef) {
        var labelFactor = unitDef.labelFactors.slice(-1)[0];
        var largeFactor = getLargeFactor(unitDef, labelFactor);
        return getPixelsPerSmallDash(unitDef.conversionFactor,  largeFactor, labelFactor) > 2;
      });
      var labelFactor = unitDefinition.labelFactors.find(function(factor) {
        var largeFactor = getLargeFactor(unitDefinition, factor);
        return getPixelsPerSmallDash(unitDefinition.conversionFactor, largeFactor, factor) > 2;
      });

      var largeFactor = getLargeFactor(unitDefinition, labelFactor);

      return {
        small: unitDefinition.conversionFactor * labelFactor * pixelsPerMillimeter * (1 / largeFactor),
        largeFactor: largeFactor,
        labelFactor: labelFactor,
        unit: unitDefinition.unit
      };
    }
  };
}(OpenSeadragon));


// Hook up Mirador plugin
(function(mirador) {
  function patchInit() {
    var oldFn = mirador.ImageView.prototype.init;
    mirador.ImageView.prototype.init = function() {
      oldFn.apply(this);
      this.physicalRulerPlugin = new mirador.PhysicalRulerPlugin(
        this.appendTo[0],
        this.osd,
        this.state.getStateProperty("physicalRuler") || {});
    };
  }

  function patchShowImage() {
    var oldFn = mirador.ImageView.prototype.showImage;
    mirador.ImageView.prototype.showImage = function(evt, imgRes) {
      oldFn.apply(this, [evt, imgRes]);
      if (imgRes.osdTiledImage) {
        var service = imgRes.parent.canvas.service;
        var _this = this;
        this.physicalRulerPlugin.checkDimensionsService(service, function(service) {
          _this.physicalRulerPlugin.enable(service);
          _this.physicalRulerPlugin.update(imgRes.osdTiledImage);
        });
      }
    };
  }

  function patchHideImage() {
    var oldFn = mirador.ImageView.prototype.hideImage;
    mirador.ImageView.prototype.hideImage = function(evt, imgRes) {
      oldFn.apply(this, [evt, imgRes]);
      var service = imgRes.parent.canvas.service;
      this.physicalRulerPlugin.checkDimensionsService(
        service, function() {
          this.physicalRulerPlugin.disable();
        }.bind(this));
    };
  }

  function patchLoadImage() {
    var oldLoadImage = mirador.ImageView.prototype.loadImage;
    mirador.ImageView.prototype.loadImage = function(event, imageResource) {
      var _this = this;
      if ("drawn" !== imageResource.status) {
        imageResource.setStatus("requested");
        var bounds = imageResource.getGlobalBounds();
        _this.osd.addTiledImage({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          tileSource: imageResource.tileSource,
          opacity: imageResource.opacity,
          clip: imageResource.clipRegion,
          index: imageResource.zIndex,
          success: function(event) {
            var tiledImage = event.item;
            // <monkeyPatch>
            if (!_this.osd.rulerInstance) {
              var service = imageResource.parent.canvas.service;
              _this.physicalRulerPlugin.checkDimensionsService(service, function(service) {
                _this.physicalRulerPlugin.enable(service);
                _this.physicalRulerPlugin.update(tiledImage);
              });
            } else {
                _this.physicalRulerPlugin.update(tiledImage);
            }
            // </monkeyPatch>
            imageResource.osdTiledImage = tiledImage;
            imageResource.setStatus("loaded");
            _this.syncAllImageResourceProperties(imageResource);
            var tileDrawnHandler = function(event) {
              if(event.tiledImage === tiledImage) {
                imageResource.setStatus("drawn");
                 _this.osd.removeHandler("tile-drawn", tileDrawnHandler);
              }
            };
            _this.osd.addHandler("tile-drawn", tileDrawnHandler);
          },
          error: function(event) {
            imageResource.setStatus("failed");
          }
        });
      }
    };
  }

  mirador.PhysicalRulerPlugin = function(viewElem, osd, config) {
    this.viewElem = viewElem;
    this.osd = osd;
    this.config = config;
    this.config.show = false;
  };

  mirador.PhysicalRulerPlugin.prototype = {
    buttonTemplate: mirador.Handlebars.compile([
      '<div class="mirador-ruler-controls">',
      '<a class="mirador-ruler-toggle hud-control{{#if active}} selected{{/if}}"',
      '   role="button" title="{{t "toggle-ruler"}}" aria-label="{{t "toggle-ruler"}}">',
      '    <i class="material-icons">straighten</i>',
      '  </a>',
      '</div>'].join('\n')),

    modalTemplate: mirador.Handlebars.compile([
      '<div class="modal fade ruler-info" tabindex="-1" role="dialog">',
      '<div class="modal-dialog" role="document">',
      '<div class="modal-content">',
      '<div class="modal-header">',
      '<button type="button" class="close" data-dismiss="modal" aria-label="Close">',
      '<span aria-hidden="true">&times;</span></button>',
      '<h4 class="modal-title">{{t "ruler-info-heading"}}</h4>',
      '</div>',
      '<div class="modal-body">',
      '{{t "ruler-info"}}',
      '</div>',
      '<div class="modal-footer">',
      '<button type="button" class="btn btn-default" data-dismiss="modal">OK</button>',
      '</div>',
      '</div>',
      '</div>',
      '</div>'
    ].join('\n')),

    checkDimensionsService: function(service, cb) {
      if (service && Array.isArray(service)) {
        service = service.find(function(s) {
          return s.profile === "http://iiif.io/api/annex/services/physdim";
        });
      }
      if (service && service.profile === "http://iiif.io/api/annex/services/physdim") {
        if ((!service.physicalScale || !service.physicalUnits) && service['@id']) {
          // Remote Service
          jQuery.getJSON(service['@id'], function(remoteService) {
            jQuery.extend(service, remoteService);
            cb(service);
          });
          return true;
        } else if (service.physicalScale && service.physicalUnits) {
          // Embedded Service
          cb(service);
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },

    enable: function(service) {
      if (service && service.profile === "http://iiif.io/api/annex/services/physdim") {
        var millimetersPerPhysicalUnit = {
          'mm': 1.0,
          'cm': 10.0,
          'in': 25.4
        };
        this.config.pixelsPerMillimeter = 1 / (millimetersPerPhysicalUnit[service.physicalUnits] * service.physicalScale);
        jQuery.extend(true, this.osd, {
          documentRulerConfig: this.config
        });
        this.osd.enableDocumentRuler(this.osd.documentRulerConfig);

        if (this.config.show) {
          this.toggleStyleAdjustments();
        }

        // Add HUD button
        var button = jQuery(this.buttonTemplate({'active': this.config.show}))[0];
        button.addEventListener('click', function() {
          /* jshint ignore:start */
          this.config.show ? this.hide() : this.show();
          /* jshint ignore:end */
        }.bind(this));
        this.viewElem.querySelector('.hud-container').appendChild(button);
      }
    },

    toggleStyleAdjustments: function() {
      ['.mirador-osd-context-controls', '.mirador-osd-previous'].forEach(function(sel) {
        var elem = this.viewElem.querySelector(sel);
        if (!elem.style.left) {
          elem.style.left = '2.3%';
        } else {
          elem.style.left = '';
        }
      }.bind(this));
    },

    handleInfoModal: function() {
      if (localStorage.getItem("rulerInfoShowed")) {
        return;
      }
      // Add info modal to the DOM
      document.body.insertAdjacentHTML('beforeend', this.modalTemplate());
      jQuery('.ruler-info').modal('show').on('hidden.bs.modal', function() {
        localStorage.setItem("rulerInfoShowed", true);
      });
    },

    show: function() {
      this.config.show = true;
      this.osd.showDocumentRuler();
      this.toggleStyleAdjustments();
      this.handleInfoModal();
      this.viewElem.querySelector('.mirador-ruler-toggle').classList.add("selected");
    },

    hide: function() {
      this.config.show = false;
      this.osd.hideDocumentRuler();
      this.toggleStyleAdjustments();
      this.viewElem.querySelector('.mirador-ruler-toggle').classList.remove("selected");
    },

    disable: function() {
      this.osd.disableDocumentRuler();
      if (this.config.show) {
        this.toggleStyleAdjustments();
      }
      var hudElement = this.viewElem.querySelector('.hud-container');
      hudElement.removeChild(
        hudElement.querySelector('.mirador-ruler-controls'));
    },

    update: function(tiledImage) {
        this.osd.rulerInstance.tiledImage = tiledImage;
        this.osd.rulerInstance.refresh();
        this.osd.rulerInstance.updateSize();
    }
  };

  var locales = {
    'de': {
      'ruler-info': [
        'Aufgrund von technischen Einschränkungen beim Scan-Prozess sind die hier dargestellten Abmessungen lediglich als ungefähr zu verstehen.',
        'Sie eignen sich nicht für Zwecke, die wissenschaftliche Exaktheit verlangen.'
      ].join(' '),
      'ruler-info-heading': 'Anmerkung zur Lineal-Funktionalität',
      'toggle-ruler': 'Lineal'
    },
    'en': {
      'ruler-info': [
        'Due to technical limitations in the scanning process, the dimensions shown here are approximate.',
        'They are not suitable for purposes that demand scientific accuracy.'
      ].join(' '),
      'ruler-info-heading': 'Note on the document ruler functionality',
      'toggle-ruler': 'Document Ruler'
    }
  };

  patchInit();
  patchShowImage();
  patchHideImage();
  patchLoadImage();
  i18next.on('initialized', function() {
    Object.keys(locales).forEach(function(lang) {
      i18next.addResources(lang, 'translation', locales[lang]);
    });
  });

  document.styleSheets[0].insertRule(
    ".ruler-label, .ruler-unit { text-shadow: rgb(0, 0, 0) 1px 1px 2px; }", 1);
}(Mirador));
