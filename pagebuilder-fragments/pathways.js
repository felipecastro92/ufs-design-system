Object.assign(PB.VARIANTS, { pathways: [] });
Object.assign(PB.DEFAULT_VARIANT, { pathways: 'default' });
PB._pathways = function(variant, sec) {
  // Real demo copy from pathways-spec.html's "3 cards" example. Each
  // card's colour (--aubergine/--squid/--orange/--smoke) is a
  // per-card content choice in the real component, not a whole-
  // section look toggle, so it isn't exposed as a PB variant — no
  // meaningfully different section-level variant exists here, per
  // this porting pass's guidance. Icons reused as-is from this DS's
  // existing icons/ set, same as the spec itself does.
  var chevron = '<span class="ufs-pathways__chevron" aria-hidden="true"><svg viewBox="0 0 7 14" fill="none"><path d="M1 1l5 6-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  return `<div class="ufs-pathways">
    <h2 class="ufs-pathways__heading">What do you want to do today?</h2>
    <div class="ufs-pathways__list">
      <a href="#" class="ufs-pathways__card ufs-pathways__card--aubergine">
        <div class="ufs-pathways__icon"><img src="icons/products.svg" alt=""></div>
        <span class="ufs-pathways__label">Products</span>
        ${chevron}
      </a>
      <a href="#" class="ufs-pathways__card ufs-pathways__card--squid">
        <div class="ufs-pathways__icon"><img src="icons/flame.svg" alt=""></div>
        <span class="ufs-pathways__label">Inspiration</span>
        ${chevron}
      </a>
      <a href="#" class="ufs-pathways__card ufs-pathways__card--orange">
        <div class="ufs-pathways__icon"><img src="icons/chef.svg" alt=""></div>
        <span class="ufs-pathways__label">Trainings</span>
        ${chevron}
      </a>
    </div>
  </div>`;
};
