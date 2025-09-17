(function(){
  function init(){
    if (window.__nbContactBound) return;
    window.__nbContactBound = true;

    const sectionEl = document.querySelector('[data-nb-contact]');
    if (!sectionEl) return;

    const debugOn   = String(sectionEl.getAttribute('data-nb-debug')) === 'true';
    const mcEnabled = String(sectionEl.getAttribute('data-mc-enabled')) === 'true';
    const mcAction  = sectionEl.getAttribute('data-mc-action') || '';
    const scEnabled = String(sectionEl.getAttribute('data-shopify-customer-enabled')) === 'true';

    // tiny debug badge
    let dbg;
    function show(msg){
      if (!debugOn) return;
      if (!dbg){
        dbg = document.createElement('div');
        dbg.style.cssText = 'position:fixed;right:10px;bottom:10px;background:#111;color:#0f0;padding:8px 10px;border-radius:8px;font:12px/1.4 system-ui;z-index:99999';
        dbg.textContent = 'Mailchimp debug: init';
        document.body.appendChild(dbg);
      }
      dbg.textContent = 'Mailchimp debug: ' + msg;
    }
    show('ready');

    // Capture-phase listener so it fires even during fast navigations
    document.addEventListener('submit', function(e){
      const form = e.target;
      if (!form || form.id !== 'NibanaContactForm') return;

      const join = document.getElementById('JoinEmails');
      if (!join || !join.checked) { show('opt-in unchecked'); return; }

      const email   = document.getElementById('ContactEmail')?.value || '';
      const name    = document.getElementById('ContactName')?.value || '';
      const phone   = document.getElementById('ContactPhone')?.value || '';
      const purpose = document.getElementById('InquiryPurpose')?.value || '';
      const tags    = ['Contact Form'];
      if (purpose) tags.push('Purpose: ' + purpose);

      // --- Mailchimp path (recommended, not blocked by hCaptcha) ---
      if (mcEnabled && mcAction) {
        const mcForm   = document.getElementById('NibanaMailchimp');
        const mcFrame  = document.getElementById('MailchimpFrame');
        if (mcForm && mcFrame) {
          mcForm.setAttribute('action', mcAction);
          // Basic fields; FNAME = first name only
          const first = (name || '').trim().split(/\s+/)[0] || '';
          document.getElementById('MC_EMAIL').value = email;
          document.getElementById('MC_FNAME').value = first;
          document.getElementById('MC_PHONE').value = phone;
          document.getElementById('MC_TAGS').value  = 'newsletter, ' + tags.join(', ');

          try {
            mcForm.requestSubmit ? mcForm.requestSubmit() : mcForm.submit();
            show('Mailchimp submit fired');
          } catch(_) {}
        } else {
          show('Mailchimp form not found');
        }
      }

      // --- Optional Shopify customer path (can be blocked by hCaptcha) ---
      if (scEnabled) {
        const hiddenForm  = document.getElementById('NibanaHiddenNewsletter');
        const hiddenFrame = document.getElementById('NewsletterFrame');
        if (hiddenForm && hiddenFrame) hiddenForm.setAttribute('target','NewsletterFrame');
        if (hiddenForm) {
          const emailInput = document.getElementById('HiddenCustomerEmail');
          const tagInput   = document.getElementById('HiddenCustomerTags');
          if (emailInput) emailInput.value = email;
          if (tagInput)   tagInput.value   = ['newsletter'].concat(tags).join(', ');

          const fd = new FormData(hiddenForm);
          fd.set('contact[email]', email);
          fd.set('contact[tags]', ['newsletter'].concat(tags).join(', '));
          const url = hiddenForm.getAttribute('action') || '/contact#newsletter';

          try {
            const params = new URLSearchParams();
            for (const [k,v] of fd.entries()) params.append(k,v);
            navigator.sendBeacon(url, new Blob([params.toString()], {type:'application/x-www-form-urlencoded;charset=UTF-8'}));
            show('Shopify beacon sent');
          } catch(_) {}

          try {
            fetch(url,{method:'POST', body:fd, credentials:'same-origin', keepalive:true})
              .then(()=>show('Shopify fetch keepalive complete')).catch(()=>{});
          } catch(_) {}

          try {
            hiddenForm.requestSubmit ? hiddenForm.requestSubmit() : hiddenForm.submit();
            show('Shopify iframe submit fired');
          } catch(_) {}
        }
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', init);
})();
