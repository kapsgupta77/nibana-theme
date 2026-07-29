(function(){
  const NAME_RE = /^[\p{L}\p{M}' .-]{1,50}$/u;
  const cf = document.getElementById('nb-contact-shopify');
  if (!cf) return;

  const sectionEl = cf.closest('.nb-contact') || document.querySelector('[data-nb-contact]');
  if (sectionEl) {
    // Mark labels of required inputs so CSS can render the red "*"
    (function markRequired(){
      const rootId = sectionEl.id ? '#' + sectionEl.id : '[data-nb-contact]';
      document.querySelectorAll(rootId + ' [required]').forEach(function(el){
        const lab = el.id ? document.querySelector(rootId + ' label[for="'+ el.id +'"]') : null;
        if (lab) lab.classList.add('nb-required');
      });
    })();
  }

  const setValue = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
    return el;
  };

  cf.addEventListener('submit', function (e) {
    const fnameEl = document.getElementById('nbc-first');
    const lnameEl = document.getElementById('nbc-last');
    if (fnameEl) fnameEl.setCustomValidity('');
    if (lnameEl) lnameEl.setCustomValidity('');
    const fname = (fnameEl?.value || '').trim();
    const lname = (lnameEl?.value || '').trim();
    if (fnameEl && !NAME_RE.test(fname)) { fnameEl.setCustomValidity(fname ? 'Please enter a valid first name.' : 'First name is required.'); fnameEl.reportValidity(); e.preventDefault(); return; }
    if (lnameEl && !NAME_RE.test(lname)) { lnameEl.setCustomValidity(lname ? 'Please enter a valid last name.' : 'Last name is required.'); lnameEl.reportValidity(); e.preventDefault(); return; }
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

    fetch('https://nibana-brevo-sync.nibana.workers.dev/?key=ccda216d6eb89592caad18eeb754697f774263bdfa84666c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, first_name: fname, last_name: lname, tags: (tagsInput ? tagsInput.value : '').split(', ').filter(Boolean), consent: consent }),
    }).catch(() => {});
    // IMPORTANT: do not preventDefault(); Shopify customer form will submit
    // and keep the on-page success UI while mirrors handle messaging.
  }, { capture: true });
})();
