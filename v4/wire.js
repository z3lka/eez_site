/* The drawing engine for v4: a see-through globe and wireframe models on one
   2D canvas. Two line weights and one red, the same hand as shared/drawings.css.
   No library: a globe is an orthographic projection, a model is an axonometric one. */
(function () {
  'use strict';
  var D2R = Math.PI / 180;
  var C = { ink: '#191813', red: '#B3341F', mono: 'monospace' };

  function colours() {
    var s = getComputedStyle(document.documentElement);
    C.ink = s.getPropertyValue('--ink').trim() || C.ink;
    C.red = s.getPropertyValue('--red').trim() || C.red;
    C.mono = s.getPropertyValue('--mono').trim() || C.mono;
  }

  /* graticule: meridians and parallels every 30 degrees, as flat [lon,lat,...] lines */
  var GRAT = (function () {
    var out = [], lon, lat, l;
    for (lon = -180; lon < 180; lon += 30) { l = []; for (lat = -85; lat <= 85; lat += 5) l.push(lon, lat); out.push(l); }
    for (lat = -60; lat <= 60; lat += 30) { l = []; for (lon = -180; lon <= 180; lon += 5) l.push(lon, lat); out.push(l); }
    return out;
  })();

  /* o: { cx, cy, R, lon, lat, alpha, w, h, back, places: [{lon, lat, on}] } */
  function globe(ctx, o) {
    var a = o.alpha;
    if (a <= 0.01) return;
    var l0 = o.lon * D2R, p0 = o.lat * D2R, sp = Math.sin(p0), cp = Math.cos(p0);
    var R = o.R, cx = o.cx, cy = o.cy, W = o.w, H = o.h, back = o.back !== false;

    function proj(lon, lat) {
      var l = lon * D2R - l0, p = lat * D2R, c = Math.cos(p), s = Math.sin(p), cl = Math.cos(l);
      return [cx + R * c * Math.sin(l), cy - R * (cp * s - sp * c * cl), sp * s + cp * c * cl];
    }
    function off(q) { return q[0] < -40 || q[0] > W + 40 || q[1] < -40 || q[1] > H + 40; }
    function draw(set, width, fa, ba) {
      var F = new Path2D(), B = new Path2D(), i, j, line, prev, q;
      for (i = 0; i < set.length; i++) {
        line = set[i]; prev = null;
        for (j = 0; j < line.length; j += 2) {
          q = proj(line[j], line[j + 1]);
          if (prev && !(off(prev) && off(q))) {
            if (prev[2] > 0 && q[2] > 0) { F.moveTo(prev[0], prev[1]); F.lineTo(q[0], q[1]); }
            else if (back && prev[2] <= 0 && q[2] <= 0) { B.moveTo(prev[0], prev[1]); B.lineTo(q[0], q[1]); }
          }
          prev = q;
        }
      }
      ctx.strokeStyle = C.ink; ctx.lineWidth = width;
      if (back) { ctx.globalAlpha = a * ba; ctx.stroke(B); }
      ctx.globalAlpha = a * fa; ctx.stroke(F);
    }

    if (R >= 60) draw(GRAT, 0.6, 0.34, 0.12);
    draw(window.LAND || [], R < 60 ? 0.7 : 1.3, 1, R < 60 ? 0 : 0.22);
    ctx.globalAlpha = a; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    (o.places || []).forEach(function (pl) {
      var q = proj(pl.lon, pl.lat);
      if (q[2] <= 0.02) return;
      ctx.globalAlpha = a; ctx.fillStyle = C.red; ctx.strokeStyle = C.red;
      ctx.beginPath(); ctx.arc(q[0], q[1], pl.on ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
      if (pl.on) { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q[0], q[1], 10, 0, Math.PI * 2); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  }

  /* m: { lines: [{p: [[x,y,z],...], k: 'hair'|'cut'|'red', g}], labels, cz, ex }
     o: { cx, cy, ppm, az, el, alpha, f (drawn fraction 0..1), explode } */
  function model(ctx, m, o) {
    var a = o.alpha;
    if (a <= 0.01) return;
    var ca = Math.cos(o.az * D2R), sa = Math.sin(o.az * D2R), ce = Math.cos(o.el * D2R), se = Math.sin(o.el * D2R);
    var ppm = o.ppm, cx = o.cx, cy = o.cy, ex = o.explode || 0, n = m.lines.length, f = o.f;

    function P(p, g) {
      var z = p[2] - m.cz + (m.ex ? ex * (m.ex[g || 0] || 0) : 0);
      return [cx + ppm * (p[0] * ca - p[1] * sa), cy - ppm * ((p[0] * sa + p[1] * ca) * se + z * ce)];
    }
    ['hair', 'cut', 'red'].forEach(function (k) {
      var i, j, L, pi, pts, segs, q, r, fr;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        L = m.lines[i];
        if (L.k !== k) continue;
        pi = f >= 1 ? 1 : Math.max(0, Math.min(1, (f * 1.35 * n - i) / (0.35 * n)));
        if (pi <= 0) continue;
        pts = L.p; segs = (pts.length - 1) * pi;
        q = P(pts[0], L.g); ctx.moveTo(q[0], q[1]);
        for (j = 1; j < pts.length; j++) {
          r = P(pts[j], L.g);
          if (j <= segs) { ctx.lineTo(r[0], r[1]); q = r; }
          else { fr = segs - (j - 1); if (fr > 0) ctx.lineTo(q[0] + (r[0] - q[0]) * fr, q[1] + (r[1] - q[1]) * fr); break; }
        }
      }
      ctx.strokeStyle = k === 'red' ? C.red : C.ink;
      ctx.lineWidth = k === 'cut' ? 1.3 : k === 'red' ? 1.5 : 0.6;
      ctx.globalAlpha = a * (k === 'hair' ? 0.75 : 1);
      ctx.stroke();
    });

    if (m.labels && f > 0.8) {
      ctx.font = '11px ' + C.mono; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = a * Math.min(1, (f - 0.8) / 0.2);
      m.labels.forEach(function (lb) {
        var q = P(lb.at, lb.g);
        ctx.fillStyle = lb.k === 'red' ? C.red : C.ink;
        ctx.textAlign = lb.left ? 'right' : 'left';
        ctx.fillText(lb.t, q[0] + (lb.left ? -8 : 8), q[1] - 6);
      });
    }
    ctx.globalAlpha = 1;
  }

  window.WIRE = { globe: globe, model: model, colours: colours };
})();
