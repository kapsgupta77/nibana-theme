(function(){
  if (!/\/pages\/contact(\?|$)/i.test(location.pathname)) return;

  const mc = document.querySelector('form[action*="list-manage.com"]') || document.querySelector('form[id*="mc-embedded-subscribe-form"]');
  if (!mc) return;

  function val(sel){ const el = mc.querySelector(sel); return el ? (el.value || '').trim() : ''; }

  function nbPostShopifyCustomerFallback(payload){
    try{
      const params = new URLSearchParams();
      const url = '/contact#contact_form';
      const contentType = 'application/x-www-form-urlencoded;charset=UTF-8';

      params.set('form_type','customer');
      params.set('utf8','✓');
      params.set('contact[email]', payload.email || '');
      if (payload.fname) params.set('contact[first_name]', payload.fname);
      if (payload.lname) params.set('contact[last_name]', payload.lname);
      if (payload.phone) params.set('contact[phone]', payload.phone);

      const tags = [];
      if (payload.consent) { params.set('contact[accepts_marketing]','true'); tags.push('newsletter'); }
      if (Array.isArray(payload.tags) && payload.tags.length) {
        tags.push.apply(tags, payload.tags);
      }
      params.set('contact[tags]', tags.join(', '));

      const encoded = params.toString();
      if (navigator.sendBeacon) {
        const blob = new Blob([encoded], { type: contentType });
        if (navigator.sendBeacon(url, blob)) return Promise.resolve();
      }

      return fetch(url, {
        method:'POST',
        body: encoded,
        credentials:'same-origin',
        keepalive: true,
        headers: { 'Content-Type': contentType }
      });
    }catch(e){ /* noop */ }
  }

  const postCustomer = typeof window.nbPostShopifyCustomer === 'function'
    ? window.nbPostShopifyCustomer
    : nbPostShopifyCustomerFallback;

  function postShopify(){
    const email = val('[name="EMAIL"], input[type="email"]');
    if (!email) return;

    const fname = val('[name="FNAME"], [name="first_name"]');
    const lname = val('[name="LNAME"], [name="last_name"]');
    const phone = val('[name="PHONE"], [type="tel"], [name="phone"]');
    const gdprConsent = !!mc.querySelector('input[name="gdpr[CONSENT]"]')?.checked;
    const formConsent = !!document.querySelector('#JoinEmails')?.checked;
    const consent = gdprConsent || formConsent;

    postCustomer({ email, fname, lname, phone, consent, tags: ['Source: /contact'] });
  }

  // Hook Mailchimp submit; send Shopify in parallel (non-blocking)
  mc.addEventListener('submit', function(){ postShopify(); }, { capture:true });
})();
