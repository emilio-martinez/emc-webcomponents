export const emcPanelSelector = 'emc-panel';
let nextId = 0;

/**
 * `EmcPanel` is a panel for a EmcTabs.
 */
export class EmcPanel extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'tabpanel');
    if (!this.id) this.id = `${emcPanelSelector}-generated-${nextId++}`;
  }
}

try {
  customElements.define(emcPanelSelector, EmcPanel);
} catch (err) {
  console.error(err);
}
