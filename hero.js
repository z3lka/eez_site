/* The hero: the visitor holds the pen.
   The page opens on a line drawing that draws itself in about a second. Wherever
   the pointer moves, the finished image develops under it like wet colour
   spreading. Left alone, the sheet finishes itself in two or three seconds.

   Two aligned images (assets/hero-line.jpg, assets/hero-colour.jpg) and one
   small mask, composited in a WebGL fragment shader. Swap the two files for any
   other pair of the same view and nothing else changes. */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('pen');
  if (!stage || !canvas) return;
  var hint = document.getElementById('hint');
  var replay = document.getElementById('replay');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function fallback() { stage.classList.add('no-gl'); if (replay) replay.hidden = true; }
  var gl = !reduce.matches && (canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl'));
  if (!gl) { fallback(); return; }

  /* ---------- timing (seconds) ---------- */
  var DRAW0 = 0.15, DRAW = 1.15;      // the line drawing arrives
  var WAIT_FIRST = 0.7;               // untouched: how long after the drawing before it finishes itself
  var WAIT_IDLE = 1.8;                // touched, then left alone
  var AUTO = 2.3;                     // how long the self-finish takes
  var STAMP = 1.25;                   // how long one touch keeps spreading

  /* ---------- shader ---------- */
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D uLine,uCol,uMask;',
    'uniform vec2 uRes;uniform float uAspect,uDraw,uFull;',
    'const vec3 PAPER=vec3(.957,.945,.918);',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+11.;a*=.5;}return s;}',
    'void main(){',
    ' float ca=uRes.x/uRes.y;',
    ' vec2 s=ca>uAspect?vec2(1.,uAspect/ca):vec2(ca/uAspect,1.);',   // object-fit: cover
    ' vec2 iuv=(v-.5)*s+.5;iuv.y=1.-iuv.y;',
    ' vec2 q=vec2(v.x*ca,v.y);',
    ' float n=fbm(q*4.5),g=fbm(q*26.+7.);',
    ' vec3 col=texture2D(uCol,iuv).rgb;',
    ' float l=pow(texture2D(uLine,iuv).r,2.0);',
    // the drawing arrives from the upper left, as a hand would work across a sheet
    ' float d=v.x*.72+(1.-v.y)*.28+(n-.5)*.22;',
    ' float vis=smoothstep(d-.14,d+.02,uDraw*1.42-.16);',
    ' vec3 c=mix(PAPER,PAPER*l,vis);',
    // wet colour: the mask, broken up by noise so its edge creeps like a wash
    ' float m=texture2D(uMask,vec2(v.x,1.-v.y)).r;',
    ' float a=smoothstep(.4,.6,m*1.25+(n-.5)*.62+(g-.5)*.14);',
    ' a=max(a,uFull);',
    ' vec3 wash=mix(PAPER*mix(vec3(1.),col,.85),col,smoothstep(.55,1.,a));', // thin at first, then full
    ' c=mix(c,wash,a);',
    ' c*=1.-.2*a*(1.-a)*4.*(1.-uFull);',                                    // pigment pools at the wet edge
    ' c*=.988+.024*g;',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  var prog = gl.createProgram();
  if (!vs || !fs) { fallback(); return; }
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallback(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uLine', 'uCol', 'uMask', 'uRes', 'uAspect', 'uDraw', 'uFull'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  function texture(unit, source) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    return t;
  }

  /* ---------- the mask: a small canvas the touches are painted into ---------- */
  var mask = document.createElement('canvas'), mctx = mask.getContext('2d');
  var MW = 288, blooms = [], maskDirty = true;
  function resetMask() {
    mctx.globalCompositeOperation = 'source-over';
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height);
    mctx.globalCompositeOperation = 'lighter';
    blooms.length = 0; maskDirty = true;
  }
  function paint(now) {
    for (var i = blooms.length - 1; i >= 0; i--) {
      var b = blooms[i], k = (now - b.t0) / b.dur;
      if (k < 0) continue;
      if (k >= 1) { blooms.splice(i, 1); k = 1; }
      var e = 1 - Math.pow(1 - k, 3), r = (b.r0 + (b.r1 - b.r0) * e) * mask.width;
      var x = b.x * mask.width, y = b.y * mask.height;
      var g = mctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.5, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x, y, r, 0, 6.2832); mctx.fill();
      maskDirty = true;
    }
  }

  /* ---------- state ---------- */
  var W = 1, H = 1, start = 0, lastTouch = -1, autoAt = -1, full = 0, raf = 0, visible = true, ready = false;
  var lastX = -1, lastY = -1, maskTex, touched = false;

  function size() {
    var r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
    var mh = Math.max(1, Math.round(MW * r.height / Math.max(1, r.width)));
    if (mask.width !== MW || mask.height !== mh) {
      mask.width = MW; mask.height = mh; resetMask();
      if (full >= 1) { mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, MW, mh); }
    }
  }
  function now() { return performance.now() / 1000; }

  function draw(t) {
    var el = t - start;
    var d = Math.min(1, Math.max(0, (el - DRAW0) / DRAW)); d = 1 - Math.pow(1 - d, 2.2);
    // left alone, the sheet finishes itself
    if (full < 1 && autoAt < 0 && el > DRAW0 + DRAW) {
      var quiet = touched ? t - lastTouch > WAIT_IDLE : el > DRAW0 + DRAW + WAIT_FIRST;
      if (quiet) {
        autoAt = t; if (hint) hint.classList.add('gone');
        var pts = [[0.2, 0.3], [0.52, 0.55], [0.82, 0.3], [0.1, 0.8], [0.4, 0.15], [0.7, 0.8], [0.95, 0.65], [0.3, 0.6]];
        pts.forEach(function (p, i) { blooms.push({ x: p[0], y: p[1], r0: 0.01, r1: 0.5, t0: t + i * 0.11, dur: AUTO - 0.5 }); });
      }
    }
    if (autoAt >= 0 && full < 1) full = Math.min(1, Math.max(0, (t - autoAt - (AUTO - 0.7)) / 0.7));
    paint(t);
    if (maskDirty) {
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      maskDirty = false;
    }
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uDraw, d); gl.uniform1f(U.uFull, full * full * (3 - 2 * full));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return d < 1 || blooms.length > 0 || full < 1;
  }
  function tick() {
    raf = 0;
    var more = draw(now());
    if (more && visible && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function wake() { if (ready && !raf) raf = requestAnimationFrame(tick); }

  function stamp(e, big) {
    if (!ready || full >= 1 || autoAt >= 0) return;
    var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    var t = now(), dx = (x - lastX) * r.width, dy = (y - lastY) * r.height;
    if (!big && lastX >= 0 && dx * dx + dy * dy < 14 * 14) return;
    lastX = x; lastY = y; lastTouch = t;
    if (!touched) { touched = true; if (hint) hint.classList.add('gone'); }
    if (t - start < DRAW0 + DRAW * 0.6) return;        // let the drawing land first
    blooms.push({ x: x, y: y, r0: 0.012, r1: (big ? 0.2 : 0.085) + Math.random() * 0.05, t0: t, dur: STAMP });
    if (blooms.length > 90) blooms.shift();
    wake();
  }

  function begin() {
    start = now(); lastTouch = -1; autoAt = -1; full = 0; touched = false; lastX = lastY = -1;
    resetMask(); if (hint) hint.classList.remove('gone');
    wake();
  }

  /* ---------- load the pair ---------- */
  var line = new Image(), col = new Image(), left = 2;
  function loaded() {
    if (--left) return;
    texture(0, line); texture(1, col); maskTex = texture(2, null);
    gl.uniform1i(U.uLine, 0); gl.uniform1i(U.uCol, 1); gl.uniform1i(U.uMask, 2);
    gl.uniform1f(U.uAspect, col.naturalWidth / col.naturalHeight);
    size(); ready = true; stage.classList.add('is-live');
    var qs = /[?&]t=([^&]+)/.exec(location.search);   // ?t=end or ?t=1.2 freezes a frame, for checking
    if (qs) {
      if (qs[1] === 'end') { if (hint) hint.classList.add('gone'); start = now() - 9; full = 1; mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, mask.width, mask.height); maskDirty = true; draw(now()); }
      else { var ft = parseFloat(qs[1]) || 0, base = now(), k; start = base; for (k = 0; k <= ft; k += 1 / 30) draw(base + k); }
      return;
    }
    begin();
  }
  line.onload = col.onload = loaded;
  line.onerror = col.onerror = fallback;
  line.src = stage.getAttribute('data-line'); col.src = stage.getAttribute('data-colour');

  stage.addEventListener('pointermove', function (e) { stamp(e, false); });
  stage.addEventListener('pointerdown', function (e) { stamp(e, true); });
  if (replay) replay.addEventListener('click', begin);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); fallback(); });
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (ready) { size(); draw(now()); wake(); } }, 120); });
  document.addEventListener('visibilitychange', wake);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }, { threshold: 0.02 }).observe(stage);
  }
})();
