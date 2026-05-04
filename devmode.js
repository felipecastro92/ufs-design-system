(function () {
  var fab = document.getElementById('devmode-fab');
  var sw  = document.getElementById('devmode-switch');
  if (!fab) return;
  fab.addEventListener('click', function () {
    var on = document.body.classList.toggle('dev-mode');
    sw.classList.toggle('on', on);
    fab.setAttribute('aria-pressed', String(on));
  });
}());

function devCopy(btn) {
  var pre = btn.closest('.dev-panel').querySelector('.dev-code');
  var text = pre.innerText || pre.textContent;
  navigator.clipboard.writeText(text).then(function () {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}
