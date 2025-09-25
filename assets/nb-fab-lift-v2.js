(function () {
  try {
    var root = document.documentElement;
    var provider = (root.getAttribute('data-lm-provider') || '').toLowerCase();
    if (!provider) {
      if (root.classList.contains('lm-provider-shopify')) provider = 'shopify';
      else provider = 'mailchimp';
    }

    // Only adjust when our FAB exists
    if (!document.querySelector('.nb-fab')) return;

    var MAILCHIMP_SELECTOR = [
      '.mcforms-wrapper',
      '.mc-modal',
      '.mc-closeModal',
      '.mc-prompt',
      '.mc-banner',
      '[id^="mcforms-"]',
      '[id^="mc-"]',
      '[class*="mailchimp"]',
      '[class*="mcjs"]'
    ].join(',');

    var SHOPIFY_SELECTOR = '.nb-lm-pill';

    var toNumber = function (value) {
      var num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    var isVisible = function (el) {
      if (!el) return false;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      var rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    var measuredHeight = function (el) {
      if (!el || !isVisible(el)) return 0;
      var cs = getComputedStyle(el);
      var rect = el.getBoundingClientRect();
      return Math.max(0, Math.round(rect.height + toNumber(cs.marginTop) + toNumber(cs.marginBottom)));
    };

    var applyLift = function (px) {
      if (typeof px === 'number' && px >= 0) {
        root.style.setProperty('--nb-fab-lift', Math.round(px) + 'px');
      }
    };

    var clearLift = function () {
      root.style.removeProperty('--nb-fab-lift');
    };

    var measureMailchimp = function () {
      var nodes = document.querySelectorAll(MAILCHIMP_SELECTOR);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var height = measuredHeight(node);
        if (height > 0) {
          applyLift(height + 12);
          return true;
        }
      }
      clearLift();
      return false;
    };

    var measureShopify = function () {
      var pill = document.querySelector(SHOPIFY_SELECTOR);
      var height = measuredHeight(pill);
      applyLift(height > 0 ? height + 12 : 0);
      return height > 0;
    };

    var measure = function () {
      if (provider === 'shopify') {
        measureShopify();
        return;
      }
      measureMailchimp();
    };

    var scheduleMeasure = function () {
      if ('requestAnimationFrame' in window) {
        requestAnimationFrame(measure);
      } else {
        setTimeout(measure, 16);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', measure);
    } else {
      measure();
    }

    window.addEventListener('resize', measure, { passive: true });

    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === 'attributes' && mutation.target === root && mutation.attributeName === 'style') {
          continue;
        }
        scheduleMeasure();
        break;
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  } catch (e) {
    if (typeof console !== 'undefined' && console && console.warn) {
      console.warn('NB FAB lift init failed', e);
    }
  }
})();
