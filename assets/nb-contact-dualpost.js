(function(){
  if (!/\/pages\/contact(\?|$)/i.test(location.pathname)) return;

  const mc = document.querySelector('form[action*="list-manage.com"]') || document.querySelector('form[id*="mc-embedded-subscribe-form"]');
  if (!mc) return;

  function val(sel){ const el = mc.querySelector(sel); return el ? (el.value || '').trim() : ''; }

  function postShopify(){
    const email = val('[name="EMAIL"], input[type="email"]');
    if (!email) return;

    const fname = val('[name="FNAME"], [name="first_name"]');
    const lname = val('[name="LNAME"], [name="last_name"]');
    const phone = val('[name="PHONE"], [type="tel"], [name="phone"]');
    const consent = !!mc.querySelector('input[name="gdpr[CONSENT]"]')?.checked;

    const fd = new FormData();
    fd.set('form_type','customer'); fd.set('utf8','✓');
    fd.set('contact[email]', email);
    if (fname) fd.set('contact[first_name]', fname);
    if (lname) fd.set('contact[last_name]', lname);
    if (phone) fd.set('contact[phone]', phone);

    const tags = [];
    if (consent){ fd.set('contact[accepts_marketing]','true'); tags.push('newsletter'); }
    tags.push('Source: /contact');
    fd.set('contact[tags]', tags.join(', '));

    fetch('/contact#contact_form', { method:'POST', body: fd, credentials:'same-origin' }).catch(()=>{});
  }

  // Hook Mailchimp submit; send Shopify in parallel (non-blocking)
  mc.addEventListener('submit', function(){ setTimeout(postShopify, 0); }, { capture:true });
})();
