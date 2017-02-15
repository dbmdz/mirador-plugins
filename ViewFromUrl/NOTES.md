- Scenarios:
    * ImageView: #image;manifestUrl;canvasUrl
    * BookView: #book;manifestUrl;canvasUrl;canvasUrl
    * Gallery: #gallery;manifestUrl
    * Scroll: #scroll;manifestUrl

- Activate URL rewriting on `slotsUpdated` with args[1].length === 1
- Disable otherwise
- Update URL when `windowUpdated` args[1] has `canvasID` and `loadedManifest`
  attributes
