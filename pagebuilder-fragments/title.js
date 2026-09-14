Object.assign(PB.VARIANTS, { title: ['light', 'dark'] });
Object.assign(PB.DEFAULT_VARIANT, { title: 'light' });
PB._title = function(variant, sec) {
  // Background is the one real look-and-feel toggle a marketer would
  // want here (title-spec.html's Background section): 'light' is the
  // default, unmodified block (no --dark/--mushroom class, sits flush
  // on the page); 'dark' applies the real .ufs-title-section--dark
  // squid-ink modifier. Reuses the dark/light keys PB.VAR_LABELS
  // already defines elsewhere (nav) rather than introducing new ones.
  var cls = 'ufs-title-section' + (variant === 'dark' ? ' ufs-title-section--dark' : '');
  return `<section class="${cls}">
    <div class="ufs-title-section__inner">
      <p class="ufs-title-section__eyebrow">Get Inspired</p>
      <h2 class="ufs-title-section__heading">Recipes</h2>
      <p class="ufs-title-section__desc">Chef-built recipes engineered for foodservice kitchens — scalable, cost-conscious, and ready to plug into your menu.</p>
    </div>
  </section>`;
};
