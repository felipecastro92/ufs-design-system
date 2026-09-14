/* Product Hero — ported from handover/product-hero-spec.html.
   Real variant registered: 'default' (single primary CTA, the spec's
   own baseline) vs 'dual' (primary + secondary CTA side by side — the
   spec's explicitly-named "Dual-CTA variant", default in
   template-product-bin.html). VAR_LABELS gets one addition since
   'dual' has no existing label in page-builder.html. The gallery's
   first (active) image is wired as an editable slot via
   PB.replaceImage; the remaining thumbnails stay static example
   imagery — this is a preview tool, not the spec's own live
   scroll-snap gallery (thumbnail sync / swipe / arrow JS is out of
   scope here, same as Nav/Footer's own decorative-only interactive
   bits). */
Object.assign(PB.VARIANTS, { 'product-hero': ['default', 'dual'] });
Object.assign(PB.DEFAULT_VARIANT, { 'product-hero': 'default' });
Object.assign(PB.VAR_LABELS, { dual: 'Dual CTA' });

PB._productHero = function(variant, sec) {
  const mainImg = (sec.images && sec.images['main']) || 'handover/images/hero/packshot.jpg';
  const uploadIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  const chevron = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 2 8 6 4 10"/></svg>`;

  const ctas = variant === 'dual'
    ? `<div class="ufs-product-hero__ctas">
        <a href="#" class="btn btn-primary btn-lg ufs-product-hero__cta">How to order</a>
        <a href="#" class="btn btn-secondary btn-lg ufs-product-hero__cta">Request a sample</a>
      </div>`
    : `<a href="#" class="btn btn-primary btn-lg ufs-product-hero__cta">How to order</a>`;

  return `<section class="ufs-product-hero">
    <div class="ufs-product-hero__gallery">
      <div class="ufs-product-hero__main">
        <div class="ufs-product-hero__main-track">
          <div class="ufs-product-hero__main-frame">
            <div class="pb-img-slot" style="width:100%;height:100%;" onclick="PB.replaceImage('${sec.id}','main',this)">
              <img src="${mainImg}" alt="Knorr Professional Chicken Stock Granules 1 Kg — front" style="width:100%;height:100%;" />
              <div class="pb-img-overlay">
                <div class="pb-img-overlay-icon">${uploadIcon}</div>
                <span class="pb-img-overlay-label">Replace image</span>
              </div>
            </div>
          </div>
          <div class="ufs-product-hero__main-frame"><img src="images/K_GPP_3996.jpg" alt="Knorr Professional Chicken Stock Granules 1 Kg — in use"/></div>
          <div class="ufs-product-hero__main-frame"><img src="handover/images/academy/K_GPP_5120.jpg" alt="Knorr Professional Chicken Stock Granules 1 Kg — preparation"/></div>
          <div class="ufs-product-hero__main-frame"><img src="images/M_GPP_6074.jpg" alt="Knorr Professional Chicken Stock Granules 1 Kg — plated"/></div>
          <div class="ufs-product-hero__main-frame"><img src="handover/images/tiles/recipe.jpg" alt="Knorr Professional Chicken Stock Granules 1 Kg — serving suggestion"/></div>
        </div>
        <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--prev" aria-label="Previous image">${chevron}</button>
        <button type="button" class="ufs-carousel-arrow ufs-carousel-arrow--next" aria-label="Next image">${chevron}</button>
      </div>
      <div class="ufs-product-hero__thumbs">
        <button type="button" class="ufs-product-hero__thumb is-active" aria-label="View image 1" aria-current="true"><img src="${mainImg}" alt=""/></button>
        <button type="button" class="ufs-product-hero__thumb" aria-label="View image 2" aria-current="false"><img src="images/K_GPP_3996.jpg" alt=""/></button>
        <button type="button" class="ufs-product-hero__thumb" aria-label="View image 3" aria-current="false"><img src="handover/images/academy/K_GPP_5120.jpg" alt=""/></button>
        <button type="button" class="ufs-product-hero__thumb" aria-label="View image 4" aria-current="false"><img src="images/M_GPP_6074.jpg" alt=""/></button>
        <button type="button" class="ufs-product-hero__thumb" aria-label="View image 5" aria-current="false"><img src="handover/images/tiles/recipe.jpg" alt=""/></button>
      </div>
    </div>
    <div class="ufs-product-hero__info">
      <div class="ufs-product-hero__intro">
        <div class="ufs-product-hero__header">
          <p class="ufs-product-hero__eyebrow">Condiments</p>
          <h1 class="ufs-product-hero__title">Knorr Professional Chicken Stock Granules 1 Kg</h1>
          <div class="ufs-product-hero__tags">
            <span class="ufs-product-hero__tag">Vegan</span>
            <span class="ufs-product-hero__tag">Gluten Free</span>
            <span class="ufs-product-hero__tag">No MSG</span>
          </div>
        </div>
        <div class="ufs-product-hero__usps">
          <p class="ufs-product-hero__usps-label">How this will help you?</p>
          <ul class="ufs-product-hero__usps-list">
            <li>Perfect for hot &amp; cold applications without weeping.</li>
            <li>Consistent texture; thick, creamy and rich.</li>
            <li>Diverse applications for sandwiches, burgers, salads and dips.</li>
          </ul>
        </div>
        <a href="#" class="ufs-product-hero__link">+ More product and allergy information</a>
      </div>
      ${ctas}
      <p class="ufs-product-hero__sku">SKU: 94000640</p>
      <div class="ufs-product-hero__utility">
        <button type="button" class="ufs-product-hero__utility-btn"><img src="icons/pdf.svg" alt=""/> Download</button>
        <button type="button" class="ufs-product-hero__utility-btn"><img src="icons/print.svg" alt=""/> Print</button>
        <button type="button" class="ufs-product-hero__utility-btn"><img src="icons/email.svg" alt=""/> Email</button>
      </div>
    </div>
  </section>`;
};
