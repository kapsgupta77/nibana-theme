(function(){
  let show = function(){};

  function normaliseTags(tagList, acceptsMarketing){
    const tags = Array.isArray(tagList) ? tagList.filter(Boolean).map(tag => String(tag)) : [];
    if (acceptsMarketing && !tags.some(tag => tag.toLowerCase() === 'newsletter')) {
      tags.unshift('newsletter');
    }
    return tags;
  }

  function assignValue(ids, value){
    [].concat(ids).forEach(function(id){
      const input = typeof id === 'string' ? document.getElementById(id) : null;
      if (input) input.value = value;
    });
  }

  function ensureTarget(form, preferredFrameId){
    if (!form) return;
    const frame = preferredFrameId ? document.getElementById(preferredFrameId) : null;
    if (frame) {
      const frameName = frame.getAttribute('name') || preferredFrameId;
      frame.setAttribute('name', frameName);
      form.setAttribute('target', frameName);
    }
  }

  function analyseShopifyFrame(frame){
    let doc = null;
    try {
      doc = frame?.contentDocument || frame?.contentWindow?.document || null;
    } catch(_) {
      return { state: 'unreachable', doc: null };
    }
    if (!doc || !doc.body) return { state: 'empty', doc };

    const captchaSelectors = '.shopify-challenge__container, form[action*="/challenge"], #g-recaptcha, .g-recaptcha, .h-captcha, iframe[src*="captcha"], [data-shopify="captcha"], [name="g-recaptcha-response"], [name="h-captcha-response"]';
    if (doc.querySelector(captchaSelectors)) return { state: 'captcha', doc };

    const successSelectors = '.form-status--success, .note--success, .alert--success, [data-form-status="success"], [data-success-message], #ContactSuccess, #CustomerSuccess';
    if (doc.querySelector(successSelectors)) return { state: 'success', doc };

    const errorSelectors = '.form-status--error, .note--error, .alert--error, .errors, [data-form-status="error"], .form__message--error';
    if (doc.querySelector(errorSelectors)) return { state: 'error', doc };

    const bodyText = (doc.body.textContent || '').toLowerCase();
    if (bodyText.includes('thank you for contacting') || bodyText.includes('thanks for contacting') || bodyText.includes('we\'ll be in touch soon')) {
      return { state: 'success', doc };
    }
    if ((bodyText.includes('captcha') || bodyText.includes('are you human')) && doc.querySelector('form')) {
      return { state: 'captcha', doc };
    }
    if (bodyText.includes('error') && (bodyText.includes('contact') || bodyText.includes('message'))) {
      return { state: 'error', doc };
    }
    return { state: 'unknown', doc };
  }

  function nbSubmitShopifyContact({ email = '', fname = '', lname = '', phone = '', consent = false, tags = [] } = {}){
    return new Promise(function(resolve, reject){
      let settled = false;
      let submitted = false;
      let overlayVisible = false;
      let previousActive = null;
      let frameLoadTimer = null;

      function finish(ok, payload){
        if (settled) return;
        settled = true;
        if (frameLoadTimer) clearTimeout(frameLoadTimer);
        cleanup();
        if (ok) {
          show('Shopify contact helper resolved');
          resolve(payload);
        } else {
          const err = payload instanceof Error ? payload : new Error(String(payload || 'Shopify contact failed'));
          show('Shopify contact helper failed: ' + (err && err.message ? err.message : 'unknown'));
          reject(err);
        }
      }

      function cleanup(){
        try { iframe && iframe.removeEventListener('load', onFrameLoad); } catch(_) {}
        closeControls.forEach(function(btn){ btn.removeEventListener('click', onOverlayClose); });
        document.removeEventListener('keydown', onEscape);
        hideOverlay();
      }

      function showOverlay(){
        if (!overlay || overlayVisible) return;
        previousActive = document.activeElement;
        overlay.removeAttribute('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        overlayVisible = true;
        const focusEl = overlay.querySelector('[data-nb-captcha-focus]') || overlay.querySelector('[data-nb-captcha-close]') || overlay.querySelector('iframe');
        if (focusEl && typeof focusEl.focus === 'function') {
          requestAnimationFrame(function(){ focusEl.focus(); });
        }
      }

      function hideOverlay(){
        if (!overlay || !overlayVisible) return;
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('hidden', '');
        overlayVisible = false;
        const focusEl = previousActive;
        previousActive = null;
        if (focusEl && typeof focusEl.focus === 'function') {
          requestAnimationFrame(function(){ focusEl.focus(); });
        }
      }

      function onOverlayClose(event){
        if (event) event.preventDefault();
        finish(false, new Error('Shopify contact cancelled'));
      }

      function onEscape(event){
        if (event.key === 'Escape' && overlayVisible) {
          event.preventDefault();
          finish(false, new Error('Shopify contact cancelled'));
        }
      }

      function onFrameLoad(){
        if (!submitted || !iframe) return;
        const analysis = analyseShopifyFrame(iframe);
        show('Shopify frame load: ' + analysis.state);
        if (analysis.state === 'captcha') {
          showOverlay();
          return;
        }
        if (analysis.state === 'success') {
          finish(true, { status: 'success' });
          return;
        }
        if (analysis.state === 'error') {
          finish(false, new Error('Shopify contact failed'));
        }
      }

      let hiddenForm;
      let iframe;
      let overlay;
      let closeControls = [];
      try {
        hiddenForm = document.getElementById('NibanaHiddenNewsletter') || document.getElementById('NibanaHiddenContact');
        if (!hiddenForm) {
          show('Hidden Shopify form missing');
          finish(false, new Error('Hidden Shopify form missing'));
          return;
        }

        const usingCustomerForm = hiddenForm.id === 'NibanaHiddenNewsletter';
        ensureTarget(hiddenForm, usingCustomerForm ? 'HiddenNewsletterFrame' : 'HiddenContactFrame');

        const targetName = hiddenForm.getAttribute('target');
        const frames = Array.prototype.slice.call(document.querySelectorAll('iframe'));
        iframe = frames.find(function(el){ return el.getAttribute('name') === targetName; })
              || (usingCustomerForm ? document.getElementById('HiddenNewsletterFrame') : document.getElementById('HiddenContactFrame'))
              || null;
        if (!iframe) {
          show('Hidden Shopify frame missing');
          finish(false, new Error('Hidden Shopify frame missing'));
          return;
        }

        overlay = document.querySelector('[data-nb-captcha-overlay]');
        closeControls = overlay ? Array.prototype.slice.call(overlay.querySelectorAll('[data-nb-captcha-close]')) : [];

        iframe.addEventListener('load', onFrameLoad);
        closeControls.forEach(function(btn){ btn.addEventListener('click', onOverlayClose); });
        document.addEventListener('keydown', onEscape);

        const trimmedEmail = (email || '').trim();
        const firstName = (fname || '').trim();
        const lastName = (lname || '').trim();
        const trimmedPhone = (phone || '').trim();
        const acceptsMarketing = !!consent;
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const marketingValue = acceptsMarketing ? 'true' : 'false';
        const tagList = normaliseTags(tags, acceptsMarketing);
        const tagString = tagList.join(', ');

        assignValue(['HiddenCustomerEmail', 'HiddenContactEmail'], trimmedEmail);
        assignValue(['HiddenCustomerFirstName', 'HiddenContactFirstName'], firstName);
        assignValue(['HiddenCustomerLastName', 'HiddenContactLastName'], lastName);
        assignValue(['HiddenCustomerPhone', 'HiddenContactPhone'], trimmedPhone);
        assignValue(['HiddenCustomerTags', 'HiddenContactTags'], tagString);
        assignValue(['HiddenCustomerAcceptsMarketing', 'HiddenContactAcceptsMarketing'], marketingValue);
        assignValue(['HiddenCustomerName', 'HiddenContactName'], fullName);

        const fd = new FormData(hiddenForm);
        fd.set('contact[email]', trimmedEmail);
        fd.set('contact[first_name]', firstName);
        fd.set('contact[last_name]', lastName);
        fd.set('contact[phone]', trimmedPhone);
        fd.set('contact[tags]', tagString);
        fd.set('contact[name]', fullName);
        fd.set('contact[accepts_marketing]', marketingValue);
        if (usingCustomerForm) {
          fd.set('customer[email]', trimmedEmail);
          fd.set('customer[first_name]', firstName);
          fd.set('customer[last_name]', lastName);
          fd.set('customer[phone]', trimmedPhone);
          fd.set('customer[tags]', tagString);
          fd.set('customer[accepts_marketing]', marketingValue);
        } else {
          fd.set('accepts_marketing', marketingValue);
        }

        const url = hiddenForm.getAttribute('action') || '/contact#contact_form';

        try {
          if (typeof navigator.sendBeacon === 'function') {
            const params = new URLSearchParams();
            fd.forEach(function(value, key){ params.append(key, value); });
            const encoded = params.toString();
            const blob = new Blob([encoded], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
            if (navigator.sendBeacon(url, blob)) {
              show('Shopify beacon sent');
            }
          }
        } catch(_) {}

        try {
          fetch(url, { method: 'POST', body: fd, credentials: 'same-origin', keepalive: true })
            .then(function(){ show('Shopify fetch keepalive complete'); })
            .catch(function(){});
        } catch(_) {}

        try {
          hiddenForm.requestSubmit ? hiddenForm.requestSubmit() : hiddenForm.submit();
          submitted = true;
          show('Shopify iframe submit fired');
        } catch(err) {
          finish(false, err);
          return;
        }

        frameLoadTimer = setTimeout(function(){
          if (!settled) {
            show('Shopify contact timeout');
            finish(false, new Error('Shopify contact timeout'));
          }
        }, 25000);
      } catch(error) {
        finish(false, error);
      }
    });
  }

  window.nbSubmitShopifyContact = nbSubmitShopifyContact;

  function init(){
    if (window.__nbContactBound) return;
    window.__nbContactBound = true;

    const sectionEl = document.querySelector('[data-nb-contact]');
    if (!sectionEl) return;

    const debugOn   = String(sectionEl.getAttribute('data-nb-debug')) === 'true';
    const mcEnabled = String(sectionEl.getAttribute('data-mc-enabled')) === 'true';
    const mcAction  = sectionEl.getAttribute('data-mc-action') || '';
    const scEnabled = String(sectionEl.getAttribute('data-shopify-customer-enabled')) === 'true';

    let dbg;
    show = function(msg){
      if (!debugOn) return;
      if (!dbg){
        dbg = document.createElement('div');
        dbg.style.cssText = 'position:fixed;right:10px;bottom:10px;background:#111;color:#0f0;padding:8px 10px;border-radius:8px;font:12px/1.4 system-ui;z-index:99999';
        dbg.textContent = 'Mailchimp debug: init';
        document.body.appendChild(dbg);
      }
      dbg.textContent = 'Mailchimp debug: ' + msg;
    };
    show('ready');

    document.addEventListener('submit', async function(e){
      const form = e.target;
      if (!form || form.id !== 'NibanaContactForm') return;

      const join = document.getElementById('JoinEmails');
      if (!join || !join.checked) { show('opt-in unchecked'); return; }

      const email   = document.getElementById('ContactEmail')?.value || '';
      const name    = document.getElementById('ContactName')?.value || '';
      const phone   = document.getElementById('ContactPhone')?.value || '';
      const purpose = document.getElementById('InquiryPurpose')?.value || '';
      const tags    = ['Contact Form'];
      if (purpose) tags.push('Purpose: ' + purpose);

      const parts = (name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ');

      if (scEnabled) {
        if (typeof window.nbSubmitShopifyContact === 'function') {
          try {
            await window.nbSubmitShopifyContact({
              email,
              fname: firstName,
              lname: lastName,
              phone,
              tags,
              consent: !!join.checked
            });
          } catch(_) {}
        } else {
          show('Shopify contact helper missing');
        }
      }

      if (mcEnabled && mcAction) {
        const mcForm   = document.getElementById('NibanaMailchimp');
        const mcFrame  = document.getElementById('MailchimpFrame');
        if (mcForm && mcFrame) {
          mcForm.setAttribute('action', mcAction);
          const first = firstName || '';
          document.getElementById('MC_EMAIL').value = email;
          document.getElementById('MC_FNAME').value = first;
          document.getElementById('MC_PHONE').value = phone;
          document.getElementById('MC_TAGS').value  = 'newsletter, ' + tags.join(', ');

          try {
            mcForm.requestSubmit ? mcForm.requestSubmit() : mcForm.submit();
            show('Mailchimp submit fired');
          } catch(_) {}
        } else {
          show('Mailchimp form not found');
        }
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', init);
})();
