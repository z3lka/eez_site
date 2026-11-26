/* Tree of Life: seven iterations, each one removes something.
   Iteration 1 is the first brief: maximum particle density, restless.
   From review 4 the trunk has weight (30% more thickness below the first fork).
   Review 7 takes 40% of the leaf particles away and the canopy breathes slowly. */
(function () {
  'use strict';
  var fig = document.getElementById('tree');
  var cv = document.getElementById('tree-canvas');
  if (!fig || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var range = document.getElementById('iter'), out = document.getElementById('iter-n'), note = document.getElementById('iter-note');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var COUNT = [1500, 1240, 1020, 860, 700, 560, 336];          // the last step is the 40% cut
  var SPEED = [3.4, 2.8, 2.2, 1.7, 1.3, 1.0, 0.55];            // radians a second: quieter, slower
  var JITTER = [2.6, 2.0, 1.5, 1.1, 0.7, 0.4, 0.15];           // restlessness, in pixels
  var NOTES = {
    1: 'First draft. Maximum particle density. Rejected after first review.',
    4: 'Review 4. The trunk needs weight: 30% more branch thickness below the first fork.',
    7: 'Review 7. Leaf particles reduced by 40%. Let it breathe.'
  };
  var BETWEEN = 'Each iteration removed something.';

  var seed = 7;
  function rnd() { var t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / 2; }

  /* ---------- grow the tree once, in a unit square ---------- */
  var segs = [], tips = [];
  function grow(x, y, a, len, w, depth) {
    var bend = (rnd() - 0.5) * 0.25;
    var x1 = x + Math.sin(a + bend) * len, y1 = y - Math.cos(a + bend) * len;
    segs.push({ x0: x, y0: y, x1: x1, y1: y1, w: w, d: depth });
    if (depth >= 3) tips.push({ x: x1, y: y1, d: depth });
    if (depth === 6) return;
    var spread = 0.42 + rnd() * 0.22;
    grow(x1, y1, a - spread, len * (0.7 + rnd() * 0.1), w * 0.66, depth + 1);
    grow(x1, y1, a + spread * (0.8 + rnd() * 0.4), len * (0.7 + rnd() * 0.1), w * 0.66, depth + 1);
    if (depth > 0 && depth < 4 && rnd() < 0.5) grow(x1, y1, a + (rnd() - 0.5) * 0.3, len * 0.62, w * 0.5, depth + 1);
  }
  grow(0.5, 0.97, 0, 0.21, 0.02, 0);

  var leaves = [];
  for (var i = 0; i < COUNT[0]; i++) {
    var t = tips[Math.floor(rnd() * tips.length)], spread = 0.016 + 0.022 * rnd();
    leaves.push({
      x: t.x + gauss() * spread * 2.2, y: t.y + gauss() * spread * 1.7,
      r: 0.8 + rnd() * 1.5, ph: rnd() * 6.2832, a: 0, rank: i
    });
  }
  // shuffle ranks so each cut thins the whole canopy evenly
  for (var j = leaves.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), tmp = leaves[j].rank; leaves[j].rank = leaves[k].rank; leaves[k].rank = tmp; }

  var W = 1, H = 1, it = 7, weight = 1.3, raf = 0, visible = false, last = 0, touched = false, played = false, timer = 0;

  function size() {
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    var t = now / 1000, n = COUNT[it - 1], sp = SPEED[it - 1], jit = JITTER[it - 1];
    var target = it >= 4 ? 1.3 : 1;
    weight += (target - weight) * Math.min(1, dt * 4);
    var S = Math.min(W, H * 1.02), offx = (W - S) / 2, offy = H - S;
    ctx.clearRect(0, 0, W, H);

    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(232,228,218,0.5)';
    for (var s = 0; s < segs.length; s++) {
      var g = segs[s];
      ctx.lineWidth = Math.max(0.6, g.w * S * (g.d === 0 ? weight : 1));
      ctx.beginPath(); ctx.moveTo(offx + g.x0 * S, offy + g.y0 * S); ctx.lineTo(offx + g.x1 * S, offy + g.y1 * S); ctx.stroke();
    }

    var moving = Math.abs(target - weight) > 0.002;
    ctx.fillStyle = '#E8E4DA';
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i], want = l.rank < n ? 1 : 0;
      if (l.a !== want) { l.a += (want - l.a) * Math.min(1, dt * 5); if (Math.abs(want - l.a) < 0.01) l.a = want; else moving = true; }
      if (l.a <= 0) continue;
      // the breath travels up through the canopy; early drafts only flicker
      var breath = 0.5 + 0.5 * Math.sin(t * sp + l.ph * (it < 5 ? 1 : 0.25) - l.y * 5);
      var x = offx + l.x * S + Math.sin(t * sp * 1.7 + l.ph) * jit, y = offy + l.y * S + Math.cos(t * sp * 1.3 + l.ph * 2) * jit;
      ctx.globalAlpha = l.a * (0.22 + 0.7 * breath);
      ctx.beginPath(); ctx.arc(x, y, l.r * (0.8 + 0.3 * breath), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (visible && !document.hidden && (!reduce.matches || moving)) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function set(n) {
    it = Math.max(1, Math.min(7, n));
    if (range) range.value = it;
    if (out) out.textContent = it;
    if (note) note.textContent = NOTES[it] || BETWEEN;
    wake();
  }
  if (range) {
    range.addEventListener('input', function () { touched = true; clearTimeout(timer); set(+range.value); });
    range.addEventListener('pointerdown', function () { touched = true; clearTimeout(timer); });
  }

  size(); weight = 1.3; leaves.forEach(function (l) { l.a = l.rank < COUNT[6] ? 1 : 0; });
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); wake(); }, 120); });
  document.addEventListener('visibilitychange', wake);

  /* Seen for the first time, it plays the seven iterations through once. */
  function play(n) {
    if (touched) return;
    set(n);
    if (n < 7) timer = setTimeout(function () { play(n + 1); }, n === 1 ? 1500 : 950);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (!visible) return;
      wake();
      if (!played && es[0].intersectionRatio > 0.5) {
        played = true;
        if (!reduce.matches && !touched) { leaves.forEach(function (l) { l.a = 1; }); weight = 1; play(1); }
      }
    }, { threshold: [0, 0.55] }).observe(cv);
  } else { visible = true; wake(); }
})();
