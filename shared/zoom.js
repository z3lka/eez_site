/* Pictures open large. A click (or Enter) lifts the picture off the page and
   grows it from where it sits to fill the window, in its original colours.
   A click anywhere, the Close button or Escape sends it back to its place. */
(function () {
  'use strict';
  var imgs = [].slice.call(document.querySelectorAll('.fig img'));
  if (!imgs.length || !window.HTMLDialogElement) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  imgs.forEach(function (img) {
    img.setAttribute('data-zoom', '');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge picture: ' + img.alt);
  });

  var dlg = document.createElement('dialog');
  dlg.className = 'zoom';
  dlg.setAttribute('aria-label', 'Picture, enlarged');
  dlg.innerHTML = '<img class="zoom-img" alt=""><p class="zoom-cap"></p><button type="button" class="zoom-x">Close</button>';
  document.body.appendChild(dlg);
  var big = dlg.querySelector('.zoom-img'), cap = dlg.querySelector('.zoom-cap');
  var from = null, closing = false, timer = 0, box = { x: 0, y: 0, w: 1, h: 1 };

  /* the largest the picture can sit in the window, under the Close button and above its caption */
  function place() {
    var vw = dlg.clientWidth, vh = dlg.clientHeight, pad = vw < 600 ? 12 : 40, top = 60;
    var capH = cap.textContent ? 48 : 0;
    var nw = from.naturalWidth || +from.getAttribute('width') || from.width;
    var nh = from.naturalHeight || +from.getAttribute('height') || from.height;
    var k = Math.min((vw - pad * 2) / nw, (vh - top - pad - capH) / nh, 1.5);
    box.w = nw * k; box.h = nh * k;
    box.x = (vw - box.w) / 2; box.y = top + (vh - top - pad - capH - box.h) / 2;
    big.style.left = box.x + 'px'; big.style.top = box.y + 'px';
    big.style.width = box.w + 'px'; big.style.height = box.h + 'px';
    cap.style.left = box.x + 'px'; cap.style.top = (box.y + box.h + 10) + 'px'; cap.style.width = box.w + 'px';
  }
  /* the transform that puts the large picture exactly over the small one */
  function home() {
    var r = from.getBoundingClientRect();
    return 'translate(' + (r.left - box.x) + 'px,' + (r.top - box.y) + 'px) scale(' + (r.width / box.w) + ',' + (r.height / box.h) + ')';
  }

  function open(img) {
    if (dlg.open) return;
    from = img; closing = false; clearTimeout(timer);
    big.src = img.currentSrc || img.src; big.alt = img.alt;
    var fc = img.closest('figure').querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : '';
    dlg.showModal();
    place();
    if (!reduce.matches) { big.style.transition = 'none'; big.style.transform = home(); }
    big.getBoundingClientRect();                       /* commit the starting position */
    big.style.transition = ''; big.style.transform = '';
    from.style.visibility = 'hidden';
    dlg.classList.add('open');
  }
  function close() {
    if (closing || !dlg.open) return;
    closing = true;
    dlg.classList.remove('open');
    if (!reduce.matches) big.style.transform = home();
    timer = setTimeout(function () { dlg.close(); }, reduce.matches ? 0 : 290);
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('img[data-zoom]');
    if (img) open(img);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('img[data-zoom]')) { e.preventDefault(); open(e.target); }
  });
  dlg.addEventListener('click', close);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('close', function () {
    clearTimeout(timer); closing = false; dlg.classList.remove('open');
    big.style.transform = '';
    if (from) { from.style.visibility = ''; from.focus({ preventScroll: true }); }
  });
  /* the page stays put underneath while a picture is open */
  dlg.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
  dlg.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', function () { if (dlg.open && !closing) place(); });
})();
