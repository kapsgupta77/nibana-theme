(function(){
  'use strict';

  var RELAY_PATH = '/dl/connection-guide';
  var STORAGE_UTM = 'nb_lm_widget_utms';
  var STORAGE_COOLDOWN = 'nb_lm_widget_cooldown';
  var STORAGE_PENDING_SUCCESS = 'nb_lm_pending_success';
  var UTM_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  var COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var BASE_TAGS = ['newsletter', 'leadmagnet:connections_guide', 'source:widget'];
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var widget, dialog, form, successView, messageRegion, honeypot, pill;
  var mailchimpForm = null;
  var mailchimpFields = {};
  var spinnerStyleInjected = false;
  var lastTrigger = null;
  var lastSubmitContext = null;

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


  function markPendingSuccess(){
    safeStorage(function(){ localStorage.setItem(STORAGE_PENDING_SUCCESS, '1'); });
  }


  function consumePendingSuccess(){
    var pending = safeStorage(function(){ return localStorage.getItem(STORAGE_PENDING_SUCCESS); });
    if (pending === '1') {
      safeStorage(function(){ localStorage.removeItem(STORAGE_PENDING_SUCCESS); });
      return true;
    }
    return false;
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

  function ensureSpinnerStyles(){
    if (spinnerStyleInjected) return;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'nb-lm-spinner-style';
    style.textContent = '' +
      '.nb-lm__submit-spinner{' +
      'display:inline-block;' +
      'width:16px;' +
      'height:16px;' +
      'margin-right:8px;' +
      'border-radius:50%;' +
      'border:2px solid currentColor;' +
      'border-top-color:transparent;' +
      'animation:nbLmSpin 0.8s linear infinite;' +
      '}' +
      '@keyframes nbLmSpin{to{transform:rotate(360deg);}}';
    var target = document.head || document.body || document.documentElement;
    if (target) {
      target.appendChild(style);
      spinnerStyleInjected = true;
    }
  }

  function setSubmittingState(btn, isSubmitting){
    if (!btn) return;
    if (isSubmitting) {
      ensureSpinnerStyles();
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-busy', 'true');
      btn.dataset.nbLmSubmitting = 'true';
      if (!btn.querySelector('[data-nb-lm-spinner]')) {
        var spinner = document.createElement('span');
        spinner.className = 'nb-lm__submit-spinner';
        spinner.setAttribute('data-nb-lm-spinner', '');
        spinner.setAttribute('aria-hidden', 'true');
        btn.insertBefore(spinner, btn.firstChild || null);
      }
    } else {
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-busy');
      delete btn.dataset.nbLmSubmitting;
      var existing = btn.querySelector('[data-nb-lm-spinner]');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }
  }

  function getSubmitButton(){
    if (!form) return null;
    return form.querySelector('[type="submit"]');
  }

  function disableSubmitButton(btn){
    setSubmittingState(btn || getSubmitButton(), true);
  }

  function enableSubmitButton(btn){
    setSubmittingState(btn || getSubmitButton(), false);
  }

  function showInlineError(text){
    showMessage('error', text);
  }

  function trackGenerateLead(){
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', { method: 'lead_magnet_widget' });
      }
    } catch (err) {
      // ignore analytics errors
    }
  }

  function showSuccessPanel(){
    if (!widget) return;
    if (form) {
      form.setAttribute('aria-hidden', 'true');
      form.style.display = 'none';
      if (typeof form.reset === 'function') {
        form.reset();
      }
      if (honeypot) honeypot.value = '';
    }
    clearFieldErrors();
    if (successView) {
      successView.removeAttribute('hidden');
      successView.style.removeProperty('display');
      var focusable = getFocusable(successView);
      if (focusable.length) {
        focusable[0].focus();
      }
    }
    showMessage('success', '');
    setCooldown();
    applyCooldownState();

  }

  function submitMailchimpMirror(first, last, email){
    if (!mailchimpForm) return;
    try {
      if (mailchimpFields.first) mailchimpFields.first.value = first || '';
      if (mailchimpFields.last) mailchimpFields.last.value = last || '';
      if (mailchimpFields.email) mailchimpFields.email.value = email || '';
      if (mailchimpForm.requestSubmit) {
        mailchimpForm.requestSubmit();
      } else {
        mailchimpForm.submit();
      }
    } catch (err) {
      console.warn('NB LM: Mailchimp mirror submit skipped', err);
    }
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

  function getFieldInput(name){
    if (!form) return null;
    return form.querySelector('input[name="contact[' + name + ']"]');
  }

  function getFieldValue(name){
    var input = getFieldInput(name);
    if (!input || typeof input.value !== 'string') return '';
    var value = input.value.trim();
    input.value = value;
    return value;
  }

  function firstNameValue(){
    return getFieldValue('first_name');
  }

  function lastNameValue(){
    return getFieldValue('last_name');
  }

  function emailValue(){
    return getFieldValue('email');
  }

  function ensureHidden(name, value){
    if (!form) return null;
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value || '';
    return input;
  }

  function collectUtmsForSubmit(){
    var current = parseSearchParams(window.location.search);
    var stored = loadUtms();
    var merged = Object.assign({}, stored, current);
    if (!Object.keys(stored).length && Object.keys(current).length) {
      saveUtms(current);
    }
    return merged;
  }

  function makeTagString(utms){
    return buildTags(utms).join(',');
  }

  function formRootUrl(){
    var widgetEl = widget || (form && form.closest('[data-nb-lm-widget]'));
    return (widgetEl && widgetEl.getAttribute('data-root-url')) || '/';
  }

  function nativeFallbackSubmit(context){
    if (!form) return false;
    var ctx = context || lastSubmitContext || {};
    var rootUrl = ctx.rootUrl || formRootUrl() || '/';
    form.setAttribute('action', rootUrl);
    form.method = 'POST';
    form.enctype = 'application/x-www-form-urlencoded';
    form.noValidate = true;

    ensureHidden('form_type', 'customer');
    ensureHidden('utf8', '✓');
    ensureHidden('contact[email]', ctx.email || emailValue());
    ensureHidden('contact[first_name]', ctx.first || firstNameValue());
    ensureHidden('contact[last_name]', ctx.last || lastNameValue());
    ensureHidden('contact[tags]', ctx.tags || makeTagString(collectUtmsForSubmit()));

    try {
      form.submit();
      return true;
    } catch (err) {
      console.error('Lead magnet native fallback failed', err);
      return false;
    }
  }

  function clearFieldErrors(){
    if (!form) return;
    var fields = form.querySelectorAll('[data-nb-lm-field]');
    Array.prototype.forEach.call(fields, function(field){
      field.classList.remove('is-invalid');
      var input = field.querySelector('input');
      if (input) {
        input.removeAttribute('aria-invalid');
      }
      var error = field.querySelector('[data-nb-lm-error]');
      if (error) {
        error.textContent = '';
        error.hidden = true;
      }
    });
  }

  function setFieldError(name, message){
    if (!form) return null;
    var field = form.querySelector('[data-nb-lm-field="' + name + '"]');
    if (!field) return null;
    field.classList.add('is-invalid');
    var input = field.querySelector('input');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
    }
    var error = field.querySelector('[data-nb-lm-error]');
    if (error) {
      error.hidden = false;
      error.textContent = message || '';
    }
    return input || null;
  }

  async function onLmSubmit(evt){
    if (!form) return;
    if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
    if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
    if (evt && typeof evt.stopImmediatePropagation === 'function') evt.stopImmediatePropagation();

    if (honeypot && honeypot.value) {
      showSuccessPanel();
      trackGenerateLead();
      enableSubmitButton();
      return;
    }

    clearFieldErrors();
    showMessage('info', '');

    var submitBtn = getSubmitButton();
    if (submitBtn && submitBtn.dataset.nbLmSubmitting === 'true') {
      return;
    }

    var first = firstNameValue();
    var last = lastNameValue();
    var email = emailValue();

    var hasErrors = false;
    var focusTarget = null;

    if (!first) {
      hasErrors = true;
      focusTarget = focusTarget || setFieldError('first_name', 'First name is required.');
    }

    if (!last) {
      hasErrors = true;
      focusTarget = focusTarget || setFieldError('last_name', 'Last name is required.');
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      hasErrors = true;
      focusTarget = focusTarget || setFieldError('email', 'Enter a valid email address.');
    }

    if (hasErrors) {
      showInlineError('Please complete the required fields.');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
      }
      return;
    }

    fireEvent('lead_submit', { form: 'lm_widget', location: 'sticky_modal' });

    disableSubmitButton(submitBtn);
    var utms = collectUtmsForSubmit();
    var tags = makeTagString(utms);

    var params = new URLSearchParams();
    params.append('form_type', 'customer');
    params.append('utf8', '✓');
    params.append('contact[email]', email);
    params.append('contact[first_name]', first);
    params.append('contact[last_name]', last);
    params.append('contact[tags]', tags);

    var rootUrl = formRootUrl();

    lastSubmitContext = {
      first: first,
      last: last,
      email: email,
      tags: tags,
      rootUrl: rootUrl
    };

    submitMailchimpMirror(first, last, email);

    var widgetEl = widget || (form && form.closest('[data-nb-lm-widget]'));
    var res = null;
    var bodySnippet = '';
    var finalURL = '';

    try {
      res = await fetch(rootUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'same-origin',
        redirect: 'follow',
        body: params.toString()
      });
      try {
        bodySnippet = (await res.clone().text()).slice(0, 200);
      } catch (errSnippet) {}
      finalURL = res && res.url ? res.url : '';
    } catch (err) {
      res = null;
    }

    var okish = res && (res.ok || res.status === 200 || res.status === 201 || res.status === 204 ||
      res.status === 302 || res.status === 303 || res.redirected === true);
    var looksChallenge = (finalURL && /\/challenge/i.test(finalURL)) || /h-captcha|g-recaptcha/i.test(bodySnippet);

    if (okish && !looksChallenge) {
      showSuccessPanel();
      trackGenerateLead();
      enableSubmitButton(submitBtn);
      return;
    }

    var fallbackSucceeded = false;
    var shouldFallback = (!okish || looksChallenge || !res);

    if (shouldFallback) {
      markPendingSuccess();
      form.setAttribute('action', (widgetEl && widgetEl.getAttribute('data-root-url')) || rootUrl || '/');
      form.method = 'POST';
      form.enctype = 'application/x-www-form-urlencoded';
      form.noValidate = true;

      ensureHidden('form_type', 'customer');
      ensureHidden('utf8', '✓');
      ensureHidden('contact[email]', email);
      ensureHidden('contact[first_name]', first);
      ensureHidden('contact[last_name]', last);
      ensureHidden('contact[tags]', tags);

      try {
        form.submit();
        fallbackSucceeded = true;
      } catch (fallbackErr) {
        fallbackSucceeded = false;
      }
      if (fallbackSucceeded) {
        return;
      }
    }

    if (shouldFallback && !fallbackSucceeded) {
      showInlineError('We hit a snag—please try again.');
      var errorFocus = getFieldInput('email');
      if (errorFocus && typeof errorFocus.focus === 'function') {
        errorFocus.focus();
      }
    }

    enableSubmitButton(submitBtn);
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

  function openModal(trigger, opts){
    var options = opts || {};
    if (!widget) return;
    lastTrigger = trigger || document.activeElement;
    clearCooldown();
    applyCooldownState();
    if (!options.showSuccess) {
      if (form) {
        form.removeAttribute('aria-hidden');
        form.style.removeProperty('display');
      }
      if (successView) {
        successView.setAttribute('hidden', 'hidden');
        successView.style.display = 'none';
      }
      clearFieldErrors();
      showMessage('info', '');
    }
    widget.hidden = false;
    widget.classList.add('is-active');
    widget.setAttribute('aria-hidden', 'false');
    if (dialog) dialog.setAttribute('aria-hidden', 'false');
    if (pill) pill.setAttribute('aria-expanded', 'true');
    if (options.showSuccess) {
      showSuccessPanel();
    }
    var focusTarget = null;
    if (options.showSuccess && successView) {
      var successFocusables = getFocusable(successView);
      focusTarget = successFocusables.length ? successFocusables[0] : null;
    }
    if (!focusTarget) {
      focusTarget = form ? getFieldInput('email') : null;
    }
    if (!focusTarget) focusTarget = dialog;
    window.requestAnimationFrame(function(){
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
      }
    });
  }

  function openLeadMagnetModal(opts){
    openModal(null, opts || {});
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
      form.addEventListener('submit', onLmSubmit, { capture: true });
    }
  }

  function init(){
    widget = document.querySelector('[data-nb-lm-widget]');
    dialog = widget && widget.querySelector('[data-nb-lm-dialog]');
    form = widget && widget.querySelector('[data-nb-lm-form]');
    successView = widget && widget.querySelector('[data-nb-lm-success]');
    messageRegion = widget && widget.querySelector('[data-nb-lm-message]');
    pill = document.querySelector('[data-nb-lm-pill]');
    mailchimpForm = widget && widget.querySelector('#nb-lm-mc');
    if (mailchimpForm) {
      mailchimpFields.first = mailchimpForm.querySelector('#nb-lm-mc-fname');
      mailchimpFields.last = mailchimpForm.querySelector('#nb-lm-mc-lname');
      mailchimpFields.email = mailchimpForm.querySelector('#nb-lm-mc-email');
    }

    if (!widget || !form) return;

    honeypot = ensureHoneypot();
    var shouldResumeSuccess = consumePendingSuccess();

    if (successView) {
      var successLink = successView.querySelector('a.nb-cta');
      if (successLink) {
        successLink.setAttribute('href', RELAY_PATH);
        successLink.setAttribute('rel', 'noopener');
        successLink.addEventListener('click', function(){
          fireEvent('asset_open', { asset: 'connection_guide', method: 'lead_magnet_widget' });
        });
      }
    }

    if (messageRegion) {
      showMessage('info', '');
      var actions = form.querySelector('.nb-lm__actions');
      if (actions && actions.nextElementSibling !== messageRegion) {
        actions.insertAdjacentElement('afterend', messageRegion);
      }
    }

    saveUtms(parseSearchParams());
    applyCooldownState();
    bindEvents();

    if (shouldResumeSuccess) {
      openLeadMagnetModal({ showSuccess: true });
      try {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { method: 'lead_magnet_widget' });
        }
      } catch (err) {}
      enableSubmitButton(form && form.querySelector('[type="submit"]'));
    }
  }

  if (typeof window !== 'undefined') {
    window.openLeadMagnetModal = openLeadMagnetModal;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
