/** TODO:
 * - Get rid of the scale{X,Y}(-1) mucking, which makes parsing the whole
 *   positioning logic unneccesarily complicated
 * - Add option to change the ruler visibility during runtime
 * - Fix configurability
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

  osd.DocumentRulerLocation = {
    TOP_LEFT: [0, 0],
    TOP_RIGHT: [1, 0],
    BOTTOM_LEFT: [0, 1],
    BOTTOM_RIGHT: [1, 1],
  };

  osd.DocumentRulerLocationMapping = {
    'top-left': osd.DocumentRulerLocation.TOP_LEFT,
    'top-right': osd.DocumentRulerLocation.TOP_RIGHT,
    'bottom-left': osd.DocumentRulerLocation.BOTTOM_LEFT,
    'bottom-right': osd.DocumentRulerLocation.BOTTOM_RIGHT
  }

  /** Construct a new ruler.
   *
   * Options are:
   *  location:   'top-left', 'top-right', 'bottom-left', 'bottom-right'
   *  smallDashSize: Size of small unit dashes in pixels
   *  largeDashSize: Size of large unit dashes in pixels
   *  pixelsPerMilimeter: How many pixels per milimeter?
   *  imperialUnits: Use imperial units instead of metric?
   *  color: RGB color to use for the rulers
   */
  osd.DocumentRuler = function(options) {
    options = options || {};
    if (!options.viewer) {
      throw new Error("A viewer must be specified.");
    }

    // Set up instance state
    this.viewer = options.viewer;
    this.location = osd.DocumentRulerLocationMapping[options.location || 'bottom-left'];
    this.smallDashSize = options.smallDashSize || 10;
    this.largeDashSize = options.largeDashSize || 15;
    this.pixelsPerMilimeter = options.pixelsPerMilimeter;
    this.labelsEvery = options.labelsEvery || 5;
    this.imperialUnits = options.imperialUnits || false;
    this.color = options.color || "#ffffff";

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

  osd.DocumentRuler.prototype = {
    // DOM elements used for the ruler
    elems: {
      large: undefined,
      small: undefined,
      unit: undefined,
    },

    // Other instance state
    location: undefined,
    pointsPerMilimeter: undefined,
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
        largeScale.style.backgroundImage = 'linear-gradient(left, ' + this.color + ' 3px, transparent 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(left, ' + this.color + ' 3px, transparent 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(left, ' + this.color + ' 3px, transparent 0px)';
      } else {
        smallScale.style.width = this.smallDashSize + 'px';
        smallScale.style.backgroundImage = 'linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        smallScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        smallScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color + ' 1px, transparent 0px)';
        largeScale.style.width = this.largeDashSize + 'px';
        largeScale.style.backgroundImage = 'linear-gradient(top, ' + this.color + ' 3px, transparent 0px)';
        largeScale.style.backgroundImage = '-moz-linear-gradient(top, ' + this.color + ' 3px, transparent 0px)';
        largeScale.style.backgroundImage = '-webkit-linear-gradient(top, ' + this.color +  ' 3px, transparent 0px)';
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
      var currentPixelsPerMilimeter = zoom * this.pixelsPerMilimeter;
      this.updateScales(currentPixelsPerMilimeter);
    },

    /** Update the scales with the new pixelsPerMilimeter value **/
    updateScales: function(pixelsPerMilimeter) {
      var scaleInfo = this.getScalesInfo(pixelsPerMilimeter);
      this.elems.horizontal.small.style.backgroundSize = scaleInfo.small + 'px 100%';
      this.elems.horizontal.large.style.backgroundSize = scaleInfo.large + 'px 100%';
      this.elems.vertical.small.style.backgroundSize = '100% ' + scaleInfo.small + 'px';
      this.elems.vertical.large.style.backgroundSize = '100% ' + scaleInfo.large + 'px';
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
        numLabels = Math.ceil(this.viewer.viewport.containerSize.y / scaleInfo.large / this.labelsEvery);
      } else {
        numLabels = Math.ceil(this.viewer.viewport.containerSize.x / scaleInfo.large / this.labelsEvery);
      }
      var labelDistance = this.labelsEvery * scaleInfo.large;
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
        var text = idx * scaleInfo.factor * this.labelsEvery;
        if (direction === 'vertical') {
          var textHeight = 17;
          if (this.location[0] === 0) {
            label.style.left = this.largeDashSize * 1.5 + 'px';
          } else {
            label.style.right = this.largeDashSize * 1.5 + 'px';
          }
          var verticalMargin = ((this.labelsEvery * idx * scaleInfo.large) - (textHeight / 2)) + 'px';
          label.style.top = verticalMargin;
        } else {
          var textWidth = textMeasureContext.measureText(text).width;
          var horizontalMargin = ((this.labelsEvery * idx * scaleInfo.large) - (textWidth / 1)) + 'px';
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
    getScalesInfo: function(pixelsPerMilimeter) {
      if (this.imperialUnits) {
        var pixelsPerEigthInch = (pixelsPerMilimeter * 25.4) / 8;
        if (pixelsPerEigthInch > 2) {
          return { large: 8 * pixelsPerEigthInch,
                  small: pixelsPerEigthInch,
                  factor: 1,
                  unit: 'in' };
        } else if (pixelsPerEigthInch > 0.125) {
          return { large: 5 * 8 * pixelsPerEigthInch,
                   small: 8 * pixelsPerEigthInch,
                   factor: 5,
                  unit: 'in' };
        } else {
          return { large: 12 * 8 * pixelsPerEigthInch,
                   small: 8 * pixelsPerEigthInch,
                   factor: 1,
                   unit: 'ft' };
        }
      } else {
        if (pixelsPerMilimeter > 2) {
          return { large: 10 * pixelsPerMilimeter,
                   small: pixelsPerMilimeter,
                   factor: 1,
                   unit: 'cm' };
        } else if (pixelsPerMilimeter > 0.1) {
          return { large: 100 * pixelsPerMilimeter,
                   small: 10 * pixelsPerMilimeter,
                   factor: 10,
                   unit: 'cm' };
        } else {
          return { large: 1000 * pixelsPerMilimeter,
                   small: 100 * pixelsPerMilimeter,
                   factor: 1,
                   unit: 'm' };
        }
      }
    }
  };
}(OpenSeadragon));


// Hook up Mirador plugin
(function(mirador) {
  var oldFn = mirador.ImageView.prototype.createOpenSeadragonInstance;
  mirador.ImageView.prototype.createOpenSeadragonInstance = function(imageUrl) {
    oldFn.apply(this, [imageUrl]);
    var _this = this;
    this.eventEmitter.subscribe('osdOpen.'+this.windowId, function() {
      var options = _this.state.getStateProperty("physicalRuler") || {};
      var service = _this.currentImg.service;
      if (service && service.profile === "http://iiif.io/api/annex/services/physdim") {
        var milimetersPerPhysicalUnit = {
          'mm': 1.0,
          'cm': 10.0,
          'in': 2.54
        };
        options.pixelsPerMilimeter = 1 / (milimetersPerPhysicalUnit[service.physicalUnits] * service.physicalScale);
        jQuery.extend(true, _this.osd, {
          documentRulerConfig: options
        });
        _this.osd.documentRuler(_this.osd.documentRulerConfig);
        _this.osd.rulerInstance.refresh();
        _this.osd.rulerInstance.updateSize();
      }
    });
  }
}(Mirador));
