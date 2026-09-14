Object.assign(PB.VARIANTS, { 'text-block': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'text-block': 'default' });
PB._textBlock = function(variant, sec) {
  // Real demo copy from text-block-spec.html's Overview section (the
  // base .ufs-text-block shape, eyebrow + --lead heading + two --lead
  // paragraphs, no media). Text Block is a pure article-body
  // component here — no image/video layout modifier is wired.
  return `<div class="ufs-text-block" style="padding-top: var(--space-16); padding-bottom: var(--space-16);">
    <div class="ufs-text-block__content">
      <p class="ufs-text-block__eyebrow">Guest 365 for Hotels &amp; Conferencing</p>
      <h2 class="ufs-text-block__heading ufs-text-block__heading--lead">The Best For Your Guest: Modern Comfort Food with a Twist!</h2>
      <div class="ufs-text-block__body ufs-text-block__body--lead">
        <p>Your guests crave the nostalgia of familiar dishes yet expect the excitement of new flavours. This is where the art of modern comfort food comes in to give your guests the best of both!</p>
        <p>With modern spins on comfort classics, transform traditional favourites into a unique guest experience that makes your hotel dining a culinary destination – one plate at a time!</p>
      </div>
    </div>
  </div>`;
};
