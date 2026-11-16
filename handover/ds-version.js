/* Design System version context — shared by every handover version.
   Newer versions reuse older pages instead of copying them (v2 and v3 link to the v1
   specs, v3 links to the v2 specs). Each page's own "back to Design System" link points
   at its own version's index, so this script carries the version being browsed:
   - On an index: links to pages of an OLDER version get ?ds=<this version>.
   - On a page opened with ?ds=<newer version>: the back links (topbar, sidebar, demo
     button) go to that version's index and say its name, and links to other
     older-version pages keep the ?ds tag.
   Without ?ds (direct visit, bookmark) a page behaves exactly as before.
   Add a new version: one line in VERSIONS, newest last. */
(function () {
  var VERSIONS = [
    { id: 'v1', index: 'index.html',    label: 'Design System' },        // v1 pages say "Design System"
    { id: 'v2', index: 'v2/index.html', label: 'Design System v2.0' },
    { id: 'v3', index: 'v3/index.html', label: 'Design System v3.0' }
  ];
  var script = document.currentScript;
  if (!script) return;
  var root = new URL('.', script.src).href;               // handover/ (the script lives there)

  function rank(id) { for (var i = 0; i < VERSIONS.length; i++) if (VERSIONS[i].id === id) return i; return -1; }
  // Version of a handover URL: its folder (v2/, v3/…) or v1 for the root
  function versionOf(href) {
    if (href.indexOf(root) !== 0) return -1;
    var m = href.slice(root.length).match(/^(v\d+)\//);
    return m ? rank(m[1]) : 0;
  }
  function isPage(url) { return /\.html$/.test(url.pathname); }

  var own = versionOf(location.href.split(/[?#]/)[0]);
  if (own < 0) return;
  var path = location.href.split(/[?#]/)[0].slice(root.length);
  var isIndex = path === VERSIONS[own].index;
  var ctx = isIndex ? own : rank(new URLSearchParams(location.search).get('ds'));
  if (ctx <= own && !isIndex) return;                      // no newer context: leave the page alone
  var v = VERSIONS[ctx];

  document.querySelectorAll('a[href]').forEach(function (a) {
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (!isPage(url)) return;
    var target = versionOf(url.href.split(/[?#]/)[0]);
    if (target < 0) return;
    var targetPath = url.href.split(/[?#]/)[0].slice(root.length);
    var backLink = a.matches('.doc-topbar-back, .sidebar-back, .demo-fab') && targetPath === VERSIONS[own].index;
    if (backLink && !isIndex) {
      a.href = root + v.index;                            // back to the version being browsed
      var nodes = [].filter.call(a.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (nodes.length) nodes[nodes.length - 1].textContent = ' ' + v.label + ' ';
    } else if (target < ctx && !/index\.html$/.test(targetPath)) {
      url.searchParams.set('ds', v.id);                   // an older page: carry the context
      a.href = url.href;
    }
  });
})();
