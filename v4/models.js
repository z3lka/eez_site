/* The skeletons, one per scale. Each is a plain list of lines in metres
   (x and y on the ground, z up), proportioned from Elif's own drawings and
   drawn as diagrams. To replace one with a real model, replace its lines.
   k: 'hair' thin, 'cut' heavy, 'red' the one thing to look at. */
(function () {
  'use strict';

  function M() { return { lines: [], labels: [], cz: 0 }; }
  function line(m, k, pts, g) { m.lines.push({ k: k, p: pts, g: g || 0 }); }
  function rect(m, k, x, y, z, w, d, g) { line(m, k, [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y, z]], g); }
  function box(m, k, x, y, z, w, d, h, g) {
    rect(m, k, x, y, z, w, d, g); rect(m, k, x, y, z + h, w, d, g);
    [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].forEach(function (c) { line(m, k, [[c[0], c[1], z], [c[0], c[1], z + h]], g); });
  }
  function ring(m, k, cx, cy, z, r, g, n, a0, a1) {
    var p = [], i; n = n || 28; a0 = a0 || 0; a1 = a1 === undefined ? Math.PI * 2 : a1;
    for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
    line(m, k, p, g);
  }
  /* upright rectangle on a wall running along x (at depth y) */
  function wallX(m, k, x, y, z, w, h) { line(m, k, [[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h], [x, y, z]]); }
  function wallY(m, k, x, y, z, d, h) { line(m, k, [[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h], [x, y, z]]); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }

  /* ── City: Zümrütevler as it stands. Footprints, streets and parks are
        OpenStreetMap data (city.js). The map records almost no heights here,
        so floors are estimated from each footprint: small sheds 1 to 2,
        apartment blocks 4 to 6, large halls 3. Lines are ordered outward
        from the square, so the drawing grows from it. ── */
  var city = M();
  (function () {
    var D = window.CITY || { b: [], r: [], g: [] }, FL = 3;
    function poly(a, from, z) { var p = [], i; for (i = from; i < a.length; i += 2) p.push([a[i], a[i + 1], z]); return p; }
    D.r.forEach(function (r) { line(city, r[0] ? 'cut' : 'hair', poly(r, 1, 0)); });
    D.g.forEach(function (g) { line(city, 'hair', poly(g, 0, 0)); });
    D.b.forEach(function (b, n) {
      var area = b[1], lv = b[0] || (area < 70 ? 1 + n % 2 : area > 650 ? 3 : 4 + (n * 7) % 3), h = lv * FL;
      var base = poly(b, 2, 0), top = poly(b, 2, h), near = Math.abs(b[2]) < 75 && Math.abs(b[3]) < 75, i, step;
      if (near) line(city, 'hair', base);
      line(city, near ? 'cut' : 'hair', top);
      step = Math.max(1, Math.round((base.length - 1) / (near ? 8 : 4)));
      for (i = 0; i < base.length - 1; i += step) line(city, 'hair', [base[i], top[i]]);
    });
    ring(city, 'red', 0, -4, 0, 13, 0, 24);                  /* about 550 m², the size of the square */
    ring(city, 'red', 0, -4, 0, 26, 0, 32);
    line(city, 'red', [[0, -4, 0], [0, -4, 60]]);
    city.labels.push({ t: 'Zümrütevler Square', at: [0, -4, 60], k: 'red' });
    city.cz = 8;
  })();

  /* ── Building: towers on a plinth with a pedestrian spine (after the
        Mersin Yenişehir Park site plan). About 190 m across. ── */
  var building = M();
  (function () {
    var b = building, z, i;
    line(b, 'hair', [[-95, -70, 0], [70, -78, 0], [96, -40, 0], [92, 66, 0], [-60, 76, 0], [-96, 40, 0], [-95, -70, 0]]);
    box(b, 'cut', -70, -52, 0, 124, 56, 6);
    box(b, 'cut', -62, -46, 6, 30, 28, 96);
    for (z = 6 + 3.2; z < 102; z += 3.2) rect(b, 'hair', -62, -46, z, 30, 28);
    box(b, 'cut', -4, -44, 6, 30, 28, 77);
    for (z = 6 + 3.2; z < 83; z += 3.2) rect(b, 'hair', -4, -44, z, 30, 28);
    box(b, 'cut', -78, 28, 0, 64, 20, 22);
    for (z = 3.6; z < 22; z += 3.6) rect(b, 'hair', -78, 28, z, 64, 20);
    for (i = 0; i <= 8; i++) {                               /* the arched hall */
      var y = 14 + i * 5, p = [], a;
      for (a = 0; a <= 12; a++) p.push([44 + 17 * Math.cos(Math.PI * a / 12), y, 17 * Math.sin(Math.PI * a / 12)]);
      line(b, 'hair', p);
    }
    line(b, 'hair', [[44, 14, 17], [44, 54, 17]]);
    line(b, 'red', [[-92, 14, 0], [-40, 16, 0], [-6, 4, 0], [26, 8, 0], [60, -2, 0], [94, 6, 0]]);
    line(b, 'red', [[-92, 20, 0], [-40, 22, 0], [-6, 10, 0], [26, 14, 0], [60, 4, 0], [94, 12, 0]]);
    b.labels.push({ t: 'pedestrian spine', at: [94, 9, 0], k: 'red' }, { t: 'site 28,313 m²', at: [-95, -70, 0], left: true });
    b.cz = 42;
  })();

  /* ── Room: a long bar room, counter and stools (after the Ramen Bar plan
        and elevations). About 11 m long. ── */
  var room = M();
  (function () {
    var r = room, W = 5.8, L = 11.2, H = 3.3, i, y;
    rect(r, 'cut', -W / 2, -L / 2, 0, W, L);
    rect(r, 'hair', -W / 2, -L / 2, H, W, L);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { line(r, 'cut', [[c[0] * W / 2, c[1] * L / 2, 0], [c[0] * W / 2, c[1] * L / 2, H]]); });
    for (i = 0; i < 3; i++) {                                 /* tall windows on the long wall */
      y = -L / 2 + 1.2 + i * 3.3;
      wallY(r, 'hair', -W / 2, y, 0.8, 1.7, 2.1);
      line(r, 'hair', [[-W / 2, y + 0.85, 0.8], [-W / 2, y + 0.85, 2.9]]);
      line(r, 'hair', [[-W / 2, y, 1.85], [-W / 2, y + 1.7, 1.85]]);
    }
    wallX(r, 'hair', -0.9, -L / 2, 0, 1.8, 2.5);              /* double door */
    line(r, 'hair', [[0, -L / 2, 0], [0, -L / 2, 2.5]]);
    box(r, 'cut', 1.0, -3.6, 0, 0.75, 7.6, 1.05);             /* the counter */
    rect(r, 'red', 0.9, -3.7, 1.08, 0.95, 7.8);
    box(r, 'hair', W / 2 - 0.45, -3.6, 0, 0.45, 7.6, 0.9);    /* back counter and shelves */
    [1.6, 2.0, 2.4].forEach(function (z) { rect(r, 'hair', W / 2 - 0.35, -3.6, z, 0.35, 7.6); });
    for (i = 0; i < 7; i++) {                                 /* seven stools */
      y = -3.1 + i * 1.08;
      ring(r, 'cut', 0.45, y, 0.74, 0.17, 0, 14);
      ring(r, 'hair', 0.45, y, 0.28, 0.2, 0, 14);
      [0, 1, 2, 3].forEach(function (q) { var a = Math.PI / 4 + q * Math.PI / 2; line(r, 'hair', [[0.45 + 0.13 * Math.cos(a), y + 0.13 * Math.sin(a), 0.74], [0.45 + 0.22 * Math.cos(a), y + 0.22 * Math.sin(a), 0]]); });
    }
    for (i = 0; i < 4; i++) {                                 /* tables by the windows */
      y = -4.2 + i * 2.5;
      rect(r, 'cut', -W / 2 + 0.25, y, 0.74, 0.75, 1.2);
      [[0.1, 0.1], [0.65, 0.1], [0.65, 1.1], [0.1, 1.1]].forEach(function (c) { line(r, 'hair', [[-W / 2 + 0.25 + c[0], y + c[1], 0.74], [-W / 2 + 0.25 + c[0], y + c[1], 0]]); });
      box(r, 'hair', -W / 2 + 1.15, y + 0.1, 0, 0.42, 0.42, 0.45);
      box(r, 'hair', -W / 2 + 1.15, y + 0.68, 0, 0.42, 0.42, 0.45);
    }
    r.labels.push({ t: 'counter', at: [1.85, 4.1, 1.08], k: 'red' });
    r.cz = 1.3;
  })();

  /* ── Object: one bar stool, taken apart, next to a 95 cm line. ── */
  var object = M();
  (function () {
    var o = object, i, a;
    o.ex = [0, 0, 0.1, 0.26, 0.44];                          /* how far each part lifts when exploded */
    [0, 1, 2, 3].forEach(function (q) {
      a = Math.PI / 4 + q * Math.PI / 2;
      var tx = 0.125 * Math.cos(a), ty = 0.125 * Math.sin(a), bx = 0.215 * Math.cos(a), by = 0.215 * Math.sin(a);
      line(o, 'cut', [[tx, ty, 0.7], [bx, by, 0]], 1);
      line(o, 'hair', [[tx + 0.012, ty, 0.7], [bx + 0.012, by, 0]], 1);
      ring(o, 'hair', bx, by, 0, 0.014, 1, 8);
    });
    ring(o, 'cut', 0, 0, 0.26, 0.182, 2);                    /* footrest */
    ring(o, 'hair', 0, 0, 0.275, 0.182, 2);
    ring(o, 'cut', 0, 0, 0.7, 0.18, 3);                      /* seat plate and cushion */
    ring(o, 'cut', 0, 0, 0.745, 0.185, 3);
    ring(o, 'hair', 0, 0, 0.76, 0.15, 3);
    for (i = 0; i < 8; i++) { a = i * Math.PI / 4; line(o, 'hair', [[0.18 * Math.cos(a), 0.18 * Math.sin(a), 0.7], [0.185 * Math.cos(a), 0.185 * Math.sin(a), 0.745]], 3); }
    ring(o, 'cut', 0, 0, 0.93, 0.185, 4, 14, Math.PI * 0.15, Math.PI * 0.85);   /* low back */
    ring(o, 'hair', 0, 0, 0.87, 0.185, 4, 14, Math.PI * 0.15, Math.PI * 0.85);
    [0.15, 0.85].forEach(function (t) { a = Math.PI * t; line(o, 'cut', [[0.185 * Math.cos(a), 0.185 * Math.sin(a), 0.745], [0.185 * Math.cos(a), 0.185 * Math.sin(a), 0.93]], 4); });
    ring(o, 'hair', 0, 0, 0, 0.3, 0, 30);                    /* floor mark */
    line(o, 'red', [[0.42, -0.1, 0], [0.42, -0.1, 0.95]]);
    for (i = 0; i <= 9; i++) line(o, 'red', [[0.42, -0.1, i * 0.1], [0.42 + (i % 5 ? 0.02 : 0.04), -0.1, i * 0.1]]);
    line(o, 'red', [[0.38, -0.1, 0.95], [0.5, -0.1, 0.95]]);
    o.labels.push({ t: '95 cm', at: [0.5, -0.1, 0.95], k: 'red' });
    o.cz = 0.56;
  })();

  /* ── Body: a phone at true size beside a centimetre rule. ── */
  var body = M();
  (function () {
    var b = body, w = 0.0715, h = 0.147, d = 0.008, i;
    box(b, 'cut', -w / 2, 0, 0, w, d, h);
    wallX(b, 'hair', -w / 2 + 0.003, 0, 0.003, w - 0.006, h - 0.006);
    wallX(b, 'hair', -0.012, 0, h - 0.0105, 0.024, 0.0045);
    wallX(b, 'red', -0.0006, 0, h / 2 - 0.0006, 0.0012, 0.0012);
    line(b, 'red', [[-w / 2 - 0.012, 0, 0], [-w / 2 - 0.012, 0, 0.15]]);
    for (i = 0; i <= 15; i++) line(b, 'red', [[-w / 2 - 0.012, 0, i * 0.01], [-w / 2 - 0.012 - (i % 5 ? 0.003 : 0.006), 0, i * 0.01]]);
    b.labels.push({ t: '15 cm', at: [-w / 2 - 0.018, 0, 0.15], k: 'red', left: true }, { t: 'one pixel', at: [0.0006, 0, h / 2], k: 'red' });
    b.cz = h / 2;
  })();

  /* ── Pixel: the screen's grid, each pixel three sub-pixels. 55 µm pitch. ── */
  var pixel = M();
  (function () {
    var p = pixel, s = 0.000055, nx = 13, nz = 17, i, j, x, z, q, red;
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      x = (i - nx / 2) * s; z = (j - nz / 2) * s; red = i === 6 && j === 8;
      for (q = 0; q < 3; q++) wallX(p, red ? 'red' : 'hair', x + s * (0.1 + q * 0.28), 0, z + s * 0.12, s * 0.2, s * 0.76);
      if (red) wallX(p, 'red', x, 0, z, s, s);
    }
    wallX(p, 'cut', -nx / 2 * s, 0, -nz / 2 * s, nx * s, nz * s);
    p.labels.push({ t: '55 µm', at: [0.5 * s, 0, 0.5 * s], k: 'red' });
    p.cz = 0;
  })();

  window.MODELS = { city: city, building: building, room: room, object: object, body: body, pixel: pixel };
})();
