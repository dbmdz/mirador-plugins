/** TODO:
 * - Get rid of the scale{X,Y}(-1) mucking, which makes parsing the whole
 *   positioning logic unneccesarily complicated
 * - Add option to change the ruler visibility during runtime
 * - Clear up variable naming, there are far too many different confusingly
 *   named "factors" involved
 * - General heavy refactoring
 * - Evaluate using SVG for drawing the rulers
 */


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


  osd.Viewer.prototype.documentRuler = function(options) {
    if (!this.rulerInstance) {
      options = options || {};
      options.viewer = this;
      this.rulerInstance = new osd.DocumentRuler(options);
    } else {
      this.rulerInstance.refresh(options);
    }
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
    var parentElement = document.createElement('div');
    parentElement.appendChild(this.elems.horizontal.ruler);
    parentElement.appendChild(this.elems.unit);
    parentElement.appendChild(this.elems.vertical.ruler);
    this.viewer.container.appendChild(parentElement);

    // Register OSD callbacks
    var self = this;
    this.viewer.addHandler("open", function() {
      self.refresh();
      self.updateSize();
    });
    this.viewer.addHandler("animation", function() {
      self.refresh();
    });
    this.viewer.addHandler("resize", function() {
      self.refresh();
      self.updateSize();
    });
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

    /** Create the DOM element used for displaying the scale unit **/
    makeUnitElement: function() {
      var elem = document.createElement('span');
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
        smallScale.style.backgroundImage = 'linear-gradient(left, ' + this.color + '1px, transparent 0px)';
        smallScale.style.backgroundImage = '-moz-linear-gradient(left, ' + this.color + ' 1px, transparent 0px)';
        smallScale.style.backgroundImage = '-webkit-linear-gradient(left, ' + this.color + ' 1px, transparent 0px)';
        largeScale.style.height = this.largeDashSize + 'px';
        largeScale.style.backgroundImage = 'linear-gradient(left, ' + this.color + ' 2px, transparent 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(left, ' + this.color + ' 2px, transparent 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(left, ' + this.color + ' 2px, transparent 0px)';
      } else {
        smallScale.style.width = this.smallDashSize + 'px';
        smallScale.style.backgroundImage = 'linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        smallScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        smallScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        largeScale.style.width = this.largeDashSize + 'px';
        largeScale.style.backgroundImage = 'linear-gradient(top, ' + this.color + ' 2px, transparent 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 2px, transparent 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color +  ' 2px, transparent 0px)';
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
    refresh: function(options) {
      var viewport = this.viewer.viewport;
      var zoom = viewport.viewportToImageZoom(viewport.getZoom(true));
      var currentPixelsPerMillimeter = zoom * this.pixelsPerMillimeter;
      this.updateScales(currentPixelsPerMillimeter);
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
  }
}(OpenSeadragon));


// Hook up Mirador plugin
(function(mirador) {
  mirador.ImageView.prototype.enablePhysicalRuler = function(service) {
    var options = this.state.getStateProperty("physicalRuler") || {};
    if (service && service.profile === "http://iiif.io/api/annex/services/physdim") {
      var millimetersPerPhysicalUnit = {
        'mm': 1.0,
        'cm': 10.0,
        'in': 25.4
      };
      options.pixelsPerMillimeter = 1 / (millimetersPerPhysicalUnit[service.physicalUnits] * service.physicalScale);
      jQuery.extend(true, this.osd, {
        documentRulerConfig: options
      });
      this.osd.documentRuler(this.osd.documentRulerConfig);
      this.osd.rulerInstance.refresh();
      this.osd.rulerInstance.updateSize();
    }
  };

  var oldFn = mirador.ImageView.prototype.createOpenSeadragonInstance;
  mirador.ImageView.prototype.createOpenSeadragonInstance = function(imageUrl) {
    oldFn.apply(this, [imageUrl]);
    var _this = this;
    this.eventEmitter.subscribe('osdOpen.'+this.windowId, function() {
      var service = _this.currentImg.service;
      // Handle multiple services, try to find first physical dimensions service
      if (service && Array.isArray(service)) {
        service = service.find(function(s) {
          return service.profile === "http://iiif.io/api/annex/services/physdim";
        });
      }
      if (service && service.profile === "http://iiif.io/api/annex/services/physdim") {
        if ((!service.physicalScale || !service.physicalUnits) && service['@id']) {
          // Remote Service
          jQuery.getJSON(service['@id'], _this.enablePhysicalRuler.bind(_this));
        } else if (service.physicalScale && service.physicalUnits) {
          // Embedded Service
          _this.enablePhysicalRuler(service);
        } else {
          return;
        }

        // Adjust styling
        // move annotation, image tools away from scale
        document.querySelector('.mirador-osd-context-controls').style.left = '2.3%';
        // keep thumbnails and ruler from overlapping
        document.querySelector('.bottomPanel').style.left = '40px';
        // move navigation arrow right
        document.querySelector('.mirador-osd-previous').style.left = '2.3%';
      }
    });
  }
}(Mirador));
