(function(){
  // Only run on the Contact page route
  if (!/\/pages\/contact(\?|$)/i.test(location.pathname)) return;

  // Find a Mailchimp embed form on the page
  const mc = document.querySelector('form[action*="list-manage.com"]') || document.querySelector('form[id*="mc-embedded-subscribe-form"]');
  if (!mc) return;

  function val(sel){ const el = mc.querySelector(sel); return el ? (el.value || '').trim() : ''; }

  function postShopify(){
    const email = val('[name="EMAIL"], input[type="email"]');
    if (!email) return;

    const fname = val('[name="FNAME"], [name="first_name"]');
    const lname = val('[name="LNAME"], [name="last_name"]');
    const phone = val('[name="PHONE"], [type="tel"], [name="phone"]');
    const consentEl = mc.querySelector('input[name="gdpr[CONSENT]"]');
    const hasConsent = consentEl ? !!consentEl.checked : false;

    const fd = new FormData();
    fd.set('form_type','customer'); fd.set('utf8','✓');
    fd.set('contact[email]', email);
    if (fname) fd.set('contact[first_name]', fname);
    if (lname) fd.set('contact[last_name]', lname);
    if (phone) fd.set('contact[phone]', phone);

    const tags = ['Source: /contact'];
    if (hasConsent) { fd.set('contact[accepts_marketing]', 'true'); tags.unshift('newsletter'); }
    fd.set('contact[tags]', tags.join(', '));

    fetch('/contact#contact_form', { method: 'POST', body: fd, credentials: 'same-origin' }).catch(()=>{});
  }

  // Hook the Mailchimp submit; fire Shopify in parallel (non-blocking)
  mc.addEventListener('submit', function(){ setTimeout(postShopify, 0); }, { capture: true });
})();
