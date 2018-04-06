# Link to the current canvas

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-downloadmenu.svg)](https://www.npmjs.com/package/@dbmdz/mirador-downloadmenu)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-downloadmenu.svg?maxAge=2592000)](http://search.maven.org/#search%7Cga%7C1%7Ca%3A%22dbmdz__mirador-downloadmenu%22)

Adds a download button to every window that contains links to the manifest and to the currently shown image in different sizes.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-downloadmenu
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-downloadmenu</artifactId>
  <version>1.2.0</version>
</dependency>
```

## Usage

Enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/downloadMenu.css" />
...
<script src="<url to the plugin>/downloadMenu.js"></script>
```
