/* Promo Banner — ported from handover/promo-banner-spec.html.
   Two variants come straight from the spec's own "Background" section:
   default (mushroom-100 background, full content — logo, countdown,
   secondary CTA, disclaimer) and --dark (squid-ink background). The
   dark instance in the spec deliberately omits the logo, countdown and
   secondary CTA as a content choice (the academy logo asset has a dark
   wordmark that would go invisible on this background) — mirrored here
   for the same reason, not because the --dark CSS modifier itself
   requires it. 'dark' reuses the key PB.VAR_LABELS already defines. */
Object.assign(PB.VARIANTS, { 'promo-banner': ['default', 'dark'] });
Object.assign(PB.DEFAULT_VARIANT, { 'promo-banner': 'default' });

PB._promoBanner = function (variant, sec) {
  const isDark = variant === 'dark';
  const imgSrc = (sec.images && sec.images['image'])
    || (isDark ? 'handover/images/academy/K_GPP_5120.jpg' : 'handover/images/academy/promo-banner-courses.jpg');
  const uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';

  const logo = isDark ? '' : `<img class="ufs-promo-banner__logo" src="handover/images/academy/ufs-academy-logo.svg" alt="UFS Academy" />`;
  const countdown = isDark ? '' : `<div class="ufs-promo-banner__countdown" role="group" aria-label="Offer ends in 18 days, 23 hours, 58 minutes, 16 seconds">
          <div class="ufs-promo-banner__countdown-item" aria-hidden="true">
            <p class="ufs-promo-banner__countdown-value text-price-xl">18</p>
            <p class="ufs-promo-banner__countdown-label text-body-sm">Days</p>
          </div>
          <div class="ufs-promo-banner__countdown-item" aria-hidden="true">
            <p class="ufs-promo-banner__countdown-value text-price-xl">23</p>
            <p class="ufs-promo-banner__countdown-label text-body-sm">Hours</p>
          </div>
          <div class="ufs-promo-banner__countdown-item" aria-hidden="true">
            <p class="ufs-promo-banner__countdown-value text-price-xl">58</p>
            <p class="ufs-promo-banner__countdown-label text-body-sm">Minutes</p>
          </div>
          <div class="ufs-promo-banner__countdown-item" aria-hidden="true">
            <p class="ufs-promo-banner__countdown-value text-price-xl">16</p>
            <p class="ufs-promo-banner__countdown-label text-body-sm">Seconds</p>
          </div>
        </div>`;
  const secondaryCta = isDark ? '' : `<button type="button" class="btn btn-secondary">How Academy Works?</button>`;

  return `<div class="ufs-promo-banner${isDark ? ' ufs-promo-banner--dark' : ''}">
      <div class="ufs-promo-banner__image pb-img-slot" onclick="PB.replaceImage('${sec.id}','image',this)">
        <img src="${imgSrc}" alt="" />
        <div class="pb-img-overlay">
          <div class="pb-img-overlay-icon">${uploadIcon}</div>
          <span class="pb-img-overlay-label">Replace image</span>
        </div>
      </div>
      <div class="ufs-promo-banner__panel">
        ${logo}
        <div class="ufs-promo-banner__body">
          <h2 class="ufs-promo-banner__title text-h2">UFS Academy: Mental Health in Kitchens</h2>
          <p class="ufs-promo-banner__desc text-body">This series will show you how to take care of yourself and your team to make the kitchen a better working environment for everyone.</p>
          ${countdown}
        </div>
        <div class="ufs-promo-banner__ctas">
          <button type="button" class="btn btn-primary">Discover All Courses</button>
          ${secondaryCta}
        </div>
        <p class="ufs-promo-banner__disclaimer text-body-xs">*Disclaimer text for specific use cases</p>
      </div>
    </div>`;
};
