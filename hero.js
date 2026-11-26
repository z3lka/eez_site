/* The hero drawing: sketch → crane assembly → colour rain → the pen.
   The whole scene is a pure function of time, render(t), so it can be
   played, scrubbed with the slider, replayed, or frozen (?t=7.5 / ?t=end). */
(function () {
  'use strict';
  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    ink: '#191813', pencil: '#6B6860', red: '#B3341F', paper: '#F4F1EA',
    sky: '#CFE2E6', sea: '#3E7EA3', seaL: '#A3C8D8', sun: '#E9B44C',
    ridge: '#B7C6AE', hill: '#8FA86C', stone: '#EAD7B4', stoneL: '#F0E4C9',
    cyp: '#2F5D45', pine: '#3F6B4A', trunk: '#6B4A35', earth: '#DCCBA6',
    yellow: '#E9B44C', pink: '#E2A08F', blue: '#7FB3C8', cream: '#F3E6CB',
    sage: '#A9C7A2', leaf: '#4F8A5B'
  };
  var G = 640; // ground line

  /* ---------- timeline (seconds, before SPEED) ---------- */
  var SPEED = 1.15;
  var SK0 = 0.2, SK1 = 2.9;          // pencil sketch
  var CR0 = 2.4, CR1 = 3.5;          // crane rises
  var BU0 = 3.5, CYC = 1.4, NP = 4;  // four lifts
  var BU1 = BU0 + CYC * NP;          // 9.1
  var CX0 = 9.0, CX1 = 9.8;          // crane leaves
  var RA0 = 9.2, RAIN_SPREAD = 1.5, FALL = 0.4;
  var PE0 = 10.9, PASS = 0.6, PGAP = 0.1, NPASS = 4;
  var PE1 = PE0 + NPASS * PASS + (NPASS - 1) * PGAP; // 13.6
  var AN0 = PE1, AN1 = PE1 + 1.1;
  var END = AN1 + 0.1;

  /* ---------- helpers ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(7);
  function f(n) { return Math.round(n * 10) / 10; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  var ease = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };
  function mk(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function set(e, k, v) { if (e['_' + k] !== v) { e['_' + k] = v; e.setAttribute(k, v); } }
  function isOpts(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function circleD(cx, cy, r) {
    return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
  }

  /* ---------- layers ---------- */
  var defs = mk('defs', null, svg);
  var mask = mk('mask', { id: 'reveal', maskUnits: 'userSpaceOnUse', x: -300, y: -400, width: 2200, height: 1400 }, defs);
  mk('rect', { x: -300, y: -400, width: 2200, height: 1400, fill: '#000' }, mask);
  var gMask = mk('g', { fill: 'none', stroke: '#fff', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mask);

  var gSketch = mk('g', { fill: 'none', stroke: C.pencil, 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0.85 }, svg);
  var gBlots = mk('g', { style: 'mix-blend-mode:multiply' }, svg);
  var gColor = mk('g', { mask: 'url(#reveal)', stroke: C.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gInk = mk('g', { stroke: C.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gCrane = mk('g', { stroke: C.red, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gRain = mk('g', { 'stroke-linecap': 'round', 'stroke-width': 5, fill: 'none' }, svg);
  var gAnno = mk('g', { stroke: C.red, 'stroke-width': 1.4, 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gBirds = mk('g', { stroke: C.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, svg);
  var gPen = mk('g', { opacity: 0 }, svg);

  /* ---------- pencil ---------- */
  var strokes = [];
  function pen(d, parent) {
    var p = mk('path', { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 }, parent);
    strokes.push(p);
    return p;
  }
  function pline(x1, y1, x2, y2, parent) {
    var len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    var o = Math.min(10, 3 + len * 0.05);
    function j() { return (R() - 0.5) * 2.4; }
    var ax = x1 - ux * o * R() + j(), ay = y1 - uy * o * R() + j();
    var bx = x2 + ux * o * R() + j(), by = y2 + uy * o * R() + j();
    var k = (R() - 0.5) * Math.min(len * 0.025, 5);
    pen('M' + f(ax) + ' ' + f(ay) + 'Q' + f((ax + bx) / 2 - uy * k) + ' ' + f((ay + by) / 2 + ux * k) + ' ' + f(bx) + ' ' + f(by), parent);
  }
  function shapePencil(s, parent) {
    var i, x, y, w, h, pts;
    switch (s[0]) {
      case 'l': pline(s[1], s[2], s[3], s[4], parent); break;
      case 'r': case 'p':
        x = s[1]; y = s[2]; w = s[3]; h = s[4];
        pline(x, y, x + w, y, parent); pline(x + w, y, x + w, y + h, parent);
        pline(x + w, y + h, x, y + h, parent); pline(x, y + h, x, y, parent); break;
      case 'pl':
        pts = s[1];
        for (i = 0; i < pts.length - 1; i++) pline(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], parent);
        if (s[2] === true) pline(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], parent);
        break;
      case 'c': pen(circleD(s[1], s[2], s[3]), parent); break;
      case 'd': pen(s[1], parent); break;
    }
  }
  function shapeInk(s, parent) {
    var o = isOpts(s[s.length - 1]) ? s[s.length - 1] : {};
    var a = {}, e;
    if (o.f) a.fill = o.f;
    if (o.sw !== undefined) a['stroke-width'] = o.sw;
    if (o.s) a.stroke = o.s;
    if (o.o !== undefined) a.opacity = o.o;
    switch (s[0]) {
      case 'l': a.x1 = s[1]; a.y1 = s[2]; a.x2 = s[3]; a.y2 = s[4]; e = mk('line', a, parent); break;
      case 'r': a.x = s[1]; a.y = s[2]; a.width = s[3]; a.height = s[4]; e = mk('rect', a, parent); break;
      case 'p': a.x = s[1]; a.y = s[2]; a.width = s[3]; a.height = s[4]; a.fill = C.ink; e = mk('rect', a, parent); break;
      case 'pl':
        a.points = s[1].map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
        e = mk(s[2] === true ? 'polygon' : 'polyline', a, parent); break;
      case 'c': a.cx = s[1]; a.cy = s[2]; a.r = s[3]; e = mk('circle', a, parent); break;
      case 'd': a.d = s[1]; e = mk('path', a, parent); break;
    }
    return e;
  }
  function figure(x, feet, h, fill) {
    var r = h * 0.085;
    return [
      ['c', x, feet - h + r, r, { f: fill || C.ink, sw: 0 }],
      ['pl', [[x - h * 0.13, feet - h * 0.8], [x + h * 0.13, feet - h * 0.8], [x + h * 0.07, feet], [x - h * 0.07, feet]], true, { f: fill || C.ink, sw: 0 }]
    ];
  }
  function cloud(x, y, s) {
    function n(v) { return f(v * s); }
    return 'M' + x + ' ' + y + 'c' + n(-22) + ' 0 ' + n(-22) + ' ' + n(-30) + ' ' + n(4) + ' ' + n(-30) +
      'c' + n(4) + ' ' + n(-26) + ' ' + n(44) + ' ' + n(-30) + ' ' + n(56) + ' ' + n(-8) +
      'c' + n(16) + ' ' + n(-18) + ' ' + n(52) + ' ' + n(-10) + ' ' + n(50) + ' ' + n(14) +
      'c' + n(24) + ' 0 ' + n(24) + ' ' + n(24) + ' ' + n(2) + ' ' + n(24) + 'z';
  }
  function house(x, w, h, rh) {
    var t = G - h, out = [
      ['r', x, t, w, h, { f: C.stone }],
      ['pl', [[x - 4, t], [x + w / 2, t - rh], [x + w + 4, t]], true, { f: C.red }]
    ];
    for (var wy = t + 12; wy < G - 22; wy += 26)
      for (var wx = x + 10; wx < x + w - 14; wx += 22)
        out.push(['r', wx, wy, 8, 12, { f: C.ink, sw: 0, ns: 1 }]);
    return out;
  }
  function cypress(x, h) {
    return ['d', 'M' + x + ' ' + G + 'C' + (x - 15) + ' ' + (G - h * 0.5) + ' ' + (x - 8) + ' ' + (G - h * 0.9) + ' ' + x + ' ' + (G - h) +
      'C' + (x + 8) + ' ' + (G - h * 0.9) + ' ' + (x + 15) + ' ' + (G - h * 0.5) + ' ' + x + ' ' + G + 'Z', { f: C.cyp }];
  }

  /* ---------- the landscape, in painter's order ---------- */
  var RIDGE = 'M600 590C720 500 830 470 940 500C1040 440 1180 400 1300 440C1400 390 1500 370 1640 380';
  var LAND = [].concat(
    [['r', -300, -400, 2200, 1040, { f: C.sky, sw: 0, ns: 1 }]],
    [['c', 318, 268, 44, { f: C.sun }]],
    [['d', cloud(64, 214, 1.2), { f: C.paper, grp: 'cloudA' }],
     ['d', cloud(1120, 232, 0.9), { f: C.paper, grp: 'cloudB' }],
     ['d', cloud(1420, 312, 1.05), { f: C.paper, grp: 'cloudA' }]],
    [['d', RIDGE + 'L1640 640L600 640Z', { f: C.ridge }],
     ['d', 'M700 566C800 520 880 506 950 528C1060 474 1180 436 1290 470C1400 424 1500 404 1640 412', { sw: 0.8, o: 0.55 }],
     ['d', 'M830 580C900 556 930 548 980 560C1080 508 1180 472 1280 500C1400 458 1500 438 1640 444', { sw: 0.8, o: 0.55 }]],
    [['d', 'M40 560Q130 512 250 560Z', { f: '#7E9A78' }],
     ['r', -300, 560, 900, 80, { f: C.sea, sw: 0 }],
     ['l', -300, 560, 600, 560],
     ['l', 60, 584, 150, 584, { s: C.seaL, sw: 2.5, grp: 'waves', ns: 1 }],
     ['l', 190, 612, 290, 612, { s: C.seaL, sw: 2.5, grp: 'waves', ns: 1 }],
     ['l', 400, 600, 440, 600, { s: C.seaL, sw: 2.5, grp: 'waves', ns: 1 }],
     ['l', 20, 622, 90, 622, { s: C.seaL, sw: 2.5, grp: 'waves', ns: 1 }]],
    [['pl', [[338, 542], [338, 586], [368, 586]], true, { f: C.paper, grp: 'boat' }],
     ['pl', [[330, 550], [330, 586], [310, 586]], true, { f: C.paper, grp: 'boat' }],
     ['l', 334, 592, 334, 536, { grp: 'boat' }],
     ['pl', [[304, 590], [370, 590], [358, 603], [314, 603]], true, { f: C.red, grp: 'boat' }]],
    [['d', 'M1040 640C1140 612 1260 580 1400 566C1500 556 1570 548 1640 544L1640 640Z', { f: C.hill }]],
    [cypress(1214, 132), cypress(1452, 156)],
    house(1150, 66, 58, 24), house(1222, 58, 84, 22),
    [['r', 1300, 420, 44, 220, { f: C.stoneL }],
     ['r', 1308, 386, 28, 34, { f: C.stoneL }],
     ['pl', [[1304, 386], [1322, 322], [1340, 386]], true, { f: C.red }],
     ['r', 1314, 436, 16, 24, { f: C.ink, sw: 0 }], ['r', 1314, 486, 16, 24, { f: C.ink, sw: 0 }],
     ['r', 1314, 536, 16, 24, { f: C.ink, sw: 0 }], ['r', 1316, 394, 12, 18, { f: C.ink, sw: 0 }],
     ['l', 1300, 470, 1344, 470], ['l', 1300, 520, 1344, 520], ['l', 1300, 570, 1344, 570]],
    house(1372, 92, 66, 26), house(1468, 70, 96, 24), house(1544, 70, 54, 22),
    [['r', -300, G, 2200, 300, { f: C.earth, sw: 0, ns: 1 }]],
    (function () { var a = []; for (var x = 580; x < 1060; x += 26) a.push(['l', x, 700, x + 44, 652, { sw: 1, o: 0.7 }]); return a; })(),
    [['pl', [[146, 640], [150, 522], [159, 522], [161, 640]], true, { f: C.trunk, grp: 'pine' }],
     ['d', 'M80 520C70 480 120 450 160 456C200 440 250 470 240 512C236 530 100 534 80 520Z', { f: C.pine, grp: 'pine' }]],
    [['p', -300, G, 2200, 9, { ns: 1 }], ['l', -40, G, 1640, G]],
    figure(1130, G, 62).map(function (s) { s[s.length - 1].grp = 'people'; return s; }),
    figure(1104, G, 33, C.red).map(function (s) { s[s.length - 1].grp = 'people'; return s; })
  );

  var gSkLand = mk('g', null, gSketch);
  var grp = {};
  LAND.forEach(function (s) {
    var o = isOpts(s[s.length - 1]) ? s[s.length - 1] : {};
    if (!o.ns) shapePencil(s, gSkLand);
    var parent = gColor;
    if (o.grp) { if (!grp[o.grp]) grp[o.grp] = mk('g', null, gColor); parent = grp[o.grp]; }
    shapeInk(s, parent);
  });

  /* ---------- the building: three prefabricated storeys and a tree ---------- */
  function stair() {
    var pts = [[628, 640]], i;
    for (i = 0; i < 8; i++) { pts.push([628 + 20 * i, f(640 - 11.6 * (i + 1))]); pts.push([648 + 20 * i, f(640 - 11.6 * (i + 1))]); }
    return ['pl', pts, false];
  }
  var MODS = [
    { cx: 820, top: 535, w: 180, fills: [['r', 612, 547, 202, 93, C.yellow], ['r', 824, 547, 204, 93, C.pink]],
      shapes: [].concat([
        ['p', 600, 535, 440, 12], ['p', 600, 547, 12, 93], ['p', 1028, 547, 12, 93], ['p', 814, 547, 10, 93],
        stair(),
        ['l', 876, 612, 944, 612], ['l', 884, 612, 884, 640], ['l', 936, 612, 936, 640],
        ['pl', [[958, 640], [958, 618], [974, 618], [974, 640]], false], ['l', 974, 618, 974, 596],
        ['pl', [[862, 640], [862, 618], [846, 618], [846, 640]], false], ['l', 846, 618, 846, 596],
        ['l', 910, 547, 910, 568], ['pl', [[898, 580], [903, 568], [917, 568], [922, 580]], true]
      ], figure(1000, 640, 62)) },
    { cx: 820, top: 430, w: 180, fills: [['r', 612, 442, 144, 93, C.blue], ['r', 764, 442, 264, 93, C.cream], ['r', 880, 468, 44, 28, C.red]],
      shapes: [].concat([
        ['p', 600, 430, 440, 12], ['p', 600, 442, 12, 93], ['p', 1028, 442, 12, 20], ['p', 1028, 507, 12, 28], ['p', 756, 442, 8, 93],
        ['pl', [[636, 535], [636, 502], [645, 502], [645, 517], [684, 517], [684, 535]], false], ['l', 645, 526, 684, 526],
        ['l', 716, 535, 716, 478], ['pl', [[705, 478], [710, 462], [722, 462], [727, 478]], true],
        ['r', 648, 458, 36, 26],
        ['l', 836, 503, 964, 503], ['l', 844, 503, 844, 535], ['l', 956, 503, 956, 535],
        ['r', 880, 468, 44, 28], ['l', 902, 496, 902, 503], ['l', 892, 503, 912, 503],
        ['pl', [[984, 535], [984, 512], [1000, 512], [1000, 535]], false], ['l', 1000, 512, 1000, 490]
      ], figure(800, 535, 62)) },
    { cx: 820, top: 255, w: 190, fills: [['r', 612, 337, 416, 93, C.sage]],
      shapes: [].concat([
        ['p', 584, 325, 472, 12], ['p', 600, 337, 12, 28], ['p', 600, 402, 12, 28], ['p', 1028, 337, 12, 93],
        ['p', 584, 311, 10, 14], ['p', 1046, 311, 10, 14],
        ['l', 690, 398, 792, 374], ['l', 706, 394, 706, 430], ['l', 780, 377, 780, 430], ['l', 700, 418, 786, 418],
        ['r', 900, 350, 104, 80], ['l', 900, 377, 1004, 377], ['l', 900, 403, 1004, 403],
        ['l', 914, 350, 914, 377], ['l', 924, 350, 924, 377], ['l', 940, 356, 940, 377], ['l', 970, 377, 970, 403],
        ['l', 982, 377, 982, 403], ['l', 930, 403, 930, 430], ['l', 948, 408, 948, 430],
        ['pl', [[852, 430], [848, 414], [868, 414], [864, 430]], true],
        ['d', 'M858 414C852 398 846 392 840 390M858 414C858 396 862 388 868 384M858 414C866 402 874 400 880 400'],
        ['l', 880, 325, 880, 258], ['l', 1012, 325, 1012, 258], ['l', 868, 258, 1024, 258], ['l', 868, 265, 1024, 265]
      ], figure(828, 430, 62), figure(946, 325, 62)) },
    { cx: 700, top: 206, w: 26, tree: true, fills: [],
      shapes: [['r', 672, 303, 56, 22]] }
  ];
  var CROWN = 'M700 268C672 270 660 248 672 232C668 212 692 204 704 212C722 202 742 218 734 238C744 256 722 272 700 268Z';

  var gRig = mk('g', null, gInk);        // sways with the load
  var gRooms = mk('g', { stroke: 'none' }, gColor);
  MODS.forEach(function (m) {
    m.ghost = mk('g', null, gSketch);
    m.g = mk('g', { opacity: 0 }, gRig);
    m.shapes.forEach(function (s) { shapePencil(s, m.ghost); shapeInk(s, m.g); });
    m.fills.forEach(function (r) { mk('rect', { x: r[1], y: r[2], width: r[3], height: r[4], fill: r[5] }, gRooms); });
    if (m.tree) {
      shapePencil(['l', 700, 303, 700, 266], m.ghost); shapePencil(['d', CROWN], m.ghost);
      m.sway = mk('g', null, m.g);
      mk('line', { x1: 700, y1: 303, x2: 700, y2: 266 }, m.sway);
      mk('path', { d: CROWN }, m.sway);
      mk('rect', { x: 672, y: 303, width: 56, height: 22, fill: C.red, stroke: 'none' }, gRooms);
      m.swayCol = mk('g', { stroke: 'none' }, gRooms);
      mk('path', { d: CROWN, fill: C.leaf }, m.swayCol);
    }
  });

  /* ---------- the crane (enters in red: the machine is an annotation) ---------- */
  var crane = [];
  function cr(d, a, b, extra) {
    var at = { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 };
    if (extra) for (var k in extra) at[k] = extra[k];
    if (at.fill) at['fill-opacity'] = 0;
    crane.push({ el: mk('path', at, gCrane), a: a, b: b, fill: !!at.fill });
  }
  var MX0 = 452, MX1 = 476, JY0 = 150, JY1 = 164, TROLLEY_Y = 172, X_OUT = 2120, CARRY = 184;
  (function () {
    var z = 'M' + MX0 + ' ' + G, y, x, i = 0;
    for (y = G - 24; y >= 190; y -= 24) { z += 'L' + (i % 2 ? MX0 : MX1) + ' ' + y; i++; }
    cr('M430 ' + G + 'H498M436 ' + G + 'V628H492V' + G, 0, 0.12);
    cr('M' + MX0 + ' ' + G + 'V186', 0.04, 0.5); cr('M' + MX1 + ' ' + G + 'V186', 0.06, 0.52);
    cr(z, 0.1, 0.56, { 'stroke-width': 1.2 });
    cr('M444 186H484V172H444Z', 0.5, 0.58);
    cr('M476 150H512V184H484', 0.52, 0.62);
    cr('M456 172L464 112L472 172', 0.52, 0.66);
    cr('M' + MX1 + ' ' + JY0 + 'H1760', 0.56, 1); cr('M' + MX1 + ' ' + JY1 + 'H1760', 0.58, 1);
    z = 'M' + MX1 + ' ' + JY1; i = 0;
    for (x = MX1 + 24; x <= 1760; x += 24) { z += 'L' + x + ' ' + (i % 2 ? JY1 : JY0); i++; }
    cr(z, 0.6, 1, { 'stroke-width': 1.2 });
    cr('M' + MX0 + ' ' + JY0 + 'H330V164H' + MX0, 0.56, 0.74);
    cr('M336 164H388V198H336Z', 0.66, 0.78, { fill: C.red });
    cr('M464 112L900 150', 0.7, 0.92, { 'stroke-width': 1.2 }); cr('M464 112L1330 150', 0.72, 1, { 'stroke-width': 1.2 });
    cr('M464 112L344 150', 0.7, 0.84, { 'stroke-width': 1.2 });
  })();
  var gHoist = mk('g', { opacity: 0 }, gCrane);
  var trolley = mk('rect', { x: -15, y: JY1, width: 30, height: 8, fill: C.red }, gHoist);
  var gSwing = mk('g', null, gHoist);
  var cable = mk('line', { x1: 0, y1: TROLLEY_Y, x2: 0, y2: 190 }, gSwing);
  var hook = mk('path', { d: 'M0 0v8a5 5 0 1 1 -5 5' }, gSwing);
  var slingL = mk('line', { 'stroke-width': 1.3 }, gSwing);
  var slingR = mk('line', { 'stroke-width': 1.3 }, gSwing);

  /* ---------- colour rain ---------- */
  var RC = [C.sea, C.sun, C.red, C.leaf, C.pink, C.blue, C.sea, C.yellow];
  function blob(cx, cy, r, rr) {
    var n = 9, pts = [], i, a, q, d;
    for (i = 0; i < n; i++) { a = i / n * Math.PI * 2; q = r * (0.72 + rr() * 0.5); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.86]); }
    d = 'M' + f((pts[0][0] + pts[n - 1][0]) / 2) + ' ' + f((pts[0][1] + pts[n - 1][1]) / 2);
    for (i = 0; i < n; i++) {
      var p = pts[i], nx = pts[(i + 1) % n];
      d += 'Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f((p[0] + nx[0]) / 2) + ' ' + f((p[1] + nx[1]) / 2);
    }
    return d + 'Z';
  }
  var drops = [];
  (function () {
    var rr = rng(21), i, x, y, r, col, g, d, k, a, dist;
    for (i = 0; i < 84; i++) {
      x = -20 + rr() * 1640; y = 150 + rr() * 560; r = 24 + rr() * 46; col = RC[i % RC.length];
      g = mk('g', { fill: col, opacity: 0 }, gBlots);
      d = blob(x, y, r, rr);
      for (k = 0; k < 3; k++) { a = rr() * 6.28; dist = r * (1.15 + rr() * 0.5); d += circleD(f(x + Math.cos(a) * dist), f(y + Math.sin(a) * dist), f(2 + rr() * 5)); }
      mk('path', { d: d }, g);
      drops.push({
        x: x, y: y, s: RA0 + rr() * RAIN_SPREAD, g: g,
        line: mk('line', { x1: 0, y1: 0, x2: 4, y2: -36, stroke: col, opacity: 0 }, gRain)
      });
    }
  })();

  /* ---------- the pen: four broad passes reveal the finished drawing ---------- */
  var NPT = 56, passes = [];
  (function () {
    var j, i, x, y, pts, Y = [92, 284, 476, 668];
    for (j = 0; j < NPASS; j++) {
      pts = [];
      for (i = 0; i < NPT; i++) {
        x = lerp(-160, 1760, i / (NPT - 1)); if (j % 2) x = 1600 - x;
        y = Y[j] + 20 * Math.sin(x / 250 + j * 1.7) + (j % 2 ? -1 : 1) * (x - 800) * 0.018;
        pts.push([f(x), f(y)]);
      }
      passes.push({
        pts: pts,
        els: [
          { el: mk('polyline', { 'stroke-width': 214 }, gMask), off: 0, lag: 0 },
          { el: mk('polyline', { 'stroke-width': 30 }, gMask), off: -112, lag: 2 },
          { el: mk('polyline', { 'stroke-width': 26 }, gMask), off: 114, lag: 3 },
          { el: mk('polyline', { 'stroke-width': 12 }, gMask), off: -132, lag: 5 },
          { el: mk('polyline', { 'stroke-width': 10 }, gMask), off: 134, lag: 7 }
        ]
      });
    }
  })();
  (function () {
    var g = mk('g', { transform: 'scale(1.15)' }, gPen);
    mk('polygon', { points: '-9,-40 -11,-250 11,-250 9,-40', fill: C.ink }, g);
    mk('rect', { x: -11, y: -263, width: 22, height: 13, fill: C.red }, g);
    mk('rect', { x: -9, y: -42, width: 18, height: 14, fill: C.red }, g);
    mk('polygon', { points: '0,0 -8,-28 8,-28', fill: C.ink }, g);
    mk('line', { x1: -4, y1: -62, x2: -5, y2: -236, stroke: C.paper, 'stroke-width': 2, opacity: 0.55 }, g);
  })();

  /* ---------- last touch: the red notes ---------- */
  var annos = [];
  function an(d, a, b) { annos.push({ el: mk('path', { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 }, gAnno), a: a, b: b }); }
  function note(x, y, text, a, anchor) {
    var t = mk('text', { x: x, y: y, 'class': 'scene-note', fill: C.red, stroke: 'none', opacity: 0, 'text-anchor': anchor || 'start' }, gAnno);
    t.textContent = text; annos.push({ el: t, a: a, b: a + 0.2, text: true });
  }
  an('M1088 607V640M1083 607H1093M1083 640H1093', 0, 0.3); note(1096, 597, '95 cm', 0.2, 'middle');
  an('M924 482H1066', 0.25, 0.5); note(1072, 487, 'screen', 0.45);
  an('M1056 331L1076 296', 0.35, 0.55); note(1080, 292, 'building', 0.5);
  an('M642 386H560', 0.45, 0.65); note(554, 391, 'room', 0.6, 'end');
  an('M640 512H560', 0.55, 0.75); note(554, 517, 'object', 0.7, 'end');
  an('M1340 328L1352 304', 0.65, 0.85); note(1356, 300, 'city', 0.8);
  an('M40 716H145M40 710V722M145 710V722M92 712V720', 0.7, 0.95); note(40, 742, '0', 0.8); note(145, 742, '3 m', 0.8, 'end');

  var birds = [];
  [[0, 0], [26, 14], [-22, 20]].forEach(function (o) {
    birds.push({ el: mk('path', { d: 'M-9 -4Q-4 -6 0 0Q4 -6 9 -4' }, gBirds), ox: o[0], oy: o[1] });
  });

  /* ---------- render ---------- */
  var maskOn = true;
  function ptsStr(pts, p, off, lag) {
    var n = (NPT - 1) * p - lag; if (n <= 0) return '';
    var k = Math.floor(n), fr = n - k, s = '', i, a, b;
    for (i = 0; i <= k && i < NPT; i++) s += pts[i][0] + ',' + f(pts[i][1] + off + (off ? 7 * Math.sin(i * 1.3 + off) : 0)) + ' ';
    if (k < NPT - 1) { a = pts[k]; b = pts[k + 1]; s += f(lerp(a[0], b[0], fr)) + ',' + f(lerp(a[1], b[1], fr) + off); }
    return s;
  }
  function passPoint(j, p) {
    var pts = passes[j].pts, n = (NPT - 1) * p, k = Math.min(NPT - 2, Math.floor(n)), fr = n - k;
    return [lerp(pts[k][0], pts[k + 1][0], fr), lerp(pts[k][1], pts[k + 1][1], fr)];
  }

  function render(t, idle) {
    var i, p, N = strokes.length, sk = seg(t, SK0, SK1), a;

    // 1. pencil
    for (i = 0; i < N; i++) {
      a = i / N * 0.8;
      set(strokes[i], 'stroke-dashoffset', f(1 - ease.inOut(seg(sk, a, a + 0.2))));
    }

    // 2. crane up, crane away
    var cIn = seg(t, CR0, CR1), cOut = seg(t, CX0, CX1), c = cIn * (1 - ease.inOut(cOut));
    for (i = 0; i < crane.length; i++) {
      p = ease.inOut(seg(c, crane[i].a, crane[i].b));
      set(crane[i].el, 'stroke-dashoffset', f(1 - p));
      if (crane[i].fill) set(crane[i].el, 'fill-opacity', f(p * p));
    }
    set(gCrane, 'opacity', c <= 0 ? 0 : 1);

    // 3. lifts
    var k = Math.floor((t - BU0) / CYC), act = k >= 0 && k < NP, u = t - BU0 - k * CYC;
    var tx = X_OUT, hy = 188, th = 0;
    MODS.forEach(function (m, idx) {
      if (idx > k || t < BU0) { set(m.g, 'opacity', 0); set(m.ghost, 'opacity', 1); return; }
      set(m.g, 'opacity', 1);
      if (idx < k || u >= 1.02) {
        set(m.g, 'transform', ''); set(m.ghost, 'opacity', 0);
      }
    });
    if (act) {
      var m = MODS[k];
      if (u < 0.7) tx = lerp(X_OUT, m.cx, ease.inOut(u / 0.7));
      else if (u < 1.05) tx = m.cx;
      else tx = lerp(m.cx, X_OUT, ease.inOut(seg(u, 1.05, CYC)));
      var dy = (CARRY - m.top) * (1 - ease.inOut(seg(u, 0.55, 1.02)));
      th = 2.4 * Math.sin(u * 8) * (1 - seg(u, 0.35, 0.95)) * seg(u, 0, 0.1);
      if (u < 1.02) {
        hy = m.top + dy - 26;
        set(m.g, 'transform', 'rotate(' + f(th) + ' ' + f(tx) + ' ' + TROLLEY_Y + ') translate(' + f(tx - m.cx) + ' ' + f(dy) + ')');
        set(m.ghost, 'opacity', f(1 - seg(u, 0.85, 1.02)));
        set(slingL, 'opacity', 1); set(slingR, 'opacity', 1);
        set(slingL, 'x1', f(tx)); set(slingL, 'y1', f(hy + 13)); set(slingL, 'x2', f(tx - m.w)); set(slingL, 'y2', f(m.top + dy));
        set(slingR, 'x1', f(tx)); set(slingR, 'y1', f(hy + 13)); set(slingR, 'x2', f(tx + m.w)); set(slingR, 'y2', f(m.top + dy));
      } else {
        hy = lerp(m.top - 26, 188, ease.out(seg(u, 1.02, 1.2)));
        set(slingL, 'opacity', 0); set(slingR, 'opacity', 0);
      }
    } else { set(slingL, 'opacity', 0); set(slingR, 'opacity', 0); }
    set(gHoist, 'opacity', cIn >= 1 ? f(1 - seg(cOut, 0, 0.12)) : 0);
    set(trolley, 'transform', 'translate(' + f(tx) + ' 0)');
    set(gSwing, 'transform', 'rotate(' + f(th) + ' ' + f(tx) + ' ' + TROLLEY_Y + ')');
    set(cable, 'x1', f(tx)); set(cable, 'x2', f(tx)); set(cable, 'y2', f(hy));
    set(hook, 'transform', 'translate(' + f(tx) + ' ' + f(hy) + ')');

    // 4. rain
    var raining = t > RA0 - 0.1 && t < END;
    for (i = 0; i < drops.length; i++) {
      var d = drops[i], q = seg(t, d.s, d.s + FALL);
      if (q > 0 && q < 1) {
        var q2 = q * q;
        set(d.line, 'opacity', 0.9);
        set(d.line, 'transform', 'translate(' + f(d.x + (1 - q2) * 70) + ' ' + f(d.y - (1 - q2) * 860) + ')');
      } else set(d.line, 'opacity', 0);
      var b = raining ? ease.out(seg(t, d.s + FALL, d.s + FALL + 0.25)) : 0;
      set(d.g, 'opacity', f(0.78 * b));
      if (b > 0 && b < 1) set(d.g, 'transform', 'translate(' + f(d.x * (1 - (0.55 + 0.45 * b))) + ' ' + f(d.y * (1 - (0.55 + 0.45 * b))) + ') scale(' + f(0.55 + 0.45 * b) + ')');
      else set(d.g, 'transform', '');
    }

    // 5. the pen
    var done = t >= PE1, px = -260, py = -160, dir = 0, po = 0;
    if (done !== !maskOn) {
      maskOn = !done;
      if (done) gColor.removeAttribute('mask'); else gColor.setAttribute('mask', 'url(#reveal)');
    }
    set(gSketch, 'display', done ? 'none' : 'inline');
    for (i = 0; i < NPASS; i++) {
      var s0 = PE0 + i * (PASS + PGAP), raw = seg(t, s0, s0 + PASS);
      p = ease.inOut(raw);
      if (!done) passes[i].els.forEach(function (e) { set(e.el, 'points', ptsStr(passes[i].pts, p, e.off, e.lag)); });
      if (t >= s0 - PGAP && t < s0 + PASS) {
        if (raw > 0) { var pp = passPoint(i, p); px = pp[0]; py = pp[1]; dir = (i % 2 ? -1 : 1) * Math.sin(Math.PI * raw); }
        else { var e0 = i ? passPoint(i - 1, 1) : [-260, -40], s1 = passPoint(i, 0), g0 = seg(t, s0 - PGAP, s0); px = lerp(e0[0], s1[0], g0); py = lerp(e0[1], s1[1], g0); }
        po = 1;
      }
    }
    if (t >= PE0 - 0.25 && t < PE0) { po = seg(t, PE0 - 0.25, PE0); var st = passPoint(0, 0); px = lerp(-420, st[0], po); py = lerp(-120, st[1], po); }
    var an01 = seg(t, AN0, AN1);
    if (t >= AN0 && an01 < 1) {
      var last = passPoint(NPASS - 1, 1);
      if (an01 < 0.12) { p = ease.out(an01 / 0.12); px = lerp(last[0], 1088, p); py = lerp(last[1], 607, p); po = 1; }
      else if (an01 < 0.3) { px = 1088; py = lerp(607, 640, ease.inOut(seg(an01, 0.12, 0.3))); po = 1; }
      else { p = ease.inOut(seg(an01, 0.3, 0.75)); px = lerp(1088, 1500, p); py = lerp(640, 820, p); po = 1 - seg(an01, 0.5, 0.75); }
    }
    set(gPen, 'opacity', f(po));
    if (po > 0) set(gPen, 'transform', 'translate(' + f(px) + ' ' + f(py) + ') rotate(' + f(30 - 13 * dir) + ')');

    // 6. notes
    for (i = 0; i < annos.length; i++) {
      p = ease.inOut(seg(an01, annos[i].a, annos[i].b));
      if (annos[i].text) set(annos[i].el, 'opacity', f(p)); else set(annos[i].el, 'stroke-dashoffset', f(1 - p));
    }

    // 7. the finished drawing breathes
    var live = idle || 0, on = t >= END ? 1 : 0;
    set(grp.cloudA, 'transform', on ? 'translate(' + f(46 * Math.sin(live * 0.11)) + ' 0)' : '');
    set(grp.cloudB, 'transform', on ? 'translate(' + f(-38 * Math.sin(live * 0.09)) + ' 0)' : '');
    set(grp.waves, 'transform', on ? 'translate(' + f(9 * Math.sin(live * 0.7)) + ' 0)' : '');
    set(grp.boat, 'transform', on ? 'translate(' + f(14 * Math.sin(live * 0.21)) + ' ' + f(1.6 * Math.sin(live * 1.4)) + ') rotate(' + f(1.8 * Math.sin(live * 1.1)) + ' 336 596)' : '');
    set(grp.pine, 'transform', on ? 'rotate(' + f(0.8 * Math.sin(live * 0.8)) + ' 154 640)' : '');
    var tr = MODS[3], sw = on ? 'rotate(' + f(2 * Math.sin(live * 1.0)) + ' 700 303)' : '';
    set(tr.sway, 'transform', sw); set(tr.swayCol, 'transform', sw);
    set(gBirds, 'opacity', f(seg(t, PE1, END)));
    for (i = 0; i < birds.length; i++) {
      var bx = 620 + ((live * 16) % 1300) + birds[i].ox, by = 96 + 14 * Math.sin(live * 0.4 + i) + birds[i].oy;
      set(birds[i].el, 'transform', 'translate(' + f(on ? bx : 620 + birds[i].ox) + ' ' + f(by) + ') scale(1 ' + f(on ? 0.55 + 0.45 * Math.sin(live * 7 + i * 1.3) : 1) + ')');
    }
  }

  /* ---------- player ---------- */
  var scrub = document.getElementById('scrub');
  var replay = document.getElementById('replay');
  var phase = document.getElementById('phase');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 700px)');
  var t = 0, idle = 0, playing = false, visible = true, lastTs = 0, raf = 0, lastPhase = '';
  var NAMES = [[BU0, 'Sketch'], [RA0, 'Assembly'], [PE0, 'Colour rain'], [END, 'The pen'], [Infinity, 'Finished']];

  function frame() {
    render(t, idle);
    if (scrub && document.activeElement !== scrub) scrub.value = Math.round(t / END * 1000);
    var name = '';
    for (var i = 0; i < NAMES.length; i++) if (t < NAMES[i][0]) { name = NAMES[i][1]; break; }
    if (phase && name !== lastPhase) { phase.textContent = name; lastPhase = name; if (scrub) scrub.setAttribute('aria-valuetext', name); }
  }
  function tick(ts) {
    raf = 0;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts;
    if (playing && t < END) t = Math.min(END, t + dt * SPEED);
    else if (t >= END && !reduce.matches) idle += dt;
    frame();
    loop();
  }
  function loop() {
    var need = visible && !document.hidden && ((playing && t < END) || (t >= END && !reduce.matches));
    if (need && !raf) raf = requestAnimationFrame(tick);
    if (!need) lastTs = 0;
  }
  function setView() { svg.setAttribute('viewBox', narrow.matches ? '400 96 740 664' : '0 0 1600 760'); }

  var qs = /[?&]t=([^&]+)/.exec(location.search);
  setView();
  if (narrow.addEventListener) narrow.addEventListener('change', setView);
  if (qs) { t = qs[1] === 'end' ? END : Math.min(END, parseFloat(qs[1]) || 0); idle = 3; frame(); }
  else if (reduce.matches) { t = END; frame(); }
  else { playing = true; frame(); loop(); }

  if (scrub) scrub.addEventListener('input', function () { playing = false; t = scrub.value / 1000 * END; idle = 0; frame(); loop(); });
  if (replay) replay.addEventListener('click', function () { t = 0; idle = 0; playing = true; lastTs = 0; frame(); loop(); });
  document.addEventListener('visibilitychange', loop);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; loop(); }, { threshold: 0.05 }).observe(svg);
  }
  svg.setAttribute('data-ready', '1');
})();
