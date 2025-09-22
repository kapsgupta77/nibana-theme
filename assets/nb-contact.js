(function(){
  const cf = document.getElementById('nb-contact-shopify');
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
    const reason = document.getElementById('nbc-reason')?.value || '';
    const message = document.getElementById('nbc-message')?.value || '';
    const consent = !!document.getElementById('nbc-consent')?.checked;
    const fullname = `${fname} ${lname}`.trim();

    setValue('nbc-name', fullname);

    const tagsInput = document.getElementById('nbc-tags');
    if (tagsInput) {
      const base = tagsInput.getAttribute('data-base') || tagsInput.defaultValue || '';
      const tags = [];
      if (base) tags.push(base);
      if (reason) tags.push(`Inquiry: ${reason}`);
      let tagString = tags.join(', ');
      if (consent) {
        if (!/(^|,\s*)newsletter(\s*|,|$)/i.test(tagString)) {
          tagString = tagString ? `${tagString}, newsletter` : 'newsletter';
        }
      }
      tagsInput.value = tagString;
    }

    setValue('nbc-accepts', consent ? 'true' : 'false');

    // ----- Shopify contact email mirror (fire-and-forget)
    const emailForm = document.getElementById('nb-contact-email');
    if (emailForm) {
      setValue('nbc-email-first', fname);
      setValue('nbc-email-last', lname);
      setValue('nbc-email-name', fullname);
      setValue('nbc-email-email', email);
      setValue('nbc-email-phone', phone);
      setValue('nbc-email-reason', reason);
      setValue('nbc-email-body', message);
      if (emailForm.requestSubmit) emailForm.requestSubmit(); else emailForm.submit();
    }

    // ----- Mailchimp mirror (parallel)
    const mc = document.getElementById('nbc-mc');
    if (mc) {
      if (consent) {
        setValue('nbc-mc-fname', fname);
        setValue('nbc-mc-lname', lname);
        setValue('nbc-mc-email', email);
        setValue('nbc-mc-phone', phone);
        setValue('nbc-mc-consent', '1');
        if (mc.requestSubmit) mc.requestSubmit(); else mc.submit();
      } else {
        setValue('nbc-mc-fname', '');
        setValue('nbc-mc-lname', '');
        setValue('nbc-mc-email', '');
        setValue('nbc-mc-phone', '');
        setValue('nbc-mc-consent', '0');
      }
    }

    // IMPORTANT: do not preventDefault(); Shopify customer form will submit
    // and keep the on-page success UI while mirrors handle messaging.
  }, { capture: true });
})();
