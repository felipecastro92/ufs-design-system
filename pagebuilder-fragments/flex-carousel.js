/* Flex Carousel — ported from handover/flex-carousel-spec.html. Four
   colour looks are documented in the spec's own "Colour Variants"
   section — default (salt/white), --squid (brand-dark), --mushroom
   (mushroom-100) and --image (photo background) — registered here
   using the same suffixes as the real CSS modifier classes
   (.ufs-flex-carousel--squid etc.) so the variant keys are self-
   documenting; PB.VAR_LABELS gets new entries for the three that don't
   already have one.

   Arrow buttons and dots are wired via a small onclick-driven helper
   (PB.flexNav / PB.flexNavDot below) that calls scrollBy()/
   scrollIntoView() directly — no addEventListener anywhere, so nothing
   here is at risk of being silently stripped by PB.render()'s full
   canvas re-render. The track itself already scrolls with plain touch/
   trackpad/drag input via native overflow-x:auto + scroll-snap, exactly
   like the spec's own .ufs-carousel-track (its JS only added the dot/
   arrow chrome and an overflow-measured .is-compact state, neither of
   which this port needs to reproduce with JS). Dots reflect which card
   was last navigated to via click, not a live-scroll-position listener
   (again to avoid an addEventListener that re-render would strip). */
Object.assign(PB.VARIANTS, { 'flex-carousel': ['default', 'squid', 'mushroom', 'image'] });
Object.assign(PB.DEFAULT_VARIANT, { 'flex-carousel': 'default' });
Object.assign(PB.VAR_LABELS, { squid: 'Squid Ink', mushroom: 'Mushroom', image: 'Image' });

PB._flexCarousel = function (variant, sec) {
  const modClass = variant && variant !== 'default' ? ' ufs-flex-carousel--' + variant : '';
  const uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  const arrowIcon = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 2 8 6 4 10"/></svg>';

  const cardsData = [
    { label: 'Chef’s Special', img: 'images/G_DSC_6099.jpg' },
    { label: 'Seasonal Menu Ideas', img: 'images/K_GPP_3996.jpg' },
    { label: 'New Recipe Drop', img: 'images/M_GPP_6074.jpg' },
    { label: 'Grilled Favourites', img: 'images/banners/promo-1.jpg' }
  ];

  const cardsHTML = cardsData.map(function (card, i) {
    const imgSrc = (sec.images && sec.images['card' + i]) || card.img;
    return `<div class="ufs-carousel-card pb-img-slot" onclick="PB.replaceImage('${sec.id}','card${i}',this)">
            <img src="${imgSrc}" alt="" />
            <div class="ufs-carousel-card__scrim"></div>
            <p class="ufs-carousel-card__label">${card.label}</p>
            <div class="pb-img-overlay">
              <div class="pb-img-overlay-icon">${uploadIcon}</div>
              <span class="pb-img-overlay-label">Replace image</span>
            </div>
          </div>`;
  }).join('');

  const dotsHTML = cardsData.map(function (_, i) {
    return `<button type="button" class="ufs-carousel-dot${i === 0 ? ' is-active' : ''}" aria-label="Go to item ${i + 1}" onclick="event.stopPropagation();PB.flexNavDot(this,${i})"></button>`;
  }).join('');

  return `<section class="ufs-flex-carousel${modClass}">
      <div class="ufs-flex-carousel__head">
        <div class="ufs-flex-carousel__intro">
          <h2 class="ufs-flex-carousel__title text-h3">Carousel title</h2>
          <p class="ufs-flex-carousel__desc">Carousel description this can be optional if it&rsquo;s needed to add some context</p>
        </div>
        <button type="button" class="btn btn-secondary ufs-flex-carousel__cta">Discover more items</button>
      </div>

      <div class="ufs-flex-carousel__track-wrap">
        <div class="ufs-carousel-track">
          <div class="ufs-carousel-spacer" aria-hidden="true"></div>
          ${cardsHTML}
        </div>
      </div>

      <div class="ufs-flex-carousel__foot">
        <div class="ufs-carousel-dots">${dotsHTML}</div>
        <div class="ufs-flex-carousel__arrows">
          <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--prev" aria-label="Previous items" onclick="event.stopPropagation();PB.flexNav(this,'prev')">${arrowIcon}</button>
          <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--next" aria-label="Next items" onclick="event.stopPropagation();PB.flexNav(this,'next')">${arrowIcon}</button>
        </div>
      </div>

      <button type="button" class="btn btn-secondary ufs-flex-carousel__cta ufs-flex-carousel__cta--mobile">Discover more items</button>
    </section>`;
};

/* Arrow nav — scrolls the track by ~80% of its own visible width. */
PB.flexNav = function (ctrl, dir) {
  const wrap = ctrl.closest('.ufs-flex-carousel');
  const track = wrap && wrap.querySelector('.ufs-carousel-track');
  if (!track) return;
  const amount = Math.round(track.clientWidth * 0.8) * (dir === 'prev' ? -1 : 1);
  track.scrollBy({ left: amount, behavior: 'smooth' });
};

/* Dot nav — scrolls the matching card into view and marks its dot
   active (a manual highlight, not a live-scroll-position sync). */
PB.flexNavDot = function (dotEl, index) {
  const wrap = dotEl.closest('.ufs-flex-carousel');
  if (!wrap) return;
  const cards = wrap.querySelectorAll('.ufs-carousel-card');
  if (cards[index]) cards[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  wrap.querySelectorAll('.ufs-carousel-dot').forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
};
