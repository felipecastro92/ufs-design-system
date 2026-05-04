(function () {
  var fab      = document.getElementById('devmode-fab');
  var sw       = document.getElementById('devmode-switch');
  var closeBtn = document.getElementById('dev-sidebar-close');
  if (!fab) return;

  function setDevMode(on) {
    document.body.classList.toggle('dev-mode', on);
    sw.classList.toggle('on', on);
    fab.setAttribute('aria-checked', String(on));
  }

  fab.addEventListener('click', function () {
    setDevMode(!document.body.classList.contains('dev-mode'));
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      setDevMode(false);
    });
  }
}());

function devCopy(btn) {
  var pre = btn.closest('.dev-section').querySelector('.dev-code');
  var text = pre.innerText || pre.textContent;
  navigator.clipboard.writeText(text).then(function () {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}
