(function () {
  try {
    var html = document.documentElement;
    var provider = html.getAttribute('data-lm-provider') || 'mailchimp';
    // Only adjust when our FAB exists
    var fab = document.querySelector('.nb-fab');
    if (!fab) return;

    // Helper: is element visible
    var isVisible = function(el) {
      if (!el) return false;
      var s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // Compute lift from an element (height + 12px breathing room)
    var liftFrom = function(el) {
      var h = el.getBoundingClientRect().height || 0;
      return Math.max(0, Math.round(h + 12));
    };

    // Scan likely Mailchimp nodes
    var findMailchimpNode = function() {
      // common candidates Mailchimp injects for popup/trigger
      var candidates = document.querySelectorAll([
        '.mc-modal',
        '.mc-closeModal',
        '.mc-prompt',
        '.mc-banner',
        '[id^="mc-"]:not(script)',
        '[class*="mailchimp"]',
        '[class*="mcjs"]'
      ].join(','));
      for (var i=0; i<candidates.length; i++) {
        var el = candidates[i];
        if (!isVisible(el)) continue;
        // Near bottom of viewport?
        var r = el.getBoundingClientRect();
        if (r.bottom >= (window.innerHeight - 140)) return el;
      }
      return null;
    };

    var applyLift = function(px) {
      // Never lower below zero; keep CSS default as baseline
      if (typeof px !== 'number') return;
      html.style.setProperty('--nb-fab-lift', px + 'px');
    };

    var measure = function() {
      // If Shopify provider, lift off native LM pill instead (if you want)
      if (provider === 'shopify') {
        var nativePill = document.querySelector('.nb-lm-pill');
        if (isVisible(nativePill)) {
          applyLift(liftFrom(nativePill));
          return;
        }
        applyLift(0);
        return;
      }

      // Provider = Mailchimp → try to measure
      var mc = findMailchimpNode();
      if (mc) {
        applyLift(liftFrom(mc));
      } else {
        // leave CSS default (72px via CSS on mobile) as a safe fallback
      }
    };

    // Run now and when layout changes
    measure();
    window.addEventListener('resize', measure, { passive: true });
    // Watch DOM for Mailchimp nodes arriving
    var mo = new MutationObserver(function() { measure(); });
    mo.observe(document.documentElement, { subtree: true, childList: true });
  } catch (e) {
    console && console.warn && console.warn('NB FAB lift init failed', e);
  }
})();
