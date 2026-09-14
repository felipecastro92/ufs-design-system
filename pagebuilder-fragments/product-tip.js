Object.assign(PB.VARIANTS, { 'product-tip': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'product-tip': 'default' });
PB._productTip = function(variant, sec) {
  // Real demo copy from product-tip-spec.html's PT_REAL_TIPS (5-card
  // row — 1..5 cards always render as a single row, so no row-split
  // math is needed here; that logic only kicks in past 5 items).
  var tips = [
    { title: 'No added MSG', desc: 'Full-bodied flavour built from real ingredients, not flavour enhancers.' },
    { title: 'Consistent every batch', desc: 'Standardised seasoning means the same result every time.' },
    { title: 'Versatile base', desc: 'Works across soups, sauces, braises and risottos without reformulating.' },
    { title: 'Fast to prep', desc: 'Dissolves quickly in hot water, no simmering from scratch.' },
    { title: 'Long shelf life', desc: 'Resealable tub stays fresh in dry storage, reducing waste.' }
  ];
  var cardsHTML = tips.map(function(t) {
    return '<div class="ufs-product-tip"><p class="ufs-product-tip__title">' + t.title + '</p><p class="ufs-product-tip__desc">' + t.desc + '</p></div>';
  }).join('');
  return `<div class="pbf-product-tip-section">
    <div class="ufs-product-tips-rows">
      <div class="ufs-product-tips">${cardsHTML}</div>
      <p class="ufs-product-tips__footnote">*Optional disclaimer, sits below every row.</p>
    </div>
  </div>`;
};
