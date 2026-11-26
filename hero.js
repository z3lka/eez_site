/* The hero drawing, second version: an elevation set out in pencil, raised by a
   tower crane, rained on with pigment, then resolved into watercolour by the pen.
   The whole scene is a pure function of time, render(t): it can be played,
   scrubbed with the slider, replayed, or frozen (?t=7.5 / ?t=end). */
(function () {
  'use strict';
  var svg = document.getElementById('scene');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    ink: '#191813', pencil: '#5B5850', red: '#B3341F', paper: '#F4F1EA',
    sky: '#B9CCD6', sea: '#5B879C', seaD: '#44708A', far: '#A9B4AE', isle: '#8FA093',
    stone: '#E2D2B2', shade: '#62788A', glass: '#9DB9C6', timber: '#BF9666',
    pine: '#5C7861', palm: '#6C8565', ochre: '#DFC79A', roof: '#B3341F', quay: '#D4C6AC', cast: '#39485A'
  };
  var G = 630;                                   // ground level, ±0.00
  var AX = [530, 620, 710, 800, 890, 980, 1070]; // column axes
  var LV = [630, 528, 432, 334];                 // slab levels

  /* ---------- timeline (seconds, before SPEED) ---------- */
  var SPEED = 1.2;
  var SK0 = 0.2, SK1 = 3.3;
  var CR0 = 2.9, CR1 = 3.9;
  var BU0 = 3.9, CYC = 1.25, NP = 4;
  var BU1 = BU0 + CYC * NP;            // 8.9
  var SH0 = 8.6;                       // shutters slide home
  var CX0 = 9.3, CX1 = 10.1;
  var RA0 = 9.5, RAIN_SPREAD = 1.9, FALL = 0.36;
  var PE0 = 11.5, TOUCH = 0.52, BLOOM = 1.5;
  var TOUCHES = [[800, 452, 520], [200, 600, 500], [420, 200, 640], [1400, 500, 520], [1180, 170, 660]];
  var PE1 = PE0 + (TOUCHES.length - 1) * TOUCH + BLOOM;  // all washes down
  var AN0 = PE0 + TOUCHES.length * TOUCH, AN1 = AN0 + 1.5;
  var END = Math.max(PE1, AN1) + 0.1;

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
  var R = rng(11);
  function f(n) { return Math.round(n * 10) / 10; }
  function f3(n) { return Math.round(n * 1000) / 1000; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  var ease = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    out5: function (t) { return 1 - Math.pow(1 - t, 5); },
    inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };
  function mk(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function set(e, k, v) { if (e['_' + k] !== v) { e['_' + k] = v; e.setAttribute(k, v); } }
  function blobD(rr, n, lo, hi) {   // an irregular closed shape of radius about 1
    var pts = [], i, a, q, d;
    for (i = 0; i < n; i++) { a = i / n * Math.PI * 2; q = lo + rr() * (hi - lo); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
    d = 'M' + f3((pts[0][0] + pts[n - 1][0]) / 2) + ' ' + f3((pts[0][1] + pts[n - 1][1]) / 2);
    for (i = 0; i < n; i++) {
      var p = pts[i], nx = pts[(i + 1) % n];
      d += 'Q' + f3(p[0]) + ' ' + f3(p[1]) + ' ' + f3((p[0] + nx[0]) / 2) + ' ' + f3((p[1] + nx[1]) / 2);
    }
    return d + 'Z';
  }
  function figD(x, feet, h) {       // a scale figure
    function X(v) { return f(x + v * h); } function Y(v) { return f(feet - v * h); }
    var r = 0.065 * h;
    return 'M' + X(-0.12) + ' ' + Y(0.84) + 'L' + X(0.12) + ' ' + Y(0.84) + 'L' + X(0.1) + ' ' + Y(0.5) + 'L' + X(0.11) + ' ' + Y(0) +
      'L' + X(0.03) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0.44) + 'L' + X(-0.03) + ' ' + Y(0) + 'L' + X(-0.11) + ' ' + Y(0) + 'L' + X(-0.1) + ' ' + Y(0.5) + 'Z' +
      'M' + f(x - r) + ' ' + Y(0.925) + 'a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(2 * r) + ' 0a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(-2 * r) + ' 0';
  }

  /* ---------- filters: the wobble and grain of a watercolour wash ---------- */
  var defs = mk('defs', null, svg);
  function wc(id, scale, freq) {
    var fl = mk('filter', { id: id, x: '-4%', y: '-8%', width: '108%', height: '116%', 'color-interpolation-filters': 'sRGB' }, defs);
    mk('feTurbulence', { type: 'fractalNoise', baseFrequency: freq, numOctaves: 2, seed: 4, result: 'n' }, fl);
    mk('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n', scale: scale, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, fl);
    mk('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.55, numOctaves: 2, seed: 9, result: 'g' }, fl);
    mk('feColorMatrix', { 'in': 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.42', result: 'ga' }, fl);
    mk('feComposite', { 'in': 'd', in2: 'ga', operator: 'in' }, fl);
  }
  wc('wcL', 16, 0.016); wc('wcB', 4, 0.03);
  var mask = mk('mask', { id: 'reveal', maskUnits: 'userSpaceOnUse', x: -300, y: -400, width: 2200, height: 1500 }, defs);
  mk('rect', { x: -300, y: -400, width: 2200, height: 1500, fill: '#000' }, mask);
  var gMask = mk('g', { fill: '#fff' }, mask);

  /* ---------- layers ---------- */
  var gSketch = mk('g', { fill: 'none', stroke: C.pencil, 'stroke-width': 0.85, 'stroke-linecap': 'round' }, svg);
  var gPeople = mk('g', { fill: C.ink, opacity: 0 }, svg);
  var gInk = mk('g', { stroke: C.ink, 'stroke-width': 1.3, 'stroke-linejoin': 'miter', 'stroke-linecap': 'square', fill: 'none' }, svg);
  var gStain = mk('g', { style: 'mix-blend-mode:multiply' }, svg);
  var gWash = mk('g', { mask: 'url(#reveal)', style: 'mix-blend-mode:multiply' }, svg);
  var gWashL = mk('g', { filter: 'url(#wcL)' }, gWash);
  var gWashB = mk('g', { filter: 'url(#wcB)' }, gWash);
  var gCrane = mk('g', { stroke: C.ink, 'stroke-width': 0.9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gRain = mk('g', { 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gAnno = mk('g', { stroke: C.red, 'stroke-width': 1, 'stroke-linecap': 'round', fill: 'none' }, svg);
  var gPen = mk('g', { opacity: 0 }, svg);

  /* ---------- pencil: every stroke overshoots its corner a little ---------- */
  var strokes = [];
  function pen(d, parent, extra) {
    var at = { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 };
    if (extra) for (var k in extra) at[k] = extra[k];
    var p = mk('path', at, parent || gSketch);
    strokes.push(p);
    return p;
  }
  function pl(x1, y1, x2, y2, parent, extra) {
    var len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    var o = Math.min(8, 2 + len * 0.04);
    function j() { return (R() - 0.5) * 1.2; }
    var ax = x1 - ux * o * R() + j(), ay = y1 - uy * o * R() + j();
    var bx = x2 + ux * o * R() + j(), by = y2 + uy * o * R() + j();
    var k = (R() - 0.5) * Math.min(len * 0.012, 3);
    pen('M' + f(ax) + ' ' + f(ay) + 'Q' + f((ax + bx) / 2 - uy * k) + ' ' + f((ay + by) / 2 + ux * k) + ' ' + f(bx) + ' ' + f(by), parent, extra);
  }
  function prect(x, y, w, h, parent, extra) {
    pl(x, y, x + w, y, parent, extra); pl(x + w, y, x + w, y + h, parent, extra);
    pl(x + w, y + h, x, y + h, parent, extra); pl(x, y + h, x, y, parent, extra);
  }
  var FAINT = { 'stroke-width': 0.5, opacity: 0.7 };
  var HOUSES = [[1200, 70, 50, 20], [1262, 54, 74, 18], [1330, 60, 44, 18], [1450, 80, 60, 22], [1524, 70, 84, 20], [1590, 60, 40, 18]];
  var PALMS = [[1262, 78], [1352, 92], [1492, 84]];
  var FLOORS = [[528, 540, 622], [432, 444, 528], [334, 348, 432]];

  // 1. setting out: ground, horizon, axes, levels
  pl(-40, G, 1640, G); pl(-40, 572, 330, 572);
  var bubbles = [];
  AX.forEach(function (x, i) {
    pl(x, 262, x, 652, gSketch, FAINT);
    pen('M' + (x - 9) + ' 250a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', gSketch, FAINT);
    var tx = mk('text', { x: x, y: 254, 'class': 'scene-axis', 'text-anchor': 'middle', fill: C.pencil, stroke: 'none', opacity: 0 }, gSketch);
    tx.textContent = String(i + 1); bubbles.push(tx);
  });
  LV.forEach(function (y) { if (y !== G) pl(470, y, 1132, y, gSketch, FAINT); });

  // 2. the building, ghosted (each storey fades as its frame lands)
  var ghosts = [mk('g', null, gSketch), mk('g', null, gSketch), mk('g', null, gSketch), mk('g', null, gSketch)];
  FLOORS.forEach(function (L, k) {
    if (k === 2) prect(496, 334, 608, 14, ghosts[k]); else prect(520, L[0], 560, 12, ghosts[k]);
    AX.forEach(function (x) { pl(x - 5, L[1], x - 5, L[2], ghosts[k]); pl(x + 5, L[1], x + 5, L[2], ghosts[k]); });
  });
  prect(710, 282, 180, 52, ghosts[3]); prect(698, 276, 204, 6, ghosts[3]);
  prect(510, 622, 580, 8);

  // 3. the context: the sea, the island, the Riva of Split, the mountain behind
  pen('M30 572Q120 540 230 572'); pen('M-40 562C40 550 110 553 180 566', gSketch, FAINT);
  pl(330, G, 330, 654); pl(-40, 648, 330, 648);
  var gWater = mk('g', null, gSketch);
  [[40, 590, 120], [150, 606, 90], [20, 622, 150], [230, 618, 70], [250, 588, 60], [90, 636, 110]].forEach(function (w) { pl(w[0], w[1], w[0] + w[2], w[1], gWater, FAINT); });
  var gBoat = mk('g', null, gSketch);
  pen('M172 604L212 604L205 613L178 613Z', gBoat); pl(191, 604, 191, 566, gBoat); pen('M194 570L194 600L212 600Z', gBoat); pen('M188 576L188 600L176 600Z', gBoat);
  pen('M1090 478C1180 430 1260 410 1340 432C1420 392 1520 372 1640 384');
  pen('M1150 500C1230 462 1290 452 1350 468C1440 430 1540 414 1640 422', gSketch, FAINT);
  HOUSES.forEach(function (h) {
    var t = 560 - h[2];
    pl(h[0], 560, h[0], t); pl(h[0] + h[1], t, h[0] + h[1], 560);
    pl(h[0] - 4, t, h[0] + h[1] / 2, t - h[3]); pl(h[0] + h[1] / 2, t - h[3], h[0] + h[1] + 4, t);
    for (var wy = t + 10; wy < 548; wy += 20) for (var wx = h[0] + 9; wx < h[0] + h[1] - 12; wx += 18) prect(wx, wy, 6, 9, gSketch, FAINT);
  });
  prect(1396, 330, 36, 230);   // the bell tower
  [380, 430, 480].forEach(function (y) { pl(1396, y, 1432, y); pen('M1407 ' + (y - 12) + 'v-22a7 7 0 0 1 14 0v22', gSketch, FAINT); });
  prect(1402, 304, 24, 26); pl(1400, 304, 1414, 262); pl(1414, 262, 1428, 304);
  pl(1180, 560, 1640, 560); pl(1180, 560, 1180, G);   // the palace wall and its arcade
  for (var ax0 = 1194; ax0 < 1630; ax0 += 34) {
    pen('M' + ax0 + ' ' + G + 'V598a10 10 0 0 1 20 0V' + G);
    prect(ax0 + 5, 570, 10, 13, gSketch, FAINT);
  }
  pen('M1136 630C1137 570 1139 520 1143 474'); pen('M1147 630C1148 570 1150 520 1151 474');   // umbrella pine
  pen('M1084 470C1078 446 1110 428 1140 432C1166 418 1206 432 1204 458C1210 474 1090 480 1084 470Z');
  pen('M1100 462C1118 450 1136 448 1152 454', gSketch, FAINT); pen('M1140 446C1160 440 1180 444 1192 454', gSketch, FAINT);
  PALMS.forEach(function (pm) {
    var x = pm[0], top = G - pm[1];
    pen('M' + (x - 2) + ' ' + G + 'C' + (x - 3) + ' ' + (G - 40) + ' ' + (x - 1) + ' ' + (top + 20) + ' ' + x + ' ' + top);
    ['q-20 -14 -34 4', 'q20 -14 34 4', 'q-10 -24 -24 -20', 'q10 -24 24 -20', 'q-26 0 -30 18', 'q26 0 30 18', 'q-2 -20 0 -28'].forEach(function (q) { pen('M' + x + ' ' + top + q); });
  });
  [360, 1110, 1300, 1470].forEach(function (hx) { for (var hk = 0; hk < 4; hk++) pl(hx + hk * 9, 646, hx + hk * 9 + 8, 634, gSketch, FAINT); });

  // people on the quay, to scale (a storey is 3.60 m)
  mk('path', { d: figD(1218, G, 50) + figD(352, G, 50) + figD(1560, G, 50) + figD(1574, G, 47) }, gPeople);
  var child = mk('path', { d: figD(368, G, 27) }, gPeople);

  /* ---------- the building, as four lifts ---------- */
  var gRig = mk('g', null, gInk);
  function solid(g, x, y, w, h) { return mk('rect', { x: x, y: y, width: w, height: h, fill: C.paper }, g); }
  function thin(g, d) { return mk('path', { d: d, 'stroke-width': 0.6 }, g); }
  function people(g, d) { mk('path', { d: d, fill: C.ink, stroke: 'none' }, g); }
  function storey(slabY, top, bot, roof) {
    var g = mk('g', { opacity: 0 }, gRig), d = '';
    if (bot === 622) {       // ground floor: glazing set back behind the colonnade
      d = 'M535 556H1065';
      AX.slice(0, 6).forEach(function (x, i) { d += 'M' + (x + 33) + ' 556V622M' + (x + 62) + ' 556V622'; if (i === 2) d += 'M' + (x + 33) + ' 574H' + (x + 62); });
      people(g, figD(668, 622, 50) + figD(846, 622, 50) + figD(858, 622, 48));
    } else {                 // loggias: a door in the back wall, a glass balustrade
      AX.slice(0, 6).forEach(function (x) { d += 'M' + (x + 24) + ' ' + bot + 'V' + (top + 16) + 'H' + (x + 66) + 'V' + bot; });
      d += 'M535 ' + (bot - 28) + 'H1065M535 ' + (bot - 25) + 'H1065';
      if (bot === 528) people(g, figD(1022, 528, 50));
    }
    if (roof) {              // roof terrace rail
      d += 'M504 318H706M894 318H1096';
      for (var x = 504; x <= 1096; x += 32) if (x < 706 || x > 894) d += 'M' + x + ' 318V334';
      people(g, figD(600, 334, 50));
    }
    thin(g, d);
    AX.forEach(function (x) { solid(g, x - 5, top, 10, bot - top); });
    if (roof) solid(g, 496, slabY, 608, 14); else solid(g, 520, slabY, 560, 12);
    return g;
  }
  var MODS = [
    { g: storey(528, 540, 622), cx: 800, top: 528, w: 240 },
    { g: storey(432, 444, 528), cx: 800, top: 432, w: 240 },
    { g: storey(334, 348, 432, true), cx: 800, top: 318, w: 260 },
    { g: (function () {
        var g = mk('g', { opacity: 0 }, gRig), d = '';
        solid(g, 710, 282, 180, 52); solid(g, 698, 276, 204, 6);
        for (var x = 740; x < 890; x += 30) d += 'M' + x + ' 282V334';
        thin(g, d + 'M710 300H890'); return g;
      })(), cx: 800, top: 276, w: 84 }
  ];
  MODS.forEach(function (m, i) { m.ghost = ghosts[i]; });

  // sliding timber shutters, one per loggia, alternating
  var shutters = [];
  [[444, 528, 0], [348, 432, 1]].forEach(function (fl) {
    for (var i = 0; i < 6; i++) {
      var right = (i + fl[2]) % 2, x = AX[i] + (right ? 44 : 6), g = mk('g', { opacity: 0 }, gInk), d = '';
      solid(g, x, fl[0], 40, fl[1] - fl[0] - 28).setAttribute('stroke-width', 1);
      for (var lx = x + 5; lx < x + 40; lx += 5) d += 'M' + lx + ' ' + fl[0] + 'V' + (fl[1] - 28);
      thin(g, d).setAttribute('stroke-width', 0.5);
      shutters.push({ g: g, from: right ? -38 : 38, x: x, top: fl[0], h: fl[1] - fl[0] - 28 });
    }
  });

  /* ---------- watercolour ---------- */
  function wash(parent, d, fill, op) { return mk('path', { d: d, fill: fill, opacity: op }, parent); }
  function rectD(x, y, w, h) { return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'z'; }
  // sky: loose patches that stop short of the paper's edge
  wash(gWashL, 'M70 300C40 190 180 90 420 96C620 60 760 120 900 96C1100 60 1380 80 1500 170C1580 240 1540 330 1420 350C1300 330 1180 380 1040 330C900 300 760 350 600 320C440 350 200 380 70 300Z', C.sky, 0.6);
  wash(gWashL, 'M220 250C240 170 420 140 600 170C760 150 880 200 820 250C700 290 380 300 220 250Z', C.sky, 0.35);
  wash(gWashL, 'M1090 478C1180 430 1260 410 1340 432C1420 392 1520 372 1640 384L1640 560L1090 560Z', C.far, 0.55);
  wash(gWashL, 'M1150 500C1230 462 1290 452 1350 468C1440 430 1540 414 1640 422L1640 560L1150 560Z', C.far, 0.4);
  wash(gWashL, 'M30 572Q120 540 230 572Z', C.isle, 0.6);
  wash(gWashL, 'M-40 573H330V648H-40Z', C.sea, 0.62);
  wash(gWashL, 'M-40 600H330V648H-40Z', C.seaD, 0.3);
  wash(gWashL, 'M-40 632H330V648H-40Z', C.seaD, 0.3);
  wash(gWashL, 'M1080 474C1070 440 1112 420 1142 428C1170 412 1214 430 1208 462C1210 482 1092 484 1080 474Z', C.pine, 0.72);
  wash(gWashL, 'M1110 470C1120 452 1170 450 1190 466C1170 478 1126 478 1110 470Z', C.pine, 0.4);
  PALMS.forEach(function (pm) { wash(gWashL, 'M' + (pm[0] - 36) + ' ' + (G - pm[1] + 8) + 'q36 -46 72 0q-36 16 -72 0z', C.palm, 0.6); });
  wash(gWashL, rectD(330, 631, 1310, 20), C.quay, 0.7);
  wash(gWashL, rectD(-40, 649, 1680, 60), C.quay, 0.28);
  wash(gWashL, 'M520 631H1130L1160 644H540Z', C.cast, 0.3);
  // the town
  wash(gWashB, rectD(1180, 560, 460, 70), C.ochre, 0.62);
  HOUSES.forEach(function (h) {
    var t = 560 - h[2];
    wash(gWashB, rectD(h[0], t, h[1], h[2]), C.ochre, 0.45);
    wash(gWashB, 'M' + (h[0] - 4) + ' ' + t + 'L' + (h[0] + h[1] / 2) + ' ' + (t - h[3]) + 'L' + (h[0] + h[1] + 4) + ' ' + t + 'Z', C.roof, 0.58);
  });
  wash(gWashB, rectD(1396, 304, 36, 256), C.stone, 0.6);
  wash(gWashB, 'M1400 304L1414 262L1428 304Z', C.roof, 0.6);
  wash(gWashB, rectD(1416, 330, 16, 230), C.cast, 0.16);
  for (var ar = 1194; ar < 1630; ar += 34) wash(gWashB, 'M' + ar + ' ' + G + 'V598a10 10 0 0 1 20 0V' + G + 'Z', C.cast, 0.42);
  // the building: stone, deep loggias, glass, timber, and the sun from the upper left
  wash(gWashB, rectD(510, 622, 580, 8), C.stone, 0.75);
  FLOORS.forEach(function (L, k) {
    wash(gWashB, k === 2 ? rectD(496, 334, 608, 14) : rectD(520, L[0], 560, 12), C.stone, 0.7);
    wash(gWashB, rectD(535, L[1], 530, L[2] - L[1]), k ? C.shade : C.glass, k ? 0.62 : 0.6);
    wash(gWashB, rectD(k === 2 ? 520 : 535, L[1], k === 2 ? 560 : 530, k === 2 ? 15 : 9), C.cast, 0.4);
    AX.forEach(function (x) {
      wash(gWashB, rectD(x - 5, L[1], 10, L[2] - L[1]), C.stone, 0.7);
      if (x < 1070) wash(gWashB, rectD(x + 5, L[1], 7, L[2] - L[1]), C.cast, 0.22);
    });
  });
  wash(gWashB, rectD(710, 282, 180, 52), C.glass, 0.6);
  wash(gWashB, rectD(698, 276, 204, 6), C.stone, 0.7);
  wash(gWashB, rectD(710, 282, 180, 8), C.cast, 0.35);
  shutters.forEach(function (s) { wash(gWashB, rectD(s.x, s.top, 40, s.h), C.timber, 0.82); });
  var childWash = mk('path', { d: figD(368, G, 27), fill: C.red, opacity: 0 }, svg);

  /* ---------- the crane, drawn fine ---------- */
  var crane = [];
  function cr(d, a, b, extra) {
    var at = { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 };
    if (extra) for (var k in extra) at[k] = extra[k];
    if (at.fill) at['fill-opacity'] = 0;
    crane.push({ el: mk('path', at, gCrane), a: a, b: b, fill: !!at.fill });
  }
  var MX0 = 396, MX1 = 414, JY0 = 142, JY1 = 154, TROLLEY_Y = 160, X_OUT = 2140, CARRY = 172;
  (function () {
    var z = 'M' + MX0 + ' ' + G, y, x, i = 0;
    for (y = G - 18; y >= 178; y -= 18) { z += 'L' + (i % 2 ? MX0 : MX1) + ' ' + y; i++; }
    cr('M376 ' + G + 'H434M384 ' + G + 'V620H426V' + G, 0, 0.1);
    cr('M' + MX0 + ' ' + G + 'V174', 0.04, 0.5); cr('M' + MX1 + ' ' + G + 'V174', 0.06, 0.52);
    cr(z, 0.1, 0.56, { 'stroke-width': 0.6 });
    cr('M390 174H420V162H390Z', 0.5, 0.58);
    cr('M414 142H440V172H420', 0.52, 0.62);
    cr('M399 162L405 112L411 162', 0.52, 0.66);
    cr('M' + MX1 + ' ' + JY0 + 'H1780', 0.56, 1); cr('M' + MX1 + ' ' + JY1 + 'H1780', 0.58, 1);
    z = 'M' + MX1 + ' ' + JY1; i = 0;
    for (x = MX1 + 14; x <= 1780; x += 14) { z += 'L' + x + ' ' + (i % 2 ? JY1 : JY0); i++; }
    cr(z, 0.6, 1, { 'stroke-width': 0.6 });
    cr('M' + MX0 + ' ' + JY0 + 'H296V154H' + MX0, 0.56, 0.74);
    cr('M302 154H340V180H302Z', 0.66, 0.78, { fill: C.ink });
    cr('M405 112L860 142', 0.7, 0.92, { 'stroke-width': 0.6 }); cr('M405 112L1300 142', 0.72, 1, { 'stroke-width': 0.6 });
    cr('M405 112L310 142', 0.7, 0.84, { 'stroke-width': 0.6 });
  })();
  var gHoist = mk('g', { opacity: 0 }, gCrane);
  var trolley = mk('rect', { x: -11, y: JY1, width: 22, height: 6, fill: C.ink, stroke: 'none' }, gHoist);
  var gSwing = mk('g', null, gHoist);
  var cable = mk('line', { x1: 0, y1: TROLLEY_Y, x2: 0, y2: 178 }, gSwing);
  var hook = mk('path', { d: 'M-3 0h6v5h-6zM0 5v5a3.5 3.5 0 1 1 -3.5 3.5', stroke: C.red, 'stroke-width': 1.1 }, gSwing);
  var slingL = mk('line', { 'stroke-width': 0.7 }, gSwing);
  var slingR = mk('line', { 'stroke-width': 0.7 }, gSwing);

  /* ---------- pigment rain ---------- */
  var RC = [C.sea, C.timber, C.shade, C.pine, C.red, C.sea, C.sky, C.timber];
  var drops = [];
  (function () {
    var rr = rng(31), i, x, y, r, col, g, L;
    for (i = 0; i < 150; i++) {
      x = -20 + rr() * 1640; y = 120 + rr() * 560; r = 4 + rr() * rr() * 18; col = RC[i % RC.length]; L = 34 + rr() * 60;
      g = mk('g', { fill: col, opacity: 0, transform: 'translate(' + f(x) + ' ' + f(y) + ')' }, gStain);
      mk('path', { d: blobD(rr, 8, 0.8, 1.15), opacity: 0.1, transform: 'scale(' + f(r * 1.9) + ')' }, g);
      mk('path', { d: blobD(rr, 8, 0.75, 1.1), opacity: 0.24, transform: 'scale(' + f(r) + ')' }, g);
      drops.push({
        x: x, y: y, s: RA0 + rr() * RAIN_SPREAD, g: g,
        line: mk('line', { x1: 0, y1: 0, x2: f(L * 0.16), y2: f(-L), stroke: col, 'stroke-width': f(0.9 + rr() * 1.3), opacity: 0 }, gRain)
      });
    }
  })();

  /* ---------- the pen: five touches, each releasing a wash ---------- */
  var blooms = [];
  (function () {
    var rr = rng(5);
    TOUCHES.forEach(function (tc) {
      var g = mk('g', { transform: 'translate(' + tc[0] + ' ' + tc[1] + ') scale(0)' }, gMask);
      mk('path', { d: blobD(rr, 16, 0.86, 1.12), opacity: 0.3 }, g);
      mk('path', { d: blobD(rr, 16, 0.8, 1.02), opacity: 0.45, transform: 'scale(0.93)' }, g);
      mk('path', { d: blobD(rr, 16, 0.8, 0.98), transform: 'scale(0.85)' }, g);
      blooms.push(g);
    });
  })();
  (function () {
    var g = mk('g', { transform: 'scale(1.3)' }, gPen);
    mk('polygon', { points: '-4.2,-34 -5,-176 5,-176 4.2,-34', fill: C.ink }, g);
    mk('rect', { x: -5, y: -188, width: 10, height: 12, fill: '#2B2A26' }, g);
    mk('rect', { x: -5.2, y: -150, width: 10.4, height: 3, fill: C.red }, g);
    mk('polygon', { points: '-4.2,-34 4.2,-34 3.4,-56 -3.4,-56', fill: '#3A3833' }, g);
    mk('polygon', { points: '-3,-34 3,-34 1,-8 -1,-8', fill: '#9A978F' }, g);
    mk('line', { x1: 0, y1: -8, x2: 0, y2: 0, stroke: C.ink, 'stroke-width': 1.1 }, g);
    mk('line', { x1: -2, y1: -64, x2: -2.6, y2: -170, stroke: '#6B6860', 'stroke-width': 1 }, g);
  })();

  /* ---------- the red notes ---------- */
  var annos = [];
  function an(d, a, b) { annos.push({ el: mk('path', { d: d, pathLength: 1, 'stroke-dasharray': '1 1.5', 'stroke-dashoffset': 1 }, gAnno), a: a, b: b }); }
  function note(x, y, text, a, anchor) {
    var t = mk('text', { x: x, y: y, 'class': 'scene-note', fill: C.red, stroke: 'none', opacity: 0, 'text-anchor': anchor || 'start' }, gAnno);
    t.textContent = text; annos.push({ el: t, a: a, b: Math.min(1, a + 0.15), text: true });
  }
  an('M380 603V630M376 603H384M376 630H384', 0.22, 0.34); note(380, 595, '95 cm', 0.3, 'middle');
  ['±0.00', '+3.60', '+7.20', '+10.80'].forEach(function (lab, i) {
    var y = LV[i];
    an('M486 ' + y + 'H452M470 ' + y + 'l-4 -7h8z', 0.2 + i * 0.08, 0.36 + i * 0.08); note(446, y + 4, lab, 0.3 + i * 0.08, 'end');
  });
  (function () { var d = 'M530 668H1070'; AX.forEach(function (x) { d += 'M' + x + ' 663V673'; }); an(d, 0.45, 0.75); })();
  note(800, 690, '6 × 5.40 m', 0.7, 'middle');
  an('M1104 334L1124 308', 0.55, 0.7); note(1128, 304, 'building', 0.65);
  an('M1036 392H1112', 0.62, 0.77); note(1118, 396, 'room', 0.72);
  an('M1432 330L1452 306', 0.7, 0.85); note(1456, 302, 'city', 0.8);

  /* ---------- render ---------- */
  var maskOn = true;
  function render(t, idle) {
    var i, p, N = strokes.length, sk = seg(t, SK0, SK1), a;

    for (i = 0; i < N; i++) { a = i / N * 0.84; set(strokes[i], 'stroke-dashoffset', f3(1 - ease.inOut(seg(sk, a, a + 0.16)))); }
    for (i = 0; i < bubbles.length; i++) set(bubbles[i], 'opacity', f(seg(sk, 0.12 + i * 0.02, 0.2 + i * 0.02)));
    set(gPeople, 'opacity', f(seg(sk, 0.86, 1)));

    var cIn = seg(t, CR0, CR1), cOut = seg(t, CX0, CX1), c = cIn * (1 - ease.inOut(cOut));
    for (i = 0; i < crane.length; i++) {
      p = ease.inOut(seg(c, crane[i].a, crane[i].b));
      set(crane[i].el, 'stroke-dashoffset', f3(1 - p));
      if (crane[i].fill) set(crane[i].el, 'fill-opacity', f(p * p));
    }
    set(gCrane, 'opacity', c <= 0 ? 0 : 1);

    var k = Math.floor((t - BU0) / CYC), act = k >= 0 && k < NP, u = t - BU0 - k * CYC;
    var tx = X_OUT, hy = 176, th = 0;
    MODS.forEach(function (m, idx) {
      if (idx > k || t < BU0) { set(m.g, 'opacity', 0); set(m.ghost, 'opacity', 1); return; }
      set(m.g, 'opacity', 1);
      if (idx < k || u >= 0.94) { set(m.g, 'transform', ''); set(m.ghost, 'opacity', 0); }
    });
    if (act) {
      var m = MODS[k];
      if (u < 0.62) tx = lerp(X_OUT, m.cx, ease.inOut(u / 0.62));
      else if (u < 0.97) tx = m.cx;
      else tx = lerp(m.cx, X_OUT, ease.inOut(seg(u, 0.97, CYC)));
      var dy = (CARRY - m.top) * (1 - ease.inOut(seg(u, 0.48, 0.94)));
      th = 1.5 * Math.sin(u * 8) * (1 - seg(u, 0.3, 0.86)) * seg(u, 0, 0.1);
      if (u < 0.94) {
        hy = m.top + dy - 22;
        set(m.g, 'transform', 'rotate(' + f(th) + ' ' + f(tx) + ' ' + TROLLEY_Y + ') translate(' + f(tx - m.cx) + ' ' + f(dy) + ')');
        set(m.ghost, 'opacity', f(1 - seg(u, 0.8, 0.94)));
        set(slingL, 'opacity', 1); set(slingR, 'opacity', 1);
        set(slingL, 'x1', f(tx)); set(slingL, 'y1', f(hy + 12)); set(slingL, 'x2', f(tx - m.w)); set(slingL, 'y2', f(m.top + dy));
        set(slingR, 'x1', f(tx)); set(slingR, 'y1', f(hy + 12)); set(slingR, 'x2', f(tx + m.w)); set(slingR, 'y2', f(m.top + dy));
      } else {
        hy = lerp(m.top - 22, 176, ease.out(seg(u, 0.94, 1.1)));
        set(slingL, 'opacity', 0); set(slingR, 'opacity', 0);
      }
    } else { set(slingL, 'opacity', 0); set(slingR, 'opacity', 0); }
    set(gHoist, 'opacity', cIn >= 1 ? f(1 - seg(cOut, 0, 0.12)) : 0);
    set(trolley, 'transform', 'translate(' + f(tx) + ' 0)');
    set(gSwing, 'transform', 'rotate(' + f(th) + ' ' + f(tx) + ' ' + TROLLEY_Y + ')');
    set(cable, 'x1', f(tx)); set(cable, 'x2', f(tx)); set(cable, 'y2', f(hy));
    set(hook, 'transform', 'translate(' + f(tx) + ' ' + f(hy) + ')');

    // shutters slide home in a ripple
    for (i = 0; i < shutters.length; i++) {
      var s0 = SH0 + i * 0.05; p = ease.out5(seg(t, s0, s0 + 0.5));
      set(shutters[i].g, 'opacity', f(seg(t, s0, s0 + 0.15)));
      set(shutters[i].g, 'transform', p >= 1 ? '' : 'translate(' + f(shutters[i].from * (1 - p)) + ' 0)');
    }

    // rain
    var absorbed = seg(t, PE0 + 1.2, PE1 - 0.2);
    for (i = 0; i < drops.length; i++) {
      var d = drops[i], q = seg(t, d.s, d.s + FALL);
      if (q > 0 && q < 1) {
        var q2 = q * q;
        set(d.line, 'opacity', 0.85);
        set(d.line, 'transform', 'translate(' + f(d.x + (1 - q2) * 130) + ' ' + f(d.y - (1 - q2) * 820) + ')');
      } else set(d.line, 'opacity', 0);
      set(d.g, 'opacity', f3(ease.out(seg(t, d.s + FALL, d.s + FALL + 0.5)) * (1 - absorbed)));
    }

    // the pen
    var done = t >= PE1, px = 1760, py = -120, po = 0, n = TOUCHES.length;
    if (done !== !maskOn) {
      maskOn = !done;
      if (done) gWash.removeAttribute('mask'); else gWash.setAttribute('mask', 'url(#reveal)');
    }
    if (!done) for (i = 0; i < n; i++) {
      var b = ease.out(seg(t, PE0 + i * TOUCH, PE0 + i * TOUCH + BLOOM));
      set(blooms[i], 'transform', 'translate(' + TOUCHES[i][0] + ' ' + TOUCHES[i][1] + ') scale(' + f(b * TOUCHES[i][2] * 1.25) + ')');
    }
    var an01 = seg(t, AN0, AN1);
    if (t >= PE0 - 0.5 && t < AN0) {
      var ti = Math.floor((t - PE0) / TOUCH), from, to, mv;
      if (t < PE0) { from = [1760, -120]; to = TOUCHES[0]; mv = ease.inOut(seg(t, PE0 - 0.5, PE0)); po = seg(t, PE0 - 0.5, PE0 - 0.3); }
      else { from = TOUCHES[ti]; to = TOUCHES[Math.min(n - 1, ti + 1)]; mv = ease.inOut(seg(t - PE0 - ti * TOUCH, 0.14, TOUCH)); po = 1; }
      px = lerp(from[0], to[0], mv); py = lerp(from[1], to[1], mv) - 46 * Math.sin(Math.PI * mv);
    } else if (t >= AN0 && an01 < 1) {
      var last = TOUCHES[n - 1];
      if (an01 < 0.22) { p = ease.inOut(an01 / 0.22); px = lerp(last[0], 380, p); py = lerp(last[1], 603, p) - 30 * Math.sin(Math.PI * p); po = 1; }
      else if (an01 < 0.34) { px = 380; py = lerp(603, 630, ease.inOut(seg(an01, 0.22, 0.34))); po = 1; }
      else { p = ease.inOut(seg(an01, 0.34, 0.74)); px = lerp(380, 120, p); py = lerp(630, 860, p); po = 1 - seg(an01, 0.54, 0.74); }
    }
    set(gPen, 'opacity', f(po));
    if (po > 0) set(gPen, 'transform', 'translate(' + f(px) + ' ' + f(py) + ') rotate(' + f(27 + (px - 800) * 0.006) + ')');

    for (i = 0; i < annos.length; i++) {
      p = ease.inOut(seg(an01, annos[i].a, annos[i].b));
      if (annos[i].text) set(annos[i].el, 'opacity', f(p)); else set(annos[i].el, 'stroke-dashoffset', f3(1 - p));
    }
    set(childWash, 'opacity', f(seg(an01, 0.2, 0.36)));
    set(child, 'opacity', f(1 - seg(an01, 0.2, 0.36)));

    // the finished sheet barely moves: the boat drifts, the water shifts
    var live = idle || 0, on = t >= END;
    set(gBoat, 'transform', on ? 'translate(' + f(12 * Math.sin(live * 0.18)) + ' ' + f(1.2 * Math.sin(live * 1.2)) + ')' : '');
    set(gWater, 'transform', on ? 'translate(' + f(7 * Math.sin(live * 0.5)) + ' 0)' : '');
  }

  /* ---------- player ---------- */
  var scrub = document.getElementById('scrub');
  var replay = document.getElementById('replay');
  var phase = document.getElementById('phase');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 700px)');
  var t = 0, idle = 0, playing = false, visible = true, lastTs = 0, raf = 0, lastPhase = '';
  var NAMES = [[BU0, 'Setting out'], [RA0, 'Assembly'], [PE0, 'Pigment'], [END, 'The pen'], [Infinity, 'Finished']];

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
  function setView() { svg.setAttribute('viewBox', narrow.matches ? '330 84 800 624' : '0 84 1600 624'); }

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
