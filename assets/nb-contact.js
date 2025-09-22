(function(){
  let show = function(){};

  function nbSubmitShopifyContact(options = {}){
    try {
      const hiddenForm = document.getElementById('NibanaHiddenContact');
      if (!hiddenForm) {
        show('Hidden Shopify contact form missing');
        return false;
      }

      const frame = document.getElementById('HiddenContactFrame');
      if (frame) {
        hiddenForm.setAttribute('target', frame.getAttribute('name') || 'HiddenContactFrame');
      }

      const email = (options.email || '').trim();
      const firstName = (options.firstName || '').trim();
      const lastName = (options.lastName || '').trim();
      const phone = (options.phone || '').trim();
      const acceptsMarketing = !!options.acceptsMarketing;
      const tags = Array.isArray(options.tags) ? options.tags.filter(Boolean) : [];
      if (acceptsMarketing && !tags.some(tag => String(tag).toLowerCase() === 'newsletter')) {
        tags.unshift('newsletter');
      }
      const tagString = tags.join(', ');
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      const assign = (id, value) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
      };
      assign('HiddenContactEmail', email);
      assign('HiddenContactFirstName', firstName);
      assign('HiddenContactLastName', lastName);
      assign('HiddenContactPhone', phone);
      assign('HiddenContactTags', tagString);
      assign('HiddenContactAcceptsMarketing', acceptsMarketing ? 'true' : 'false');
      assign('HiddenContactName', fullName);

      const fd = new FormData(hiddenForm);
      fd.set('contact[email]', email);
      fd.set('contact[first_name]', firstName);
      fd.set('contact[last_name]', lastName);
      fd.set('contact[phone]', phone);
      fd.set('contact[tags]', tagString);
      fd.set('accepts_marketing', acceptsMarketing ? 'true' : 'false');
      fd.set('contact[name]', fullName);

      const url = hiddenForm.getAttribute('action') || '/contact#contact_form';

      try {
        if (typeof navigator.sendBeacon === 'function') {
          const params = new URLSearchParams();
          for (const [key, value] of fd.entries()) {
            params.append(key, value);
          }
          const encoded = params.toString();
          const blob = new Blob([encoded], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
          if (navigator.sendBeacon(url, blob)) {
            show('Shopify beacon sent');
          }
        }
      } catch(_) {}

      try {
        fetch(url, { method: 'POST', body: fd, credentials: 'same-origin', keepalive: true })
          .then(() => show('Shopify fetch keepalive complete'))
          .catch(() => {});
      } catch(_) {}

      try {
        hiddenForm.requestSubmit ? hiddenForm.requestSubmit() : hiddenForm.submit();
        show('Shopify iframe submit fired');
      } catch(_) {}

      return true;
    } catch(_) {
      return false;
    }
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

    document.addEventListener('submit', function(e){
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

      if (mcEnabled && mcAction) {
        const mcForm   = document.getElementById('NibanaMailchimp');
        const mcFrame  = document.getElementById('MailchimpFrame');
        if (mcForm && mcFrame) {
          mcForm.setAttribute('action', mcAction);
          const first = (name || '').trim().split(/\s+/)[0] || '';
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

      if (scEnabled) {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        const firstName = parts.shift() || '';
        const lastName = parts.join(' ');
        if (typeof window.nbSubmitShopifyContact === 'function') {
          const ok = window.nbSubmitShopifyContact({
            email,
            firstName,
            lastName,
            phone,
            tags,
            acceptsMarketing: !!join.checked
          });
          if (!ok) show('Shopify contact helper failed');
        } else {
          show('Shopify contact helper missing');
        }
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', init);
})();
