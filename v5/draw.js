/* Headings marked for drawing become outlined SVG text whose strokes draw on
   when they enter the view. The real text stays as the accessible name. */
(function () {
  'use strict';
  var els = [].slice.call(document.querySelectorAll('h1, .sh h2, .places b, .contact h2'));
  els.forEach(function (el) {
    var text = el.textContent.trim(), lines = (el.getAttribute('data-draw') || text).split('|');
    var size = parseFloat(getComputedStyle(el).fontSize) || 60;
    el.setAttribute('aria-label', text);
    el.classList.add('drawn');
    el.style.setProperty('--len', Math.round(size * 7));
    el.innerHTML = lines.map(function (l, i) {
      return '<svg class="dr" aria-hidden="true" focusable="false" style="--i:' + i + '"><text x="0" y="0.8em">' +
        l.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>';
    }).join('');
  });
  /* each picture gets a blue backing to print against */
  [].slice.call(document.querySelectorAll('.fig > img')).forEach(function (img) {
    var w = document.createElement('span'); w.className = 'pr';
    img.parentNode.insertBefore(w, img); w.appendChild(img);
  });

  var marks = els.concat([].slice.call(document.querySelectorAll('.sh, .pj')));
  if (!('IntersectionObserver' in window)) { marks.forEach(function (el) { el.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
  marks.forEach(function (el) { io.observe(el); });
})();
