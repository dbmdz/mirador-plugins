# Download menu

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-downloadmenu.svg)](https://www.npmjs.com/package/@dbmdz/mirador-downloadmenu)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-downloadmenu.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-downloadmenu)

Adds a download menu to every window that contains links to the manifest and to the currently shown image in different sizes.

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
  <version>{set to current version}</version>
</dependency>
```

## Usage

Enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/downloadMenu.min.css" />
...
<script src="<url to the plugin>/downloadMenu.min.js"></script>
```
