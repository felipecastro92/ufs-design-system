/* Campaign Hero — ported from handover/campaign-hero-spec.html. No
   real variant: the spec's "Background" section (video vs static
   image) is a media-format choice — this port always renders a
   static, replaceable image via the generic PB.replaceImage slot —
   and "Content Combinations" is explicitly documented in the spec as
   plain content omission, not a modifier class, so the richest
   combination (logo, countdown, dual CTA, disclaimer) is rendered as
   the single canonical instance. */
Object.assign(PB.VARIANTS, { 'campaign-hero': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'campaign-hero': 'default' });

PB._campaignHero = function(variant, sec) {
  const imgSrc = (sec.images && sec.images['bg']) || 'handover/images/academy/promo-banner-courses.jpg';
  const uploadIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

  return `<section class="ufs-campaign-hero">
    <div class="ufs-campaign-hero__media" aria-hidden="true">
      <div class="pb-img-slot" style="position:absolute;inset:0;" onclick="PB.replaceImage('${sec.id}','bg',this)">
        <img src="${imgSrc}" alt="" />
        <div class="pb-img-overlay">
          <div class="pb-img-overlay-icon">${uploadIcon}</div>
          <span class="pb-img-overlay-label">Replace image</span>
        </div>
      </div>
      <div class="ufs-campaign-hero__overlay"></div>
    </div>
    <div class="ufs-campaign-hero__content">
      <img class="ufs-campaign-hero__logo" src="handover/images/academy/ufs-academy-logo-reversed.svg" alt="UFS Academy" />
      <div class="ufs-campaign-hero__heading">
        <h2 class="ufs-campaign-hero__title">Certified Professional Chef Training</h2>
        <p class="ufs-campaign-hero__desc">Our team of industry professionals are waiting to teach you skills, tips &amp; tricks you can use right now with carefully composed chef tutorials and chef training material.</p>
      </div>
      <div class="ufs-campaign-hero__countdown" role="group" aria-label="Offer ends in 18 days, 23 hours, 58 minutes, 16 seconds">
        <div class="ufs-campaign-hero__countdown-item" aria-hidden="true">
          <p class="ufs-campaign-hero__countdown-value text-price-xl">18</p>
          <p class="ufs-campaign-hero__countdown-label text-body-sm">Days</p>
        </div>
        <div class="ufs-campaign-hero__countdown-item" aria-hidden="true">
          <p class="ufs-campaign-hero__countdown-value text-price-xl">23</p>
          <p class="ufs-campaign-hero__countdown-label text-body-sm">Hours</p>
        </div>
        <div class="ufs-campaign-hero__countdown-item" aria-hidden="true">
          <p class="ufs-campaign-hero__countdown-value text-price-xl">58</p>
          <p class="ufs-campaign-hero__countdown-label text-body-sm">Minutes</p>
        </div>
        <div class="ufs-campaign-hero__countdown-item" aria-hidden="true">
          <p class="ufs-campaign-hero__countdown-value text-price-xl">16</p>
          <p class="ufs-campaign-hero__countdown-label text-body-sm">Seconds</p>
        </div>
      </div>
      <div class="ufs-campaign-hero__ctas btn-on-dark">
        <button type="button" class="btn btn-primary">Discover More Than 100 Courses</button>
        <button type="button" class="btn btn-secondary">Secondary Action Here</button>
      </div>
      <p class="ufs-campaign-hero__disclaimer">*Disclamer text area option for any legal notes</p>
    </div>
  </section>`;
};
