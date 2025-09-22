(function(){
  if (!/\/pages\/contact(\?|$)/i.test(location.pathname)) return;

  const mc = document.querySelector('form[action*="list-manage.com"]') || document.querySelector('form[id*="mc-embedded-subscribe-form"]');
  if (!mc) return;

  function val(sel){ const el = mc.querySelector(sel); return el ? (el.value || '').trim() : ''; }

  function nbPostShopifyCustomerFallback(payload){
    try{
      const body = new URLSearchParams();
      const url = '/contact#contact_form';
      const contentType = 'application/x-www-form-urlencoded;charset=UTF-8';
      const headers = { 'Content-Type': contentType };

      body.set('form_type','customer');
      body.set('utf8','✓');
      body.set('contact[email]', payload.email || '');
      if (payload.fname) body.set('contact[first_name]', payload.fname);
      if (payload.lname) body.set('contact[last_name]', payload.lname);
      if (payload.phone) body.set('contact[phone]', payload.phone);

      const tags = [];
      if (payload.consent) { body.set('contact[accepts_marketing]','true'); tags.push('newsletter'); }
      if (Array.isArray(payload.tags) && payload.tags.length) {
        tags.push.apply(tags, payload.tags);
      }
      body.set('contact[tags]', tags.join(', '));

      const encoded = body.toString();
      if (navigator.sendBeacon) {
        const blob = new Blob([encoded], { type: contentType });
        navigator.sendBeacon(url, blob);
        return Promise.resolve();
      }

      return fetch(url, {
        method:'POST',
        body: encoded,
        credentials:'same-origin',
        keepalive: true,
        headers
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
    const consent = !!mc.querySelector('input[name="gdpr[CONSENT]"]')?.checked;

    postCustomer({ email, fname, lname, phone, consent, tags: ['Source: /contact'] });
  }

  // Hook Mailchimp submit; send Shopify in parallel (non-blocking)
  mc.addEventListener('submit', function(){ postShopify(); }, { capture:true });
})();
