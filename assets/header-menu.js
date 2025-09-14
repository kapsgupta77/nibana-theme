import { Component } from '@theme/component';
import { debounce, onDocumentReady } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

const ACTIVATE_DELAY = 60;   // tiny delay for smoother intent
const DEACTIVATE_DELAY = 300;

/**
 * Header Menu web component.
 *
 * @typedef {Object} State
 * @property {HTMLElement | null} activeItem
 *
 * @typedef {object} Refs
 * @property {HTMLElement} overflowMenu
 * @property {HTMLElement[]} [submenu]
 */
class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];
  #abortController = new AbortController();

  /** Internal state */
  #state = { activeItem: null };

  /** Observe DOM changes so we can keep the strap transparent */
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

  /** Time to allow for a closing animation */
  get animationDelay() {
    const value = this.dataset.animationDelay;
    return value ? parseInt(value, 10) : 0;
  }

  /** Overflow host → Shadow part that renders the row container */
  get overflowMenu() {
    return /** @type {HTMLElement | null} */ (
      this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]')
    );
  }

  /** Is the overflow row hovered? */
  get overflowHovered() {
    return this.refs.overflowMenu?.matches(':hover') ?? false;
  }

  /** Public handler: activate on pointer/focus */
  activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.#debouncedActivateHandler.cancel();
    this.#debouncedActivateHandler(event);
  };

  /** Internal activate logic */
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

    // When hovering the “More” trigger, the overflow panel acts as submenu
    if (!submenu && !isDefaultSlot) {
      submenu = this.overflowMenu;
    }

    // No submenu? Do not expand; ensure overlay vars are reset.
    if (!submenu) {
      this.dataset.overflowExpanded = 'false';
      this.#deactivate(this.#state.activeItem);
      return;
    }

    // Proceed to expand
    const previouslyActiveItem = this.#state.activeItem;
    if (previouslyActiveItem) previouslyActiveItem.ariaExpanded = 'false';

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    const submenuHeight = Math.max(submenu.offsetHeight, overflowMenuHeight);
    this.dataset.overflowExpanded = (!isDefaultSlot).toString();
    this.style.setProperty('--submenu-height', `${submenuHeight}px`);
    this.style.setProperty('--submenu-opacity', '1');

    // Make sure the full-width strap stays transparent
    this.#clearStrap();

    // Optional debug: outline any remaining background painters
    if (document.documentElement.hasAttribute('data-nb-menu-debug')) {
      try { this.#debugScan(); } catch(_) {}
    }
  };

  #debouncedActivateHandler = debounce(this.#activateHandler, ACTIVATE_DELAY);

  /** Public handler: deactivate on pointer/focus out */
  deactivate(event) {
    this.#debouncedActivateHandler.cancel();
    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);
    if (item === this.#state.activeItem) this.#debouncedDeactivate();
  }

  /** Internal close now */
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

  /** Preload lazy header images to avoid flicker */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => image.removeAttribute('loading'));
  };

  /** Force transparent background / no shadow on the full-width popover strap */
  #clearStrap = () => {
    // 1) Shadow part used by the overflow row
    if (this.overflowMenu) {
      try {
        this.overflowMenu.style.setProperty('background', 'transparent', 'important');
        this.overflowMenu.style.setProperty('box-shadow', 'none', 'important');
        this.overflowMenu.style.setProperty('border', '0', 'important');
        // theme vars that sometimes feed into computed background
        this.overflowMenu.style.setProperty('--color-background', '0 0 0');
        this.overflowMenu.style.setProperty('--opacity-background', '0');
        this.overflowMenu.style.setProperty('--shadow-opacity', '0');
      } catch (_) {}
    }

    // 2) Light-DOM containers that often paint the strap
    const nodes = this.querySelectorAll(
      '[data-header-nav-popover], .menu_list__submenu, .menu_list__submenu-inner'
    );
    nodes.forEach((el) => {
      try {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('border', '0', 'important');
        el.style.setProperty('--color-background', '0 0 0');
        el.style.setProperty('--opacity-background', '0');
        el.style.setProperty('--shadow-opacity', '0');
      } catch (_) {}
    });
  };

  /** Debug helper: outlines any element in the header still painting a bg */
  #debugScan = () => {
    const header = this.closest('header');
    if (!header) return;

    header.querySelectorAll('[data-nb-bg]').forEach(n => {
      n.style.outline = '';
      n.removeAttribute('data-nb-bg');
    });

    const nodes = header.querySelectorAll('*');
    nodes.forEach(el => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const beforeBG = getComputedStyle(el, '::before').backgroundColor;
      const afterBG  = getComputedStyle(el, '::after').backgroundColor;

      const isOpaque = (c) =>
        c && c !== 'transparent' && !/^rgba?\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*0)?\s*\)$/.test(c);

      if (isOpaque(bg) || isOpaque(beforeBG) || isOpaque(afterBG) || s.boxShadow !== 'none') {
        el.style.outline = '2px solid red';
        el.setAttribute('data-nb-bg', '1');
        // eslint-disable-next-line no-console
        console.log('[NB menu debug]', el, { bg, beforeBG, afterBG, boxShadow: s.boxShadow });
      }
    });
  };
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/** Find the closest menu item element */
function findMenuItem(element) {
  if (!(element instanceof Element)) return null;
  if (element?.matches('[slot="more"]')) {
    // Hovering the “More” trigger → use the first overflow item
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }
  return element?.querySelector('[ref="menuitem"]');
}

/** Find the submenu associated to a menu item */
function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}
