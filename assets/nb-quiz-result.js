(function(){
  function qs(name){ const u=new URL(window.location.href); return (u.searchParams.get(name)||'').toLowerCase(); }
  function html(s){ const d=document.createElement('div'); d.innerHTML=s; return d.firstElementChild; }
  function dl(event, params){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event}, params||{})); }

  document.addEventListener('DOMContentLoaded', async function(){
    const root = document.querySelector('[data-nb-result-app]');
    if(!root) return;

    const style = qs('style'); // accelerator | stabilizer | defuser
    const jsonUrl = root.getAttribute('data-json');
    const callHref = root.getAttribute('data-call-href') || '/pages/book-a-call';
    const retakeHref = root.getAttribute('data-retake-href') || '/pages/surge-signature';

    let data;
    try{
      const res = await fetch(jsonUrl, { credentials:'same-origin' });
      data = await res.json();
    }catch(e){
      root.innerHTML = '<div class="nb-card">Could not load results.</div>';
      return;
    }

    const s = data.styles[style];
    if(!s){
      root.innerHTML = `
        <div class="nb-card">
          <h3 style="margin-top:0">Pick your result</h3>
          <p>Use one of these:</p>
          <ul>
            <li><a href="?style=accelerator">Accelerator</a></li>
            <li><a href="?style=stabilizer">Stabilizer</a></li>
            <li><a href="?style=defuser">Defuser</a></li>
          </ul>
        </div>`;
      return;
    }

    dl('quiz_result_view', { quiz: 'surge_signature', style: style });

    const card = `
      <div class="nb-card nb-result">
        <p class="nb-quiz__result-kicker">Your Surge Signature™</p>
        <h1 class="nb-quiz__result-title">${s.title}</h1>
        <p class="nb-quiz__summary">${s.summary}</p>

        ${s.exalted ? `<div class="nb-result__block"><h3>Exalted form</h3><p>${s.exalted}</p></div>` : ''}

        ${Array.isArray(s.pitfalls) ? `
          <div class="nb-result__block">
            <h3>Watch-outs</h3>
            <ul class="nb-list">
              ${s.pitfalls.map(p=>`<li>${p}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${s.practice_preview ? `
          <div class="nb-result__block">
            <h3>Try this today</h3>
            <p>${s.practice_preview}</p>
          </div>` : ''}

        <div class="nb-result__cta">
          <a class="nb-btn nb-btn--primary" href="${callHref}">Book a 20-min Clarity Call</a>
          <a class="nb-btn nb-btn--ghost" href="${retakeHref}">Retake the quiz</a>
        </div>
      </div>
    `;
    root.innerHTML = card;
  });
})();
