(function(){
  'use strict';

  var RELAY_PATH = '/dl/connection-guide';
  var STORAGE_UTM = 'nb_lm_widget_utms';
  var STORAGE_COOLDOWN = 'nb_lm_widget_cooldown';
  var UTM_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  var COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var BASE_TAGS = ['newsletter', 'leadmagnet:connections_guide', 'source:widget'];

  var widget, dialog, form, successView, messageRegion, honeypot, pill;
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

  function clearCooldown(){
    safeStorage(function(){ localStorage.removeItem(STORAGE_COOLDOWN); });
  }

  function withinCooldown(){
    var ts = safeStorage(function(){ return localStorage.getItem(STORAGE_COOLDOWN); });
    if (!ts) return false;
    var parsed = parseInt(ts, 10);
    if (isNaN(parsed)) return false;
    return now() - parsed < COOLDOWN_MS;
  }

  function applyCooldownState(){
    if (!pill) pill = document.querySelector('[data-nb-lm-pill]');
    if (!pill) return;
    if (withinCooldown()) {
      pill.setAttribute('hidden', 'hidden');
      pill.setAttribute('aria-hidden', 'true');
    } else {
      pill.removeAttribute('hidden');
      pill.removeAttribute('aria-hidden');
    }
  }

  function getFocusable(container){
    if (!container) return [];
    var focusables = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(focusables, function(el){
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function fireEvent(name, payload){
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, payload || {});
      }
    } catch (err) {
      // ignore analytics errors
    }
  }

  function ensureHoneypot(){
    if (!form) return null;
    var existing = form.querySelector('input[name="website"]');
    if (existing) return existing;
    var trap = document.createElement('input');
    trap.type = 'text';
    trap.name = 'website';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.position = 'absolute';
    trap.style.left = '-9999px';
    trap.style.opacity = '0';
    trap.style.pointerEvents = 'none';
    form.appendChild(trap);
    return trap;
  }

  function showMessage(type, text){
    if (!messageRegion) return;
    messageRegion.dataset.state = type || 'info';
    messageRegion.textContent = text || '';
  }

  function showSuccess(){
    if (!widget) return;
    if (form) {
      form.setAttribute('aria-hidden', 'true');
      form.style.display = 'none';
      if (typeof form.reset === 'function') {
        form.reset();
      }
      if (honeypot) honeypot.value = '';
    }
    if (successView) {
      successView.removeAttribute('hidden');
      successView.style.removeProperty('display');
      var focusable = getFocusable(successView);
      if (focusable.length) {
        focusable[0].focus();
      }
    }
    showMessage('success', '');
    fireEvent('generate_lead', { method: 'lead_magnet_widget' });
    setCooldown();
    applyCooldownState();
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

  function gatherField(selector){
    if (!form) return '';
    var el = form.querySelector(selector);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function submitForm(evt){
    evt.preventDefault();
    if (!form) return;
    if (honeypot && honeypot.value) {
      showSuccess();
      return;
    }

    var email = gatherField('input[name="contact[email]"]');
    if (!email) {
      showMessage('error', 'Please enter a valid email address.');
      var emailField = form.querySelector('input[name="contact[email]"]');
      if (emailField) emailField.focus();
      return;
    }

    fireEvent('lead_submit', { form: 'lm_widget', location: 'sticky_modal' });

    var params = new URLSearchParams();
    params.append('form_type', 'customer');
    params.append('utf8', '✓');
    params.append('contact[email]', email);
    params.append('contact[accepts_marketing]', 'true');

    var first = gatherField('input[name="contact[first_name]"]');
    var last = gatherField('input[name="contact[last_name]"]');
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
    showMessage('info', 'Working on it…');

    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).then(function(res){
      if (!res.ok) throw new Error('Non-200 response');
      if (submitBtn) submitBtn.removeAttribute('disabled');
      showSuccess();
    }).catch(function(err){
      if (submitBtn) submitBtn.removeAttribute('disabled');
      console.error('Lead magnet submit failed', err);
      showMessage('error', 'We hit a snag — please try again.');
    });
  }

  function handleKeydown(evt){
    if (!widget || !widget.classList.contains('is-active')) return;
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      closeModal({ manual: true });
      return;
    }
    if (evt.key !== 'Tab') return;
    var focusable = getFocusable(dialog);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = document.activeElement;
    if (evt.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        last.focus();
        evt.preventDefault();
      }
    } else {
      if (active === last) {
        first.focus();
        evt.preventDefault();
      }
    }
  }

  function openModal(trigger){
    if (!widget) return;
    lastTrigger = trigger || document.activeElement;
    clearCooldown();
    applyCooldownState();
    if (form) {
      form.removeAttribute('aria-hidden');
      form.style.removeProperty('display');
    }
    if (successView) {
      successView.setAttribute('hidden', 'hidden');
      successView.style.display = 'none';
    }
    showMessage('info', '');
    widget.hidden = false;
    widget.classList.add('is-active');
    widget.setAttribute('aria-hidden', 'false');
    if (dialog) dialog.setAttribute('aria-hidden', 'false');
    if (pill) pill.setAttribute('aria-expanded', 'true');
    var focusTarget = form ? form.querySelector('input[name="contact[email]"]') : null;
    if (!focusTarget) focusTarget = dialog;
    window.requestAnimationFrame(function(){
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
      }
    });
  }

  function closeModal(opts){
    if (!widget || !widget.classList.contains('is-active')) return;
    var manual = opts && opts.manual;
    widget.classList.remove('is-active');
    widget.setAttribute('aria-hidden', 'true');
    widget.hidden = true;
    if (dialog) dialog.setAttribute('aria-hidden', 'true');
    if (pill) pill.setAttribute('aria-expanded', 'false');
    if (manual) {
      setCooldown();
      applyCooldownState();
    }
    var returnTarget = lastTrigger;
    if (returnTarget && typeof returnTarget.focus === 'function') {
      setTimeout(function(){ returnTarget.focus(); }, 50);
    }
  }

  function bindEvents(){
    var openers = document.querySelectorAll('[data-nb-lm-open]');
    Array.prototype.forEach.call(openers, function(btn){
      btn.addEventListener('click', function(evt){
        evt.preventDefault();
        openModal(btn);
      });
    });

    if (widget) {
      widget.addEventListener('click', function(evt){
        var closeEl = evt.target.closest('[data-nb-lm-close]');
        if (!closeEl) return;
        evt.preventDefault();
        closeModal({ manual: true });
      });
    }

    if (dialog) {
      dialog.addEventListener('keydown', handleKeydown);
    }

    if (form) {
      form.addEventListener('submit', submitForm);
    }
  }

  function init(){
    widget = document.querySelector('[data-nb-lm-widget]');
    dialog = widget && widget.querySelector('[data-nb-lm-dialog]');
    form = widget && widget.querySelector('[data-nb-lm-form]');
    successView = widget && widget.querySelector('[data-nb-lm-success]');
    messageRegion = widget && widget.querySelector('[data-nb-lm-message]');
    pill = document.querySelector('[data-nb-lm-pill]');

    if (!widget || !form) return;

    honeypot = ensureHoneypot();
    if (successView) {
      var successLink = successView.querySelector('a');
      if (successLink) {
        successLink.setAttribute('href', RELAY_PATH);
        successLink.setAttribute('rel', 'noopener');
      }
    }

    if (messageRegion) {
      showMessage('info', '');
    }

    saveUtms(parseSearchParams());
    applyCooldownState();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
