(function(){
  function init(){
    if (window.__nbContactBound) return;
    window.__nbContactBound = true;

    const sectionEl = document.querySelector('[data-nb-contact]');
    const debugEnabled = (sectionEl && String(sectionEl.getAttribute('data-nb-debug')) === 'true');
    let dbg;
    function show(msg){
      if (!debugEnabled) return;
      if (!dbg){
        dbg = document.createElement('div');
        dbg.style.cssText='position:fixed;right:10px;bottom:10px;background:#111;color:#0f0;padding:8px 10px;border-radius:8px;font:12px/1.4 system-ui;z-index:99999';
        dbg.textContent='Mailchimp debug: init';
        document.body.appendChild(dbg);
      }
      dbg.textContent='Mailchimp debug: ' + msg;
    }

    // Capture phase so we still run even if the page navigates
    document.addEventListener('submit', function(e){
      const form = e.target;
      if (!form || form.id !== 'NibanaContactForm') return;

      const join = document.getElementById('JoinEmails');
      if (!join || !join.checked) { show('opt-in unchecked'); return; }

      const hiddenForm  = document.getElementById('NibanaHiddenNewsletter');
      const hiddenFrame = document.getElementById('NewsletterFrame');
      if (!hiddenForm){ show('hidden form missing'); return; }
      if (hiddenFrame) hiddenForm.setAttribute('target','NewsletterFrame');

      const email   = document.getElementById('ContactEmail')?.value || '';
      const purpose = document.getElementById('InquiryPurpose')?.value || '';
      const tags    = ['newsletter','Contact Form'];
      if (purpose) tags.push('Purpose: ' + purpose);

      const emailInput = document.getElementById('HiddenCustomerEmail');
      const tagInput   = document.getElementById('HiddenCustomerTags');
      if (emailInput) emailInput.value = email;
      if (tagInput)   tagInput.value   = tags.join(', ');

      // Build payload (includes Shopify's hidden inputs from {% form 'customer' %})
      const fd = new FormData(hiddenForm);
      fd.set('contact[email]', email);
      fd.set('contact[tags]', tags.join(', '));

      const url = hiddenForm.getAttribute('action') || '/contact#newsletter';

      // 1) sendBeacon
      try{
        const params = new URLSearchParams();
        for (const [k,v] of fd.entries()) params.append(k,v);
        const ok = navigator.sendBeacon(url, new Blob([params.toString()], {type:'application/x-www-form-urlencoded;charset=UTF-8'}));
        if (ok) show('sent via beacon');
      }catch(_){}

      // 2) fetch keepalive
      try{
        fetch(url,{method:'POST', body:fd, credentials:'same-origin', keepalive:true})
          .then(()=>show('fetch keepalive complete'))
          .catch(()=>{});
      }catch(_){}

      // 3) iframe fallback (real form POST)
      try{
        if (hiddenForm.requestSubmit) hiddenForm.requestSubmit();
        else document.getElementById('HiddenSubmit')?.click();
        show('iframe submit fired');
      }catch(_){}
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-bind if the section is hot-reloaded in the Theme Editor
  document.addEventListener('shopify:section:load', init);
})();
