# Image cropper

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-imagecropper.svg)](https://www.npmjs.com/package/@dbmdz/mirador-imagecropper)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-imagecropper.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-imagecropper)

Adds an overlay to the canvas for retrieving the image url for the selected area.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-imagecropper
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-imagecropper</artifactId>
  <version>{set to current version}</version>
</dependency>
```

## Usage

* enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/imageCropper.min.css" />
...
<script src="<url to the plugin>/imageCropper.min.js"></script>
```

* include the [ShareButtons extension](https://github.com/dbmdz/mirador-plugins/tree/master/ShareButtons) - the usage is explained in the corresponding README - if you want to have some share buttons displayed in the modal dialog

* configure the behaviour of the plugin with the `imageCropper` configuration key:

```js
var mirador = Mirador({
  ...
  imageCropper: {
     // Activate the cropping selection frame for every window in Mirador, default is false
    activeOnStart: true,
    // Define the number of decimals in the relative region coordinates, default is 5
    roundingPrecision: 3,
    // Show a license link defined in the containing manifest, default is false
    showLicense: true,
    // Display an info that the website containing the Mirador instance is left by clicking on the share buttons, default is false
    showShareButtonsInfo: true
  }
  ...
});
```

**NOTE:** The configuration key `showShareButtonsInfo` is only evaluated, if you have also included the [ShareButtons extension](https://github.com/dbmdz/mirador-plugins/tree/master/ShareButtons).

## Demo

![Demo](https://thumbs.gfycat.com/UnsungExcellentIsabellinewheatear-size_restricted.gif)
