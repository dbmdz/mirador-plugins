# Share buttons

[![NPM](https://img.shields.io/npm/v/@dbmdz/mirador-sharebuttons.svg)](https://www.npmjs.com/package/@dbmdz/mirador-sharebuttons)
[![Maven Central](https://img.shields.io/maven-central/v/org.webjars.npm/dbmdz__mirador-sharebuttons.svg)](http://search.maven.org/search?q=a:dbmdz__mirador-sharebuttons)

Provides functions for adding additional buttons that allow sharing content across different social media platforms.

**NOTE:** This plugin is just a library, it does nothing by just including it.

## Installation

You can find production-ready build artifacts in the [releases section](https://github.com/dbmdz/mirador-plugins/releases).

Alternatively, you can use `npm` to install the artifacts:

```sh
$ npm install @dbmdz/mirador-sharebuttons
```

If you have a Java Web-Application managed with `mvn`, there is also a WebJar, which can be included as follows:

```xml
<dependency>
  <groupId>org.webjars.npm</groupId>
  <artifactId>dbmdz__mirador-sharebuttons</artifactId>
  <version>{set to current version}</version>
</dependency>
```

## Usage

### Including

Enable the plugin by including the CSS and the JavaScript (**after** loading Mirador):

```html
<link rel="stylesheet" type="text/css" href="<url to the plugin>/shareButtons.min.css" />
...
<script src="<url to the plugin>/shareButtons.min.js"></script>
```

### Provided functions

#### init(showExternalLinkInfo) → {void}

Registers some needed `Handlebars` helpers and sets a variable.

Parameters:

| Name                 | Type    | Description                                                                                               | Default |
|----------------------|---------|-----------------------------------------------------------------------------------------------------------|---------|
| showExternalLinkInfo | Boolean | Display an info that the website containing the Mirador instance is left by clicking on the share buttons | false   |

#### injectButtonsToDom(targetSelector, position) → {void}

Injects the buttons to the target selector element in the given position.

Parameters:

| Name           | Type   | Description                                                  | Default      |
|----------------|--------|--------------------------------------------------------------|--------------|
| targetSelector | String | The selector for the element that should contain the buttons |              |
| position       | String | The position of the buttons within the containing element    | "afterbegin" |

#### updateButtonLinks(data) → {void}

Updates the button links with the given parameters.

Parameters:

| Name              | Type   | Description                            |
|-------------------|--------|----------------------------------------|
| data              | Object | The data for the links                 |
| data.attribution  | String | The attribution of the link to share   |
| data.label        | String | The label of the link to share         |
| data.link         | String | The link itself                        |
| data.thumbnailUrl | String | The thumbnail url of the link to share |
