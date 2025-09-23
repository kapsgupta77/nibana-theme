(function() {
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  const MAX_POPULAR = 6; // show at most 6 curated popular subtopics

  function slugify(s) {
    return (s || '').toString().trim().toLowerCase()
      .replace(/\u2019/g, "'") // smart apostrophe
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function parseParams() {
    const p = new URLSearchParams(location.search);
    return { cat: p.get('cat') || 'all', topic: p.get('topic') || '' };
  }

  function setParams(next) {
    const p = new URLSearchParams(location.search);
    (next.cat != null) && p.set('cat', slugify(next.cat));
    (next.topic != null) ? p.set('topic', slugify(next.topic)) : p.delete('topic');
    const url = `${location.pathname}?${p.toString()}`;
    history.replaceState({}, '', url);
  }

  function normalize(s){ return (s||'').trim(); }

  function init() {
    const root = qs('[data-nb-blog-filter]');
    if (!root) return;

    const catChips = qsa('.nb-chip[data-cat]', root);
    const input = qs('.nb-subtopic-input', root);
    const clearBtn = qs('.nb-clear', root);
    const popularRow = qs('.nb-filter-row--popular', root);

    // Collect cards
    const cardNodes = qsa('[data-cat][data-topics]');
    const cardData = cardNodes.map(el => {
      const host = el.closest('.blog-post-item') || el;
      const cat = normalize(el.getAttribute('data-cat'));
      const topics = normalize(el.getAttribute('data-topics'))
        .split(',')
        .map(t => normalize(t))
        .filter(Boolean);
      return { el: host, cat, topics, topicsSlug: topics.map(slugify) };
    });

    // Popular subtopics (top N by frequency)
    const freq = {};
    cardData.forEach(c => c.topicsSlug.forEach(t => { freq[t]=(freq[t]||0)+1; }));
    const popular = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .slice(0, MAX_POPULAR)
      .map(([t])=>t)
      .filter(Boolean);
    if (popular.length) {
      popularRow.hidden = false;
      popular.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'nb-chip';
        btn.textContent = t.replace(/-/g, ' ');
        btn.setAttribute('data-topic', t);
        popularRow.appendChild(btn);
      });
    }

    function applyFilters(catSel, topicSel) {
      const catSlug = slugify(catSel);
      const topicSlug = slugify(topicSel);
      cardData.forEach((c) => {
        const catOk = (catSlug==='all') || (slugify(c.cat)===catSlug);
        const topicOk = !topicSlug || c.topicsSlug.includes(topicSlug);
        c.el.style.display = (catOk && topicOk) ? '' : 'none';
      });
    }

    function selectCat(catLabel) {
      catChips.forEach(chip => {
        const on = normalize(chip.getAttribute('data-cat')) === catLabel;
        chip.classList.toggle('nb-chip--on', on);
        chip.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    // Wire category clicks
    catChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const catLabel = normalize(chip.getAttribute('data-cat'));
        selectCat(catLabel);
        const topicValue = input.value.trim();
        setParams({ cat: catLabel, topic: topicValue || null });
        applyFilters(catLabel, topicValue);
        clearBtn.hidden = !(catLabel.toLowerCase()!=='all' || topicValue);
      });
    });

    // Wire popular topic chips
    popularRow.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-topic]');
      if (!btn) return;
      const topic = btn.getAttribute('data-topic');
      input.value = topic.replace(/-/g,' ');
      const catLabel = normalize(qs('.nb-chip.nb-chip--on', root)?.getAttribute('data-cat') || 'All');
      setParams({ topic });
      applyFilters(catLabel, topic);
      clearBtn.hidden = !(catLabel.toLowerCase()!=='all' || topic);
    });

    // Search input (Enter or blur triggers)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const topic = input.value.trim();
        const catLabel = normalize(qs('.nb-chip.nb-chip--on', root)?.getAttribute('data-cat') || 'All');
        setParams({ topic: topic || null });
        applyFilters(catLabel, topic);
        clearBtn.hidden = !(catLabel.toLowerCase()!=='all' || topic);
      }
    });
    input.addEventListener('blur', () => {
      const topic = input.value.trim();
      const catLabel = normalize(qs('.nb-chip.nb-chip--on', root)?.getAttribute('data-cat') || 'All');
      setParams({ topic: topic || null });
      applyFilters(catLabel, topic);
      clearBtn.hidden = !(catLabel.toLowerCase()!=='all' || topic);
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      selectCat('All');
      setParams({ cat: 'All', topic: null });
      applyFilters('All', '');
      clearBtn.hidden = true;
    });

    // Initial state from URL
    const { cat, topic } = parseParams();
    const catLabelFromSlug = (function(){
      const fromSlug = catChips
        .map(ch => ch.getAttribute('data-cat'))
        .find(lbl => slugify(lbl) === slugify(cat));
      return fromSlug || 'All';
    })();
    selectCat(catLabelFromSlug);
    input.value = topic ? topic.replace(/-/g,' ') : '';
    applyFilters(catLabelFromSlug, input.value);
    clearBtn.hidden = !(catLabelFromSlug.toLowerCase()!=='all' || input.value);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
