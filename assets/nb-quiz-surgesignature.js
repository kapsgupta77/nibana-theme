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
        const emailForm = `
          <form id="nb-quiz-sub" action="${cfg.mailchimpAction}" method="post" novalidate>
            <p class="nb-quiz__result-kicker">Your Surge Signature™</p>
            <h3 class="nb-quiz__result-title">${s.title}</h3>
            <p class="nb-quiz__summary">${s.summary}</p>
            <div class="nb-quiz__free-insight">Try this: ${s.practice_preview}</div>
            <div class="nb-quiz__gate">
              <label for="nb-email">Get your full 2-page playbook by email:</label>
              <input id="nb-email" type="email" name="EMAIL" required placeholder="you@domain.com">
              <input type="hidden" name="tags" value="Quiz: Surge Signature, Source: /surge-signature, Style: ${s.title}">
              <input type="hidden" name="STYLE" value="${style}">
              ${cfg.enableGdpr ? `<div class="nb-quiz__gdpr"><label><input type="checkbox" name="gdpr[CONSENT]" required> I consent to receive emails. See Privacy.</label></div>` : ``}
              <button type="submit" class="nb-btn nb-btn--primary">Email me the full playbook</button>
            </div>
          </form>`;
        appEl.hidden = true;
        resultEl.hidden = false;
        resultEl.innerHTML = `<div class="nb-card nb-quiz__result-card">${emailForm}</div>`;

        const sub = resultEl.querySelector('#nb-quiz-sub');
        sub.addEventListener('submit', function(){
          dl('email_submit', { source: 'quiz_result_gate', quiz: cfg.gaNamespace, style: style });
        });
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
