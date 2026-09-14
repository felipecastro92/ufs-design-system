/* Utility Bar — ported from handover/utility-bar-spec.html.
   Single visual treatment, no variant toggle (see this spec's own
   Anatomy & States sections — States documents hover/focus only). */
Object.assign(PB.VARIANTS, { 'utility-bar': [] });
Object.assign(PB.DEFAULT_VARIANT, { 'utility-bar': 'default' });

PB._utilityBar = function(variant, sec) {
  return `<div class="ufs-utility-bar">
    <button type="button" class="ufs-utility-bar__btn"><span class="ufs-utility-bar__icon"><img src="icons/dowload.svg" alt=""></span> Download</button>
    <button type="button" class="ufs-utility-bar__btn"><span class="ufs-utility-bar__icon"><img src="icons/print.svg" alt=""></span> Print</button>
    <button type="button" class="ufs-utility-bar__btn"><span class="ufs-utility-bar__icon"><img src="icons/email.svg" alt=""></span> Email</button>
  </div>`;
};
