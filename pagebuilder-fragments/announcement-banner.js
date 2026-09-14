/* Announcement Banner — ported from handover/announcement-banner-spec.html.
   Two free-choice colour variants documented in the spec's own "Colour
   Variants" section — Neutral and Warm, no fixed meaning attached to
   either. Both need new PB.VAR_LABELS entries (neither 'dark' nor
   'light' fits: Warm is a light orange tint, not a dark theme).

   The countdown renders static illustrative numbers rather than the
   spec's live-ticking data-countdown-end behaviour — PB.render()
   replaces the whole canvas on every state change, which would leak a
   fresh setInterval on every re-render with no matching teardown, so
   live ticking is intentionally not ported here.

   Dismiss is wired via a plain onclick (PB.dismissAnnBanner below)
   rather than the spec's document-level delegated click listener, so
   it keeps working after PB.render() replaces the canvas markup. */
Object.assign(PB.VARIANTS, { 'announcement-banner': ['neutral', 'warm'] });
Object.assign(PB.DEFAULT_VARIANT, { 'announcement-banner': 'warm' });
Object.assign(PB.VAR_LABELS, { neutral: 'Neutral', warm: 'Warm' });

PB._announcementBanner = function (variant, sec) {
  const isWarm = variant !== 'neutral';
  const closeBtn = `<button type="button" class="ufs-ann-banner__close" aria-label="Dismiss announcement" onclick="PB.dismissAnnBanner(this)">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
      </button>`;

  if (!isWarm) {
    return `<div class="ufs-ann-banner ufs-ann-banner--neutral">
      <p class="ufs-ann-banner__content">
        <span class="ufs-ann-banner__text">We are experiencing delays in our shippings due to bad weather conditions. Please keep an eye on your inbox for order updates.</span>
      </p>
      ${closeBtn}
    </div>`;
  }

  return `<div class="ufs-ann-banner ufs-ann-banner--warm">
      <div class="ufs-ann-banner__countdown">
        <div class="ufs-ann-banner__unit"><span class="ufs-ann-banner__unit-value">07</span><span class="ufs-ann-banner__unit-label">Days</span></div>
        <div class="ufs-ann-banner__unit"><span class="ufs-ann-banner__unit-value">14</span><span class="ufs-ann-banner__unit-label">Hours</span></div>
        <div class="ufs-ann-banner__unit"><span class="ufs-ann-banner__unit-value">32</span><span class="ufs-ann-banner__unit-label">Minutes</span></div>
        <div class="ufs-ann-banner__unit"><span class="ufs-ann-banner__unit-value">09</span><span class="ufs-ann-banner__unit-label">Seconds</span></div>
      </div>
      <p class="ufs-ann-banner__content">
        <span class="ufs-ann-banner__title">30 Seconds. That&rsquo;s All We Need. </span><span class="ufs-ann-banner__text">Update your details for offers made just for you. </span><a href="#" class="ufs-ann-banner__link" onclick="return false;">Let's Do It</a>
      </p>
      ${closeBtn}
    </div>`;
};

/* Dismiss — adds the closing transition class then removes the element
   once it finishes; a one-time listener on the banner itself, cleaned
   up automatically (or simply moot if the section is removed from the
   canvas first via any other state change). */
PB.dismissAnnBanner = function (closeBtn) {
  const banner = closeBtn.closest('.ufs-ann-banner');
  if (!banner) return;
  banner.classList.add('is-closing');
  banner.addEventListener('transitionend', function () { banner.remove(); }, { once: true });
};
