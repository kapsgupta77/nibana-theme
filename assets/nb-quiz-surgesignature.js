(function(){
  function dl(event, params){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event}, params||{})); }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('section.nb-quiz.nb-quiz--surgesignature').forEach(function(section){
      const cfg = (window.NB_QUIZ && window.NB_QUIZ[section.dataset.sectionId]) || {};
      const startBtn = section.querySelector('[data-nb-quiz-start]');
      const appEl = section.querySelector('[data-nb-quiz-app]');
      const resultEl = section.querySelector('[data-nb-quiz-result]');
      let quiz = null, state = { index: 0, answers: [] }, startedAt = 0;

      // --- Microcopy / A11y hint ---
      (function(){
        const shell = section.querySelector('.nb-shell');
        if (!shell) return;
        // Add a visually-hidden hint once
        if (!section.querySelector('[data-nb-quiz-a11y]')) {
          const hint = document.createElement('div');
          hint.setAttribute('data-nb-quiz-a11y','');
          hint.setAttribute('aria-hidden','true');
          hint.style.position = 'absolute'; hint.style.left = '-9999px';
          hint.textContent = 'Hint: Use arrow keys to move, Enter to select.';
          shell.prepend(hint);
        }
      })();

      try {
        const memStyle = localStorage.getItem('nb_surge_style');
        if (memStyle && ['accelerator','stabilizer','defuser'].includes(memStyle)) {
          const dismissed = localStorage.getItem('nb_quiz_banner_dismissed') === '1';
          if (!dismissed) {
            const banner = document.createElement('div');
            banner.className = 'nb-card';
            banner.style.marginBottom = '16px';
            banner.innerHTML = `
              <div class="nb-quiz__mem">
                <strong>Last time you were ${memStyle.charAt(0).toUpperCase()+memStyle.slice(1)}.</strong>
                <div class="nb-quiz__mem-actions">
                  <a class="nb-btn nb-btn--ghost" href="/pages/surge-signature-result?style=${memStyle}" data-mem-view>View result</a>
                  <button class="nb-btn nb-btn--primary" type="button" data-mem-retake>Retake</button>
                  <button class="nb-btn nb-btn--ghost" type="button" data-mem-dismiss aria-label="Dismiss">Dismiss</button>
                </div>
              </div>`;
            section.querySelector('.nb-shell').prepend(banner);
            window.dataLayer = window.dataLayer || []; window.dataLayer.push({event:'memory_banner_view', quiz_style: memStyle});
            banner.querySelector('[data-mem-view]').addEventListener('click', ()=>{ window.dataLayer.push({event:'memory_view_result_click', quiz_style: memStyle}); });
            banner.querySelector('[data-mem-retake]').addEventListener('click', ()=>{ window.dataLayer.push({event:'memory_retake_click', quiz_style: memStyle}); });
            banner.querySelector('[data-mem-dismiss]').addEventListener('click', ()=>{
              try { localStorage.setItem('nb_quiz_banner_dismissed','1'); } catch(e){}
              banner.remove();
            });
          }
        }
      } catch(e){}

      async function loadQuiz(){
        const res = await fetch(cfg.jsonUrl, { credentials: 'same-origin' });
        return res.json();
      }

      function setProgressLabel(index, total){
        const pill = section.querySelector('.nb-quiz__progress');
        if (pill) pill.textContent = `Question ${index} of ${total}`;
      }

      function renderQuestion(){
        const q = quiz.questions[state.index];
        appEl.innerHTML = `
          <div class="nb-card">
            <div class="nb-quiz__progress" role="progressbar" aria-valuemin="0" aria-valuemax="${quiz.questions.length}" aria-valuenow="${state.index+1}">
              Question ${state.index+1} of ${quiz.questions.length}
            </div>
            <h3 class="nb-quiz__prompt" aria-live="polite">${q.prompt}</h3>
            <div class="nb-quiz__options">
              ${q.options.map((o,i)=>`<button class="nb-btn nb-btn--option" data-value="${o.value}" data-i="${i}">${o.label}</button>`).join('')}
            </div>
          </div>`;
        setProgressLabel(state.index+1, quiz.questions.length);
        dl('quiz_question_view', { index: state.index+1, quiz: cfg.gaNamespace });
        appEl.querySelectorAll('.nb-btn--option').forEach(b=>{
          b.addEventListener('click', ()=>{
            state.answers[state.index] = b.dataset.value;
            state.index++;
            if(state.index < quiz.questions.length){ renderQuestion(); }
            else { onComplete(); }
          });
        });
      }

      function tally(){
        const t = {A:0,B:0,C:0};
        state.answers.forEach(v => { if(t[v]!==undefined) t[v]++; });
        const maxKey = Object.keys(t).sort((a,b)=>t[b]-t[a])[0];
        return quiz.scoring[maxKey];
      }

      function onComplete(){
        const elapsed = Date.now() - startedAt;
        const style = tally();
        window.NB_QUIZ_STYLE = style;
        dl('quiz_complete', { quiz: cfg.gaNamespace, time_to_complete_ms: elapsed, quiz_style: style });
        try { localStorage.setItem('nb_surge_style', style); localStorage.removeItem('nb_quiz_banner_dismissed'); } catch(e){}
        dl('quiz_result', { quiz: cfg.gaNamespace, style: style });

        const s = quiz.styles[style];

        // ---- BEGIN Mailchimp Group IDs (REAL) ----
        // Mailchimp Group Category "Lead Source" (checkboxes)
        const MC_CAT_ID    = '78632';
        const MC_INT_SURGE = '1'; // Surge Signature Quiz
        const MC_INT_ACCEL = '2'; // Accelerator
        const MC_INT_STABL = '4'; // Stabiliser
        const MC_INT_DEFUS = '8'; // Defuser
        // Map computed style -> interest ID
        let styleInterest = '';
        if (style === 'accelerator') styleInterest = MC_INT_ACCEL;
        else if (style === 'stabilizer' || style === 'stabiliser') styleInterest = MC_INT_STABL;
        else if (style === 'defuser') styleInterest = MC_INT_DEFUS;
        // ---- END Mailchimp Group IDs ----

        // Parse u & id from the Mailchimp action URL
        const act = document.createElement('a');
        act.href = cfg.mailchimpAction;
        const params = new URLSearchParams(act.search);
        const mc_u = params.get('u') || '';
        const mc_id = params.get('id') || '';

        // Build action URL with tag appended for redundancy
        if (!params.has('tags')) {
          params.append('tags', 'Surge Signature Quiz');
        }
        const actionWithParams = act.origin + act.pathname + '?' + params.toString();

        const emailForm = `
    <div data-nb-quiz-form>
      <form id="nb-quiz-sub" data-nb-quiz-sub action="${actionWithParams}" method="post" target="mc-target-${section.dataset.sectionId}">
        <p class="nb-quiz__result-kicker">Your Surge Signature™</p>
        <h3 class="nb-quiz__result-title">${s.title}</h3>
        <p class="nb-quiz__summary">${s.summary}</p>
        <p class="nb-quiz__trust">We’ll email the full 2-page playbook with tailored practices. GDPR-friendly—no spam.</p>
        <div class="nb-quiz__free-insight">Try this: ${s.practice_preview}</div>

        <div class="nb-quiz__gate">
          <label for="nb-fname">First name *</label>
          <input id="nb-fname" type="text" name="FNAME" required placeholder="First">

          <label for="nb-lname" style="margin-top:8px;">Last name *</label>
          <input id="nb-lname" type="text" name="LNAME" required placeholder="Last">

          <label for="nb-email" style="margin-top:8px;">Email *</label>
          <input id="nb-email" type="email" name="EMAIL" required placeholder="you@domain.com">

          <label for="nb-phone" style="margin-top:8px;">Phone (optional)</label>
          <input id="nb-phone" type="tel" name="PHONE" placeholder="+44 7700 900123">

          <!-- Audience keys -->
          <input type="hidden" name="u" value="${mc_u}">
          <input type="hidden" name="id" value="${mc_id}">

          <!-- Mailchimp Interest Group: always check "Surge Signature Quiz" -->
          <input type="checkbox" name="group[${MC_CAT_ID}][${MC_INT_SURGE}]" value="1" checked hidden>

          <!-- Mailchimp Interest Group: style-specific interest -->
          ${styleInterest ? `<input type="checkbox" name="group[${MC_CAT_ID}][${styleInterest}]" value="1" checked hidden>` : ''}

          <!-- Style merge field (text) -->
          <input type="hidden" name="STYLE" value="${style}">

          ${cfg.enableGdpr ? `<div class="nb-quiz__gdpr"><label><input type="checkbox" name="gdpr[CONSENT]" required> I consent to receive emails. See Privacy.</label></div>` : ``}

          <button type="submit" class="nb-btn nb-btn--primary" style="margin-top:8px;">Email me the full playbook</button>
        </div>
      </form>
    </div>

    <div class="nb-quiz__thanks nb-card" data-nb-quiz-thanks hidden>
      <h3>Check your inbox ✉️</h3>
      <p>We’ve sent your 2-page playbook. If it’s not there, check Promotions/Spam.</p>
      <p><a href="/pages/surge-signature-result?style=${style}">View your result on Nibana →</a></p>
      <p>Want help applying it? Book a 20-min Clarity Call—come with one situation; leave with a clear next step.</p>
    </div>
  `;

        appEl.hidden = true;
        resultEl.hidden = false;
        resultEl.innerHTML = `<div class="nb-card nb-quiz__result-card">${emailForm}</div>`;

        const sub = resultEl.querySelector('#nb-quiz-sub');
        const thanks = resultEl.querySelector('[data-nb-quiz-thanks]');

        function buildStyleLabel(){
          const slug = (window.NB_QUIZ_STYLE || document.querySelector('[data-nb-style]')?.getAttribute('data-nb-style') || '').toLowerCase();
          const map = { accelerator: 'Accelerator', stabilizer: 'Stabiliser', stabiliser: 'Stabiliser', defuser: 'Defuser' };
          return map[slug] || '';
        }

        async function submitShopifyTags(when){
          if (!sub) return;
          const sf = document.getElementById('nb-shopify-form');
          const fEmail = document.getElementById('nb-sf-email');
          const fF = document.getElementById('nb-sf-fname');
          const fL = document.getElementById('nb-sf-lname');
          const fP = document.getElementById('nb-sf-phone');
          const fTags = document.getElementById('nb-sf-tags');
          if (!sf || !fEmail || !fTags) return;

          const email = sub.querySelector('[name="EMAIL"]')?.value || '';
          const fname = sub.querySelector('[name="FNAME"]')?.value || '';
          const lname = sub.querySelector('[name="LNAME"]')?.value || '';
          const phone = sub.querySelector('[name="PHONE"]')?.value || '';
          const styleLabel = buildStyleLabel();

          fEmail.value = email;
          if (fF) fF.value = fname;
          if (fL) fL.value = lname;
          if (fP) fP.value = phone;

          const baseTags = sf.dataset.baseTags || fTags.value || '';
          sf.dataset.baseTags = baseTags;

          const extra = [
            'Quiz: Surge Signature',
            styleLabel ? `Style: ${styleLabel}` : '',
            'Source: /surge-signature'
          ].filter(Boolean).join(', ');
          fTags.value = [baseTags, extra].filter(Boolean).join(', ');

          try {
            const fd = new FormData(sf);
            const res = await fetch(sf.action || '/contact#contact_form', { method: 'POST', body: fd, credentials: 'same-origin' });
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'shopify_customer_submit', attempt: when, status: res.ok ? 'ok' : 'http_error', quiz_style: styleLabel });
          } catch (e) {
            sf.submit();
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'shopify_customer_submit', attempt: when, status: 'iframe', quiz_style: styleLabel });
          }
        }
        sub.setAttribute('target', `mc-target-${section.dataset.sectionId}`);
        try {
          const saved = JSON.parse(localStorage.getItem('nb_surge_user') || '{}');
          ['FNAME','LNAME','EMAIL','PHONE'].forEach(k=>{
            const el = sub.querySelector(`[name="${k}"]`);
            if (el && saved[k]) el.value = saved[k];
          });
          if (saved.FNAME || saved.EMAIL) {
            window.dataLayer = window.dataLayer || []; window.dataLayer.push({event:'prefill_used', quiz_style: style});
          }
        } catch(e){}

        // Fire GA event; HTML5 "required" handles validation for FNAME/LNAME/EMAIL
        sub.addEventListener('submit', function(){
          const payload = {
            FNAME: sub.querySelector('[name="FNAME"]')?.value || '',
            LNAME: sub.querySelector('[name="LNAME"]')?.value || '',
            EMAIL: sub.querySelector('[name="EMAIL"]')?.value || '',
            PHONE: sub.querySelector('[name="PHONE"]')?.value || ''
          };
          const consentField = sub.querySelector('input[name="gdpr[CONSENT]"]');
          const consentChecked = !consentField || consentField.checked;

          if (payload.EMAIL && consentChecked && window.NBTagWorker) {
            const styleLabel = buildStyleLabel();
            window.NBTagWorker.enqueue({
              email: payload.EMAIL,
              fname: payload.FNAME,
              lname: payload.LNAME,
              phone: payload.PHONE,
              styleLabel: styleLabel,
              source: '/surge-signature'
            });
            window.NBTagWorker.tick && window.NBTagWorker.tick();
          }

          try {
            localStorage.setItem('nb_surge_user', JSON.stringify(payload));
          } catch(e){}

          try {
            if (consentChecked) {
              submitShopifyTags('now');
              setTimeout(()=>submitShopifyTags('retry_2500ms'), 2500);
              setTimeout(()=>submitShopifyTags('retry_6000ms'), 6000);
            }
          } catch(e) {
            console.warn('NB QUIZ dual-post retry warn:', e);
          }

          dl('email_submit', { source: 'quiz_result_gate', quiz: cfg.gaNamespace, style: style });
        });

        // Ensure a hidden iframe exists (create if Liquid was missed)
        let iframe = document.querySelector(`iframe[name="mc-target-${section.dataset.sectionId}"]`);
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.name = `mc-target-${section.dataset.sectionId}`;
          iframe.style.display = 'none';
          section.querySelector('.nb-shell').appendChild(iframe);
        }

        // Target elements
        const formWrap = resultEl.querySelector('[data-nb-quiz-form]');
        function showThanks(){
          if (formWrap) formWrap.style.display = 'none';
          if (thanks && thanks.hidden) thanks.hidden = false;
        }

        // Primary: when the iframe loads the Mailchimp response
        iframe.addEventListener('load', showThanks);

        // Fallback: reveal after 1500ms post-submit in case load is slow
        let thanksTimer = null;
        sub.addEventListener('submit', function(event){
          if (!sub.reportValidity()) {
            event.preventDefault();
            return;
          }
          if (thanksTimer) clearTimeout(thanksTimer);
          thanksTimer = setTimeout(showThanks, 1500);
        });
      }

      startBtn.addEventListener('click', async function(){
        startBtn.disabled = true;
        quiz = await loadQuiz();
        startedAt = Date.now();
        dl('quiz_start', { quiz: cfg.gaNamespace });
        appEl.hidden = false;
        renderQuestion();
        setProgressLabel(state.index+1, quiz.questions.length);
        const header = section.querySelector('.nb-quiz__header');
        if (header) header.style.display = 'none';
      });
    });
  });
})();
