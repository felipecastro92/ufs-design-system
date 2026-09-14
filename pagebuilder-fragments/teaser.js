Object.assign(PB.VARIANTS, { teaser: ['light', 'dark'] });
Object.assign(PB.DEFAULT_VARIANT, { teaser: 'light' });
PB._teaser = function(variant, sec) {
  // Background is the real look-and-feel toggle documented in
  // teaser-spec.html (White vs Squid-ink 3-up examples) — reuses the
  // dark/light keys PB.VAR_LABELS already defines elsewhere (nav)
  // rather than introducing new ones. Content/images below are taken
  // verbatim from the spec's own White and Squid-ink 3-up, text-link
  // CTA demos.
  var isDark = variant === 'dark';
  var cards = isDark ? [
    { key: 'teaser-0', img: 'handover/images/tiles/reward.jpg', eyebrow: 'Awards', title: 'Celebrating culinary excellence', desc: "See this year's UFS Chef Awards winners." },
    { key: 'teaser-1', img: 'handover/images/tiles/article.jpg', eyebrow: 'Support', title: 'Talk to our team', desc: 'Get help with orders, products or your account.' },
    { key: 'teaser-2', img: 'images/banners/promo-1.jpg', eyebrow: 'Loyalty', title: 'Earn points on every order', desc: 'Redeem loyalty points for merchandise and training.' }
  ] : [
    { key: 'teaser-0', img: 'handover/images/tiles/recipe.jpg', eyebrow: 'Recipes', title: 'Browse our recipe library', desc: '500+ chef-tested recipes built around UFS pantry staples.' },
    { key: 'teaser-1', img: 'handover/images/tiles/topic.jpg', eyebrow: 'Sustainability', title: 'Our sustainability commitments', desc: "See how we're helping kitchens reduce waste." },
    { key: 'teaser-2', img: 'handover/images/tiles/training.jpg', eyebrow: 'Training', title: 'Live culinary masterclasses', desc: 'Join monthly sessions with guest chefs.' }
  ];
  var uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
  var cardsHTML = cards.map(function(c) {
    var src = (sec.images && sec.images[c.key]) || c.img;
    return '<div class="ufs-teaser">' +
      '<div class="ufs-teaser__image pb-img-slot" onclick="PB.replaceImage(\'' + sec.id + '\',\'' + c.key + '\',this)">' +
        '<img src="' + src + '" alt="">' +
        '<div class="pb-img-overlay"><div class="pb-img-overlay-icon">' + uploadIcon + '</div><span class="pb-img-overlay-label">Replace</span></div>' +
      '</div>' +
      '<div class="ufs-teaser__body">' +
        '<p class="ufs-teaser__eyebrow">' + c.eyebrow + '</p>' +
        '<div class="ufs-teaser__heading">' +
          '<h3 class="ufs-teaser__title">' + c.title + '</h3>' +
          '<p class="ufs-teaser__desc">' + c.desc + '</p>' +
        '</div>' +
        '<a href="#" class="ufs-teaser__link">Learn more</a>' +
      '</div>' +
    '</div>';
  }).join('');
  return `<div class="pg-teaser-section${isDark ? ' pg-teaser-section--squidink' : ''}">
    <div class="ufs-teaser-wrapper ufs-teaser-wrapper--3">${cardsHTML}</div>
  </div>`;
};
