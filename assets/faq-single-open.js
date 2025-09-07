/* NIBANA — FAQ single-open behavior (section suffix: __section_4EQaYA) */
(function () {
  function initFAQ(scope) {
    // Limit to your FAQ section only
    const root = (scope || document).querySelector('[id$="__section_4EQaYA"]');
    if (!root) return;

    const items = root.querySelectorAll('details');
    if (!items.length) return;

    // Bind once per <details>
    items.forEach((d) => {
      if (d.__faqBound) return;       // guard
      d.__faqBound = true;

      // Use the native 'toggle' event so we catch open/close from any source
      d.addEventListener('toggle', function () {
        if (!this.open) return;
        items.forEach((other) => {
          if (other !== this && other.hasAttribute('open')) {
            other.removeAttribute('open');
          }
        });
      }, { passive: true });
    });
  }

  // Initial page load
  document.addEventListener('DOMContentLoaded', () => initFAQ());
  window.addEventListener('load', () => initFAQ());

  // Editor / dynamic section loads
  document.addEventListener('shopify:section:load', (e) => initFAQ(e.target));
  document.addEventListener('shopify:section:select', (e) => initFAQ(e.target));
})();
