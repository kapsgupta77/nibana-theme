(function(){
  if (!/\/pages\/contact(\?|$)/i.test(location.pathname)) return;

  const mc = document.querySelector('form[action*="list-manage.com"]') || document.querySelector('form[id*="mc-embedded-subscribe-form"]');
  if (!mc) return;

  function val(sel){ const el = mc.querySelector(sel); return el ? (el.value || '').trim() : ''; }

  function postEncodedShopifyContact(payload){
    try {
      const url = '/contact#contact_form';
      const params = new URLSearchParams();
      params.set('form_type', 'contact');
      params.set('utf8', '✓');
      params.set('contact[email]', payload.email || '');
      params.set('contact[first_name]', payload.fname || '');
      params.set('contact[last_name]', payload.lname || '');
      params.set('contact[phone]', payload.phone || '');
      params.set('contact[name]', [payload.fname, payload.lname].filter(Boolean).join(' '));

      const tags = Array.isArray(payload.tags) ? payload.tags.slice() : [];
      if (payload.consent && !tags.some(tag => String(tag).toLowerCase() === 'newsletter')) {
        tags.unshift('newsletter');
      }
      params.set('contact[tags]', tags.join(', '));
      params.set('accepts_marketing', payload.consent ? 'true' : 'false');

      const encoded = params.toString();
      return fetch(url, {
        method: 'POST',
        body: encoded,
        credentials: 'same-origin',
        keepalive: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
      }).catch(() => {});
    } catch(_) {
      return Promise.resolve();
    }
  }

  function postShopify(){
    const email = val('[name="EMAIL"], input[type="email"]');
    if (!email) return;

    const firstName = val('[name="FNAME"], [name="first_name"]');
    const lastName = val('[name="LNAME"], [name="last_name"]');
    const phone = val('[name="PHONE"], [type="tel"], [name="phone"]');
    const gdprConsent = !!mc.querySelector('input[name="gdpr[CONSENT]"]')?.checked;
    const formConsent = !!document.querySelector('#JoinEmails')?.checked;
    const acceptsMarketing = gdprConsent || formConsent;

    const payload = {
      email,
      fname: firstName,
      lname: lastName,
      phone,
      tags: ['Source: /contact'],
      consent: acceptsMarketing
    };

    const hiddenForm = document.getElementById('NibanaHiddenNewsletter') || document.getElementById('NibanaHiddenContact');
    if (typeof window.nbSubmitShopifyContact === 'function' && hiddenForm) {
      window.nbSubmitShopifyContact(payload);
    } else {
      postEncodedShopifyContact(payload);
    }
  }

  mc.addEventListener('submit', function(){ postShopify(); }, { capture:true });
})();
