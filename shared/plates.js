/* Photographs. Empty until Elif sends her own.
   Each page has slots: <figure data-plate="zumrutevler"></figure>. A slot with no
   entry here stays hidden, so the pages are complete without pictures. To place a
   photograph in all three versions, add one line:

     zumrutevler: { src: 'assets/real/zumrutevler-01.jpg', w: 2560, h: 1440,
                    alt: 'What the picture shows', credit: 'Photograph: Name' },

   Paths are from the site root. Pictures are shown whole, in their own colour. */
(function () {
  'use strict';
  var PLATES = {
    // hero: {},
    // zumrutevler: {},
    // yali: {},
    // intersect: {},
    // hamam: {},
    // tree: {},
    // portrait: {}
  };

  [].forEach.call(document.querySelectorAll('[data-plate]'), function (el) {
    var p = PLATES[el.getAttribute('data-plate')];
    if (!p || !p.src) { el.hidden = true; return; }
    var img = document.createElement('img');
    img.src = '../' + p.src; img.alt = p.alt || ''; img.loading = 'lazy';
    if (p.w) img.width = p.w; if (p.h) img.height = p.h;
    el.appendChild(img);
    if (p.credit) { var c = document.createElement('figcaption'); c.textContent = p.credit; el.appendChild(c); }
    el.classList.add('plate');
  });
})();
