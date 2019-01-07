var DownloadMenu = {
  /* the template for the image urls */
  imageUrlTemplate: Mirador.Handlebars.compile(
    '{{imageBaseUrl}}/full/{{size}}/0/default.jpg'
  ),

  /* the template for the link menu */
  menuTemplate: Mirador.Handlebars.compile([
    '<span class="mirador-btn mirador-icon-download" role="button" title="Download">',
    '<i class="fa fa-download fa-lg fa-fw"></i>',
    '<i class="fa fa-caret-down"></i>',
    '<ul class="dropdown download-list">',
    '<li title="IIIF-Manifest"><a href="{{manifestUrl}}" target="_blank">',
    '<i class="fa fa-file-text-o fa-lg fa-fw"></i>IIIF-Manifest',
    '</a></li>',
    '{{#each imageUrls}}',
    '<li class="{{#if (eq this "#")}}disabled {{/if}}image-link" title="JPG ({{this.title}})">',
    '<a href="{{this.href}}" target="_blank">',
    '<i class="fa fa-file-image-o fa-lg fa-fw"></i>JPG (<span class="dimensions">{{this.title}}</span>)',
    '</a></li>',
    '{{/each}}',
    '</ul>',
    '</span>'
  ].join('')),

  /* the different sizes of the image links */
  sizes: ['full', '250,'],

  /* extracts image urls from the viewer window */
  extractImageUrls: function(viewerWindow){
    var currentImgIndex = viewerWindow.focusModules.ImageView.currentImgIndex;
    if(viewerWindow.manifest.jsonLd.viewingDirection === 'right-to-left'){
        currentImgIndex = viewerWindow.manifest.jsonLd.sequences[0].canvases.length - currentImgIndex;
    }

    var currentImage = viewerWindow.imagesList[currentImgIndex];
    var imageBaseUrl = Mirador.Iiif.getImageUrl(currentImage);
    var ratio = currentImage.height / currentImage.width;

    var imageUrls = [];
    this.sizes.forEach(function(size){
      imageUrls.push({
        'href': viewerWindow.currentImageMode !== 'ImageView' ? '#' : this.imageUrlTemplate({
          'imageBaseUrl': imageBaseUrl, 'size': size
        }),
        'title': size === 'full' ? currentImage.width + 'x' + currentImage.height : parseInt(size) + 'x' + Math.ceil(parseInt(size) * ratio)
      });
    }.bind(this));
    return imageUrls;
  },

  /* initializes the plugin, i.e. adds an event handler */
  init: function(){
    Mirador.Handlebars.registerHelper('eq', function(first, second){
      return first === second;
    });
    this.injectWindowEventHandler();
    this.injectWorkspaceEventHandler();
  },

  /* injects the link menu to the window navigation */
  injectMenuToNavigation: function(windowNavigation, manifestUrl, imageUrls){
    $(windowNavigation).prepend(this.menuTemplate({
      'imageUrls': imageUrls,
      'manifestUrl': manifestUrl,
    }));
  },

  /* injects the needed window event handler */
  injectWindowEventHandler: function(){
    var this_ = this;
    var origBindNavigation = Mirador.Window.prototype.bindNavigation;
    Mirador.Window.prototype.bindNavigation = function(){
      origBindNavigation.apply(this);
      this.element.find('.window-manifest-navigation').on(
        'mouseenter', '.mirador-icon-download', function(){
          this.element.find('.download-list').stop().slideFadeToggle(300);
        }.bind(this)
      ).on(
        'mouseleave', '.mirador-icon-download', function(){
          this.element.find('.download-list').stop().slideFadeToggle(300);
        }.bind(this)
      );
    };
    var origBindEvents = Mirador.Window.prototype.bindEvents;
    Mirador.Window.prototype.bindEvents = function(){
      origBindEvents.apply(this);
      this.eventEmitter.subscribe('windowUpdated', function(evt, data){
        if(this.id !== data.id || !data.viewType){
          return;
        }
        if(this.element.find('.mirador-icon-download').length === 0){
          var manifestUrl = this.manifest.jsonLd['@id'];
          var windowNavigation = this.element.find('.window-manifest-navigation');
          this_.injectMenuToNavigation(windowNavigation, manifestUrl, this_.sizes.reduce(function(fakeImageUrls){
            fakeImageUrls.push({
              'href': '#',
              'title': 'n.a.'
            });
            return fakeImageUrls;
          }, []));
        }
        if(data.viewType === 'ImageView'){
          var imageUrls = this_.extractImageUrls(this);
          this.element.find('.image-link').removeClass('disabled').attr(
            'title', function(index){ return 'JPG (' + imageUrls[index].title + ')'; }
          ).find('a').attr(
            'href', function(index){ return imageUrls[index].href; }
          ).find('span.dimensions').text(
            function(index){ return imageUrls[index].title; }
          );
        }else{
          this.element.find('.image-link').addClass('disabled').find('span.dimensions').text('n.a.');
        }
      }.bind(this));
    };
  },

  /* injects the needed workspace event handler */
  injectWorkspaceEventHandler: function(){
    var this_ = this;
    var origFunc = Mirador.Workspace.prototype.bindEvents;
    Mirador.Workspace.prototype.bindEvents = function(){
      origFunc.apply(this);
      this.eventEmitter.subscribe('windowAdded', function(evt, data){
        var viewerWindow = this.windows.filter(function(currentWindow){
          return currentWindow.id === data.id;
        })[0];
        var manifestUrl = viewerWindow.manifest.jsonLd['@id'];
        var imageUrls = this_.extractImageUrls(viewerWindow);
        var windowNavigation = viewerWindow.element.find('.window-manifest-navigation');
        this_.injectMenuToNavigation(windowNavigation, manifestUrl, imageUrls);
      }.bind(this));
    };
  }
};

$(document).ready(function(){
  DownloadMenu.init();
});
