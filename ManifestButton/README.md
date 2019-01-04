## Manifest button

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-manifestbutton.svg)](https://www.npmjs.com/package/@dbmdz/mirador-manifestbutton)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-manifestbutton.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-manifestbutton)

Adds an extra button to every window that links to the loaded manifest.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-manifestbutton
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-manifestbutton</artifactId>
  <version>{set to current version}</version>
</dependency>
```

## Usage

* enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/manifestButton.min.css" />
...
<script src="<url to the plugin>/manifestButton.min.js"></script>
```

* configure the icon class of the button with the `manifestButton` configuration attribute in your Mirador configuration:

```js
var mirador = Mirador({
  ...
  manifestButton: {
    iconClass: 'fa-file' // Define the icon class of the button
  }
  ...
});
```

**NOTE:** The value has to be one of the [Font Awesome Icon classes](http://fontawesome.io/icon), the default is [`fa-file-text-o`](http://fontawesome.io/icon/file-text-o/).
