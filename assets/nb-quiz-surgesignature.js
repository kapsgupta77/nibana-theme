(function(){
  function dl(event, params){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event}, params||{})); }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('section.nb-quiz.nb-quiz--surgesignature').forEach(function(section){
      const cfg = (window.NB_QUIZ && window.NB_QUIZ[section.dataset.sectionId]) || {};
      const startBtn = section.querySelector('[data-nb-quiz-start]');
      const appEl = section.querySelector('[data-nb-quiz-app]');
      const resultEl = section.querySelector('[data-nb-quiz-result]');
      const header = section.querySelector('.nb-quiz__header');
      let quiz = null, state = { index: 0, answers: [] }, startedAt = 0;

      if (resultEl && resultEl.querySelector('[data-nb-quiz-thanks]')) {
        resultEl.hidden = false;
        if (header) header.style.display = 'none';
        try {
          const storedStyle = (localStorage.getItem('nb_surge_style') || '').toLowerCase();
          if (storedStyle) {
            const link = resultEl.querySelector('[data-nb-quiz-thanks] a');
            if (link) link.setAttribute('href', `/pages/surge-signature-result?style=${storedStyle}`);
          }
        } catch(_){}
      }

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

      function renderScoreBreakdown({ quiz, answers, container }) {
        if (!container || !quiz || !Array.isArray(answers) || !answers.length) return;

        // Map letters -> style keys (e.g., {A:'accelerator', B:'stabiliser', C:'defuser'})
        // This exists in the JSON; try both likely shapes for safety.
        var letterToStyle = (quiz.scoring && quiz.scoring.map) || quiz.scoring || {};
        var styles = quiz.styles || {};

        // Tally counts
        var totals = {};
        var totalAnswers = 0;
        answers.forEach(function(letter){
          var key = letterToStyle[letter];
          if (!key) return;
          totals[key] = (totals[key] || 0) + 1;
          totalAnswers += 1;
        });

        if (!totalAnswers) return;

        // Build DOM
        var html = '<div class="nb-quiz__scores-title">Your mix</div><ul class="nb-quiz__scores-list">';
        ['accelerator','stabilizer','defuser'].forEach(function(key){
          var styleDef = styles[key] || styles[key === 'stabilizer' ? 'stabiliser' : key];
          if (!styleDef) return;
          var totalKey = totals[key] !== undefined ? key : (key === 'stabilizer' ? 'stabiliser' : key);
          var count = totals[totalKey] || 0;
          var pct = Math.round((count / totalAnswers) * 100);
          var classKey = key === 'stabilizer' ? 'stabiliser' : key;
          var label = styleDef.title || (classKey.charAt(0).toUpperCase() + classKey.slice(1));
          html += [
            '<li class="nb-quiz__score nb-quiz__score--', classKey, '">',
              '<span class="nb-quiz__score-label">', label, '</span>',
              '<span class="nb-quiz__score-pct">', pct, '%</span>',
              '<div class="nb-quiz__score-bar"><b style="width:', pct, '%"></b></div>',
            '</li>'
          ].join('');
        });
        html += '</ul>';

        container.innerHTML = html;
        container.hidden = false;
      }

      function onComplete(){
        const elapsed = Date.now() - startedAt;
        const style = tally();
        window.NB_QUIZ_STYLE = style;  // accelerator | stabilizer | defuser
        dl('quiz_complete', { quiz: cfg.gaNamespace, time_to_complete_ms: elapsed, quiz_style: style });
        try {
          localStorage.setItem('nb_surge_style', style);
          localStorage.removeItem('nb_quiz_banner_dismissed');
        } catch(e){}
        dl('quiz_result', { quiz: cfg.gaNamespace, style: style });

        const s = quiz.styles[style] || {};

        appEl.hidden = true;

        if (header) header.style.display = 'none';

        const titleEl = resultEl.querySelector('[data-nb-quiz-title]');
        if (titleEl) titleEl.textContent = s.title || '';

        const summaryEl = resultEl.querySelector('[data-nb-quiz-summary]');
        if (summaryEl) summaryEl.innerHTML = s.summary || '';

        const practiceEl = resultEl.querySelector('[data-nb-quiz-practice]');
        if (practiceEl) {
          practiceEl.textContent = s.practice_preview ? `Try this: ${s.practice_preview}` : '';
        }

        try {
          var scoresEl = resultEl ? resultEl.querySelector('[data-nb-quiz-scores]') : null;
          renderScoreBreakdown({ quiz: quiz, answers: state.answers || [], container: scoresEl });
        } catch (_){ }

        resultEl.hidden = false;

        const thanksLink = resultEl.querySelector('[data-nb-quiz-thanks] a');
        if (thanksLink) thanksLink.setAttribute('href', `/pages/surge-signature-result?style=${style}`);

        const shopifyForm = document.getElementById('nb-quiz-shopify');
        if (shopifyForm) {
          try {
            const saved = JSON.parse(localStorage.getItem('nb_surge_user') || '{}');
            const map = { FNAME: 'nbq-fname', LNAME: 'nbq-lname', EMAIL: 'nbq-email', PHONE: 'nbq-phone' };
            let prefilled = false;
            Object.keys(map).forEach(function(key){
              const value = saved[key];
              if (!value) return;
              const input = document.getElementById(map[key]);
              if (input) {
                input.value = value;
                prefilled = true;
              }
            });
            if (prefilled && !shopifyForm.dataset.nbPrefillFired) {
              dl('prefill_used', { quiz_style: style });
              shopifyForm.dataset.nbPrefillFired = '1';
            }
          } catch(_){}

          if (!shopifyForm.dataset.nbTrack) {
            shopifyForm.addEventListener('submit', function(){
              dl('email_submit', { source: 'quiz_result_gate', quiz: cfg.gaNamespace, style: String(window.NB_QUIZ_STYLE || style || '') });
            });
            shopifyForm.dataset.nbTrack = '1';
          }
        }

        if (!window.__NB_QUIZ_FORM_HOOKED__) {
          window.__NB_QUIZ_FORM_HOOKED__ = true;

// ----- QUIZ: primary Shopify submit + parallel Mailchimp -----
(function(){
  const shopifyForm = document.getElementById('nb-quiz-shopify');
  if (!shopifyForm) return;

  shopifyForm.addEventListener('submit', function () {
    const fname = document.getElementById('nbq-fname')?.value || '';
    const lname = document.getElementById('nbq-lname')?.value || '';
    const email = document.getElementById('nbq-email')?.value || '';
    const phone = document.getElementById('nbq-phone')?.value || '';
    const consent = !!document.getElementById('nbq-consent')?.checked;

    const map = { accelerator: 'Accelerator', stabilizer: 'Stabiliser', defuser: 'Defuser' };
    const styleLabel = map[(window.NB_QUIZ_STYLE || '').toLowerCase()] || '';

    // Fill Shopify hidden fields
    const tags = [
      'Quiz: Surge Signature',
      styleLabel ? `Style: ${styleLabel}` : '',
      'Source: /surge-signature'
    ].filter(Boolean).join(', ');
    document.getElementById('nbq-tags').value = tags;
    document.getElementById('nbq-accepts').value = consent ? 'true' : 'false';

    // Submit Mailchimp in parallel
    const mc = document.getElementById('nbq-mc');
    if (mc) {
      if (consent) {
        document.getElementById('nbq-mc-fname').value = fname;
        document.getElementById('nbq-mc-lname').value = lname;
        document.getElementById('nbq-mc-email').value = email;
        document.getElementById('nbq-mc-phone').value = phone;
        document.getElementById('nbq-mc-style').value = styleLabel;

        document.getElementById('nbq-mc-acc').checked  = (styleLabel === 'Accelerator');
        document.getElementById('nbq-mc-stab').checked = (styleLabel === 'Stabiliser');
        document.getElementById('nbq-mc-def').checked  = (styleLabel === 'Defuser');

        if (mc.requestSubmit) mc.requestSubmit(); else mc.submit();
      } else {
        document.getElementById('nbq-mc-fname').value = '';
        document.getElementById('nbq-mc-lname').value = '';
        document.getElementById('nbq-mc-email').value = '';
        document.getElementById('nbq-mc-phone').value = '';
        document.getElementById('nbq-mc-style').value = '';

        document.getElementById('nbq-mc-acc').checked  = false;
        document.getElementById('nbq-mc-stab').checked = false;
        document.getElementById('nbq-mc-def').checked  = false;
      }
    }

    // Persist for thank-you / rehydration
    try {
      localStorage.setItem('nb_surge_user', JSON.stringify({ FNAME: fname, LNAME: lname, EMAIL: email, PHONE: phone }));
      localStorage.setItem('nb_surge_style', (window.NB_QUIZ_STYLE || '').toLowerCase());
      localStorage.removeItem('nb_quiz_banner_dismissed');
    } catch (_) {}
    // IMPORTANT: do NOT preventDefault(). Let Shopify submit normally.
  }, { capture: true });
})();
        }
      }

      startBtn.addEventListener('click', async function(){
        startBtn.disabled = true;
        quiz = await loadQuiz();
        startedAt = Date.now();
        dl('quiz_start', { quiz: cfg.gaNamespace });
        appEl.hidden = false;
        renderQuestion();
        setProgressLabel(state.index+1, quiz.questions.length);
        if (header) header.style.display = 'none';
      });
    });
  });
})();

(function(){
  const posted = document.getElementById('nbq-posted');
  if (posted && posted.dataset.posted === 'true') {
    // Optional: redirect to a clean page after success
    // window.location.href = '/pages/surge-signature-result';
  }
})();

(function(){
  var gate = document.getElementById('nb-quiz-gate');
  var form = document.getElementById('nb-quiz-shopify');
  if (!gate || !form) return;

  form.addEventListener('submit', function(){
    try { localStorage.setItem('nb_quiz_submitted', '1'); } catch(_){ }
  });

  (function showThanksIfNeeded(){
    var qs = new URLSearchParams(window.location.search);
    var serverThanks = document.getElementById('nb-quiz-server-thanks');
    var hasUrlSuccess =
      qs.get('customer_posted') === 'true' ||
      qs.get('form_type') === 'customer' ||
      qs.get('contact_posted') === 'true';

    if (serverThanks) {
      try { localStorage.removeItem('nb_quiz_submitted'); } catch(_){ }
      return;
    }

    var hadFlag = false;
    try { hadFlag = localStorage.getItem('nb_quiz_submitted') === '1'; } catch(_){ }

    if (!serverThanks && (hasUrlSuccess || hadFlag)) {
      gate.classList.add('is-client-thanks');
      try { localStorage.removeItem('nb_quiz_submitted'); } catch(_){ }
      var t = document.getElementById('nb-quiz-client-thanks');
      if (t) try { t.scrollIntoView({behavior:'smooth', block:'center'}); } catch(_){ }
    }
  })();
})();

(function(){
  var thanks = document.getElementById('nb-quiz-server-thanks');
  if (!thanks) return;
  try {
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch(_) {}
})();
