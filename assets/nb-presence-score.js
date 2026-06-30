(function(){
  const KEYS={answers:'nb_presence_score_answers',email:'nb_presence_score_email',result:'nb_presence_score_result',started:'nb_presence_score_started_at'};
  const bands={
    Performer:{range:'0–35',stage:'Performance',truth:'You have built the life, but performance is still running too much of it.',headline:'Built the life. Still managed by performance.',copy:['You have learned how to produce, hold things together, and keep moving. That has probably served you. It may also be costing more than you admit.','At this stage, presence is not yet stable because too much of life is still organised around output, image, responsibility, or control. The work is not to become less capable. The work is to see what your capability has been protecting you from feeling.'],primary:'Book a private conversation',primaryKey:'bookCallUrl',secondary:'Take the Surge Signature assessment',secondaryKey:'surgeUrl',tag:'presence-score-performer',stageCopy:'You are in the Performance stage. Life is still organised around output, approval, control, role, success, or image.'},
    Observer:{range:'36–55',stage:'Pattern',truth:'You are no longer only searching. You are beginning to see the pattern.',headline:'Something is missing. The pattern is becoming visible.',copy:['You know performance is not the whole story. You have started to see the gap between the life you have built and the life that would actually feel like yours.','This stage can be uncomfortable because the old performance no longer fully convinces you, but the new way is not stable yet. The work now is to stop treating discomfort as a problem and start reading it as information.'],primary:'Explore the Performance to Presence method',primaryKey:'methodUrl',secondary:'Take the Surge Signature assessment',secondaryKey:'surgeUrl',tag:'presence-score-observer',stageCopy:'You are in the Pattern stage. You can no longer fully believe the performance, but the deeper pattern is still becoming visible.'},
    Practitioner:{range:'56–75',stage:'Truth / Practice',truth:'You have done real work, but insight still needs to become embodied under pressure.',headline:'In the work. Not yet free inside it.',copy:['You have done real work on yourself, and it shows. You can name patterns. You have moments of presence. You may already have practices, language, and insight.','The next layer is not more information. It is whether truth remains available when you are under pressure, in conflict, in desire, in uncertainty, or being seen.','This is where the work becomes embodied.'],primary:'Explore the P2P course',primaryKey:'courseUrl',secondary:'Book a private conversation',secondaryKey:'bookCallUrl',tag:'presence-score-practitioner',stageCopy:'You are in the Truth / Practice stage. Insight is ready to become embodied in choices, relationships, and pressure.'},
    Integrator:{range:'76–100',stage:'Presence',truth:'Presence is becoming less of a state and more of a way you live.',headline:'Presence is becoming a way of living.',copy:['You are no longer using presence as an idea or destination. It is becoming part of how you meet your body, your relationships, your work, your desire, and your choices.','This does not mean the work is complete. It means the work is subtler now. Less about adding more, more about protecting what is true and letting it deepen.'],primary:'Take the Life Wheel assessment',primaryKey:'lifeWheelUrl',secondary:'Subscribe to The Unedited Life',secondaryKey:'uneditedUrl',tag:'presence-score-integrator',stageCopy:'You are in the Presence stage. Presence is becoming less of a state and more of a way you live.'}
  };
  const weak={
    Identity:['Your lowest score is Identity.','This usually means the performance is still close to the self-image. You may be able to function well, lead well, and appear clear, while still being run by inherited standards, old roles, or the need to be seen in a certain way.','When identity work goes deep, the performance stops feeling like something you have to maintain. You begin to act from choice rather than from history.'],
    Presence:['Your lowest score is Presence.','This usually means you can understand yourself after the fact, but staying present in the moment is harder. Especially when you feel exposed, challenged, rejected, desired, or misunderstood.','Presence is not about being calm. It is about being here while something real is happening.'],
    Desire:['Your lowest score is Desire.','This usually means your life may be well-constructed, but not fully organised around what you actually want. Desire may be buried under responsibility, performance, loyalty, fear, or proof.','When desire becomes clearer, decisions that used to feel agonising often become simpler. Not easier. Simpler.'],
    Aliveness:['Your lowest score is Aliveness.','This usually means insight is not yet fully moving into the body and daily rhythm. You may understand a lot, but still carry too much, recover too slowly, or live with low-grade accumulation.','Aliveness is not a luxury. It is data. When it drops, something important is asking for attention.']
  };
  function track(event,params){ window.dataLayer=window.dataLayer||[]; window.dataLayer.push(Object.assign({event},params||{})); }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function bandFor(score){ if(score<=35)return 'Performer'; if(score<=55)return 'Observer'; if(score<=75)return 'Practitioner'; return 'Integrator'; }
  function href(cfg,key){ return cfg[key] || '#'; }
  function resultParams(r){ return {score:r.totalScore,band:r.band,stage:r.stage,weakest_dimension:r.weakest,identity_pct:r.identityPct,presence_pct:r.presencePct,desire_pct:r.desirePct,aliveness_pct:r.alivenessPct}; }
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.nb-presence-score').forEach(init);
  });
  async function init(root){
    const cfg=(window.NB_PRESENCE_SCORE&&window.NB_PRESENCE_SCORE[root.dataset.sectionId])||{};
    const screens={landing:root.querySelector('[data-screen="landing"]'),quiz:root.querySelector('[data-screen="quiz"]'),email:root.querySelector('[data-screen="email"]'),loading:root.querySelector('[data-screen="loading"]'),results:root.querySelector('[data-screen="results"]')};
    const qEl=root.querySelector('[data-presence-question]'); const pEl=root.querySelector('[data-presence-progress]');
    let questions=[]; let state={index:0,answers:[]};
    const show=name=>Object.keys(screens).forEach(k=>{
      const isActive=k===name;
      screens[k].hidden=!isActive;
      screens[k].classList.toggle('is-active',isActive);
    });
    show('landing');
    const data=await fetch(cfg.dataUrl,{credentials:'same-origin'}).then(r=>r.json()); questions=data.questions||[];
    try{ state.answers=JSON.parse(localStorage.getItem(KEYS.answers)||'[]'); }catch(_){ }
    const start=root.querySelector('[data-presence-start]');
    start&&start.addEventListener('click',()=>{ state={index:0,answers:[]}; try{localStorage.setItem(KEYS.started,new Date().toISOString());localStorage.setItem(KEYS.answers,'[]');}catch(_){} track('presence_score_started'); show('quiz'); renderQuestion(); });
    root.querySelector('[data-presence-back-email]')?.addEventListener('click',()=>{ state.index=7; show('quiz'); renderQuestion(); });
    root.querySelector('.nb-presence-score__form')?.addEventListener('submit',onEmail);
    root.querySelector('[data-presence-skip-email]')?.addEventListener('click',skipEmail);
    function renderQuestion(){
      const q=questions[state.index]; if(!q)return;
      const pct=Math.round((state.index/questions.length)*100); pEl.style.width=pct+'%';
      qEl.innerHTML=`<button class="nb-presence-score__back" type="button" ${state.index===0?'hidden':''} data-back>Back</button><p class="nb-presence-score__dimension">${esc(q.dimension)}</p>${state.index===0?'<p class="nb-presence-score__intro-note">There are no right answers. Answer from what actually happens, not who you think you should be.</p>':''}<h2>${esc(q.prompt)}</h2><div class="nb-presence-score__options">${q.options.map(o=>`<button type="button" class="nb-presence-score__option ${Number(state.answers[state.index])===o.value?'is-selected':''}" data-value="${o.value}">${esc(o.label)}</button>`).join('')}</div>`;
      qEl.querySelector('[data-back]')?.addEventListener('click',()=>{ state.index=Math.max(0,state.index-1); renderQuestion(); });
      qEl.querySelectorAll('[data-value]').forEach(btn=>btn.addEventListener('click',()=>{ state.answers[state.index]=Number(btn.dataset.value); try{localStorage.setItem(KEYS.answers,JSON.stringify(state.answers));}catch(_){} if(state.index===7){ show('email'); return; } if(state.index<questions.length-1){ state.index++; renderQuestion(); } else complete(); }));
    }
    function onEmail(e){
      e.preventDefault();
      const input=root.querySelector('[data-presence-email]');
      if(!input)return;
      const email=input.value.trim();
      if(!input.checkValidity()){ input.reportValidity(); return; }
      try{localStorage.setItem(KEYS.email,email);}catch(_){}
      track('presence_score_email_submitted',{email_domain:(email.split('@')[1]||'').toLowerCase()});
      submitKit({email,quiz_started:'true'});
      continueAfterEmail();
    }
    function skipEmail(){
      if(!cfg.allowSkipEmail)return;
      try{localStorage.removeItem(KEYS.email);}catch(_){}
      track('presence_score_email_skipped');
      continueAfterEmail();
    }
    function continueAfterEmail(){ state.index=8; show('quiz'); renderQuestion(); }
    function calculate(){
      const a=state.answers.map(Number); const sum=(s,e)=>a.slice(s,e).reduce((x,y)=>x+(y||0),0);
      const identity=sum(0,4), presence=sum(4,8), desire=sum(8,12), aliveness=sum(12,15), raw=identity+presence+desire+aliveness;
      const r={rawTotal:raw,totalScore:Math.round((raw/75)*100),identityPct:Math.round((identity/20)*100),presencePct:Math.round((presence/20)*100),desirePct:Math.round((desire/20)*100),alivenessPct:Math.round((aliveness/15)*100)};
      const ordered=[['Identity',r.identityPct],['Presence',r.presencePct],['Desire',r.desirePct],['Aliveness',r.alivenessPct]]; r.weakest=ordered.reduce((m,x)=>x[1]<m[1]?x:m,ordered[0])[0]; r.band=bandFor(r.totalScore); r.stage=bands[r.band].stage; return r;
    }
    function complete(){ const r=calculate(); try{localStorage.setItem(KEYS.result,JSON.stringify(r));}catch(_){} track('presence_score_completed',resultParams(r)); show('loading'); setTimeout(()=>renderResults(r),1500); }
    function renderResults(r){
      const b=bands[r.band], w=weak[r.weakest], dims=[['Identity',r.identityPct],['Presence',r.presencePct],['Desire',r.desirePct],['Aliveness',r.alivenessPct]], stages=['Performance','Pattern','Truth','Practice','Presence'];
      const cta=(label,key,mod)=>`<a class="nb-presence-score__cta ${mod||''}" href="${esc(href(cfg,key))}" data-cta-label="${esc(label)}" data-cta-url="${esc(href(cfg,key))}">${esc(label)}</a>`;
      let primaryLabel=b.primary, primaryKey=b.primaryKey;
      if(primaryKey==='courseUrl'&&!cfg.courseUrl){primaryLabel='Explore the Performance to Presence method';primaryKey='methodUrl';}
      if(primaryKey==='lifeWheelUrl'&&!cfg.lifeWheelUrl){primaryLabel='Explore the Performance to Presence method';primaryKey='methodUrl';}
      screens.results.innerHTML=`<div class="nb-presence-score__result-hero"><p class="nb-presence-score__eyebrow">Your Presence Score</p><div class="nb-presence-score__number"><span data-count>0</span><small>/100</small></div><h1>The ${esc(r.band)}</h1><p>${esc(b.truth)}</p><div class="nb-presence-score__scorebar"><span style="width:${r.totalScore}%"></span></div></div><div class="nb-presence-score__result-body"><section class="nb-presence-score__card"><p class="nb-presence-score__label">Your P2P journey position</p><div class="nb-presence-score__journey">${stages.map(s=>`<span class="${b.stage.indexOf(s)>-1?'is-active':''}">${s}</span>`).join('')}</div><h2>You are in the ${esc(b.stage)} stage.</h2><p>${esc(b.stageCopy)}</p></section><section class="nb-presence-score__card"><p class="nb-presence-score__label">Your breakdown</p>${dims.map(d=>`<div class="nb-presence-score__dim ${d[0]===r.weakest?'is-lowest':''}"><div><strong>${d[0]}</strong><span>${d[1]}%</span></div><i><b style="width:${d[1]}%"></b></i></div>`).join('')}</section><section class="nb-presence-score__card"><p class="nb-presence-score__label">What this means</p><h2>${esc(b.headline)}</h2>${b.copy.map(p=>`<p>${esc(p)}</p>`).join('')}</section><section class="nb-presence-score__card nb-presence-score__card--lowest"><p class="nb-presence-score__label">Your lowest dimension</p><h2>${esc(w[0])}</h2><p>${esc(w[1])}</p><p>${esc(w[2])}</p></section><section class="nb-presence-score__card nb-presence-score__next"><p class="nb-presence-score__label">Your next step</p><h2>Keep the movement honest.</h2><div>${cta(primaryLabel,primaryKey)}${cta(b.secondary,b.secondaryKey,'nb-presence-score__cta--secondary')}</div></section></div>`;
      show('results'); animateCount(screens.results.querySelector('[data-count]'),r.totalScore); track('presence_score_result_viewed',resultParams(r)); submitKit(Object.assign({email:localStorage.getItem(KEYS.email)||'',quiz_completed:'true',presence_score:r.totalScore,score_band:r.band,p2p_stage:r.stage,weakest_dimension:r.weakest,identity_pct:r.identityPct,presence_pct:r.presencePct,desire_pct:r.desirePct,aliveness_pct:r.alivenessPct,tags:'presence-score-quiz,'+b.tag},{}));
      screens.results.querySelectorAll('[data-cta-label]').forEach(a=>a.addEventListener('click',()=>track('presence_score_cta_clicked',Object.assign(resultParams(r),{cta_label:a.dataset.ctaLabel,cta_url:a.dataset.ctaUrl}))));
    }
    function animateCount(el,target){ let n=0, start=performance.now(); function step(t){ n=Math.min(target,Math.round(((t-start)/900)*target)); el.textContent=n; if(n<target)requestAnimationFrame(step); } requestAnimationFrame(step); }
    function submitKit(payload){ if(!cfg.kitFormUrl)return; const body=new FormData(); Object.keys(payload).forEach(k=>body.append(k,payload[k])); fetch(cfg.kitFormUrl,{method:'POST',mode:'no-cors',body}).catch(()=>{}); }
  }
})();
