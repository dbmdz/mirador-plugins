# Link to the current canvas

Adds an extra button to every window that displays a link to the currently shown canvas. The URL will look like this:

```html
<canvas uri>/view
```

**NOTE:** This means that the server serving Mirador needs a rule for resolving this URL.

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
  <version>1.2.0</version>
</dependency>
```

## Usage

To enable it, include the CSS and the JavaScript (**after** loading Mirador).

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/canvasLink.css" />
...
<script src="<url to the plugin>/canvasLink.js"></script>
```

You can configure the modal dialog containing the canvas link with the `canvasLink` configuration attribute in your Mirador configuration:

```js
var mirador = Mirador({
  ...
  canvasLink: {
    // Display an info that the website containing the Mirador instance is left by clicking on the share buttons
    showShareButtonsInfo: true,
    // Define the url extension appended to the canvas url
    urlExtension: '/example'
  }
  ...
});
```
