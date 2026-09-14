/* Training Hero — ported from handover/training-hero-spec.html. Single
   canonical demo in the spec (no background/theme toggle documented),
   so no real variant is registered. Photo and instructor avatar are
   both editable via the generic PB.replaceImage image-slot pattern.
   The favourite heart uses the same plain classList.toggle already
   used inline by tiles.js (no bespoke pop/splash animation ported).
   The "Watch trailer" control opens a lazy-created lightbox modal
   (PB.openTrailerLB/closeTrailerLB below) appended to document.body —
   outside the canvas PB.render() replaces on every state change, so it
   keeps working across re-renders without needing any per-section init
   step. */
Object.assign(PB.VARIANTS, { 'training-hero': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'training-hero': 'default' });

PB._trainingHero = function (variant, sec) {
  const photoSrc = (sec.images && sec.images['photo']) || 'handover/images/training/hero.jpg';
  const avatarSrc = (sec.images && sec.images['avatar']) || 'images/chef-profiles/eric-chua.png';
  const uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  const videoUrl = 'https://player.vimeo.com/video/336809853?autoplay=1&title=0&byline=0&portrait=0';

  return `<section class="ufs-training-hero">
    <div class="ufs-training-hero__panel">
      <div class="ufs-training-hero__content">
        <p class="ufs-training-hero__eyebrow">Training</p>
        <h1 class="ufs-training-hero__title">Middle Eastern Cuisine with Chef Rabeh</h1>
        <p class="ufs-training-hero__desc">Make pasta from scratch with true Italian techniques in these online culinary courses! Learn about Italian cooking &amp; how to make the perfect Tagliatelle - Italian style!</p>
        <div class="ufs-training-hero__instructor">
          <p class="ufs-training-hero__instructor-label">Instructor:</p>
          <div class="ufs-training-hero__instructor-row">
            <div class="pb-img-slot" style="width:40px;height:40px;border-radius:var(--radius-full);flex-shrink:0;overflow:hidden;" onclick="PB.replaceImage('${sec.id}','avatar',this)">
              <img src="${avatarSrc}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
              <div class="pb-img-overlay"><div class="pb-img-overlay-icon" style="width:24px;height:24px;">${uploadIcon}</div></div>
            </div>
            <div>
              <p class="ufs-training-hero__instructor-name">Chef Eric Chua</p>
              <p class="ufs-training-hero__instructor-role">Head of Culinary Services UFS</p>
            </div>
          </div>
        </div>
        <div class="ufs-training-hero__cta">
          <button type="button" class="btn btn-primary">Start Training Now</button>
        </div>
      </div>
    </div>
    <div class="ufs-training-hero__media">
      <div class="pb-img-slot" style="position:absolute;inset:0;" onclick="PB.replaceImage('${sec.id}','photo',this)">
        <img src="${photoSrc}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
        <div class="pb-img-overlay">
          <div class="pb-img-overlay-icon">${uploadIcon}</div>
          <span class="pb-img-overlay-label">Replace image</span>
        </div>
      </div>
      <div class="ufs-training-hero__overlay"></div>
      <button class="ufs-tile__fav ufs-training-hero__fav" aria-label="Add to favourites" aria-pressed="false" onclick="event.stopPropagation();this.classList.toggle('is-active')">
        <svg width="20" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
      <button type="button" class="ufs-training-hero__trailer" onclick="event.stopPropagation();PB.openTrailerLB('${videoUrl}')" aria-label="Watch trailer">
        <span class="ufs-training-hero__trailer-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="ufs-training-hero__trailer-label">Watch trailer</span>
      </button>
    </div>
  </section>`;
};

/* Shared video lightbox — created once, on first use, and appended to
   document.body (outside #pb-canvas) so PB.render()'s innerHTML swap of
   the canvas never removes it. Safe to call repeatedly; re-declaring
   these functions on script reload is harmless (last definition wins,
   both are identical). */
PB.openTrailerLB = function (url) {
  let overlay = document.getElementById('pb-lb-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pb-lb-overlay';
    overlay.className = 'lb-overlay';
    overlay.innerHTML = '<div class="lb-wrap"><button type="button" class="lb-close" aria-label="Close" onclick="PB.closeTrailerLB()">&times;</button><div class="lb-panel"><iframe id="pb-lb-iframe" src="" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) PB.closeTrailerLB(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') PB.closeTrailerLB(); });
    document.body.appendChild(overlay);
  }
  document.getElementById('pb-lb-iframe').src = url;
  overlay.classList.add('open');
};
PB.closeTrailerLB = function () {
  const overlay = document.getElementById('pb-lb-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  const iframe = document.getElementById('pb-lb-iframe');
  if (iframe) iframe.src = '';
};
