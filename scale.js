/* The scale instrument: one elevation of a square, drawn at five scales.
   A three year old (red, 95 cm) stands in it. The camera zooms in powers of ten,
   anchored on her feet, so at 1 : 10 000 she is too small to draw and at 1 : 1
   she is taller than the sheet. Everything is in metres; one CSS pixel is
   1/96 inch, so the ratios on the scale bar are true to the CSS inch. */
(function () {
  'use strict';
  var box = document.getElementById('scalebox');
  var cv = document.getElementById('scale-canvas');
  if (!box || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var view = cv.parentNode;
  var read = document.getElementById('scale-read');
  var barText = document.getElementById('sbar-text');
  var blocks = box.querySelector('.sbar-blocks');
  var radios = [].slice.call(box.querySelectorAll('input[name="sc"]'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PX_PER_M = 96 / 0.0254;                  // CSS pixels in a metre at 1 : 1

  var css = getComputedStyle(document.documentElement);
  function v(n) { return css.getPropertyValue(n).trim(); }
  var C = { field: v('--paper-deep'), hill: v('--tone'), town: v('--tone2'), ink: v('--ink'), ink2: v('--ink2'), red: v('--red'), paper: v('--paper') };

  var LINES = {
    10000: 'At 1 : 10 000 a three year old is a third of a pixel tall. The drawing cannot see her.',
    1000: 'At 1 : 1000 she is four pixels tall. A mark, not yet a person.',
    100: 'At 1 : 100 she is 36 pixels tall. She has a head and a place to stand.',
    10: 'At 1 : 10 she is 9.5 centimetres tall on this screen. Her eye level is a line you can draw.',
    1: 'At 1 : 1 she is 95 centimetres tall and no longer fits on the sheet. <a href="#observe">Scroll her full height</a>.'
  };

  /* ---------- the world, in metres; x = 0 at the child, y = 0 at the ground ---------- */
  var seed = 95;
  function rnd() { var t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  var town = [];
  (function () {
    var x = -4200;
    while (x < 4200) {
      var w = 11 + rnd() * 26, storeys = 2 + Math.floor(rnd() * rnd() * 9), gap = rnd() < 0.2 ? 6 + rnd() * 10 : 0;
      if (x + w < -24 || x > 30) town.push({ x: x, w: w, h: storeys * 3.1 + 0.6, n: storeys, bays: Math.max(2, Math.round(w / 3.4)) });
      x += w + gap;
    }
  })();
  var hills = [];
  (function () {
    for (var x = -9000; x <= 9000; x += 150) {
      hills.push([x, 90 + 70 * Math.sin(x / 1900 + 1) + 46 * Math.sin(x / 730 + 2.2) + 22 * Math.sin(x / 260)]);
    }
  })();

  var W = 1, H = 1, N = 10000, from = N, to = N, t0 = 0, dur = 0, raf = 0, touched = false, played = false;

  function size() {
    var r = view.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function person(X, Y, s, x, h, colour) {
    var r = h * 0.085, top = h - 2 * r - h * 0.035, wt = h * 0.27, wb = h * 0.14;
    ctx.fillStyle = colour;
    if (h * s < 1.2) return;                       // truthfully too small to draw
    ctx.beginPath(); ctx.arc(X(x), Y(h - r), Math.max(0.6, r * s), 0, 6.2832); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(X(x - wt / 2), Y(top)); ctx.lineTo(X(x + wt / 2), Y(top));
    ctx.lineTo(X(x + wb / 2), Y(0)); ctx.lineTo(X(x - wb / 2), Y(0)); ctx.closePath(); ctx.fill();
  }

  function draw() {
    var s = PX_PER_M / N, ox = W * 0.42, gy = Math.round(H * 0.8);
    function X(x) { return ox + x * s; }
    function Y(y) { return gy - y * s; }
    var lg = Math.log(N) / Math.LN10;
    ctx.fillStyle = C.field; ctx.fillRect(0, 0, W, H);

    // the hills behind the town: only a city drawing is wide enough to hold them
    var ha = Math.max(0, Math.min(1, (lg - 2.2) / 0.6));
    if (ha > 0) {
      ctx.globalAlpha = ha; ctx.fillStyle = C.hill; ctx.beginPath(); ctx.moveTo(X(hills[0][0]), gy);
      for (var i = 0; i < hills.length; i++) ctx.lineTo(X(hills[i][0]), Y(hills[i][1]));
      ctx.lineTo(X(hills[hills.length - 1][0]), gy); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }

    // the town, with the square left open around her
    for (var b = 0; b < town.length; b++) {
      var t = town[b], x0 = X(t.x), x1 = X(t.x + t.w);
      if (x1 < 0 || x0 > W) continue;
      ctx.fillStyle = C.town; ctx.fillRect(x0, Y(t.h), x1 - x0, t.h * s);
      if (s > 2.4) {                               // windows, once a storey is worth drawing
        ctx.fillStyle = C.field;
        var bw = t.w / t.bays;
        for (var f = 0; f < t.n; f++) for (var k = 0; k < t.bays; k++) {
          ctx.fillRect(X(t.x + k * bw + bw * 0.28), Y(f * 3.1 + 2.5), bw * 0.44 * s, 1.5 * s);
        }
      }
    }

    // the furniture of the square
    if (s > 1.5) {
      ctx.fillStyle = C.ink2; ctx.fillRect(X(7.8), Y(3), 0.4 * s, 3 * s);                      // a tree
      ctx.fillStyle = C.town; ctx.beginPath(); ctx.arc(X(8), Y(5.4), 3 * s, 0, 6.2832); ctx.fill();
      ctx.fillStyle = C.ink2;
      ctx.fillRect(X(-3.1), Y(0.6), 1.3 * s, 0.6 * s);                                          // a planter
      ctx.beginPath(); ctx.arc(X(-2.45), Y(0.95), 0.55 * s, 0, 6.2832); ctx.fill();
      ctx.fillRect(X(1.0), Y(0.45), 1.6 * s, 0.08 * s);                                         // a bench
      ctx.fillRect(X(1.08), Y(0.45), 0.08 * s, 0.45 * s); ctx.fillRect(X(2.44), Y(0.45), 0.08 * s, 0.45 * s);
      ctx.fillRect(X(2.5), Y(0.88), 0.07 * s, 0.88 * s);
    }
    person(X, Y, s, -0.62, 1.7, C.ink);
    person(X, Y, s, 0, 0.95, C.red);

    // the ground, cut through and filled
    ctx.fillStyle = C.ink; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = C.red; ctx.beginPath();                                                    // where she stands
    ctx.moveTo(ox, gy + 6); ctx.lineTo(ox + 7, gy + 18); ctx.lineTo(ox - 7, gy + 18); ctx.closePath(); ctx.fill();
  }

  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function label() {
    var bar = blocks.getBoundingClientRect().width, m = bar / PX_PER_M * N;       // what the bar stands for
    var nice = N >= 1000 ? Math.round(N / 10) * 10 : N >= 100 ? Math.round(N) : Math.round(N * 10) / 10;
    var len = m >= 10 ? fmt(m) + ' m' : m >= 1 ? (Math.round(m * 10) / 10) + ' m' : (Math.round(m * 1000) / 10) + ' cm';
    barText.textContent = len + ' at 1 : ' + (nice >= 10 ? fmt(nice) : nice);
  }

  function ease(k) { return k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2; }
  function tick(now) {
    raf = 0;
    var k = dur ? Math.min(1, (now - t0) / dur) : 1;
    N = Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * ease(k));     // zoom in powers, not in steps
    if (k >= 1) N = to;
    draw(); label();
    if (k < 1) raf = requestAnimationFrame(tick);
    else if (read) read.innerHTML = LINES[to];
  }
  function go(target, ms) {
    from = N; to = target;
    var decades = Math.abs(Math.log(from / to)) / Math.LN10;
    dur = reduce.matches ? 0 : (ms || 500 + 420 * decades);
    t0 = performance.now();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  radios.forEach(function (r, i) {
    r.parentNode.style.setProperty('--i', i);
    r.addEventListener('change', function () { touched = true; if (r.checked) go(+r.value); });
  });

  size(); draw(); label();
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); draw(); label(); }, 120); });

  /* The first time it is seen it starts close to her and pulls back to the city,
     so the visitor watches her disappear. After that the visitor holds the zoom. */
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || played) return;
      played = true; io.disconnect();
      if (touched) return;
      N = 10; draw(); label();
      setTimeout(function () { if (!touched) go(10000, 3400); }, 500);
    }, { threshold: 0.55 });
    io.observe(view);
  }
})();
