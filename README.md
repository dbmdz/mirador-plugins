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


## Multi-Page Navigation

Adds a small additional navigation bar to the top of the viewport that
allows faster seeking through a manifest.

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

**NOTE:** This plugin does currently not work with upstream Mirador. This is
due to a still pending pull request that updates the i18next dependency
(https://github.com/ProjectMirador/mirador/pull/1230).

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/multiPageNavigation.css" />
...
<script src="<url to the plugin>/multiPageNavigation.js"></script>
```


## Bookmarkable Viewer State

Modifies Mirador to dynamically update the URL hash to reflect the currently
selected view type (image, book, etc), manifest and canvas and to reconstruct
a Mirador session from such an URL hash. This allows users to bookmark the
(partial) state of Mirador and restore it at a later time.

This plugins comes with a major caveat, namely that the URL is only updated
if there is a single slot in the viewer. This is due to the fact that more
complicated workspace layouts carry a lot more state that would be too
unwieldy to store in the URL hash. Use Mirador's built-in bookmarking
functionality (via JSONBlob) for these use cases.

To enable it, just include the JavaScript **after** loading Mirador.

## Keyboard Navigation

Adds keyboard nagivation features to Mirador. If there are multiple windows, the action are applied to all of them.

| Key                              | Action                                                |
| -------------------------------- | ----------------------------------------------------- |
| <kbd>←</kbd>                     | Go to previous page.                                  |
| <kbd>→</kbd> or <kbd>SPACE</kbd> | Go to next page.                                      |
| <kbd>ctrl</kbd> + <kbd>←</kbd>   | Go to first page.                                  |
| <kbd>ctrl</kbd> + <kbd>→</kbd>   | Go to last page.                                      |
| <kbd>i</kbd>                     | Show or hide information/metadata.                    |
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
