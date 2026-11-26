/* Download form (Opt-In journey → 04 Download, handover/form-journeys.html).
   Ported from handover/forms-examples.html: the rs-* 'download' mode
   (openRs, rsValidate, rsBusiness*, rsDownloadFile, handleRsDownloadClick)
   plus the shared reg-* helpers it leans on (phone-code dropdown, phone
   validation, Enter-to-submit). Only the download mode is kept.
   Relies on the page's global S (S.auth = "User: Logged In" control). */

/* ── Shared helpers (from forms-examples.html reg-*) ── */
var REG_PHONE_COUNTRIES = [
  { iso: 'MA', name: 'Morocco',        dial: '+212', nsnLen: [9],      trunkZero: true  },
  { iso: 'US', name: 'United States',  dial: '+1',   nsnLen: [10],     trunkZero: false },
  { iso: 'GB', name: 'United Kingdom', dial: '+44',  nsnLen: [10],     trunkZero: true  },
  { iso: 'IT', name: 'Italy',          dial: '+39',  nsnLen: [9, 10],  trunkZero: false },
  { iso: 'FR', name: 'France',         dial: '+33',  nsnLen: [9],      trunkZero: true  },
  { iso: 'ES', name: 'Spain',          dial: '+34',  nsnLen: [9],      trunkZero: false },
  { iso: 'DE', name: 'Germany',        dial: '+49',  nsnLen: [10, 11], trunkZero: true  }
];

// Same sample businesses as the spec's Business name table
var regBusinessSuggestions = [
  { name: 'My restaurant',      address: 'Via Roma 12',        city: 'Milano',  postal: '20121', dialCode: '+39', phone: '345 678 9012' },
  { name: 'La Trattoria Bella', address: 'Via Dante 8',        city: 'Torino',  postal: '10121', dialCode: '+39', phone: '347 221 5566' },
  { name: 'Pizzeria Napoli',    address: '',                   city: 'Napoli',  postal: '80122', dialCode: '+39', phone: '333 998 4471' }, // incomplete record
  { name: 'Osteria del Chef',   address: 'Piazza Garibaldi 3', city: 'Firenze', postal: '50123', dialCode: '+39', phone: '328 674 1290' },
  { name: 'Ristorante Milano',  address: 'Via Torino 21',      city: 'Milano',  postal: '20123', dialCode: '+39', phone: '351 887 3345' }
];

function regEscapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function regFindCountryByDial(dial) {
  for (var i = 0; i < REG_PHONE_COUNTRIES.length; i++) {
    if (REG_PHONE_COUNTRIES[i].dial === dial) return REG_PHONE_COUNTRIES[i];
  }
  return REG_PHONE_COUNTRIES[0];
}

function regValidatePhone(raw, country) {
  var cleaned = raw.trim().replace(/[\s\-().]/g, '');
  var nsn = (country.trunkZero && cleaned.charAt(0) === '0') ? cleaned.slice(1) : cleaned;
  if (!nsn || !/^\d+$/.test(nsn)) return { valid: false };
  return { valid: country.nsnLen.indexOf(nsn.length) !== -1 };
}

// Enter-to-submit: the panel isn't a <form>, so it's wired per field
function regStepEnter(event, btnId) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  var btn = document.getElementById(btnId);
  if (btn && !btn.disabled) btn.click();
}

// Country-code dropdown + search (id + -trigger/-label/-panel/-search/-list)
var regPhoneCodeOpenId = null;

function regPhoneCodeMatches(country, q) {
  if (!q) return true;
  return country.name.toLowerCase().indexOf(q) !== -1
    || country.dial.indexOf(q) !== -1
    || country.dial.replace('+', '').indexOf(q) !== -1;
}
function regPhoneCodeRenderList(id, query) {
  var q = (query || '').trim().toLowerCase();
  var matches = REG_PHONE_COUNTRIES.filter(function(c) { return regPhoneCodeMatches(c, q); });
  var ul = document.getElementById(id + '-list');
  if (!matches.length) { ul.innerHTML = '<li class="reg-phone-code-empty">No matches</li>'; return; }
  ul.innerHTML = matches.map(function(c) {
    return '<li class="reg-phone-code-item" role="option" onmousedown="regPhoneCodeSelect(\'' + id + '\',\'' + c.dial + '\')">' +
      '<span class="reg-phone-code-item-name">' + regEscapeHtml(c.name) + '</span>' +
      '<span class="reg-phone-code-item-dial">' + c.dial + '</span></li>';
  }).join('');
}
function regPhoneCodeCloseAll() {
  document.querySelectorAll('.reg-phone-code-panel').forEach(function(p) { p.hidden = true; });
  document.querySelectorAll('.fi-phone-code-trigger').forEach(function(t) { t.setAttribute('aria-expanded', 'false'); });
  regPhoneCodeOpenId = null;
}
function regPhoneCodeToggle(id) {
  var wasOpen = regPhoneCodeOpenId === id;
  regPhoneCodeCloseAll();
  if (wasOpen) return;
  document.getElementById(id + '-panel').hidden = false;
  document.getElementById(id + '-trigger').setAttribute('aria-expanded', 'true');
  regPhoneCodeOpenId = id;
  var search = document.getElementById(id + '-search');
  search.value = '';
  regPhoneCodeRenderList(id, '');
  search.focus();
}
function regPhoneCodeFilter(id, value) { regPhoneCodeRenderList(id, value); }
function regPhoneCodeSetValue(id, dial) {
  document.getElementById(id).value = dial;
  var label = document.getElementById(id + '-label');
  if (label) label.textContent = dial;
}
function regPhoneCodeSelect(id, dial) {
  regPhoneCodeSetValue(id, dial);
  regPhoneCodeCloseAll();
  document.getElementById(id + '-trigger').focus();
  // The mobile number's validity depends on the selected country
  if (id === 'dl-mobile-code') { dlClearMobileError(); dlValidateMobileFormat(); dlValidate(); }
}
function regPhoneCodeSearchKeydown(event, id) {
  if (event.key === 'Escape') {
    event.preventDefault();
    regPhoneCodeCloseAll();
    document.getElementById(id + '-trigger').focus();
    return;
  }
  if (event.key !== 'Enter') return;
  event.preventDefault();
  var q = document.getElementById(id + '-search').value.trim().toLowerCase();
  var match = REG_PHONE_COUNTRIES.filter(function(c) { return regPhoneCodeMatches(c, q); })[0];
  if (match) regPhoneCodeSelect(id, match.dial);
}
document.addEventListener('click', function(e) {
  if (regPhoneCodeOpenId && !e.target.closest('.reg-phone-code-wrap')) regPhoneCodeCloseAll();
});

/* ── Download form ── */
var $ = function(id) { return document.getElementById(id); };
var DL_DOWNLOAD_LABEL = 'Download “13 ultimate burger recipes”';
var dlDownloadedThisSession = false;
var dlSubmitTimeout = null, dlDownloadTimeout = null, dlAutoDownloadTimeout = null;
var dlLastFocus = null;

// Banner CTA: first time opens the form; once downloaded this session it
// hands the file over directly (spec: "Repeat visits skip the form").
function dlHandleCtaClick(event) {
  if (event) event.preventDefault();
  if (!dlDownloadedThisSession) { dlOpen(); return; }
  if (dlAutoDownloadTimeout) return;
  var cta = $('fep-cta');
  var original = cta.textContent;
  cta.textContent = 'Downloading…';
  dlAutoDownloadTimeout = setTimeout(function() {
    cta.textContent = 'Downloaded';
    setTimeout(function() { cta.textContent = original; dlAutoDownloadTimeout = null; }, 1500);
  }, 900);
}

function dlOpen() {
  dlLastFocus = document.activeElement;
  dlResetFlow();
  if (S.auth) dlComplete();   // signed in: details on file, straight to the download
  $('dl-backdrop').classList.add('is-open');
  $('dl-panel').classList.add('is-open');
  document.body.style.overflow = 'hidden';
  $('dl-panel-body').scrollTop = 0;
  setTimeout(function() { (S.auth ? $('dl-download-btn') : $('dl-email')).focus(); }, 350);
}

function dlClose() {
  $('dl-backdrop').classList.remove('is-open');
  $('dl-panel').classList.remove('is-open');
  document.body.style.overflow = '';
  if (dlLastFocus) dlLastFocus.focus();
}

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape' || !$('dl-panel').classList.contains('is-open')) return;
  if (regPhoneCodeOpenId) return; // Esc closes the code dropdown first
  dlClose();
});

function dlBizIsValid() {
  if (!$('dl-business-wrap').classList.contains('is-visible')) return true;
  if (!$('dl-business').value.trim()) return false;
  if ($('dl-address-wrap').classList.contains('is-visible') && !$('dl-address').value.trim()) return false;
  return true;
}

function dlMobileIsValid() {
  if (!$('dl-mobile-wrap').classList.contains('is-visible')) return true; // hidden: never required
  var val = $('dl-mobile').value.trim();
  if (!val) return true;   // optional: only a malformed number blocks
  return regValidatePhone(val, regFindCountryByDial($('dl-mobile-code').value)).valid;
}

// Download rules: shared Opt-In field set, marketing consent REQUIRED,
// Job title + Mobile optional (author setting), age confirmation required.
function dlValidate() {
  var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('dl-email').value.trim())
    && $('dl-name').value.trim()
    && $('dl-lastname').value.trim()
    && $('dl-business-type').value
    && dlBizIsValid()
    && dlMobileIsValid()
    && $('dl-consent').checked
    && $('dl-age').checked;
  $('dl-continue-btn').disabled = !ok;
}

function dlConsentToggle() {
  var checked = $('dl-consent').checked;
  document.querySelectorAll('.dl-consent-channel').forEach(function(cb) { cb.checked = checked; });
  dlValidate();
}
function dlConsentChannelChange() {
  $('dl-consent').checked = Array.prototype.some.call(document.querySelectorAll('.dl-consent-channel'), function(cb) { return cb.checked; });
  dlValidate();
}
function dlToggleConsentChannels() {
  var btn = $('dl-consent-toggle'), panel = $('dl-consent-channels');
  var opening = panel.hidden;
  panel.hidden = !opening;
  btn.classList.toggle('is-open', opening);
  btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
}

// Display rule: a real business reveals Business name, Job title, Mobile
// together; "I don't have/work in a business" hides them (and anything
// Business name revealed). Values are kept for when they come back.
function dlBusinessTypeChange() {
  var type = $('dl-business-type').value;
  var show = (type !== '' && type !== 'none');
  ['dl-business-wrap', 'dl-job-title-wrap', 'dl-mobile-wrap'].forEach(function(id) { $(id).classList.toggle('is-visible', show); });
  ['dl-biz-card', 'dl-address-wrap', 'dl-extra-fields'].forEach(function(id) {
    var el = $(id);
    if (!show && el.classList.contains('is-visible')) { el.dataset.cHidden = '1'; el.classList.remove('is-visible'); }
    else if (show && el.dataset.cHidden) { delete el.dataset.cHidden; el.classList.add('is-visible'); }
  });
  dlValidate();
}

function dlClearMobileError() {
  $('dl-mobile').classList.remove('is-invalid');
  $('dl-mobile-hint').classList.remove('is-error');
  $('dl-mobile-hint').textContent = '';
}
function dlValidateMobileFormat() {
  var input = $('dl-mobile'), hint = $('dl-mobile-hint');
  if (!input.value.trim()) { dlClearMobileError(); return; }
  var valid = dlMobileIsValid();
  input.classList.toggle('is-invalid', !valid);
  hint.classList.toggle('is-error', !valid);
  hint.textContent = valid ? '' : 'Enter a valid mobile number for the selected country code.';
}

/* Business name typeahead (shared pattern) */
function dlClearBizFields() {
  $('dl-address').value = ''; $('dl-city').value = ''; $('dl-postal').value = '';
  regPhoneCodeSetValue('dl-phone-code', '+39');
  $('dl-phone').value = '';
}
function dlBusinessNameInput(value) {
  var typed = value.trim(), q = typed.toLowerCase();
  var box = $('dl-biz-suggest');
  if (!q) {
    box.classList.remove('is-open'); box.innerHTML = '';
    dlHideBizCard();
    dlClearBizFields();
    return;
  }
  var html = regBusinessSuggestions.filter(function(b) { return b.name.toLowerCase().indexOf(q) !== -1; }).map(function(b) {
    return '<div class="reg-biz-suggest-item" onmousedown="dlSelectBusiness(\'' + b.name.replace(/'/g, "\\'") + '\')">' + regEscapeHtml(b.name) + '</div>';
  }).join('');
  html += '<div class="reg-biz-suggest-item reg-biz-suggest-item--add" onmousedown="dlAddCustomBusiness()">Add &quot;' + regEscapeHtml(typed) + '&quot;</div>';
  box.innerHTML = html;
  box.classList.add('is-open');
}
function dlBusinessNameBlur() {
  setTimeout(function() { var box = $('dl-biz-suggest'); box.classList.remove('is-open'); box.innerHTML = ''; }, 150);
}
function dlBusinessNameEnter(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  var box = $('dl-biz-suggest'), first = box.querySelector('.reg-biz-suggest-item');
  if (box.classList.contains('is-open') && first) {
    if (first.classList.contains('reg-biz-suggest-item--add')) dlAddCustomBusiness();
    else dlSelectBusiness(first.textContent);
    return;
  }
  regStepEnter(event, 'dl-continue-btn');
}
function dlSelectBusiness(name) {
  var biz = regBusinessSuggestions.filter(function(b) { return b.name === name; })[0];
  $('dl-business').value = name;
  $('dl-biz-suggest').classList.remove('is-open'); $('dl-biz-suggest').innerHTML = '';
  if (!biz) return;
  $('dl-address').value = biz.address; $('dl-city').value = biz.city; $('dl-postal').value = biz.postal;
  regPhoneCodeSetValue('dl-phone-code', biz.dialCode);
  $('dl-phone').value = biz.phone;
  dlApplyBusinessRecord(name, biz);
  dlValidate();
}
function dlAddCustomBusiness() {
  $('dl-biz-suggest').classList.remove('is-open'); $('dl-biz-suggest').innerHTML = '';
  dlHideBizCard();
  $('dl-address-wrap').classList.add('is-visible');
  $('dl-extra-fields').classList.add('is-visible');
  dlClearBizFields();
  $('dl-address').focus();
  dlValidate();
}
// Complete record → read-only summary card. Incomplete → real fields,
// locked where a value exists, missing ones open with a red border.
function dlApplyBusinessRecord(name, biz) {
  if (biz.address && biz.city && biz.postal && biz.phone) {
    $('dl-address-wrap').classList.remove('is-visible');
    $('dl-extra-fields').classList.remove('is-visible');
    $('dl-biz-card-name').textContent    = name;
    $('dl-biz-card-address').textContent = [biz.address, biz.city, biz.postal].join(', ');
    $('dl-biz-card-phone').textContent   = biz.dialCode + ' ' + biz.phone;
    $('dl-biz-card').classList.add('is-visible');
    var check = document.querySelector('#dl-biz-card .reg-biz-card-check');
    check.classList.remove('is-drawing');
    void check.getBoundingClientRect(); // reflow so the draw animation replays
    check.classList.add('is-drawing');
    return;
  }
  $('dl-biz-card').classList.remove('is-visible');
  $('dl-address-wrap').classList.add('is-visible');
  $('dl-extra-fields').classList.add('is-visible');
  [['dl-address', biz.address], ['dl-city', biz.city], ['dl-postal', biz.postal], ['dl-phone', biz.phone]].forEach(function(p) {
    $(p[0]).disabled = !!p[1];
    $(p[0]).classList.toggle('is-invalid', !p[1]);
  });
  $('dl-phone-code-trigger').disabled = !!biz.phone;
}
function dlHideBizCard() {
  $('dl-biz-card').classList.remove('is-visible');
  document.querySelector('#dl-biz-card .reg-biz-card-check').classList.remove('is-drawing');
  ['dl-biz-card-name', 'dl-biz-card-address', 'dl-biz-card-phone'].forEach(function(id) { $(id).textContent = ''; });
  $('dl-address-wrap').classList.remove('is-visible');
  $('dl-extra-fields').classList.remove('is-visible');
  ['dl-address', 'dl-city', 'dl-postal', 'dl-phone', 'dl-phone-code-trigger'].forEach(function(id) { $(id).disabled = false; });
  ['dl-address', 'dl-city', 'dl-postal', 'dl-phone'].forEach(function(id) { $(id).classList.remove('is-invalid'); });
}

/* Submit → Success */
function dlResetBar(btnId, barId) {
  $(btnId).classList.remove('is-loading', 'is-done');
  var bar = $(barId);
  bar.style.transition = 'none';
  bar.style.width = '0%';
  void bar.offsetWidth; // reflow so the next fill re-triggers the transition
  bar.style.transition = '';
}

function dlSubmit() {
  var btn = $('dl-continue-btn');
  if (btn.disabled || btn.classList.contains('is-loading')) return;
  btn.classList.add('is-loading');
  btn.disabled = true;
  requestAnimationFrame(function() { $('dl-continue-btn-bar').style.width = '100%'; });
  dlSubmitTimeout = setTimeout(function() { dlSubmitTimeout = null; dlComplete(); }, 1000);
}

function dlComplete() {
  var name = $('dl-name').value.trim();
  $('dl-success-title').textContent = 'Thank you' + (name ? ', ' + name : '') + '!';
  // Guests get the account invite; signed-in users only the download
  $('dl-success-invite').style.display = S.auth ? 'none' : '';
  $('dl-step-form').style.display = 'none';
  $('dl-step-success').style.display = '';
  $('dl-panel-body').scrollTop = 0;
  $('dl-download-btn').focus({ preventScroll: true });
}

function dlDownloadFile() {
  var btn = $('dl-download-btn');
  if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return;
  btn.classList.add('is-loading');
  requestAnimationFrame(function() { $('dl-download-btn-bar').style.width = '100%'; });
  dlDownloadTimeout = setTimeout(function() {
    dlDownloadTimeout = null;
    btn.classList.remove('is-loading');
    btn.classList.add('is-done');
    $('dl-download-btn-label').textContent = 'Downloaded';
    dlDownloadedThisSession = true; // banner CTA now re-downloads directly
  }, 900);
}

// Stub: in the full system this hands every field over to Account
// Creation (forms-examples.html rsFinishAccount → openSignIn). Here it
// just closes the panel.
function dlFinishAccount() { dlClose(); }

function dlResetFlow() {
  if (dlSubmitTimeout)   { clearTimeout(dlSubmitTimeout);   dlSubmitTimeout = null; }
  if (dlDownloadTimeout) { clearTimeout(dlDownloadTimeout); dlDownloadTimeout = null; }
  $('dl-step-form').style.display = '';
  $('dl-step-success').style.display = 'none';
  ['dl-email', 'dl-name', 'dl-lastname', 'dl-mobile', 'dl-business', 'dl-business-type', 'dl-job-title'].forEach(function(id) { $(id).value = ''; });
  regPhoneCodeSetValue('dl-mobile-code', '+212');
  regPhoneCodeCloseAll();
  dlClearMobileError();
  ['dl-business-wrap', 'dl-job-title-wrap', 'dl-mobile-wrap'].forEach(function(id) { $(id).classList.remove('is-visible'); });
  ['dl-biz-card', 'dl-address-wrap', 'dl-extra-fields'].forEach(function(id) { delete $(id).dataset.cHidden; });
  $('dl-biz-suggest').classList.remove('is-open'); $('dl-biz-suggest').innerHTML = '';
  dlHideBizCard();
  dlClearBizFields();
  $('dl-consent').checked = false;
  document.querySelectorAll('.dl-consent-channel').forEach(function(cb) { cb.checked = false; });
  $('dl-consent-channels').hidden = true;
  $('dl-consent-toggle').classList.remove('is-open');
  $('dl-consent-toggle').setAttribute('aria-expanded', 'false');
  $('dl-age').checked = false;
  dlResetBar('dl-continue-btn', 'dl-continue-btn-bar');
  dlResetBar('dl-download-btn', 'dl-download-btn-bar');
  $('dl-download-btn-label').textContent = DL_DOWNLOAD_LABEL;
  $('dl-continue-btn').disabled = true;
}

$('fep-cta').addEventListener('click', dlHandleCtaClick);
