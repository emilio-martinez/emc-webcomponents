export const emcTabSelector = 'emc-tab';
let nextId = 0;

/**
 * `EmcTabsTab` is a tab for a EmcTabs.
 */
export class EmcTab extends HTMLElement {
  static get observedAttributes() {
    return ['selected'];
  }

  connectedCallback() {
    // A tab should be used with `role=heading` to have appropriate semantics
    // in non-JavaScript environments. Once instantiated, `role=tab` takes over.
    this.setAttribute('role', 'tab');

    // Generate unique ID if none is specified.
    if (!this.id) this.id = `${emcTabSelector}-generated-${nextId++}`;

    // Initial state.
    this.setAttribute('aria-selected', 'false');
    this.setAttribute('tabIndex', '-1');
    this._upgradeProperty('selected');
  }

  /**
   * Removes a property that may have already been set on an instance to ensure
   * that class property setters are being shadowed. The former value is re-set.
   */
  _upgradeProperty(prop: keyof this): void {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  /**
   * Handles side effects created by setting a property or attribute
   */
  attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null) {
    switch (name) {
      case 'selected': {
        const value = newValue !== null;
        this.setAttribute('aria-selected', `${value}`);
        this.setAttribute('tabIndex', `${value ? 0 : -1}`);
        break
      }
    }
  }

  set selected(value: boolean) {
    value = Boolean(value);
    if (value) this.setAttribute('selected', '');
    else this.removeAttribute('selected');
  }

  get selected() {
    return this.hasAttribute('selected');
  }
}

try {
  customElements.define(emcTabSelector, EmcTab);
} catch (err) {
  console.error(err);
}
