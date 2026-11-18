/* ================================================================
   PWA POPUP — when to show it, open / close, 30-day snooze.
   Call pwaPopup.init() once the page has loaded. It shows the popup
   after DELAY ms, only in Safari on an iPhone, when the site isn't
   already installed and the popup wasn't closed in the last 30 days.
================================================================ */
var pwaPopup = (function () {
  var KEY = 'ufs-pwa-popup';           // localStorage: time (ms) the popup was last closed
  var SNOOZE_DAYS = 30;
  var DELAY = 5000;                    // ms after init()
  var root, sheet, lastFocus, hideTimer, showTimer;

  function el() {
    if (!root) { root = document.getElementById('pwa-popup'); sheet = root && root.querySelector('.ufs-pwa-popup__sheet'); }
    return root;
  }

  // iPhone (not iPad) Safari. In-app browsers and Chrome / Firefox / Edge on iOS
  // put Add to Home Screen elsewhere, so the pointer would be wrong there.
  function isIPhoneSafari() {
    var ua = navigator.userAgent;
    return /iPhone|iPod/.test(ua) && /Version\/[\d.]+.*Safari\//.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|LinkedInApp|Line\//.test(ua);
  }
  function isInstalled() {
    return navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }
  function snoozedUntil() {
    try {
      var t = +localStorage.getItem(KEY);
      return t ? t + SNOOZE_DAYS * 864e5 : 0;
    } catch (e) { return 0; }       // storage blocked: never snoozed (shows once per page load at most)
  }
  // Why the popup would or wouldn't show here: '' = it would show
  function reason() {
    if (!isIPhoneSafari()) return 'not Safari on an iPhone';
    if (isInstalled()) return 'already installed (opened from the Home Screen)';
    var until = snoozedUntil();
    if (until > Date.now()) return 'closed recently, snoozed until ' + new Date(until).toLocaleDateString();
    return '';
  }

  function open() {
    if (!el() || !root.hidden) return;
    clearTimeout(hideTimer);
    lastFocus = document.activeElement;
    root.hidden = false;
    root.offsetWidth;                  // start the slide-up from the closed position
    root.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    sheet.focus({ preventScroll: true });
  }

  function close() {
    if (!el() || root.hidden) return;
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    root.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    hideTimer = setTimeout(function () { root.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    // Keep focus in the sheet: the close button is its only control
    if (e.key === 'Tab') { e.preventDefault(); root.querySelector('.ufs-pwa-popup__close').focus(); }
  }

  function wire() {
    if (!el() || root.dataset.wired) return;
    root.dataset.wired = '1';
    root.addEventListener('click', function (e) { if (e.target.closest('[data-pwa-close]')) close(); });
    document.addEventListener('keydown', onKey);
  }

  function init(opts) {
    wire();
    if (!root || reason()) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(open, opts && opts.delay != null ? opts.delay : DELAY);
  }

  return {
    init: init, open: function () { wire(); open(); }, close: close, reason: reason,
    resetSnooze: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
