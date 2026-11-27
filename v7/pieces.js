/* One piece per project: the part of it you would recognise, as a skeleton.
   Same format as ../v4/models.js: lines in metres (x and y on the ground,
   z up), k: 'hair' thin, 'cut' heavy, 'red' the one thing to look at.
   They are diagrams made from the project texts and pictures, not survey
   drawings. To replace one with a real model, replace its lines.
   Each entry: { m, extent (metres across), n (sheet scale), az, turn, el }. */
(function () {
  'use strict';
  var PI = Math.PI;

  function M() { return { lines: [], labels: [], cz: 0 }; }
  function line(m, k, pts, g) { m.lines.push({ k: k, p: pts, g: g || 0 }); }
  function rect(m, k, x, y, z, w, d, g) { line(m, k, [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y, z]], g); }
  function box(m, k, x, y, z, w, d, h, g) {
    rect(m, k, x, y, z, w, d, g); rect(m, k, x, y, z + h, w, d, g);
    [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].forEach(function (c) { line(m, k, [[c[0], c[1], z], [c[0], c[1], z + h]], g); });
  }
  /* flat ellipse (a circle when b is left out) */
  function ring(m, k, cx, cy, z, a, g, n, a0, a1, b) {
    var p = [], i, t; n = n || 28; a0 = a0 || 0; a1 = a1 === undefined ? PI * 2 : a1; b = b || a;
    for (i = 0; i <= n; i++) { t = a0 + (a1 - a0) * i / n; p.push([cx + a * Math.cos(t), cy + b * Math.sin(t), z]); }
    line(m, k, p, g);
  }
  /* upright circle or arc, standing in the plane turned `ang` from the x axis */
  function hoop(m, k, cx, cy, cz, r, ang, g, n, a0, a1) {
    var p = [], i, t, c = Math.cos(ang || 0), s = Math.sin(ang || 0); n = n || 24; a0 = a0 || 0; a1 = a1 === undefined ? PI * 2 : a1;
    for (i = 0; i <= n; i++) { t = a0 + (a1 - a0) * i / n; p.push([cx + r * Math.cos(t) * c, cy + r * Math.cos(t) * s, cz + r * Math.sin(t)]); }
    line(m, k, p, g);
  }
  function wallX(m, k, x, y, z, w, h, g) { line(m, k, [[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h], [x, y, z]], g); }
  function wallY(m, k, x, y, z, d, h, g) { line(m, k, [[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h], [x, y, z]], g); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
  /* a measuring rule standing at x, y */
  function rule(m, x, y, h, step) {
    var i, n = Math.round(h / step);
    line(m, 'red', [[x, y, 0], [x, y, h]]);
    for (i = 0; i <= n; i++) line(m, 'red', [[x, y, i * step], [x + step * (i % 5 ? 0.2 : 0.4), y, i * step]]);
  }
  function stool(m, x, y) {
    ring(m, 'cut', x, y, 0.74, 0.17, 0, 14);
    ring(m, 'hair', x, y, 0.28, 0.2, 0, 14);
    [0, 1, 2, 3].forEach(function (q) { var a = PI / 4 + q * PI / 2; line(m, 'hair', [[x + 0.13 * Math.cos(a), y + 0.13 * Math.sin(a), 0.74], [x + 0.22 * Math.cos(a), y + 0.22 * Math.sin(a), 0]]); });
  }

  var P = {};

  /* ── Urban95: a planter with a tree, a bench that can be moved, paint on the
        asphalt, and the height the square was measured from. ── */
  (function () {
    var m = M(), i;
    ring(m, 'hair', 0, 0, 0, 2.3, 0, 36);                         /* paint */
    ring(m, 'hair', 1.5, -1.3, 0, 0.55, 0, 16);
    ring(m, 'hair', -1.6, -1.0, 0, 0.4, 0, 14);
    ring(m, 'hair', -0.4, -1.8, 0, 0.3, 0, 12);
    box(m, 'cut', -0.6, 0.2, 0, 1.2, 1.2, 0.55);                  /* planter */
    rect(m, 'hair', -0.5, 0.3, 0.55, 1.0, 1.0);
    line(m, 'cut', [[0, 0.8, 0.55], [0, 0.8, 2.2]]);              /* tree */
    [[2.2, 0.55], [2.6, 0.95], [3.0, 0.8], [3.35, 0.4]].forEach(function (c) { ring(m, 'hair', 0, 0.8, c[0], c[1], 0, 18); });
    for (i = 0; i < 4; i++) hoop(m, 'hair', 0, 0.8, 2.75, 0.75, i * PI / 4, 0, 18);
    box(m, 'cut', 0.9, -0.5, 0.38, 1.5, 0.42, 0.05);              /* bench */
    [[1.0, -0.42], [2.3, -0.42], [2.3, -0.16], [1.0, -0.16]].forEach(function (c) { line(m, 'hair', [[c[0], c[1], 0], [c[0], c[1], 0.38]]); });
    rule(m, -1.7, -1.9, 0.95, 0.1);
    line(m, 'red', [[-1.82, -1.9, 0.95], [-1.5, -1.9, 0.95]]);
    m.labels.push({ t: '95 cm', at: [-1.82, -1.9, 0.95], k: 'red', left: true });
    m.cz = 1.6;
    P.urban95 = { m: m, extent: 5.2, n: 20, az: 28, turn: 34, el: 22 };
  })();

  /* ── HOP: a tent of rope and fabric, a cardboard tunnel, hoops. ── */
  (function () {
    var m = M(), i;
    rect(m, 'hair', -1.0, -0.8, 0, 2.0, 1.6);                     /* tent */
    line(m, 'cut', [[-1.0, 0, 1.25], [1.0, 0, 1.25]]);
    [-1.0, 1.0].forEach(function (x) { line(m, 'cut', [[x, -0.8, 0], [x, 0, 1.25], [x, 0.8, 0]]); });
    for (i = 1; i < 5; i++) line(m, 'hair', [[-1.0 + i * 0.4, -0.8, 0], [-1.0 + i * 0.4, 0, 1.25], [-1.0 + i * 0.4, 0.8, 0]]);
    line(m, 'hair', [[-1.0, 0, 1.25], [-1.9, 0, 0]]); line(m, 'hair', [[1.0, 0, 1.25], [1.9, 0, 0]]);   /* guy ropes */
    for (i = 0; i < 3; i++) box(m, i === 1 ? 'hair' : 'cut', -0.35 + i * 0.02, 1.4 + i * 0.78, 0, 0.7, 0.75, 0.7);   /* tunnel of boxes */
    ring(m, 'hair', 1.7, -1.3, 0, 0.4, 0, 18); ring(m, 'hair', 2.2, -0.7, 0, 0.4, 0, 18); ring(m, 'hair', -1.9, -1.4, 0, 0.4, 0, 18);
    hoop(m, 'red', 1.9, 1.3, 0.4, 0.4, PI * 0.3, 0, 22);          /* one hoop, rolling */
    m.labels.push({ t: 'cardboard, rope, fabric, tape', at: [1.9, 0, 0] });
    m.cz = 0.55;
    P.hop = { m: m, extent: 5.6, n: 20, az: 34, turn: 30, el: 26 };
  })();

  /* ── Intersect: the land wall, and a light roof leaning on it. ── */
  (function () {
    var m = M(), i, x;
    box(m, 'cut', -14, 4, 0, 28, 3, 9);                           /* wall */
    box(m, 'cut', -3.5, 2.5, 0, 7, 6, 13);                        /* tower */
    for (i = 0; i < 7; i++) { rect(m, 'hair', -13.5 + i * 4, 4, 9, 2, 0.8); line(m, 'hair', [[-13.5 + i * 4, 4, 9], [-13.5 + i * 4, 4, 10], [-11.5 + i * 4, 4, 10], [-11.5 + i * 4, 4, 9]]); }
    for (i = 0; i < 8; i++) {                                     /* frames */
      x = -12.6 + i * 3.6;
      line(m, 'hair', [[x, -6, 0], [x, -6, 4.2], [x, 4, 6.6]]);
      line(m, 'hair', [[x, -1, 0], [x, -1, 5.4]]);
    }
    [[-6, 4.2], [-3.5, 4.8], [-1, 5.4], [1.5, 6.0]].forEach(function (c) { line(m, 'hair', [[-12.6, c[0], c[1]], [12.6, c[0], c[1]]]); });
    line(m, 'red', [[-12.6, -6, 4.2], [12.6, -6, 4.2], [12.6, 4, 6.6], [-12.6, 4, 6.6], [-12.6, -6, 4.2]]);
    for (i = 0; i < 6; i++) rect(m, 'hair', -12 + i * 4.2, -12, 0, 3.2, 4);   /* market gardens */
    m.labels.push({ t: 'one roof', at: [12.6, -6, 4.2], k: 'red' }, { t: 'land wall', at: [-14, 7, 9], left: true });
    m.cz = 5;
    P.intersect = { m: m, extent: 36, n: 200, az: 32, turn: 26, el: 24 };
  })();

  /* ── Argenteuil: courtyard blocks, and routes from the river through them. ── */
  (function () {
    var m = M(), i, x, p, q;
    function court(x, y, w, d, h, t) {
      box(m, 'cut', x, y, 0, w, d, h);
      rect(m, 'hair', x + t, y + t, h, w - 2 * t, d - 2 * t); rect(m, 'hair', x + t, y + t, 0, w - 2 * t, d - 2 * t);
      [[x + t, y + t], [x + w - t, y + t], [x + w - t, y + d - t], [x + t, y + d - t]].forEach(function (c) { line(m, 'hair', [[c[0], c[1], 0], [c[0], c[1], h]]); });
    }
    court(-72, -8, 40, 34, 15, 10); court(-20, -8, 40, 34, 18, 10); court(32, -8, 40, 34, 12, 10);
    court(-46, 40, 40, 26, 9, 9); court(6, 40, 40, 26, 12, 9);
    p = []; q = [];
    for (i = 0; i <= 24; i++) { x = -84 + i * 7; p.push([x, -30 + 3 * Math.sin(i * 0.5), 0]); q.push([x, -44 + 3 * Math.sin(i * 0.5 + 0.6), 0]); }
    line(m, 'hair', p); line(m, 'hair', q);                       /* the Seine */
    line(m, 'red', [[-26, -22, 0], [-26, 33, 0], [26, 33, 0], [26, -22, 0]]);
    line(m, 'red', [[-80, -22, 0], [80, -22, 0]]);
    line(m, 'red', [[0, 33, 0], [0, 70, 0]]);
    m.labels.push({ t: 'river to courtyard', at: [80, -22, 0], k: 'red' });
    m.cz = 6;
    P.argenteuil = { m: m, extent: 185, n: 1000, az: 24, turn: 28, el: 32 };
  })();

  /* ── Yenişehir Park: one tower floor, eight flats around the core. ── */
  (function () {
    var m = M(), W = 30, D = 28, H = 3.2, f, z, g;
    m.ex = [0, 5.5];
    for (f = 0; f < 2; f++) {
      z = f * H; g = f;
      rect(m, 'cut', -W / 2, -D / 2, z, W, D, g);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { line(m, 'cut', [[c[0] * W / 2, c[1] * D / 2, z], [c[0] * W / 2, c[1] * D / 2, z + H]], g); });
      box(m, f ? 'red' : 'cut', -4, -3.5, z, 8, 7, H, g);          /* core */
      [[-4, -3.5, -W / 2, -D / 2], [4, -3.5, W / 2, -D / 2], [4, 3.5, W / 2, D / 2], [-4, 3.5, -W / 2, D / 2],
       [0, -3.5, 0, -D / 2], [0, 3.5, 0, D / 2], [-4, 0, -W / 2, 0], [4, 0, W / 2, 0]].forEach(function (c) {
        line(m, 'hair', [[c[0], c[1], z], [c[2], c[3], z], [c[2], c[3], z + H], [c[0], c[1], z + H]], g);
      });
      [[-12, -D / 2 - 1.6, 9, 1.6], [3, -D / 2 - 1.6, 9, 1.6], [-12, D / 2, 9, 1.6], [3, D / 2, 9, 1.6]].forEach(function (c) { box(m, 'hair', c[0], c[1], z, c[2], c[3], 1.1, g); });   /* balconies */
    }
    rect(m, 'hair', -W / 2, -D / 2, 2 * H, W, D, 1);
    m.labels.push({ t: 'core', at: [4, -3.5, 2 * H], k: 'red', g: 1 }, { t: '2+1 and 3+1', at: [-W / 2, -D / 2, 0], left: true });
    m.cz = 5;
    P.mersin = { m: m, extent: 44, n: 200, az: 30, turn: 28, el: 34, explode: true };
  })();

  /* ── Toulouse Business School: an open ground floor, rooms stacked above,
        an auditorium, and the terraces between them. ── */
  (function () {
    var m = M(), i, j;
    for (i = 0; i < 5; i++) for (j = 0; j < 3; j++) line(m, 'hair', [[-20 + i * 10, -13 + j * 13, 0], [-20 + i * 10, -13 + j * 13, 5]]);
    rect(m, 'hair', -22, -15, 0, 44, 30);
    rect(m, 'cut', -22, -15, 5, 44, 30);
    box(m, 'cut', -22, -15, 5, 24, 30, 9);                        /* classrooms */
    for (i = 1; i < 3; i++) rect(m, 'hair', -22, -15, 5 + i * 3, 24, 30);
    box(m, 'hair', 2, -15, 5, 20, 30, 4.5);
    rect(m, 'red', 2, -15, 9.5, 20, 30);                          /* terrace */
    for (i = 0; i < 5; i++) line(m, 'red', [[2 + i * 0.9, -4, 9.5 + i * 0.9], [2 + i * 0.9, 4, 9.5 + i * 0.9]]);
    box(m, 'cut', -14, -12, 14, 34, 24, 8);                       /* auditorium, reaching out over the terrace */
    for (i = 0; i < 7; i++) line(m, 'hair', [[-10 + i * 3.6, -12, 14.6 + i * 0.75], [-10 + i * 3.6, 12, 14.6 + i * 0.75]]);
    rect(m, 'red', -14, -12, 22, 34, 24);
    m.labels.push({ t: 'terraces', at: [22, -15, 9.5], k: 'red' }, { t: 'auditorium', at: [-14, -12, 22], left: true });
    m.cz = 11;
    P.toulouse = { m: m, extent: 58, n: 500, az: 34, turn: 28, el: 24 };
  })();

  /* ── Housing in Hamam: a dome with its lights, set against the quarry. ── */
  (function () {
    var m = M(), i, a, r = 5.2;
    [-15, 15].forEach(function (x) { line(m, 'cut', [[x, 7, 0], [x, 7, 5], [x, 11, 5], [x, 11, 10], [x, 15, 10], [x, 15, 15]]); });   /* quarry benches */
    [[7, 0], [7, 5], [11, 5], [11, 10], [15, 10], [15, 15]].forEach(function (c, n) { line(m, n % 2 ? 'cut' : 'hair', [[-15, c[0], c[1]], [15, c[0], c[1]]]); });
    for (i = 0; i < 9; i++) line(m, 'hair', [[-13 + i * 3.3, 7, 0.4], [-13.6 + i * 3.3, 7, 4.6]]);
    box(m, 'cut', -6, -6, 0, 12, 12, 3.6);                        /* hot room */
    ring(m, 'cut', 0, 0, 3.6, r, 0, 32);
    ring(m, 'hair', 0, 0, 3.6 + r * 0.5, r * 0.866, 0, 28);
    ring(m, 'hair', 0, 0, 3.6 + r * 0.8, r * 0.6, 0, 24);
    for (i = 0; i < 4; i++) hoop(m, 'hair', 0, 0, 3.6, r, i * PI / 4, 0, 20, 0, PI);
    for (i = 0; i < 8; i++) { a = i * PI / 4 + 0.2; ring(m, 'red', r * 0.72 * Math.cos(a), r * 0.72 * Math.sin(a), 3.6 + r * 0.69, 0.32, 0, 8); }   /* star lights */
    ring(m, 'red', 0, 0, 3.6 + r, 0.5, 0, 10);
    box(m, 'hair', -14, -5, 0, 7, 6, 3); box(m, 'hair', 7, -5, 0, 7, 6, 3);   /* rooms to stay */
    rect(m, 'hair', -2.2, -11, 0, 4.4, 4);                        /* pool */
    rect(m, 'hair', -1.8, -10.6, -0.5, 3.6, 3.2);
    m.labels.push({ t: 'hamam', at: [0.5, 0, 3.6 + r], k: 'red' }, { t: 'quarry wall', at: [15, 15, 15] });
    m.cz = 6.5;
    P.hamam = { m: m, extent: 36, n: 200, az: 28, turn: 30, el: 24 };
  })();

  /* ── Opening ceremony: the stadium bowl and the drones above it. ── */
  (function () {
    var m = M(), i, a, T = [[52, 34, 0], [62, 44, 5], [74, 56, 12], [86, 68, 20], [96, 78, 27]];
    rect(m, 'hair', -34, -22, 0, 68, 44); ring(m, 'hair', 0, 0, 0, 6, 0, 16); line(m, 'hair', [[0, -22, 0], [0, 22, 0]]);
    T.forEach(function (t, n) { ring(m, n === 0 || n === 4 ? 'cut' : 'hair', 0, 0, t[2], t[0], 0, 48, 0, PI * 2, t[1]); });
    for (i = 0; i < 28; i++) { a = i * PI / 14; line(m, 'hair', T.map(function (t) { return [t[0] * Math.cos(a), t[1] * Math.sin(a), t[2]]; })); }
    ring(m, 'cut', 0, 0, 31, 104, 0, 48, 0, PI * 2, 86);          /* roof edge */
    for (i = 0; i < 28; i++) { a = i * PI / 14; line(m, 'hair', [[96 * Math.cos(a), 78 * Math.sin(a), 27], [104 * Math.cos(a), 86 * Math.sin(a), 31], [84 * Math.cos(a), 66 * Math.sin(a), 33]]); }
    for (i = 0; i < 36; i++) {                                    /* drones, holding a ring */
      a = i * PI / 18;
      line(m, 'red', [[30 * Math.cos(a) - 1.4, 30 * Math.sin(a), 78], [30 * Math.cos(a) + 1.4, 30 * Math.sin(a), 78]]);
      if (i % 3 === 0) line(m, 'red', [[15 * Math.cos(a), 15 * Math.sin(a) - 1.4, 86], [15 * Math.cos(a), 15 * Math.sin(a) + 1.4, 86]]);
    }
    m.labels.push({ t: 'drone show', at: [30, 0, 78], k: 'red' });
    m.cz = 34;
    P.konya = { m: m, extent: 230, n: 2000, az: 20, turn: 30, el: 28 };
  })();

  /* ── Hope Alkazar: the court on the roof. ── */
  (function () {
    var m = M(), i, a;
    rect(m, 'cut', -3.6, -1.2, 0, 7.2, 6.4);                      /* half court */
    rect(m, 'hair', -1.8, -1.2, 0, 3.6, 4.6);
    ring(m, 'hair', 0, 3.4, 0, 1.8, 0, 24);
    ring(m, 'hair', 0, 0, 0, 3.3, 0, 24, PI * 0.08, PI * 0.92);
    line(m, 'cut', [[0, -2.0, 0], [0, -2.0, 3.2], [0, -1.0, 3.6]]);    /* post and arm */
    line(m, 'hair', [[0.1, -2.0, 0], [0.1, -2.0, 3.2], [0.1, -1.0, 3.6]]);
    wallX(m, 'cut', -0.9, -1.0, 2.9, 1.8, 1.05);                  /* backboard */
    wallX(m, 'hair', -0.3, -1.0, 3.05, 0.6, 0.45);
    ring(m, 'red', 0, -0.6, 3.05, 0.23, 0, 18);                   /* rim and net */
    ring(m, 'hair', 0, -0.6, 2.65, 0.13, 0, 12);
    for (i = 0; i < 8; i++) { a = i * PI / 4; line(m, 'hair', [[0.23 * Math.cos(a), -0.6 + 0.23 * Math.sin(a), 3.05], [0.13 * Math.cos(a + 0.4), -0.6 + 0.13 * Math.sin(a + 0.4), 2.65]]); }
    line(m, 'red', [[-0.23, -0.6, 3.05], [-0.9, -0.6, 3.05]]);
    rect(m, 'hair', -4.6, -2.6, 0, 9.2, 8.6);                     /* parapet */
    rect(m, 'hair', -4.6, -2.6, 1.1, 9.2, 8.6);
    [[-4.6, -2.6], [4.6, -2.6], [4.6, 6.0], [-4.6, 6.0]].forEach(function (c) { line(m, 'hair', [[c[0], c[1], 0], [c[0], c[1], 1.1]]); });
    m.labels.push({ t: 'rooftop court', at: [-0.9, -0.6, 3.05], k: 'red', left: true });
    m.cz = 1.7;
    P.hope = { m: m, extent: 11, n: 50, az: 30, turn: 30, el: 26 };
  })();

  /* ── Ramen Bar: a length of the counter, a bowl, a lamp, two stools. ── */
  (function () {
    var m = M(), i, a;
    box(m, 'cut', -1.3, 0, 0, 2.6, 0.7, 1.05);
    rect(m, 'red', -1.4, -0.1, 1.08, 2.8, 0.9);
    line(m, 'hair', [[-1.3, 0, 0.2], [1.3, 0, 0.2]]);             /* foot rail */
    ring(m, 'cut', -0.35, 0.3, 1.2, 0.12, 0, 16);                 /* bowl */
    ring(m, 'hair', -0.35, 0.3, 1.1, 0.05, 0, 10);
    for (i = 0; i < 6; i++) { a = i * PI / 3; line(m, 'hair', [[-0.35 + 0.12 * Math.cos(a), 0.3 + 0.12 * Math.sin(a), 1.2], [-0.35 + 0.05 * Math.cos(a), 0.3 + 0.05 * Math.sin(a), 1.1]]); }
    line(m, 'hair', [[-0.52, 0.22, 1.21], [-0.16, 0.34, 1.21]]); line(m, 'hair', [[-0.52, 0.25, 1.21], [-0.16, 0.37, 1.21]]);   /* chopsticks */
    [-0.35, 0.75].forEach(function (x) {                          /* lamps */
      line(m, 'hair', [[x, 0.3, 2.7], [x, 0.3, 1.95]]);
      ring(m, 'hair', x, 0.3, 1.95, 0.03, 0, 8); ring(m, 'cut', x, 0.3, 1.72, 0.19, 0, 16);
      for (i = 0; i < 4; i++) { a = i * PI / 2; line(m, 'hair', [[x + 0.03 * Math.cos(a), 0.3 + 0.03 * Math.sin(a), 1.95], [x + 0.19 * Math.cos(a), 0.3 + 0.19 * Math.sin(a), 1.72]]); }
    });
    stool(m, -0.55, -0.5); stool(m, 0.55, -0.5);
    m.labels.push({ t: 'one counter', at: [1.4, -0.1, 1.08], k: 'red' });
    m.cz = 1.25;
    P.ramen = { m: m, extent: 3.6, n: 20, az: 30, turn: 34, el: 20 };
  })();

  /* ── Towards to City: three runs of display wall and the walk between them. ── */
  (function () {
    var m = M(), i;
    rect(m, 'cut', -12, -6, 0, 24, 12);
    [[-12, -6], [12, -6], [12, 6], [-12, 6]].forEach(function (c) { line(m, 'hair', [[c[0], c[1], 0], [c[0], c[1], 4.5]]); });
    rect(m, 'hair', -12, -6, 4.5, 24, 12);
    [[-9, -6, 1], [-1, 6, -1], [7, -6, 1]].forEach(function (w) {
      var x = w[0], y0 = w[1], s = w[2];
      box(m, 'cut', x, s > 0 ? y0 : y0 - 8, 0, 0.3, 8, 2.8);
      for (i = 0; i < 4; i++) { wallY(m, 'hair', x - 0.02, (s > 0 ? y0 : y0 - 8) + 0.6 + i * 1.85, 1.1, 1.3, 1.0); wallY(m, 'hair', x + 0.32, (s > 0 ? y0 : y0 - 8) + 0.6 + i * 1.85, 1.1, 1.3, 1.0); }
    });
    line(m, 'red', [[-12, -3, 0], [-10.5, -3, 0], [-10.5, 4, 0], [-5, 4, 0], [-5, -4, 0], [3, -4, 0], [3, 4, 0], [10, 4, 0], [10, -3, 0], [12, -3, 0]]);
    line(m, 'red', [[11.3, -3.5, 0], [12, -3, 0], [11.3, -2.5, 0]]);
    m.labels.push({ t: 'walking route', at: [12, -3, 0], k: 'red' });
    m.cz = 1.6;
    P.towards = { m: m, extent: 27, n: 200, az: 28, turn: 26, el: 34 };
  })();

  /* ── When Symphony Meets Digital Arts: the orchestra, and projectors that
        take the hall as their screen. ── */
  (function () {
    var m = M(), i, a;
    rect(m, 'cut', -9, -5, 0, 18, 11);                            /* stage */
    wallX(m, 'cut', -9, 6, 0, 18, 9);                             /* back wall */
    wallY(m, 'hair', -9, -5, 0, 11, 9); wallY(m, 'hair', 9, -5, 0, 11, 9);
    [2.2, 3.6, 5.0, 6.4].forEach(function (r, n) {                /* desks in arcs */
      ring(m, 'hair', 0, -3.5, 0.1, r, 0, 20, PI * 0.08, PI * 0.92);
      for (i = 0; i <= 5 + n * 2; i++) { a = PI * 0.08 + PI * 0.84 * i / (5 + n * 2); line(m, 'hair', [[r * Math.cos(a), -3.5 + r * Math.sin(a), 0.1], [r * Math.cos(a), -3.5 + r * Math.sin(a), 1.1]]); }
    });
    box(m, 'cut', -0.6, -4.3, 0, 1.2, 1.0, 0.25);                 /* conductor */
    line(m, 'cut', [[0, -3.8, 0.25], [0, -3.8, 1.9]]);
    box(m, 'red', -0.5, -15.6, 7.2, 1.0, 1.2, 0.6);                /* a projector, and its throw */
    [[-9, 0], [9, 0], [9, 9], [-9, 9]].forEach(function (c) { line(m, 'red', [[0, -15, 7.5], [c[0], 6, c[1]]]); });
    wallX(m, 'red', -9, 5.95, 0, 18, 9);
    m.labels.push({ t: 'forty projectors', at: [0.5, -15, 7.8], k: 'red' }, { t: 'seventy players', at: [-9, -5, 0], left: true });
    m.cz = 4;
    P.symphony = { m: m, extent: 28, n: 200, az: 24, turn: 24, el: 22 };
  })();

  /* ── Lucky Cat: a curved banquette, its table, the globes above. ── */
  (function () {
    var m = M(), i, a, a0 = PI * 0.12, a1 = PI * 0.88, R = rng(7);
    ring(m, 'cut', 0, 0, 0.45, 1.35, 0, 24, a0, a1); ring(m, 'cut', 0, 0, 0.45, 1.85, 0, 24, a0, a1);
    ring(m, 'hair', 0, 0, 0, 1.35, 0, 24, a0, a1); ring(m, 'hair', 0, 0, 0, 1.95, 0, 24, a0, a1);
    ring(m, 'cut', 0, 0, 1.0, 1.95, 0, 24, a0, a1); ring(m, 'hair', 0, 0, 1.0, 1.82, 0, 24, a0, a1);
    for (i = 0; i <= 8; i++) {
      a = a0 + (a1 - a0) * i / 8;
      line(m, i % 8 ? 'hair' : 'cut', [[1.35 * Math.cos(a), 1.35 * Math.sin(a), 0], [1.35 * Math.cos(a), 1.35 * Math.sin(a), 0.45], [1.85 * Math.cos(a), 1.85 * Math.sin(a), 0.45], [1.95 * Math.cos(a), 1.95 * Math.sin(a), 1.0], [1.95 * Math.cos(a), 1.95 * Math.sin(a), 0]]);
    }
    ring(m, 'red', 0, 0.55, 0.74, 0.55, 0, 22);                   /* table */
    ring(m, 'hair', 0, 0.55, 0.7, 0.55, 0, 22);
    line(m, 'cut', [[0, 0.55, 0.7], [0, 0.55, 0.03]]); ring(m, 'hair', 0, 0.55, 0.03, 0.26, 0, 14);
    for (i = 0; i < 9; i++) {                                     /* globe lights */
      var gx = -1.5 + (i % 3) * 1.5 + (R() - 0.5) * 0.5, gy = -0.3 + Math.floor(i / 3) * 0.9 + (R() - 0.5) * 0.4, gz = 2.15 + R() * 0.45, gr = 0.13 + R() * 0.07;
      line(m, 'hair', [[gx, gy, 2.95], [gx, gy, gz + gr]]);
      ring(m, 'hair', gx, gy, gz, gr, 0, 12); hoop(m, 'hair', gx, gy, gz, gr, 0, 0, 12); hoop(m, 'hair', gx, gy, gz, gr, PI / 2, 0, 12);
    }
    m.labels.push({ t: 'made to drawing', at: [0.55, 0.55, 0.74], k: 'red' });
    m.cz = 1.35;
    P.lucky = { m: m, extent: 4.6, n: 20, az: -62, turn: 34, el: 22 };
  })();

  /* ── Mikroçark: the vessel taken apart: hull ring, deck, cabin, roof. ── */
  (function () {
    var m = M(), i, a;
    m.ex = [0, 0, 0.55, 1.15, 1.95];
    ring(m, 'hair', 0, 0, 0.15, 3.3, 0, 36); ring(m, 'hair', 0, 0, 0.15, 3.9, 0, 40);   /* water */
    ring(m, 'red', 0, 0, 0.6, 2.45, 1, 36);                       /* hull ring */
    ring(m, 'cut', 0, 0, 0, 2.0, 1, 30); ring(m, 'cut', 0, 0, 0.3, 2.5, 1, 36); ring(m, 'hair', 0, 0, 0.6, 2.1, 1, 30);
    for (i = 0; i < 16; i++) { a = i * PI / 8; line(m, 'hair', [[2.0 * Math.cos(a), 2.0 * Math.sin(a), 0], [2.5 * Math.cos(a), 2.5 * Math.sin(a), 0.3], [2.45 * Math.cos(a), 2.45 * Math.sin(a), 0.6], [2.1 * Math.cos(a), 2.1 * Math.sin(a), 0.6]], 1); }
    ring(m, 'cut', 0, 0, 0.65, 2.05, 2, 30);                      /* deck */
    for (i = 0; i < 8; i++) { a = i * PI / 4; line(m, 'hair', [[0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.65], [2.05 * Math.cos(a), 2.05 * Math.sin(a), 0.65]], 2); }
    ring(m, 'hair', 0, 0, 0.65, 0.5, 2, 14);
    ring(m, 'cut', 0, 0, 0.7, 1.5, 3, 26); ring(m, 'cut', 0, 0, 2.0, 1.5, 3, 26);   /* cabin */
    ring(m, 'hair', 0, 0, 1.15, 1.5, 3, 26);
    for (i = 0; i < 10; i++) { a = i * PI / 5; line(m, 'hair', [[1.5 * Math.cos(a), 1.5 * Math.sin(a), 0.7], [1.5 * Math.cos(a), 1.5 * Math.sin(a), 2.0]], 3); }
    ring(m, 'cut', 0, 0, 2.05, 1.75, 4, 28);                      /* roof */
    ring(m, 'hair', 0, 0, 2.3, 1.1, 4, 20);
    for (i = 0; i < 4; i++) hoop(m, 'hair', 0, 0, 2.05, 1.75, i * PI / 4, 4, 16, 0, PI);
    m.labels.push({ t: 'hull ring', at: [2.45, 0, 0.6], k: 'red', g: 1 });
    m.cz = 1.9;
    P.mikrocark = { m: m, extent: 8.6, n: 50, az: 20, turn: 40, el: 22, explode: true };
  })();

  /* ── Art Tower: the monument, and a dancer as motion capture sees her. ── */
  (function () {
    var m = M(), i, y = -1.32, S = 5.2, Z = 2.4;
    box(m, 'hair', -2.4, -2.4, 0, 4.8, 4.8, 0.5);
    box(m, 'cut', -1.3, -1.3, 0.5, 2.6, 2.6, 9.5);
    for (i = 1; i < 10; i++) rect(m, 'hair', -1.3, -1.3, 0.5 + i * 0.95, 2.6, 2.6);
    var J = { head: [0.03, 0.93], neck: [0, 0.85], sl: [-0.1, 0.83], sr: [0.11, 0.82], el: [-0.2, 0.97], hl: [-0.17, 1.12], er: [0.24, 0.8], hr: [0.38, 0.86],
              hip: [0.01, 0.52], kl: [0, 0.27], fl: [0.01, 0], kr: [0.2, 0.47], fr: [0.4, 0.56] };
    function at(k) { return [J[k][0] * S * 0.55, y, Z + J[k][1] * S]; }
    [['neck', 'hip'], ['sl', 'neck', 'sr'], ['sl', 'el', 'hl'], ['sr', 'er', 'hr'], ['hip', 'kl', 'fl'], ['hip', 'kr', 'fr']].forEach(function (b) { line(m, 'red', b.map(at)); });
    hoop(m, 'red', J.head[0] * S * 0.55, y, Z + J.head[1] * S, 0.3, 0, 0, 14);
    Object.keys(J).forEach(function (k) { if (k !== 'head') hoop(m, 'red', at(k)[0], y, at(k)[2], 0.09, 0, 0, 6); });   /* markers */
    m.labels.push({ t: 'motion capture', at: at('hr'), k: 'red' });
    m.cz = 5;
    P.tower = { m: m, extent: 12.5, n: 100, az: 18, turn: 22, el: 12 };
  })();

  /* ── Tree of Life: a tree that grows into the ceiling. ── */
  (function () {
    var m = M(), R = rng(41), i;
    function grow(p, d, len, depth, a0) {
      var q = [p[0] + d[0] * len, p[1] + d[1] * len, Math.min(4.15, p[2] + d[2] * len)], j, a, n, s;
      line(m, depth > 3 ? 'cut' : depth === 2 && R() < 0.25 ? 'red' : 'hair', [p, q]);
      if (!depth) return;
      for (j = 0; j < 3; j++) {
        a = a0 + j * PI * 2 / 3 + (R() - 0.5) * 0.9; s = 0.62 + (4 - depth) * 0.16;
        n = [d[0] * 0.55 + Math.cos(a) * s, d[1] * 0.55 + Math.sin(a) * s, Math.max(0.05, d[2] * 0.7 - 0.05)];
        var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
        grow(q, [n[0] / l, n[1] / l, n[2] / l], len * 0.8, depth - 1, a + 0.5);
      }
    }
    grow([0, 0, 0], [0, 0, 1], 2.1, 4, 0.3);
    line(m, 'cut', [[0.09, 0, 0], [0.07, 0, 2.1]]); line(m, 'cut', [[-0.09, 0, 0], [-0.07, 0, 2.1]]);
    ring(m, 'hair', 0, 0, 0, 0.5, 0, 16);
    ring(m, 'hair', 0, 0, 4.2, 4.2, 0, 40);                       /* ceiling */
    for (i = 0; i < 2; i++) ring(m, 'hair', 0, 0, i * 2.6, 4.9, 0, 36, PI * 0.25, PI * 1.75);   /* the 270 degree screen */
    for (i = 0; i <= 12; i++) { var a = PI * 0.25 + PI * 1.5 * i / 12; line(m, 'hair', [[4.9 * Math.cos(a), 4.9 * Math.sin(a), 0], [4.9 * Math.cos(a), 4.9 * Math.sin(a), 2.6]]); }
    m.labels.push({ t: '270° screen', at: [4.9 * Math.cos(PI * 1.75), 4.9 * Math.sin(PI * 1.75), 0] });
    m.cz = 2.2;
    P.tree = { m: m, extent: 10.5, n: 50, az: 100, turn: 36, el: 16 };
  })();

  /* ── The Little Prince: a planet the size of a house, a rose under glass. ── */
  (function () {
    var m = M(), i, r = 1.15, R = rng(11);
    [-0.6, 0, 0.6].forEach(function (t) { ring(m, t ? 'hair' : 'cut', 0, 0, r * Math.sin(t), r * Math.cos(t), 0, 28); });
    for (i = 0; i < 4; i++) hoop(m, 'hair', 0, 0, 0, r, i * PI / 4, 0, 28);
    line(m, 'red', [[0.3, 0, 1.11], [0.3, 0, 1.42]]);             /* the rose */
    ring(m, 'red', 0.3, 0, 1.44, 0.06, 0, 8); ring(m, 'red', 0.3, 0, 1.48, 0.035, 0, 6);
    line(m, 'red', [[0.3, 0, 1.25], [0.37, 0.02, 1.3]]);
    ring(m, 'hair', 0.3, 0, 1.11, 0.2, 0, 14);                    /* glass */
    hoop(m, 'hair', 0.3, 0, 1.38, 0.2, 0, 0, 12, 0, PI); hoop(m, 'hair', 0.3, 0, 1.38, 0.2, PI / 2, 0, 12, 0, PI);
    line(m, 'hair', [[0.1, 0, 1.11], [0.1, 0, 1.38]]); line(m, 'hair', [[0.5, 0, 1.11], [0.5, 0, 1.38]]);
    line(m, 'cut', [[-0.42, 0.1, 1.07], [-0.42, 0.1, 1.62]]);     /* the prince, and his scarf */
    hoop(m, 'cut', -0.42, 0.1, 1.72, 0.1, 0.4, 0, 12);
    line(m, 'hair', [[-0.42, 0.1, 1.58], [-0.7, 0.16, 1.66], [-0.92, 0.2, 1.58]]);
    line(m, 'hair', [[-0.42, 0.1, 1.5], [-0.27, 0.05, 1.36]]); line(m, 'hair', [[-0.42, 0.1, 1.5], [-0.56, 0.16, 1.34]]);
    ring(m, 'hair', -0.1, -0.75, 0.86, 0.16, 0, 10); ring(m, 'hair', -0.1, -0.8, 1.02, 0.06, 0, 8);   /* a volcano */
    ring(m, 'hair', 0, 0, 0, 1.9, 0, 40, 0, PI * 2, 1.5);         /* its orbit */
    for (i = 0; i < 9; i++) {                                     /* stars */
      var sx = (R() - 0.5) * 4.4, sy = (R() - 0.5) * 3, sz = 1.3 + R() * 1.3, s = 0.05 + R() * 0.05;
      line(m, 'hair', [[sx - s, sy, sz], [sx + s, sy, sz]]); line(m, 'hair', [[sx, sy, sz - s], [sx, sy, sz + s]]);
    }
    m.labels.push({ t: 'the rose', at: [0.5, 0, 1.44], k: 'red' });
    m.cz = 0.55;
    P.prince = { m: m, extent: 4.6, n: 20, az: 16, turn: 36, el: 14 };
  })();

  /* ── XYRO: three screens of a flow, drawn as wireframes at full size. ── */
  (function () {
    var m = M(), w = 0.0715, h = 0.147, gap = 0.03, i, s, x;
    for (s = 0; s < 3; s++) {
      x = (s - 1) * (w + gap) - w / 2;
      wallX(m, 'cut', x, 0, 0, w, h);
      wallX(m, 'hair', x + 0.004, 0, h - 0.016, w - 0.008, 0.009);                     /* bar */
      if (s === 0) {
        wallX(m, 'hair', x + 0.006, 0, 0.075, w - 0.012, 0.05);                          /* picture */
        line(m, 'hair', [[x + 0.006, 0, 0.075], [x + w - 0.006, 0, 0.125]]); line(m, 'hair', [[x + 0.006, 0, 0.125], [x + w - 0.006, 0, 0.075]]);
        for (i = 0; i < 3; i++) line(m, 'hair', [[x + 0.006, 0, 0.064 - i * 0.008], [x + w - 0.006 - (i === 2 ? 0.02 : 0), 0, 0.064 - i * 0.008]]);
        wallX(m, 'red', x + 0.006, 0, 0.014, w - 0.012, 0.012);                          /* the one button */
      } else if (s === 1) {
        for (i = 0; i < 4; i++) {
          wallX(m, i === 1 ? 'red' : 'hair', x + 0.006, 0, 0.1 - i * 0.027, w - 0.012, 0.022);
          wallX(m, 'hair', x + 0.009, 0, 0.104 - i * 0.027, 0.014, 0.014);
          line(m, 'hair', [[x + 0.028, 0, 0.114 - i * 0.027], [x + w - 0.012, 0, 0.114 - i * 0.027]]);
          line(m, 'hair', [[x + 0.028, 0, 0.107 - i * 0.027], [x + w - 0.026, 0, 0.107 - i * 0.027]]);
        }
      } else {
        hoop(m, 'hair', x + w / 2, 0, 0.098, 0.02, 0, 0, 20);
        line(m, 'red', [[x + w / 2 - 0.009, 0, 0.098], [x + w / 2 - 0.002, 0, 0.091], [x + w / 2 + 0.01, 0, 0.106]]);
        for (i = 0; i < 2; i++) line(m, 'hair', [[x + 0.014 + i * 0.006, 0, 0.062 - i * 0.008], [x + w - 0.014 - i * 0.006, 0, 0.062 - i * 0.008]]);
        wallX(m, 'hair', x + 0.006, 0, 0.014, w - 0.012, 0.012);
      }
      if (s < 2) {                                                                       /* the step to the next screen */
        line(m, 'red', [[x + w + 0.004, 0, 0.02 + s * 0.068], [x + w + gap - 0.004, 0, 0.02 + s * 0.068]]);
        line(m, 'red', [[x + w + gap - 0.009, 0, 0.024 + s * 0.068], [x + w + gap - 0.004, 0, 0.02 + s * 0.068], [x + w + gap - 0.009, 0, 0.016 + s * 0.068]]);
      }
    }
    m.labels.push({ t: 'one tap', at: [-w / 2 - gap + 0.002, 0, 0.026], k: 'red' });
    m.cz = h / 2;
    P.xyro = { m: m, extent: 0.3, n: 1, az: -14, turn: 22, el: 6 };
  })();

  window.PIECES = P;
})();
