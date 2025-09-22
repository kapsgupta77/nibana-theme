(function(){
  const cf = document.getElementById('nb-contact-form');
  if (!cf) return;

  const setValue = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
    return el;
  };

  cf.addEventListener('submit', function () {
    const fname = document.getElementById('nbc-first')?.value || '';
    const lname = document.getElementById('nbc-last')?.value || '';
    const email = document.getElementById('nbc-email')?.value || '';
    const phone = document.getElementById('nbc-phone')?.value || '';
    const consent = !!document.getElementById('nbc-consent')?.checked;
    const fullname = `${fname} ${lname}`.trim();

    setValue('nbc-name', fullname);

    // ----- Shopify Customer mirror (fire-and-forget)
    const sf = document.getElementById('nb-contact-customer');
    if (sf) {
      setValue('nbc-cust-email', email);
      setValue('nbc-cust-f', fname);
      setValue('nbc-cust-l', lname);
      setValue('nbc-cust-name', fullname);
      setValue('nbc-cust-phone', phone);
      setValue('nbc-cust-acc', consent ? 'true' : 'false');

      // add newsletter to tags if consented
      const t = document.getElementById('nbc-cust-tags');
      if (t && consent && !/(\b|,)\s*newsletter\s*(,|$)/i.test(t.value)) {
        t.value = t.value ? (t.value + ', newsletter') : 'newsletter';
      }
      if (sf.requestSubmit) sf.requestSubmit(); else sf.submit();
    }

    // ----- Mailchimp mirror (parallel)
    const mc = document.getElementById('nbc-mc');
    if (mc) {
      setValue('nbc-mc-fname', fname);
      setValue('nbc-mc-lname', lname);
      setValue('nbc-mc-email', email);
      setValue('nbc-mc-phone', phone);
      setValue('nbc-mc-consent', consent ? '1' : '0');
      if (mc.requestSubmit) mc.requestSubmit(); else mc.submit();
    }

    // IMPORTANT: do not preventDefault(); Shopify CONTACT form will submit
    // and send the store email (includes reason + message).
  }, { capture: true });
})();
