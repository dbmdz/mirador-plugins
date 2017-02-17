# Mirador plugins

This repository contains multiple extensions for the IIIF viewer Mirador (see http://projectmirador.org/).

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
