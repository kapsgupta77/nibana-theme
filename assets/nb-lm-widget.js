(function(){
  'use strict';

  var RELAY_PATH = '/dl/connection-guide';
  var STORAGE_UTM = 'nb_lm_widget_utms';
  var STORAGE_COOLDOWN = 'nb_lm_widget_cooldown';
  var UTM_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  var COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var BASE_TAGS = ['newsletter', 'leadmagnet:connections_guide', 'source:widget'];
  var lastTrigger = null;

  function now(){ return Date.now(); }

  function safeStorage(fn){
    try { return fn(); } catch (err) { return undefined; }
  }

  function parseSearchParams(search){
    var params = new URLSearchParams(search || window.location.search || '');
    var utms = {};
    UTM_KEYS.forEach(function(key){
      var value = params.get(key);
      if (value) utms[key] = value.trim();
    });
    return utms;
  }

  function saveUtms(utms){
    if (!utms || !Object.keys(utms).length) return;
    var payload = { timestamp: now(), utms: utms };
    safeStorage(function(){ localStorage.setItem(STORAGE_UTM, JSON.stringify(payload)); });
  }

  function loadUtms(){
    var stored = safeStorage(function(){ return localStorage.getItem(STORAGE_UTM); });
    if (!stored) return {};
    try {
      var data = JSON.parse(stored);
      if (!data || typeof data !== 'object') return {};
      if (data.timestamp && now() - data.timestamp > UTM_TTL) {
        safeStorage(function(){ localStorage.removeItem(STORAGE_UTM); });
        return {};
      }
      return Object.assign({}, data.utms || {});
    } catch (err) {
      return {};
    }
  }

  function setCooldown(){
    safeStorage(function(){ localStorage.setItem(STORAGE_COOLDOWN, String(now())); });
  }

  function withinCooldown(){
    var ts = safeStorage(function(){ return localStorage.getItem(STORAGE_COOLDOWN); });
    if (!ts) return false;
    var parsed = parseInt(ts, 10);
    if (isNaN(parsed)) return false;
    return now() - parsed < COOLDOWN_MS;
  }

  function applyCooldownState(){
    var pill = document.querySelector('.nb-sticky-cta');
    if (!pill) return;
    if (withinCooldown()) {
      if (!pill.dataset.nbOriginalDisplay) {
        pill.dataset.nbOriginalDisplay = pill.style.display || '';
      }
      pill.style.display = 'none';
      pill.setAttribute('aria-hidden', 'true');
      pill.setAttribute('data-nb-lm-suppressed', 'true');
    } else {
      if (pill.dataset.nbOriginalDisplay !== undefined) {
        pill.style.display = pill.dataset.nbOriginalDisplay;
      } else {
        pill.style.removeProperty('display');
      }
      pill.removeAttribute('aria-hidden');
      pill.removeAttribute('data-nb-lm-suppressed');
    }
  }

  function registerTriggerListener(){
    document.addEventListener('click', function(evt){
      var target = evt.target instanceof Element ? evt.target.closest('.nb-sticky-cta a, .nb-sticky-cta button') : null;
      if (!target) return;
      lastTrigger = target;
      if (withinCooldown()) {
        safeStorage(function(){ localStorage.removeItem(STORAGE_COOLDOWN); });
        applyCooldownState();
      }
    }, { capture: true });
  }

  function getFocusable(container){
    if (!container) return [];
    var focusables = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(focusables, function(el){
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function applyFocusTrap(modal){
    if (!modal || modal._nbLmFocusTrap) return;
    modal._nbLmFocusTrap = true;

    modal.addEventListener('keydown', function(evt){
      if (evt.key === 'Escape' || evt.key === 'Esc') {
        if (closeModal(modal)) {
          evt.preventDefault();
          evt.stopPropagation();
        }
        return;
      }
      if (evt.key !== 'Tab') return;
      var focusable = getFocusable(modal);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      var active = document.activeElement;
      if (evt.shiftKey) {
        if (active === first || !modal.contains(active)) {
          last.focus();
          evt.preventDefault();
        }
      } else {
        if (active === last) {
          first.focus();
          evt.preventDefault();
        }
      }
    });
  }

  function closeModal(modal){
    if (!modal) return false;
    var closeBtn = modal.querySelector('[data-modal-close], [data-close], [data-action="close"], .modal__close, button[aria-label*="close" i]');
    if (closeBtn) {
      closeBtn.click();
    } else if (typeof modal.hide === 'function') {
      modal.hide();
    } else if (modal.classList) {
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
    } else {
      modal.setAttribute('hidden', 'true');
    }
    setCooldown();
    applyCooldownState();
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      setTimeout(function(){ lastTrigger.focus(); }, 30);
    }
    return true;
  }

  function ensureConsentCopy(container){
    if (!container) return;
    var existing = container.querySelector('[data-nb-lm-consent]');
    if (existing) return;
    var form = container.querySelector('form');
    if (!form) return;
    var consent = document.createElement('p');
    consent.className = 'nb-lm-consent';
    consent.dataset.nbLmConsent = 'true';
    consent.innerHTML = "By subscribing, you’ll receive occasional tips and updates. Unsubscribe any time. See our <a href='/policies/privacy-policy' class='nb-link'>Privacy Policy</a>.";
    consent.setAttribute('aria-live', 'polite');
    var submitRow = form.querySelector('[type="submit"]');
    if (submitRow && submitRow.parentNode) {
      submitRow.parentNode.insertBefore(consent, submitRow.nextSibling);
    } else {
      form.appendChild(consent);
    }
  }

  function ensureHoneypot(form){
    if (!form) return null;
    var existing = form.querySelector('input[name="website"]');
    if (existing) return existing;
    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.style.position = 'absolute';
    honeypot.style.left = '-9999px';
    honeypot.style.opacity = '0';
    honeypot.style.pointerEvents = 'none';
    form.appendChild(honeypot);
    return honeypot;
  }

  function updateSuccessLinks(container){
    if (!container) return;
    var candidates = container.querySelectorAll('a, button');
    Array.prototype.forEach.call(candidates, function(node){
      if (!node) return;
      var text = (node.textContent || '').trim().toLowerCase();
      if (!text) return;
      if (/open the guide|download pdf|download the guide|view guide/.test(text)) {
        if (node.tagName === 'A') {
          node.setAttribute('href', RELAY_PATH);
          node.setAttribute('rel', 'noopener');
        } else {
          node.dataset.href = RELAY_PATH;
        }
      }
    });
  }

  function findWidgetForm(){
    var forms = document.querySelectorAll('form[action*="list-manage.com"]');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form._nbLmBound) continue;
      var text = (form.textContent || '').toLowerCase();
      if (/free guide|5 shifts|connections guide/.test(text)) {
        return form;
      }
      var submit = form.querySelector('[type="submit"]');
      if (submit && /(get|open).*(guide|pdf)/i.test(submit.textContent || '')) {
        return form;
      }
    }
    return null;
  }

  function buildTags(utms){
    var tags = BASE_TAGS.slice();
    if (utms) {
      UTM_KEYS.forEach(function(key){
        var value = utms[key];
        if (value) tags.push(key + ':' + value);
      });
    }
    return Array.from(new Set(tags));
  }

  function fireEvent(name, payload){
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, payload || {});
      }
    } catch (err) {
      // noop
    }
  }

  function showMessage(container, type, message){
    if (!container) return;
    var region = container.querySelector('[data-nb-lm-message]');
    if (!region) {
      region = document.createElement('div');
      region.dataset.nbLmMessage = 'true';
      region.setAttribute('role', 'alert');
      region.className = 'nb-lm-message';
      container.appendChild(region);
    }
    region.textContent = message || '';
    region.dataset.state = type || 'info';
  }

  function showSuccess(container){
    if (!container) return;
    container.classList.add('is-success');
    var formWrap = container.querySelector('[data-nb-lm-form], form');
    var success = container.querySelector('[data-nb-lm-success], .nb-lm-success');
    if (formWrap) {
      formWrap.setAttribute('aria-hidden', 'true');
      formWrap.style.display = 'none';
    }
    if (success) {
      success.removeAttribute('hidden');
      success.style.removeProperty('display');
      var focusable = getFocusable(success);
      if (focusable.length) {
        focusable[0].focus();
      }
    }
    updateSuccessLinks(container);
    fireEvent('generate_lead', { method: 'lead_magnet_widget' });
  }

  function gatherField(form, selector){
    var el = form.querySelector(selector);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function handleSubmit(form, container, honeypot){
    form.addEventListener('submit', function(evt){
      evt.preventDefault();
      if (honeypot && honeypot.value) {
        showSuccess(container);
        return;
      }

      var email = gatherField(form, 'input[name="EMAIL"], input[name="email"], input[type="email"]');
      if (!email) {
        showMessage(container, 'error', 'Please enter a valid email address.');
        return;
      }

      fireEvent('lead_submit', { form: 'lm_widget', location: 'sticky_modal' });

      var first = gatherField(form, 'input[name="FNAME"], input[name*="first"]');
      var last = gatherField(form, 'input[name="LNAME"], input[name*="last"]');

      var params = new URLSearchParams();
      params.append('form_type', 'customer');
      params.append('utf8', '✓');
      params.append('contact[email]', email);
      params.append('contact[accepts_marketing]', 'true');
      if (first) params.append('contact[first_name]', first);
      if (last) params.append('contact[last_name]', last);

      var utmsCurrent = parseSearchParams(window.location.search);
      var stored = loadUtms();
      var utms = Object.assign({}, stored, utmsCurrent);
      if (!Object.keys(stored).length && Object.keys(utmsCurrent).length) {
        saveUtms(utmsCurrent);
      }
      var tags = buildTags(utms);
      params.append('contact[tags]', tags.join(','));

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.setAttribute('disabled', 'true');

      fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }).then(function(res){
        if (!res.ok) throw new Error('Network response was not ok');
        showSuccess(container);
        if (submitBtn) submitBtn.removeAttribute('disabled');
      }).catch(function(err){
        if (submitBtn) submitBtn.removeAttribute('disabled');
        showMessage(container, 'error', 'We hit a snag—please try again.');
        console.error('LM widget submit failed', err);
      });
    });
  }

  function decorateClosers(container){
    if (!container) return;
    var closers = container.querySelectorAll('[data-modal-close], [data-close], [data-action="close"], .modal__close, button[aria-label*="close" i]');
    Array.prototype.forEach.call(closers, function(btn){
      if (btn._nbLmCloseBound) return;
      btn._nbLmCloseBound = true;
      btn.addEventListener('click', function(){
        setCooldown();
        applyCooldownState();
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
          setTimeout(function(){ lastTrigger.focus(); }, 30);
        }
      });
    });
  }

  function initOnce(){
    var form = findWidgetForm();
    if (!form) return;
    form._nbLmBound = true;
    var container = form.closest('[data-nb-lm-modal], [role="dialog"], .modal, .popup, .drawer, .nb-modal, .nb-sticky-cta');
    if (!container) container = form.parentElement;
    if (!container) container = document.body;

    ensureConsentCopy(container);
    updateSuccessLinks(container);
    var honeypot = ensureHoneypot(form);
    applyFocusTrap(container);
    decorateClosers(container);
    handleSubmit(form, container, honeypot);
  }

  function observeDom(){
    var observer = new MutationObserver(function(){
      initOnce();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    initOnce();
  }

  function init(){
    saveUtms(parseSearchParams());
    applyCooldownState();
    registerTriggerListener();
    observeDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
