# [WIP] emc Web Components

Testing ground for me to experiment with [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). For the time being, while aware of Web Component frameworks out there, the intent is for this to be vanilla-only.

## ⚠️ Fair warning ⚠️

While the intent is to build these components with good practices in mind, this is currently a playground. As such, these components may not be production-ready, may undergo changes without notice, and may not be generic enough for other use cases beyond what's intended here.

## Intended Browser Support

This project will use polyfills/shims provided by [`@webcomponents/webcomponentsjs`](https://github.com/webcomponents/webcomponentsjs). While HTML Imports is provided, this project will not make use of them.

At the time of this writing, the current support is as shown below. For most-current info, please visit the `@webcomponents` package.

| Polyfill   | IE11+ | Chrome* | Firefox* | Safari 9+* | Chrome Android* | Mobile Safari* |
| ---------- |:-----:|:-------:|:--------:|:----------:|:---------------:|:--------------:|
| Custom Elements | ✓ | ✓ | ✓ | ✓ | ✓| ✓ |
| Shady CSS/DOM |  ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

\* Indicates the current version of the browser

