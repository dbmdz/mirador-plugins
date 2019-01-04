# Link to the current canvas

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-canvaslink.svg)](https://www.npmjs.com/package/@dbmdz/mirador-canvaslink)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-canvaslink.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-canvaslink)

Adds an extra button to every window that displays a link to the currently shown canvas. The URL will look like this:

```html
<canvas uri>/view
```

**NOTE:** This means that the server serving the manifest needs a rule for resolving this URL.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-canvaslink
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-canvaslink</artifactId>
  <version>{set to current version}</version>
</dependency>
```

## Usage

* enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/canvasLink.min.css" />
...
<script src="<url to the plugin>/canvasLink.min.js"></script>
```

* include the [ShareButtons extension](https://github.com/dbmdz/mirador-plugins/tree/master/ShareButtons) - the usage is explained in the corresponding README - if you want to have some share buttons displayed in the modal dialog

* configure the modal dialog containing the canvas link with the `canvasLink` configuration attribute in your Mirador configuration:

```js
var mirador = Mirador({
  ...
  canvasLink: {
    // Display an info that the website containing the Mirador instance is left by clicking on the share buttons, default is false
    showShareButtonsInfo: true,
    // Define the url extension appended to the canvas url, default is /view
    urlExtension: '/example'
  }
  ...
});
```

**NOTE:** The configuration key `showShareButtonsInfo` is only evaluated, if you have also included the `ShareButtons` extension.
