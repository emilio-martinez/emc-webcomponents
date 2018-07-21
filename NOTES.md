# Web Components: What to keep in mind

This document is simply an aggregated set of web component guidelines and best practices that I've collected by reading docs, articles, browsing source code, and so on. It's not meant to be exhaustive but just a handy summary of practices I've found to be particularly useful when building vanilla web components.

If using a framework like Polymer these might be interesting but not super helpful because a lot of these will likely be handled for you.

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

### Use `attributeChangedCallback()` for side effects

Setting properties or otherwise reflecting state within `attributeChangedCallback()` can go very wrong very fast without care.

```ts
// Handles `selected` attribute change and therefore sets property
attributeChangedCallback(name, oldValue, newValue) {
  if (name === 'selected') this.selected = newValue;
}

// ⚠️Infinite loop ⚠️ ahead.
// Attribute is set and triggers `attributeChangedCallback()` again
set selected(value) {
  const selected = Boolean(value);
  if (selected) this.setAttribute('selected', '');
  else this.removeAttribute('selected');
}
```

An easy solve is to check whether the value has changed within the setter, therefore neutralizing the loop as it comes back. However, perhaps a more elegant way is to avoid it altogether by reserving `attributeChangedCallback()` to handle side effects. In this manner, setters won't need extra logic to manage property state without concern for creating a loop, and side effects for all properties will isolated and handled within `attributeChangedCallback()`.

```ts
attributeChangedCallback() {
  const value = this.hasAttribute('selected');
  this.setAttribute('aria-selected', `${value}`);
  this.setAttribute('tabIndex', `${value ? 0 : -1}`);
}

// OR

attributeChangedCallback(name, oldValue, newValue) {
  const value = newValue !== null;
  switch (name) {
    case 'selected':
      this.setAttribute('aria-selected', `${value}`);
      this.setAttribute('tabIndex', `${value ? 0 : -1}`);
      break;
  }
}
```
