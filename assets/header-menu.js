import { Component } from '@theme/component';
import { debounce, onDocumentReady } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

const ACTIVATE_DELAY = 60;
const DEACTIVATE_DELAY = 300;

class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];
  #abortController = new AbortController();
  #observer = new MutationObserver(() => {
    this.#patchOverflowShadow();
    this.#clearLightDOMStrap();
  });

  connectedCallback() {
    super.connectedCallback();

    // First paint: make the strap transparent in BOTH places it can exist.
    this.#patchOverflowShadow();
    this.#clearLightDOMStrap();

    // Re-patch on any subtree changes (theme re-renders open/close states)
    this.#observer.observe(this, { childList: true, subtree: true });

    this.overflowMenu?.addEventListener(
      'pointerleave',
      () => this.#debouncedDeactivate(),
      { signal: this.#abortController.signal }
    );

    onDocumentReady(this.#preloadImages);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
    this.#observer.disconnect();
  }

  /** State */
  #state = { activeItem: null };

  /** Animation timing pulled from data-attribute */
  get animationDelay() {
    const v = this.dataset.animationDelay;
    return v ? parseInt(v, 10) : 0;
  }

  /** <overflow-list> element inside header-menu */
  get overflowMenu() {
    return /** @type {HTMLElement|null} */ (
      this.refs.overflowMenu?.shadowRoot?.host ?? this.refs.overflowMenu
    );
  }

  /** Is the overflow menu hovered? */
  get overflowHovered() {
    return this.refs.overflowMenu?.matches(':hover') ?? false;
  }

  /** ========== THE FIX: make the strap transparent in Shadow DOM ========== */
  #patchOverflowShadow = () => {
    const host = /** @type {HTMLElement|null} */ (this.refs.overflowMenu);
    if (!host || !host.shadowRoot) return;

    // Inject a style tag once into the Shadow root so we can override internals.
    if (!host.shadowRoot.querySelector('#nb-overflow-patch')) {
      const style = document.createElement('style');
      style.id = 'nb-overflow-patch';
      style.textContent = `
  /* kill the full-width strap behind the white panel */
  .menu_list__submenu,
  .menu-list__submenu {
    background: transparent !important;
    box-shadow: none !important;
    border: 0 !important;
    --color-background: 0 0 0;
    --opacity-background: 0;
    --shadow-opacity: 0;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
`;
      host.shadowRoot.appendChild(style);
    } else {
      // no-op; already patched
    }
  };

  /** Also clear any light-DOM strap (some presets render it outside shadow) */
  #clearLightDOMStrap = () => {
    const nodes = this.querySelectorAll(
  '[data-header-nav-popover], \
  .menu_list__submenu, .menu_list__submenu-inner, \
  .menu-list__submenu, .menu-list__submenu-inner, \
  .header__submenu, .mega-menu__content'
);
    nodes.forEach((el) => {
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('border', '0', 'important');
      el.style.setProperty('--color-background', '0 0 0');
      el.style.setProperty('--opacity-background', '0');
      el.style.setProperty('--shadow-opacity', '0');
      el.style.setProperty('backdrop-filter', 'none', 'important');
      el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    });
  };

  /** Public: activate on hover/focus */
  activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.#debouncedActivate.cancel();
    this.#debouncedActivate(event);
  };

  /** Internal: activate after a small delay */
  #activate = (event) => {
    this.#debouncedDeactivate.cancel();
    this.dispatchEvent(new MegaMenuHoverEvent());
    this.removeAttribute('data-animating');

    if (!(event.target instanceof Element)) return;

    const item = findMenuItem(event.target);
    if (!item || item === this.#state.activeItem) return;

    const isDefaultSlot = event.target.slot === '';
    let submenu = findSubmenu(item);
    const overflowMenuHeight =
      this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]')
        ?.offsetHeight ?? 0;

    if (!submenu && !isDefaultSlot) submenu = this.overflowMenu;

    // No submenu? Don’t open the strap.
    if (!submenu) {
      this.dataset.overflowExpanded = 'false';
      this.#deactivate(this.#state.activeItem);
      return;
    }

    const prev = this.#state.activeItem;
    if (prev) prev.ariaExpanded = 'false';

    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';

    const submenuHeight = Math.max(submenu.offsetHeight || 0, overflowMenuHeight);
    this.dataset.overflowExpanded = (!isDefaultSlot).toString();
    this.style.setProperty('--submenu-height', `${submenuHeight}px`);
    this.style.setProperty('--submenu-opacity', '1');

    // Safety: ensure strap stays transparent after open
    this.#patchOverflowShadow();
    this.#clearLightDOMStrap();
  };
  #debouncedActivate = debounce(this.#activate, ACTIVATE_DELAY);

  /** Public: schedule close */
  deactivate(event) {
    this.#debouncedActivate.cancel();
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
    setTimeout(
      () => item.removeAttribute('data-animating'),
      Math.max(0, this.animationDelay - 150)
    );
  };
  #debouncedDeactivate = debounce(this.#deactivate, DEACTIVATE_DELAY);

  /** Preload lazy images so the menu won’t flash-in late */
  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((img) => img.removeAttribute('loading'));
  };
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

/** Helpers */
function findMenuItem(el) {
  if (!(el instanceof Element)) return null;
  if (el.matches('[slot="more"]')) {
    return findMenuItem(el.parentElement?.querySelector('[slot="overflow"]'));
  }
  return el.querySelector('[ref="menuitem"]');
}
function findSubmenu(el) {
  const submenu = el?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}

/* NIBANA — drive open/close from header-menu attributes + add a closing grace period */
(function () {
  const onReady = (fn) =>
    (document.readyState !== 'loading')
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn);

  onReady(() => {
    const headerMenu = document.querySelector('header-menu');
    if (!headerMenu) return;

    let closeTO;

    const parseMs = (v) => {
      if (!v) return 220;
      v = (v + '').trim();
      if (v.endsWith('ms')) return Math.max(120, parseFloat(v));
      if (v.endsWith('s'))  return Math.max(120, parseFloat(v) * 1000);
      const n = parseFloat(v);
      return isNaN(n) ? 220 : Math.max(120, n);
    };

    const getCloseDelay = () => {
      const z = getComputedStyle(headerMenu).getPropertyValue('--submenu-animation-speed');
      return parseMs(z) + 60; // buffer to cover repaint
    };

    const setState = (expanded) => {
      clearTimeout(closeTO);
      if (expanded) {
        document.body.classList.add('is-mega-open');
        document.body.classList.remove('is-mega-closing');
      } else {
        // keep transparent during close animation
        document.body.classList.remove('is-mega-open');
        document.body.classList.add('is-mega-closing');
        closeTO = setTimeout(() => {
          document.body.classList.remove('is-mega-closing');
        }, getCloseDelay());
      }
    };

    const isExpanded = () =>
      headerMenu.matches('[aria-expanded="true"], [data-overflow-expanded="true"]');

    // Initial state
    setState(isExpanded());

    // React to attribute changes from the web component
    const mo = new MutationObserver(() => setState(isExpanded()));
    mo.observe(headerMenu, { attributes: true, attributeFilter: ['aria-expanded', 'data-overflow-expanded'] });

    // Fallback: hovering the submenu wrappers should force open state
    const reinforce = () => setState(true);
    const relax = () => { if (!isExpanded()) setState(false); };

    const panels = document.querySelectorAll('.menu-list__submenu, .menu_list__submenu');
    panels.forEach(p => {
      p.addEventListener('mouseenter', reinforce);
      p.addEventListener('focusin', reinforce, true);
      p.addEventListener('mouseleave', relax);
      p.addEventListener('focusout', relax, true);
    });
  });
})();
