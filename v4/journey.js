/* Scroll position drives one camera: the globe turns to each place, then each
   stop zooms into the next. The scale readout and the scale bar are computed
   from what is actually drawn (at 96 CSS px to the inch), so they stay true. */
(function () {
  'use strict';
  var canvas = document.getElementById('wire');
  if (!canvas || !window.WIRE || !window.MODELS) return;
  var ctx = canvas.getContext('2d');
  var stage = canvas.parentNode;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PX_PER_M = 96 / 0.0254;                    /* CSS pixels in a metre of screen */
  var EARTH = 6371000;

  /* extent in metres; fit is the share of the short side it fills */
  var SCENES = [
    { globe: true, zoom: 26 },
    { m: MODELS.city, extent: 900, fit: 0.94, n: 10000, zin: 4, az: 38, turn: 26, el: 32, zoom: 7 },
    { m: MODELS.building, extent: 210, fit: 0.82, n: 1000, az: 30, turn: 30, el: 26, zoom: 7 },
    { m: MODELS.room, extent: 12.5, fit: 0.86, n: 50, az: 52, turn: -28, el: 30, zoom: 6 },
    { m: MODELS.object, extent: 1.3, fit: 0.9, n: 5, az: 24, turn: 40, el: 20, zoom: 5, explode: true },
    { m: MODELS.body, extent: 0.2, fit: 0.9, n: 1, az: -24, turn: 24, el: 8, zoom: 30 },
    { m: MODELS.pixel, extent: 0.0011, fit: 0.84, az: 0, turn: 0, el: 0, zoom: 1 }
  ];

  var stops = [].slice.call(document.querySelectorAll('[data-stop]'));
  var places = [].slice.call(document.querySelectorAll('[data-place]')).map(function (el) {
    var v = el.getAttribute('data-place').split(',');
    return { el: el, lon: +v[0], lat: +v[1], name: v.slice(2).join(',').trim() };
  });
  var dots = [];
  places.forEach(function (p) { if (p.name && !dots.some(function (d) { return d.name === p.name; })) dots.push({ lon: p.lon, lat: p.lat, name: p.name }); });

  var hud = {
    stop: document.getElementById('hud-stop'), n: document.getElementById('hud-n'),
    bar: document.getElementById('hud-bar'), len: document.getElementById('hud-len'),
    place: document.getElementById('hud-place')
  };
  var ladder = [].slice.call(document.querySelectorAll('.ladder a'));

  var W = 0, H = 0, dpr = 1;
  var P = 0, p = 0;                              /* target and shown position along the stops */
  var lon = 8, lat = 34, tLon = 8, tLat = 34;    /* shown and target globe centre */
  var U = [], us = [], active = null, intro = 0, raf = 0, last = 0, shown = {};

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  function size() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    WIRE.colours();
  }

  function measure() {
    var vh = window.innerHeight, mid = vh * 0.5, i, r, t;
    P = 0;
    for (i = 0; i < stops.length; i++) {
      r = stops[i].getBoundingClientRect();
      if (i > 0) P += clamp((vh * 0.95 - r.top) / (vh * 0.6), 0, 1);
      U[i] = clamp((mid - r.top) / Math.max(1, r.height), 0, 1);
    }
    active = null;
    for (i = 0; i < places.length; i++) {
      r = places[i].el.getBoundingClientRect();
      if (r.top <= mid) active = places[i]; else break;
    }
    if (active) { tLon = active.lon; tLat = active.lat; }
  }

  function basePpm(i) {
    var s = SCENES[i], short = Math.min(W, H) * (W < 520 ? 0.88 : 1);
    if (s.globe) return (short * 0.37) / EARTH;
    var fit = (s.fit * short) / s.extent;
    var ppm = s.n ? Math.min(fit, PX_PER_M / s.n) : fit;
    /* some stops move closer once you have arrived and started reading */
    return s.zin ? ppm * (1 + (s.zin - 1) * smooth(((us[i] || 0) - 0.03) / 0.1)) : ppm;   /* never larger than the sheet scale */
  }

  function fmtScale(n) {
    function sig(v) { var e = Math.pow(10, Math.floor(Math.log(v) / Math.LN10) - 1); return Math.round(v / e) * e; }
    function sp(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    if (n >= 1.05) return '1 : ' + sp(sig(n));
    if (n > 0.95) return '1 : 1';
    return sp(sig(1 / n)) + ' : 1';
  }
  function fmtLen(m) {
    if (m >= 1000) return m / 1000 + ' km';
    if (m >= 1) return m + ' m';
    if (m >= 0.01) return Math.round(m * 100) + ' cm';
    if (m >= 0.001) return Math.round(m * 1000) + ' mm';
    return Math.round(m * 1e6) + ' µm';
  }
  function set(key, el, v) { if (el && shown[key] !== v) { shown[key] = v; el.textContent = v; } }

  function draw() {
    var i = Math.min(SCENES.length - 2, Math.floor(p)), t = clamp(p - i, 0, 1), e = smooth(t);
    var cx = W / 2, cy = H * (W < 520 ? 0.57 : 0.54), k, s, a, z, f, ppm;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    for (k = i; k <= i + 1; k++) {
      s = SCENES[k];
      if (k === i) { z = Math.pow(s.zoom, e); a = 1 - smooth(t * 1.5); f = 1; }
      else { z = Math.pow(SCENES[i].zoom, e - 1); a = smooth((t - 0.12) / 0.7); f = reduce.matches ? 1 : clamp(t * 1.25, 0, 1); }
      if (a <= 0.01) continue;
      ppm = basePpm(k) * z;
      if (s.globe) {
        WIRE.globe(ctx, {
          cx: cx, cy: cy, R: ppm * EARTH, lon: lon, lat: lat, alpha: a * intro, w: W, h: H, back: t < 0.25,
          places: dots.map(function (d) { return { lon: d.lon, lat: d.lat, on: !!active && active.name === d.name }; })
        });
      } else {
        WIRE.model(ctx, s.m, {
          cx: cx, cy: cy, ppm: ppm, az: s.az + s.turn * (us[k] || 0), el: s.el, alpha: a, f: f,
          explode: s.explode ? smooth(((us[k] || 0) - 0.12) / 0.5) : 0
        });
      }
    }

    /* the locator: a small globe that keeps saying where on Earth this is */
    var la = clamp(p * 2 - 0.9, 0, 1);
    if (la > 0.01) {
      var r = W < 520 ? 22 : 34;
      WIRE.globe(ctx, { cx: W - r - 22, cy: H - r - 22, R: r, lon: lon, lat: lat, alpha: la, w: W, h: H, places: active && active.name ? [{ lon: active.lon, lat: active.lat, on: false }] : [] });
    }

    /* readout */
    var now = Math.exp(Math.log(basePpm(i)) * (1 - e) + Math.log(basePpm(i + 1)) * e);
    var series = [1, 2, 5], want = 96 / now, exp = Math.floor(Math.log(want) / Math.LN10), best = 0, q, v;
    for (q = exp - 1; q <= exp + 1; q++) series.forEach(function (sv) { v = sv * Math.pow(10, q); if (v * now <= 132 && v > best) best = v; });
    set('n', hud.n, fmtScale(PX_PER_M / now));
    set('len', hud.len, fmtLen(+best.toPrecision(1)));
    if (hud.bar) hud.bar.style.width = (best * now).toFixed(1) + 'px';
    var cur = Math.round(p);
    set('stop', hud.stop, stops[cur] ? stops[cur].getAttribute('data-stop') : '');
    set('place', hud.place, active && active.name ? active.name : '');
    if (shown.cur !== cur) {
      shown.cur = cur;
      ladder.forEach(function (aEl, n) { if (n === cur) aEl.setAttribute('aria-current', 'true'); else aEl.removeAttribute('aria-current'); });
    }
  }

  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var snap = reduce.matches, kf = snap ? 1 : 1 - Math.exp(-dt * 9), kg = snap ? 1 : 1 - Math.exp(-dt * 3.2);
    var d = ((tLon - lon + 540) % 360) - 180;
    var moving = false;
    U.forEach(function (u, n) { var c = us[n] || 0; us[n] = c + (u - c) * kf; if (Math.abs(u - c) > 0.0008) moving = true; });
    p += (P - p) * kf; lon += d * kg; lat += (tLat - lat) * kg;
    intro += (1 - intro) * (snap ? 1 : 1 - Math.exp(-dt * 2.5));
    draw();
    if (moving || Math.abs(P - p) > 0.0005 || Math.abs(d) > 0.02 || Math.abs(tLat - lat) > 0.02 || intro < 0.995) kick();
    else { p = P; }
  }
  function kick() { if (!raf) { raf = requestAnimationFrame(frame); } }
  function onScroll() { measure(); kick(); }

  size(); measure(); us = U.slice(); p = P; lon = tLon; lat = tLat;
  last = performance.now(); kick();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { size(); onScroll(); });
  window.addEventListener('load', onScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { size(); onScroll(); });
})();
