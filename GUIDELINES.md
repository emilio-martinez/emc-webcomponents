# Web Component Guidelines

This is a series of web component guidelines I've collected through various sources and through experimentation. It's not meant to be exhaustive but rather it's a compiled set of practices I've found to be particularly useful to keep in mind.

## Properties and attributes

### Upgrading properties

This is a technique is interesting because it's not something you'd necessarily think about. It guards for a case where a property may have already been set before the web component definition has loaded. This is perhaps more likely to happen when using frameworks.

The way this works is that the instance property is deleted, if it exists, and then the former value is re-set. This ensures the custom element's property setter isn't shadowed by an instance property, and the property can be immediately reflected as soon as the component definition loads.

```ts
connectedCallback() {
  ...
  this._upgradeProperty('selected');
}

_upgradeProperty(prop) {
  if (this.hasOwnProperty(prop)) {
    let value = this[prop];
    delete this[prop];
    this[prop] = value;
  }
}
```
