var ShareButtons = {
  /* all of the needed locales */
  locales: {
    'de': {
      'share-buttons-info': 'Beim Klick auf einen der Teilen-Buttons verlassen Sie diese Webseite.',
      'share-on-envelope': 'Per Mail teilen',
      'share-on-facebook': 'Auf Facebook teilen',
      'share-on-pinterest': 'Auf Pinterest teilen',
      'share-on-tumblr': 'Auf Tumblr teilen',
      'share-on-twitter': 'Auf Twitter teilen',
      'share-on-whatsapp': 'Per Whatsapp teilen'
    },
    'en': {
      'share-buttons-info': 'By clicking on one of the share buttons, you will leave this website.',
      'share-on-envelope': 'Share via mail',
      'share-on-facebook': 'Share on Facebook',
      'share-on-pinterest': 'Share on Pinterest',
      'share-on-tumblr': 'Share on Tumblr',
      'share-on-twitter': 'Share on Twitter',
      'share-on-whatsapp': 'Share via Whatsapp'
    }
  },

  /* options of the plugin */
  showExternalLinkInfo: false,

  /* the template for the buttons */
  buttonsTemplate: Mirador.Handlebars.compile([
    '{{#if showExternalLinkInfo}}',
    '<div id="share-buttons-info" class="alert alert-info" role="alert">{{t "share-buttons-info"}}</div>',
    '{{/if}}',
    '<div id="share-buttons" class="pull-left">',
    '{{#each shareButtons}}',
    '<a type="button" class="share-button" id="share-on-{{this}}" title="{{t (concat this)}}" target="_blank" data-target="{{this}}">',
    '<span class="fa-stack fa-lg">',
    '<i class="fa fa-circle fa-stack-2x"></i>',
    '<i class="fa fa-{{this}} fa-stack-1x" aria-hidden="true"></i>',
    '</span>',
    '</a>',
    '{{/each}}',
    '</div>'
  ].join('')),

  /* the templates for the different links */
  linkTemplates: {
    'envelope': Mirador.Handlebars.compile(
      'mailto:?subject={{{label}}}{{#if attribution}} ({{attribution}}){{/if}}&body={{{label}}}{{#if attribution}} ({{{attribution}}}){{/if}}: {{link}}'
    ),
    'facebook': Mirador.Handlebars.compile(
      'https://www.facebook.com/sharer/sharer.php?title={{{label}}} {{#if attribution}} ({{attribution}}){{/if}}&u={{link}}'
    ),
    'pinterest': Mirador.Handlebars.compile(
      'http://pinterest.com/pin/create/bookmarklet/?url={{link}}&description={{{label}}}%20{{#if attribution}}%20({{attribution}}){{/if}}&media={{{thumbnailUrl}}}'
    ),
    'tumblr': Mirador.Handlebars.compile(
      'http://www.tumblr.com/share/link?url={{link}}&name={{{label}}} {{#if attribution}} ({{attribution}}){{/if}}&tags=iiif'
    ),
    'twitter': Mirador.Handlebars.compile(
      'https://twitter.com/intent/tweet?text={{{truncate label attribution}}}&url={{link}}&hashtags=iiif'
    ),
    'whatsapp': Mirador.Handlebars.compile(
      'whatsapp://send?text={{{label}}} {{#if attribution}} ({{attribution}}){{/if}}: {{link}}'
    )
  },

  /* initializes the plugin */
  init: function(showExternalLinkInfo){
    Mirador.Handlebars.registerHelper('concat', function(target){
      return 'share-on-' + target;
    });
    Mirador.Handlebars.registerHelper('truncate', function(label, attribution){
      var text = label + (attribution ? ' (' + attribution + ')' : '');
      if(text.length > 60){
        text = text.substring(0, 60) + '...';
      }
      return text;
    });
    this.showExternalLinkInfo = showExternalLinkInfo || false;
  },

  /* injects the buttons to the target selector element */
  injectButtonsToDom: function(targetSelector, position){
    var shareButtons = ['facebook', 'twitter', 'pinterest', 'tumblr', 'envelope'];
    if('ontouchstart' in window || navigator.maxTouchPoints){
      shareButtons.push('whatsapp');
    }
    if(position === undefined || ['beforebegin', 'afterbegin', 'beforeend', 'afterend'].indexOf(position) === -1){
      position = 'afterbegin';
    }
    document.querySelector(targetSelector).insertAdjacentHTML(position, this.buttonsTemplate({
      'shareButtons': shareButtons,
      'showExternalLinkInfo': this.showExternalLinkInfo
    }));
  },

  /* updates the button links with the given parameters */
  updateButtonLinks: function(data){
    var this_ = this;
    $('#share-buttons > .share-button').attr('href', function(){
      return this_.linkTemplates[$(this).data('target')]({
        'label': data.label,
        'attribution': data.attribution,
        'link': data.link,
        'thumbnailUrl': data.thumbnailUrl
      });
    });
  }
};
