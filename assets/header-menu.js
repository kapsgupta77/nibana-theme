import { Component } from '@theme/component';
import { debounce, onDocumentReady } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

const ACTIVATE_DELAY = 0;
const DEACTIVATE_DELAY = 350;

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

  connectedCallback() {
    super.connectedCallback();

    this.overflowMenu?.addEventListener('pointerleave', () => this.#debouncedDeactivate(), {
      signal: this.#abortController.signal,
    });

    // Flag only real panel parents (adds .has-panel and aria-expanded="false")
    // Run once now and again after DOM is ready to catch slotting.
    this.#flagRealToggles();
    onDocumentReady(this.#flagRealToggles);

    onDocumentReady(this.#preloadImages);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  /**
   * @type {State}
   */
  #state = {
    activeItem: null,
  };

  /**
   * Time to allow for a closing animation between initiating a deactivation and actually deactivating the active item.
   * @returns {number}
   */
  get animationDelay() {
    const value = this.dataset.animationDelay;
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Get the overflow menu
   */
  get overflowMenu() {
    return /** @type {HTMLElement | null} */ (this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]'));
  }

  /**
   * Whether the overflow menu is hovered
   * @returns {boolean}
   */
  get overflowHovered() {
    return this.refs.overflowMenu?.matches(':hover') ?? false;
  }

  /**
   * Activate the selected menu item immediately
   * @param {PointerEvent | FocusEvent} event
   */
  activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.#debouncedActivateHandler.cancel();

    this.#debouncedActivateHandler(event);
  };

  /**
   * Activate the selected menu item with a delay
   * @param {PointerEvent | FocusEvent} event
   */
  #activateHandler = (event) => {
    this.#debouncedDeactivate.cancel();

    this.dispatchEvent(new MegaMenuHoverEvent());

    this.removeAttribute('data-animating');

    if (!(event.target instanceof Element)) return;

    let item = findMenuItem(event.target);
    if (!item || item == this.#state.activeItem) return;

    const isDefaultSlot = event.target.slot === '';
    this.dataset.overflowExpanded = (!isDefaultSlot).toString();

    const previouslyActiveItem = this.#state.activeItem;
    if (previouslyActiveItem) previouslyActiveItem.ariaExpanded = 'false';

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    let submenu = findSubmenu(item);
    let overflowMenuHeight = this.overflowMenu?.offsetHeight ?? 0;

    if (!submenu && !isDefaultSlot) {
      submenu = this.overflowMenu;
    }

    const submenuHeight = submenu ? Math.max(submenu.offsetHeight, overflowMenuHeight) : 0;

    this.style.setProperty('--submenu-height', `${submenuHeight}px`);
    this.style.setProperty('--submenu-opacity', '1');
  };

  #debouncedActivateHandler = debounce(this.#activateHandler, ACTIVATE_DELAY);

  /**
   * Deactivate the active item after a delay
   * @param {PointerEvent | FocusEvent} event
   */
  deactivate(event) {
    this.#debouncedActivateHandler.cancel();

    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);

    // Make sure the item to be deactivated is still the active one. Ideally
    // we cancelled the debounce before the item was changed, but just in case.
    if (item === this.#state.activeItem) {
      this.#debouncedDeactivate();
    }
  }

  /**
   * Deactivate the active item immediately
   * @param {HTMLElement | null} [item]
   */
  #deactivate = (item = this.#state.activeItem) => {
    if (!item || item != this.#state.activeItem) return;
    if (this.overflowHovered) return;

    this.style.setProperty('--submenu-height', '0px');
    this.style.setProperty('--submenu-opacity', '0');
    this.dataset.overflowExpanded = 'false';

    this.#state.activeItem = null;
    this.ariaExpanded = 'false';
    item.ariaExpanded = 'false';
    item.setAttribute('data-animating', '');

    setTimeout(
      () => {
        item.removeAttribute('data-animating');
      },
      Math.max(0, this.animationDelay - 150)
    ); // Start header transition 150ms before submenu finishes
  };

  /**
   * Deactivate the active item after a delay
   * @param {PointerEvent | FocusEvent} event
   */
  #debouncedDeactivate = debounce(this.#deactivate, DEACTIVATE_DELAY);

  /**
   * Preload images that are set to load lazily.
   */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => image.removeAttribute('loading'));
  };

  /**
   * Mark only the true mega-menu parents.
   * - Adds .has-panel and aria-expanded="false" to items that own a submenu
   * - Removes aria-expanded and .has-panel from items that don't
   */
  #flagRealToggles = () => {
    /** @type {HTMLElement[]} */
    const links = Array.from(this.querySelectorAll('[ref="menuitem"]'));

    links.forEach((link) => {
      const hasPanel = !!findSubmenu(link);

      if (hasPanel) {
        link.classList.add('has-panel');
        if (!link.hasAttribute('aria-expanded')) link.setAttribute('aria-expanded', 'false');
      } else {
        link.classList.remove('has-panel');
        link.removeAttribute('aria-expanded');
      }
    });
  };
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/**
 * Find the closest menu item.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findMenuItem(element) {
  if (!(element instanceof Element)) return null;

  if (element?.matches('[slot="more"]')) {
    // Select the first overflowing menu item when hovering over the "More" item
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }

  return element?.querySelector('[ref="menuitem"]');
}

/**
 * Find the closest submenu.
 * @param {Element | null | undefined} element
 * @returns {HTMLElement | null}
 */
function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}

/* === NB: Class toggle for desktop mega overlay (scrim) === */
(function () {
  var desktopMQ = window.matchMedia('(min-width: 990px)');
  var header = document.querySelector('header');
  if (!header) return;

  var openClass = 'nb-mega-open';
  var overCount = 0; // avoid flicker crossing sub-elements

  function enable() {
    if (!desktopMQ.matches) return;
    document.documentElement.classList.add(openClass);
  }
  function disable() {
    if (!desktopMQ.matches) return;
    document.documentElement.classList.remove(openClass);
  }

  header.addEventListener(
    'mouseenter',
    function (e) {
      var el = e.target.closest('[data-header-nav-popover], .mega-menu, .header__inline-menu');
      if (el) {
        overCount++;
        enable();
      }
    },
    true
  );

  header.addEventListener(
    'mouseleave',
    function (e) {
      var el = e.target.closest('[data-header-nav-popover], .mega-menu, .header__inline-menu');
      if (el) {
        overCount = Math.max(0, overCount - 1);
        if (overCount === 0) disable();
      }
    },
    true
  );

  // Close on Esc as a nicety
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') disable();
  });
})();
