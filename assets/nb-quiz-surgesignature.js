(function(){
  function dl(event, params){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event}, params||{})); }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('section.nb-quiz.nb-quiz--surgesignature').forEach(function(section){
      const cfg = (window.NB_QUIZ && window.NB_QUIZ[section.dataset.sectionId]) || {};
      const startBtn = section.querySelector('[data-nb-quiz-start]');
      const appEl = section.querySelector('[data-nb-quiz-app]');
      const resultEl = section.querySelector('[data-nb-quiz-result]');
      let quiz = null, state = { index: 0, answers: [] }, startedAt = 0;

      async function loadQuiz(){
        const res = await fetch(cfg.jsonUrl, { credentials: 'same-origin' });
        return res.json();
      }

      function renderQuestion(){
        const q = quiz.questions[state.index];
        appEl.innerHTML = `
          <div class="nb-card">
            <div class="nb-quiz__progress" role="progressbar" aria-valuemin="0" aria-valuemax="${quiz.questions.length}" aria-valuenow="${state.index+1}">
              ${state.index+1}/${quiz.questions.length}
            </div>
            <h3 class="nb-quiz__prompt" aria-live="polite">${q.prompt}</h3>
            <div class="nb-quiz__options">
              ${q.options.map((o,i)=>`<button class="nb-btn nb-btn--option" data-value="${o.value}" data-i="${i}">${o.label}</button>`).join('')}
            </div>
          </div>`;
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
        dl('quiz_complete', { quiz: cfg.gaNamespace, time_to_complete_ms: elapsed });
        const style = tally();
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
        const actionWithTags = act.origin + act.pathname + '?' + params.toString();

        const emailForm = `
          <form id="nb-quiz-sub" action="${actionWithTags}" method="post" target="mc-target-${section.dataset.sectionId}" novalidate>
            <p class="nb-quiz__result-kicker">Your Surge Signature™</p>
            <h3 class="nb-quiz__result-title">${s.title}</h3>
            <p class="nb-quiz__summary">${s.summary}</p>
            <div class="nb-quiz__free-insight">Try this: ${s.practice_preview}</div>

            <div class="nb-quiz__gate">
              <label for="nb-fullname">Full name *</label>
              <input id="nb-fullname" type="text" name="FULLNAME" required placeholder="First Last">

              <label for="nb-email" style="margin-top:8px;">Email *</label>
              <input id="nb-email" type="email" name="EMAIL" required placeholder="you@domain.com">

              <label for="nb-phone" style="margin-top:8px;">Phone (optional)</label>
              <input id="nb-phone" type="tel" name="PHONE" placeholder="+44 7700 900123">

              <!-- Hidden merge fields derived from FULLNAME -->
              <input type="hidden" name="FNAME" value="">
              <input type="hidden" name="LNAME" value="">

              <!-- Mailchimp audience keys -->
              <input type="hidden" name="u" value="${mc_u}">
              <input type="hidden" name="id" value="${mc_id}">

              <!-- Tags as array fields -->
              <input type="hidden" name="tags[]" value="Quiz: Surge Signature">
              <input type="hidden" name="tags[]" value="Source: /surge-signature">
              <input type="hidden" name="tags[]" value="Style: ${s.title}">

              <input type="checkbox" name="group[${MC_CAT_ID}][${MC_INT_SURGE}]" value="1" checked hidden>
              ${styleInterest ? `<input type="checkbox" name="group[${MC_CAT_ID}][${styleInterest}]" value="1" checked hidden>` : ''}

              <!-- Redundant tag fields to ensure Mailchimp tagging -->
              <input type="hidden" name="tags" value="Surge Signature Quiz">
              <input type="hidden" name="tags[]" value="Surge Signature Quiz">

              <!-- Style merge field -->
              <input type="hidden" name="STYLE" value="${style}">

              ${cfg.enableGdpr ? `<div class="nb-quiz__gdpr"><label><input type="checkbox" name="gdpr[CONSENT]" required> I consent to receive emails. See Privacy.</label></div>` : ``}

              <button type="submit" class="nb-btn nb-btn--primary" style="margin-top:8px;">Email me the full playbook</button>
            </div>
          </form>

          <div class="nb-quiz__thanks nb-card" data-nb-quiz-thanks hidden>
            <h3>Check your inbox ✉️</h3>
            <p>We’ve sent your 2-page playbook. If it’s not there, check Promotions/Spam.</p>
            <p>Want help applying it? <a href="/pages/book-a-call">Book a 20-min Clarity Call</a>.</p>
          </div>
        `;

        appEl.hidden = true;
        resultEl.hidden = false;
        resultEl.innerHTML = `<div class="nb-card nb-quiz__result-card">${emailForm}</div>`;

        const sub = resultEl.querySelector('#nb-quiz-sub');
        const fullNameInput = sub.querySelector('input[name="FULLNAME"]');
        const fnameHidden = sub.querySelector('input[name="FNAME"]');
        const lnameHidden = sub.querySelector('input[name="LNAME"]');
        const thanks = resultEl.querySelector('[data-nb-quiz-thanks]');

        // Ensure the form targets the section's iframe (created in Liquid)
        sub.setAttribute('target', `mc-target-${section.dataset.sectionId}`);

        // Before submit, split Full name -> FNAME/LNAME
        sub.addEventListener('submit', function(){
          const parts = (fullNameInput.value || '').trim().split(/\s+/);
          fnameHidden.value = parts[0] || '';
          lnameHidden.value = parts.slice(1).join(' ') || '';
          dl('email_submit', { source: 'quiz_result_gate', quiz: cfg.gaNamespace, style: style });
        });

        // When Mailchimp responds in the hidden iframe, show on-site thank-you
        const iframe = document.querySelector(`iframe[name="mc-target-${section.dataset.sectionId}"]`);
        if (iframe) {
          iframe.addEventListener('load', function(){
            const card = resultEl.querySelector('.nb-quiz__result-card');
            if (card && thanks) {
              card.style.display = 'none';
              thanks.hidden = false;
            }
          });
        }
      }

      startBtn.addEventListener('click', async function(){
        startBtn.disabled = true;
        quiz = await loadQuiz();
        startedAt = Date.now();
        dl('quiz_start', { quiz: cfg.gaNamespace });
        appEl.hidden = false;
        renderQuestion();
        const header = section.querySelector('.nb-quiz__header');
        if (header) header.style.display = 'none';
      });
    });
  });
})();
