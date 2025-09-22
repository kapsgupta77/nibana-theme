(function(){
  const cf = document.getElementById('nb-contact-form');
  if (!cf) return;

  cf.addEventListener('submit', function () {
    const fname = document.getElementById('nbc-first')?.value || '';
    const lname = document.getElementById('nbc-last')?.value || '';
    const email = document.getElementById('nbc-email')?.value || '';
    const phone = document.getElementById('nbc-phone')?.value || '';
    const consent = !!document.getElementById('nbc-consent')?.checked;

    // ----- Shopify Customer mirror (fire-and-forget)
    const sf = document.getElementById('nb-contact-customer');
    if (sf) {
      document.getElementById('nbc-cust-email').value = email;
      document.getElementById('nbc-cust-f').value     = fname;
      document.getElementById('nbc-cust-l').value     = lname;
      document.getElementById('nbc-cust-phone').value = phone;
      document.getElementById('nbc-cust-acc').value   = consent ? 'true' : 'false';

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
      document.getElementById('nbc-mc-fname').value = fname;
      document.getElementById('nbc-mc-lname').value = lname;
      document.getElementById('nbc-mc-email').value = email;
      document.getElementById('nbc-mc-phone').value = phone;
      if (mc.requestSubmit) mc.requestSubmit(); else mc.submit();
    }

    // IMPORTANT: do not preventDefault(); Shopify CONTACT form will submit
    // and send the store email (includes reason + message).
  }, { capture: true });
})();
