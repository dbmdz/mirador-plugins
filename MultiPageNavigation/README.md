## Multi-Page Navigation

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-multipagenavigation.svg)](https://www.npmjs.com/package/@dbmdz/mirador-multipagenavigation)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-multipagenavigation.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-multipagenavigation)

Adds a small additional navigation bar to the top of the viewport that allows faster seeking through a manifest.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-multipagenavigation
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-multipagenavigation</artifactId>
  <version>{set to current version}</version>
</dependency>
```

## Usage

* enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/multiPageNavigation.min.css" />
...
<script src="<url to the plugin>/multiPageNavigation.min.js"></script>
```
