(function(){
  const form = document.getElementById('nb-contact-shopify');
  if (!form) return;

  form.addEventListener('submit', function () {
    const fname = document.getElementById('nbc-fname')?.value || '';
    const lname = document.getElementById('nbc-lname')?.value || '';
    const email = document.getElementById('nbc-email')?.value || '';
    const phone = document.getElementById('nbc-phone')?.value || '';
    const consent = !!document.getElementById('nbc-consent')?.checked;

    // Fill Shopify hidden fields
    const accepts = document.getElementById('nbc-accepts');
    if (accepts) accepts.value = consent ? 'true' : 'false';
    // nbc-tags already has Source: /contact by default; append newsletter if consent
    const tagsEl = document.getElementById('nbc-tags');
    if (tagsEl && consent && !/(\b|,)\s*newsletter\s*(,|$)/i.test(tagsEl.value)) {
      tagsEl.value = (tagsEl.value ? (tagsEl.value + ', newsletter') : 'newsletter');
    }

    // Parallel Mailchimp submit
    const mc = document.getElementById('nbc-mc');
    if (mc) {
      document.getElementById('nbc-mc-fname').value = fname;
      document.getElementById('nbc-mc-lname').value = lname;
      document.getElementById('nbc-mc-email').value = email;
      document.getElementById('nbc-mc-phone').value = phone;
      if (mc.requestSubmit) mc.requestSubmit(); else mc.submit();
    }
    // IMPORTANT: do not preventDefault(); let Shopify submit normally.
  }, { capture: true });
})();
