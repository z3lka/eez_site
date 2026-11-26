/* Version switcher for the comparison. Not part of any design: remove the
   script tag from the version that wins. Keys 0 to 4 also switch. */
(function () {
  'use strict';
  var V = [
    { k: '0', name: 'Current', href: '../index.html' },
    { k: '1', name: 'Practice', href: '../v1/' },
    { k: '2', name: 'Publication', href: '../v2/' },
    { k: '3', name: '95 cm', href: '../v3/' },
    { k: '4', name: 'Scale', href: '../v4/' }
  ];
  var here = (/\/v(\d)\//.exec(location.pathname) || [])[1] || '0';
  var nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Design versions');
  nav.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:90;display:flex;gap:2px;padding:3px;background:#111110;border-radius:999px;font:500 12px/1 system-ui,sans-serif;box-shadow:0 2px 14px rgba(0,0,0,.22)';
  V.concat([{ k: 'a', name: 'All', href: '../versions.html' }]).forEach(function (v) {
    var a = document.createElement('a');
    a.href = v.href; a.textContent = v.k === 'a' ? v.name : v.k + ' ' + v.name;
    var on = v.k === here;
    a.style.cssText = 'padding:8px 12px;border-radius:999px;text-decoration:none;white-space:nowrap;color:' + (on ? '#111110' : '#E8E4DA') + ';background:' + (on ? '#F4F1EA' : 'transparent');
    if (on) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var v = V.filter(function (x) { return x.k === e.key; })[0];
    if (v && v.k !== here) location.href = v.href;
  });
})();
