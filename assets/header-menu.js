import { Component } from '@theme/component';
import { debounce, onDocumentReady } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

const ACTIVATE_DELAY = 60;  // a tiny delay helps smoothness without feeling laggy
const DEACTIVATE_DELAY = 300;

/**
 * A custom element that manages a header menu.
 *
 * @typedef {Object} State
 * @property {HTMLElement | null} activeItem - The currently active menu item.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} overflowMenu - The overflow menu.
 * @property {HTMLElement[]} [submenu] - The submenu in each respective menu item.
 *
 * @extends {Component<Refs>}
 */
class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];
  #abortController = new AbortController();

/** Force transparent background for the full-width popover strap */
#clearStrap = () => {
  // the strap + its inner wrappers that paint the dark band
  const nodes = this.querySelectorAll(
    '[data-header-nav-popover], .menu_list__submenu, .menu_list__submenu-inner'
  );
  nodes.forEach((el) => {
    try {
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('border', '0', 'important');
      // neutralize color-scheme variables used by the theme
      el.style.setProperty('--color-background', '0 0 0');
      el.style.setProperty('--opacity-background', '0');
      el.style.setProperty('--shadow-opacity', '0');
    } catch (e) {}
  });
};

/** Watch for submenu DOM changes and re-apply transparency */
#strapObserver = new MutationObserver(() => this.#clearStrap());
  
  connectedCallback() {
    super.connectedCallback();
    this.#clearStrap();
this.#strapObserver.observe(this, { childList: true, subtree: true });

    this.overflowMenu?.addEventListener('pointerleave', () => this.#debouncedDeactivate(), {
      signal: this.#abortController.signal,
    });

    onDocumentReady(this.#preloadImages);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
    this.#strapObserver.disconnect();
  }

  /** @type {State} */
  #state = { activeItem: null };

  /** Time to allow for a closing animation between initiating a deactivation and actually deactivating the active item. */
  get animationDelay() {
    const value = this.dataset.animationDelay;
    return value ? parseInt(value, 10) : 0;
  }

  /** The overflow menu element inside the custom element’s shadow */
  get overflowMenu() {
    return /** @type {HTMLElement | null} */ (this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]'));
  }

  /** Is the overflow menu currently hovered? */
  get overflowHovered() {
    return this.refs.overflowMenu?.matches(':hover') ?? false;
  }

  /** Activate the selected menu item (public handler used by the template) */
  activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.#debouncedActivateHandler.cancel();
    this.#debouncedActivateHandler(event);
  };

  /** Internal: activate after a small delay */
  #activateHandler = (event) => {
    this.#debouncedDeactivate.cancel();
    this.dispatchEvent(new MegaMenuHoverEvent());
    this.removeAttribute('data-animating');

    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);
    if (!item || item === this.#state.activeItem) return;

    const isDefaultSlot = event.target.slot === ''; // true for normal top-level items
    let submenu = findSubmenu(item);
    const overflowMenuHeight = this.overflowMenu?.offsetHeight ?? 0;

    // If we're hovering the “More” item, use the overflow panel as the submenu
    if (!submenu && !isDefaultSlot) {
      submenu = this.overflowMenu;
    }

    // 🔒 No submenu? Do not enter expanded state. Also ensure overlay is closed.
    if (!submenu) {
      this.dataset.overflowExpanded = 'false';
      this.#deactivate(this.#state.activeItem);
      return;
    }

    // There *is* a submenu: proceed to expand
    const previouslyActiveItem = this.#state.activeItem;
    if (previouslyActiveItem) previouslyActiveItem.ariaExpanded = 'false';

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    const submenuHeight = Math.max(submenu.offsetHeight, overflowMenuHeight);
    this.dataset.overflowExpanded = (!isDefaultSlot).toString();
    this.style.setProperty('--submenu-height', `${submenuHeight}px`);
    this.style.setProperty('--submenu-opacity', '1');
  };

  #debouncedActivateHandler = debounce(this.#activateHandler, ACTIVATE_DELAY);

  /** Deactivate the active item after a delay (public handler used by template) */
  deactivate(event) {
    this.#debouncedActivateHandler.cancel();
    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);
    if (item === this.#state.activeItem) this.#debouncedDeactivate();
  }

  /** Internal: close immediately */
  #deactivate = (item = this.#state.activeItem) => {
    if (!item || item !== this.#state.activeItem) return;
    if (this.overflowHovered) return;

    this.style.setProperty('--submenu-height', '0px');
    this.style.setProperty('--submenu-opacity', '0');
    this.dataset.overflowExpanded = 'false';

    this.#state.activeItem = null;
    this.ariaExpanded = 'false';
    item.ariaExpanded = 'false';
    item.setAttribute('data-animating', '');

    setTimeout(() => item.removeAttribute('data-animating'), Math.max(0, this.animationDelay - 150));
  };

  #debouncedDeactivate = debounce(this.#deactivate, DEACTIVATE_DELAY);

  /** Preload lazy images in the header so the mega doesn’t flash in late */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => image.removeAttribute('loading'));
  };
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/** Find the closest menu item element */
function findMenuItem(element) {
  if (!(element instanceof Element)) return null;

  if (element?.matches('[slot="more"]')) {
    // Hovering the “More” trigger → select the first overflowing item’s menuitem
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }
  return element?.querySelector('[ref="menuitem"]');
}

/** Find the submenu associated to a menu item */
function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}
