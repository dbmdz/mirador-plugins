# Mirador plugins

This repository contains multiple extensions for the IIIF viewer Mirador (see http://projectmirador.org/).

## Physical Document Ruler

Adds a vertical and a horizontal ruler with metric or imperial units to the
canvas display if the canvas has a [physical dimensions service](http://iiif.io/api/annex/services/#physical-dimensions)
set.

[![Demo](https://thumbs.gfycat.com/InexperiencedPoshArabianhorse-size_restricted.gif)](https://gfycat.com/InexperiencedPoshArabianhorse)

To enable it, simply include the JavaScript (**after** loading Mirador):

```html
<script src="<url to the plugin>/physicalRuler.js"></script>
```

You can configure the ruler with the `physicalRuler` configuration attribute
in your Mirador configuration:

```javascript
var mirador = Mirador({
  physicalRuler: {
    color: "#ffffff",         // The color for the rulers and labels
    location: "bottom-left",  // Location of the reference point of the rulers
    smallDashSize: 10,        // Size of the small dashes in pixels
    largeDashSize: 15,        // Size of the large dashes in pixels
    labelsEvery: 5,           // Draw ruler labels every n centimeters/inches
    imperialUnits: false      // Use imperial units instead of metric
  }
});
```

## Image cropper

Adds an overlay to the canvas for retrieving the image url for the selected area.

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/imageCropper.css" />
...
<script src="<url to the plugin>/imageCropper.js"></script>
```

To activate the plugin at startup of Mirador, you can achieve this by adding an option to your Mirador configuration:

```js
var mirador = Mirador({
  ...
  activateImageCropping: true
  ...
});
```

By default, it's deactivated.

## Manifest button

Adds an extra button to every window that links to the loaded manifest.

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

It's possible to define the icon class of the button in the Mirador configuration with the attribute `iconClass` in the section `manifestButton`:

```js
var mirador = Mirador({
  manifestButton: {
    iconClass: 'fa-file' // Define the icon class of the button
  }
});
```

The value has to be one of the [Font Awesome Icon classes](http://fontawesome.io/icon), the default is [`fa-file-text-o`](http://fontawesome.io/icon/file-text-o/).

## Multi-Page Navigation

Adds a small additional navigation bar to the top of the viewport that
allows faster seeking through a manifest.

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/multiPageNavigation.css" />
...
<script src="<url to the plugin>/multiPageNavigation.js"></script>
```

## Link to the current canvas

Adds an extra button to every window that displays a link to the currently shown canvas. The URL will look like this:

```html
<canvas uri>/view
```

**NOTE:** This means that the server serving Mirador needs a rule for resolving this URL.

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/canvasLink.css" />
...
<script src="<url to the plugin>/canvasLink.js"></script>
```

You can configure the modal dialog containing the canvas link with the `canvasLink` configuration attribute in your Mirador configuration:

```javascript
var mirador = Mirador({
  canvasLink: {
    showShareButtons: true, // Display buttons to share the canvas link on e.g. Facebook or Twitter
    showShareButtonsInfo: true, // Display an info that the website containing the Mirador instance is left by clicking on the share buttons
    urlExtension: '/example' // Define the url extension appended to the canvas url
  }
});
```

## Bookmarkable Viewer State

Modifies Mirador to dynamically update the URL to reflect the currently
selected view type (image, book, etc), manifest and canvas and to reconstruct
a Mirador session from such an URL hash. This allows users to bookmark the
(partial) state of Mirador and restore it at a later time.

The syntax of the URL is compatible with the [work-in-progress IIIF Drag-and-Drop pattern](http://zimeon.github.io/iiif-dragndrop/).

This plugins comes with a major caveat, namely that the URL is only updated
if there is a single slot in the viewer. This is due to the fact that more
complicated workspace layouts carry a lot more state that would be too
unwieldy to store in the URL hash. Use Mirador's built-in bookmarking
functionality (via JSONBlob) for these use cases.

To enable it, just include the JavaScript **after** loading Mirador.

## Keyboard Navigation

Adds keyboard nagivation features to Mirador. If there are multiple windows, the action are applied to all of them.

| Key                              | Action                                               |
| -------------------------------- | ---------------------------------------------------- |
| <kbd>←</kbd>                     | Go to previous page.                                 |
| <kbd>→</kbd> or <kbd>SPACE</kbd> | Go to next page.                                     |
| <kbd>ctrl</kbd> + <kbd>←</kbd>   | Go to first page.                                    |
| <kbd>ctrl</kbd> + <kbd>→</kbd>   | Go to last page.                                     |
| <kbd>i</kbd>                     | Show or hide information/metadata.                   |
| <kbd>↵</kbd>                     | Toggle fullscreen using the largest possible option. |

Installation:

```html
<script src="build/mirador/mirador.js"></script>
<script src="path/to/keyboardNavigation.js"></script>
<script>
// Creating Mirador instance
// ...
</script>
```


## Piwik Tracking of Mirador Events

This plugin records user interactions with Mirador to a Piwik instance.

You can configure the plugin with the `piwikTracking` configuration Key:

```js
{
    // Only set trackerUrl and siteId if you did not use the Piwik
    // JavaScript snippet
    trackerUrl: undefined,
    siteId: undefined,

    // Can be 'event' or 'content', what kind of interaction to record
    // in Piwik. 'event' will trigger an Event, 'content' a Content Interaction.
    method: 'event',
    events: [
      'change-page',
      'zoom',
      'enable-annotations',
      'add-annotation',
      'add-window'
    ]
}
```
