Object.assign(PB.VARIANTS, { 'video-embed': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'video-embed': 'default' });
PB._videoEmbed = function(variant, sec) {
  // This is a local offline preview tool, so the real Vimeo embed the
  // spec links to (data-video-url) won't resolve here — per this
  // porting pass's guidance, the real component chrome (frame, play
  // button, title/duration) is rendered around a static poster image
  // instead of a working video stream. Title/duration copy and the
  // poster image are taken from the spec's own --wide demo.
  var poster = (sec.images && sec.images.poster) || 'handover/images/tiles/topic-wide.jpg';
  var uploadIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>';
  return `<div class="pbf-video-embed-section">
    <div class="ufs-video-embed ufs-video-embed--wide">
      <div class="ufs-video-embed__media pb-img-slot" onclick="PB.replaceImage('${sec.id}','poster',this)">
        <img class="ufs-video-embed__poster" src="${poster}" alt="">
        <div class="pb-img-overlay">
          <div class="pb-img-overlay-icon">${uploadIcon}</div>
          <span class="pb-img-overlay-label">Replace</span>
        </div>
      </div>
      <button type="button" class="ufs-video-embed__play" aria-label="Play video">
        <span class="ufs-video-embed__play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      </button>
      <div class="ufs-video-embed__body">
        <p class="ufs-video-embed__title">Behind the Menu: Sourcing Seasonal Produce</p>
        <div class="ufs-video-embed__meta"><img src="icons/timer.svg" alt=""><span>24 min</span></div>
      </div>
    </div>
  </div>`;
};
