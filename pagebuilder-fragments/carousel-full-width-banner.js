/* Full-Width Banner Carousel — ported from
   handover/carousel-full-width-banner-spec.html. The spec shows a
   single canonical 3-slide instance (no whole-banner colour-theme
   toggle — the aubergine/mushroom looks are per-slide content
   modifiers, not a variant a marketer would switch for the whole
   section), so no real variant is registered.

   Slide navigation (PB.fwNav below) is wired via plain onclick
   attributes rather than the spec's initFwBanner() (which attaches
   addEventListener-based click/keyboard/touch-drag handling per
   instance): PB.render() replaces the entire canvas via innerHTML on
   every state change, which would silently strip any such listeners on
   the next re-render. onclick attributes are re-emitted as part of the
   HTML string on every render instead, so they keep working. This
   covers arrow + dot navigation; real touch-swipe dragging on mobile is
   not ported (flag for integration if that's wanted later) — the dots
   stay visible and clickable at every width as the fallback. */
Object.assign(PB.VARIANTS, { 'carousel-full-width-banner': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'carousel-full-width-banner': 'default' });

PB._carouselFullWidthBanner = function (variant, sec) {
  const uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  const prevIcon = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 2 8 6 4 10"/></svg>';

  const slidesData = [
    { mod: '', badge: 'New Arrival', title: 'Descubra a experiência digital do Menus do Futuro Vol. 4.', desc: 'Receba gratuitamente dicas e insights personalizados para os desafios do seu negócio — desde otimização de cardápio até controle de custos — com base na nossa pesquisa de tendências culinárias para 2026.', cta: 'Explorar Agora', img: 'handover/images/carousel/slide1.jpg' },
    { mod: 'aubergine', badge: 'Promotion', title: 'Made with 99% potatoes', desc: 'Throughout the year, UFS speaks to hundreds of chefs across Australia and New Zealand — insight into how customer preferences evolve.', cta: 'Explore Products', img: 'handover/images/carousel/slide2.jpg' },
    { mod: 'mushroom', badge: 'Free Training', title: 'Master Umami, on us', desc: 'A free online module built for working chefs — practical techniques you can use on shift tonight.', cta: 'Start Learning', img: 'handover/images/carousel/slide3.jpg' }
  ];

  const slidesHTML = slidesData.map(function (slide, i) {
    const imgSrc = (sec.images && sec.images['slide' + i]) || slide.img;
    const modClass = slide.mod ? ' ufs-fw-banner__slide--' + slide.mod : '';
    return `<div class="ufs-fw-banner__slide${modClass}${i === 0 ? ' is-active' : ''}" data-fw-slide="${i}">
          <div class="ufs-fw-banner__panel">
            <span class="ufs-fw-banner__badge">${slide.badge}</span>
            <h3 class="ufs-fw-banner__title text-h2">${slide.title}</h3>
            <p class="ufs-fw-banner__desc text-body-sm">${slide.desc}</p>
            <a href="#" class="btn btn-primary" onclick="return false;">${slide.cta}</a>
          </div>
          <div class="ufs-fw-banner__image pb-img-slot" onclick="PB.replaceImage('${sec.id}','slide${i}',this)">
            <div class="ufs-fw-banner__image-media"><img src="${imgSrc}" alt="" /></div>
            <div class="pb-img-overlay">
              <div class="pb-img-overlay-icon">${uploadIcon}</div>
              <span class="pb-img-overlay-label">Replace image</span>
            </div>
          </div>
        </div>`;
  }).join('');

  const dotsHTML = slidesData.map(function (_, i) {
    return `<button type="button" class="ufs-carousel-dot${i === 0 ? ' is-active' : ''}" aria-label="Go to slide ${i + 1}" onclick="event.stopPropagation();PB.fwNav(this,${i})"></button>`;
  }).join('');

  return `<section class="ufs-fw-banner" aria-roledescription="carousel" aria-label="Featured promotions">
      <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--prev" aria-label="Previous slide" onclick="event.stopPropagation();PB.fwNav(this,'prev')">${prevIcon}</button>
      <div class="ufs-fw-banner__track">
        ${slidesHTML}
      </div>
      <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--next" aria-label="Next slide" onclick="event.stopPropagation();PB.fwNav(this,'next')">${prevIcon}</button>
      <div class="ufs-fw-banner__scrim"></div>
      <div class="ufs-carousel-dots">${dotsHTML}</div>
    </section>`;
};

/* Navigation — stateless: reads the currently active slide straight
   from the DOM (no closure/module state to go stale across re-renders),
   toggles .is-active on the target slide, and syncs the dots. target is
   'prev' / 'next' or a numeric slide index (dot click). */
PB.fwNav = function (ctrl, target) {
  const root = ctrl.closest('.ufs-fw-banner');
  if (!root) return;
  const slides = Array.prototype.slice.call(root.querySelectorAll('.ufs-fw-banner__slide'));
  if (!slides.length) return;
  let activeIdx = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
  if (activeIdx < 0) activeIdx = 0;
  let nextIdx;
  if (target === 'next') nextIdx = (activeIdx + 1) % slides.length;
  else if (target === 'prev') nextIdx = (activeIdx - 1 + slides.length) % slides.length;
  else nextIdx = Number(target);
  if (isNaN(nextIdx) || nextIdx < 0 || nextIdx >= slides.length || nextIdx === activeIdx) return;
  slides[activeIdx].classList.remove('is-active');
  slides[nextIdx].classList.add('is-active');
  const dots = root.querySelectorAll('.ufs-carousel-dot');
  dots.forEach(function (d, i) { d.classList.toggle('is-active', i === nextIdx); });
};
