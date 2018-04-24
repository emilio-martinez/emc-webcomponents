import { Keycode } from '../../common/keycodes';

import { EmcTab, emcTabSelector } from './emc-tab';
import { EmcPanel, emcPanelSelector } from './emc-panel';

const emcTabsSelector = 'emc-tabs';

/**
 * Template with the contents of the EmcTabs shadow DOM. Shared by all
 * EmcTabs instances to avoid invoking the parser with `.innerHTML`
 */
const template: HTMLTemplateElement = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: -ms-flexbox;
      display: flex;
      -ms-flex-direction: column;
      flex-direction: column;
    }
    .${emcTabsSelector}-tabs {
      display: -ms-inline-flexbox;
      display: inline-flex;
      -ms-flex: 0 0 auto;
      flex: 0 0 auto;
      overflow-y: hidden;
      overflow-x: auto;
    }
  </style>
  <div class="${emcTabsSelector}-tabs"><slot name="tab"></slot></div>
  <slot name="panel"></slot>
`;

// ShadyCSS will rename classes as needed to ensure style scoping.
ShadyCSS.prepareTemplate(template, emcTabsSelector);

/**
 * `EmcTabs` is a container element for tabs and panels.
 *
 * All children of should be either a tab or a panel. This element is stateless,
 * meaning that no values are cached and therefore change during runtime work.
 */
export class EmcTabs extends HTMLElement {
  constructor() {
    super();

    // Ensure event handlers are bound to `this`
    this._onSlotChange = this._onSlotChange.bind(this);

    // Elements that reorder children tend to not work well with frameworks.
    // Instead shadow DOM is used to reorder the elements by using slots.
    const shadowRoot = this.attachShadow({ mode: 'open' });

    // Set template
    shadowRoot.appendChild(template.content.cloneNode(true));

    this._tabSlot = shadowRoot.querySelector<HTMLSlotElement>('slot[name=tab]')!;
    this._panelSlot = shadowRoot.querySelector<HTMLSlotElement>('slot[name=panel]')!;

    // As new children are slotted, `slotchange` will fire for this element to
    // handle it's tab and panel children
    this._tabSlot.addEventListener('slotchange', this._onSlotChange);
    this._panelSlot.addEventListener('slotchange', this._onSlotChange);
  }

  private _tabSlot: HTMLSlotElement;
  private _panelSlot: HTMLSlotElement;

  /** Groups tabs and panels by ordering reordering and ensuring only one tab is active */
  connectedCallback() {
    // Shim Shadow DOM styles.
    ShadyCSS.styleElement(this);

    // Keydown handler for arrow key and Home/End navigation.
    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('click', this._onClick);

    // Check for role first before overriding
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tablist');

    // Up until recently, `slotchange` events did not fire when an element was
    // upgraded by the parser. For this reason, the element invokes the
    // handler manually. Once the new behavior lands in all browsers, the code
    // below can be removed.
    Promise.all([
      customElements.whenDefined(emcTabSelector),
      customElements.whenDefined(emcPanelSelector)
    ]).then(_ => this._linkPanels());
  }

  /** Removes all event listeners */
  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('click', this._onClick);
  }

  /** Marks all tabs as deselected and hides all panels */
  reset() {
    const tabs = this._allTabs();
    const panels = this._allPanels();

    tabs.forEach(tab => (tab.selected = false));
    panels.forEach(panel => (panel.hidden = true));
  }

  /** Called when an element is added or removed from one of the shadow DOM slots */
  private _onSlotChange() {
    this._linkPanels();
  }

  /**
   * Links tabs to their adjacent panels by using `aria-controls` and `aria-labelledby`.
   * Additionally, the method ensures only one tab is active.
   *
   * TODO: Optimize by only handling new elements instead of iterating over all of the
   * element's children.
   */
  private _linkPanels() {
    const tabs = this._allTabs();
    // Give each panel a `aria-labelledby` attribute that refers to the tab
    // that controls it.
    tabs.forEach(tab => {
      const panel = tab.nextElementSibling;

      if (!panel) return;

      if (panel.tagName.toLowerCase() !== emcPanelSelector) {
        console.error(`Tab #${tab.id} is not a` + `sibling of a <${emcPanelSelector}>`);
        return;
      }

      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
    });

    // The element checks if any of the tabs have been marked as selected.
    // If not, the first tab is now selected.
    const selectedTab = tabs.filter(tab => tab.selected)[0] || tabs[0];

    // Next, switch to the selected tab. `selectTab()` takes care of
    // marking all other tabs as deselected and hiding all other panels.
    this._selectTab(selectedTab);
  }

  /**
   * Returns all panels in the tab panel.
   * This is a method and not a getter, because a getter implies that it is cheap to read.
   */
  private _allPanels(): EmcPanel[] {
    return Array.from(this.querySelectorAll(emcPanelSelector));
  }

  /** Returns all the tabs in the tab panel. */
  private _allTabs(): EmcTab[] {
    return Array.from(this.querySelectorAll(emcTabSelector));
  }

  /** Returns the panel that the given tab controls. */
  private _panelForTab(tab: EmcTab): EmcPanel | null {
    const panelId = tab.getAttribute('aria-controls');
    return this.querySelector(`#${panelId}`);
  }

  /**
   * Returns the tab that's before the currently selected one.
   * Wraps around when the first one is reached.
   */
  private _prevTab(): EmcTab {
    const tabs = this._allTabs();
    // Use `findIndex()` to find the index of the currently
    // selected element and subtracts one to get the index of the previous
    // element.
    let newIdx = tabs.findIndex(tab => tab.selected) - 1;
    // Add `tabs.length` to make sure the index is a positive number
    // and get the modulus to wrap around if necessary.
    return tabs[(newIdx + tabs.length) % tabs.length];
  }

  /** Returns the first tab. */
  private _firstTab(): EmcTab {
    const tabs = this._allTabs();
    return tabs[0];
  }

  /** Returns the last tab. */
  private _lastTab(): EmcTab {
    const tabs = this._allTabs();
    return tabs[tabs.length - 1];
  }

  /**
   * Returns the tab that's after the currently selected one.
   * Wraps around when the last one is reached.
   */
  private _nextTab(): EmcTab {
    const tabs = this._allTabs();
    let newIdx = tabs.findIndex(tab => tab.selected) + 1;
    return tabs[newIdx % tabs.length];
  }

  /** Marks a given tab as selected, showing the corresponding panel */
  private _selectTab(newTab: EmcTab) {
    // Deselect all tabs and hide all panels.
    this.reset();

    // Get the panel that the `newTab` is associated with.
    const newPanel = this._panelForTab(newTab);
    // If that panel doesn’t exist, abort.
    if (!newPanel) throw new Error(`No panel with id ${newTab.id}`);
    newTab.selected = true;
    newPanel.hidden = false;
    newTab.focus();
  }

  /** Handles key presses inside the tab panel. */
  private _onKeyDown(event: HTMLElementEventMap['keydown']) {
    const target = <EmcTab>event.target;

    // If the keypress did not originate from a tab element itself,
    // it was a keypress inside the a panel or on empty space. Nothing to do.
    if (target.getAttribute('role') !== 'tab') return;
    // Don’t handle modifier shortcuts typically used by assistive technology.
    if (event.altKey) return;

    // The switch-case will determine which tab should be marked as active
    // depending on the key that was pressed.
    let newTab;
    switch (event.keyCode) {
      case Keycode.LEFT:
      case Keycode.UP:
        newTab = this._prevTab();
        break;

      case Keycode.RIGHT:
      case Keycode.DOWN:
        newTab = this._nextTab();
        break;

      case Keycode.HOME:
        newTab = this._firstTab();
        break;

      case Keycode.END:
        newTab = this._lastTab();
        break;
      // Any other key press is ignored and passed back to the browser.
      default:
        return;
    }

    // The browser might have some native functionality bound to the arrow
    // keys, home or end. The element calls `preventDefault()` to prevent the
    // browser from taking any actions.
    event.preventDefault();
    // Select the new tab, that has been determined in the switch-case.
    this._selectTab(newTab);
  }

  /** Handles clicks inside the tab panel. */
  private _onClick(event: HTMLElementEventMap['click']) {
    const target = <EmcTab>event.target;
    // If the click was not targeted on a tab element itself,
    // it was a click inside the a panel or on empty space. Nothing to do.
    if (target.getAttribute('role') !== 'tab') return;
    // If it was on a tab element, though, select that tab.
    this._selectTab(target);
  }
}

try {
  customElements.define(emcTabsSelector, EmcTabs);
} catch (err) {
  console.error(err);
}
