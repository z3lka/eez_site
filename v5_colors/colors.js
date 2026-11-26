/* Print picker for comparing blueprint colours. Remembers the choice and
   accepts #print=name in the address so a colour can be shared as a link. */
(function () {
  'use strict';
  var PRINTS = [
    { id: 'blue', name: 'Blueprint', a: '#0E2E6E', b: '#F1F5FF' },
    { id: 'black', name: 'Black, white', a: '#0B0B0C', b: '#F4F4F2' },
    { id: 'yellow', name: 'Black, yellow', a: '#0C0B08', b: '#FFD84A' },
    { id: 'cyan', name: 'Night, cyan', a: '#06141F', b: '#8FE9FF' },
    { id: 'white', name: 'Whiteprint', a: '#F7F8FB', b: '#0E2E6E', light: true },
    { id: 'trace', name: 'Yellow trace', a: '#F2D24B', b: '#17150C', light: true },
    { id: 'diazo', name: 'Diazo', a: '#EEE9F4', b: '#3A2A7C', light: true }
  ];
  var root = document.documentElement, bar = document.createElement('div'), label = document.createElement('span');
  bar.className = 'prints'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Print colour');
  bar.appendChild(label);

  function apply(id, save) {
    var p = PRINTS.filter(function (x) { return x.id === id; })[0] || PRINTS[0];
    root.setAttribute('data-print', p.id);
    root.setAttribute('data-mode', p.light ? 'light' : 'dark');
    label.textContent = p.name;
    [].forEach.call(bar.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.value === p.id)); });
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = p.a;
    if (save) { try { localStorage.setItem('zelka-print', p.id); history.replaceState(null, '', '#print=' + p.id); } catch (e) {} }
    window.dispatchEvent(new Event('resize'));           /* the canvas re-reads its colours on resize */
  }
  PRINTS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.value = p.id; b.title = p.name; b.setAttribute('aria-label', p.name);
    b.style.setProperty('--a', p.a); b.style.setProperty('--b', p.b);
    b.addEventListener('click', function () { apply(p.id, true); });
    bar.appendChild(b);
  });
  document.body.appendChild(bar);
  apply(root.getAttribute('data-print') || 'blue', false);
})();
