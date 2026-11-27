/* The picture frame: ../v6/reel.js, taking its cue from tour.js and holding
   pictures as well as films. After a project's line drawing has been drawn,
   four drafting lines travel in from the edges and close into a frame. A film's
   still prints inside it and the film then plays there, muted. A photograph
   prints as a blueprint and then develops into its own colours; a drawing stays
   a print. Scrolling on opens the frame again.
   Players are only loaded for the project being read. */
(function () {
  'use strict';
  var stage = document.querySelector('.stage');
  if (!stage || !window.TOUR) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;

  var reel = document.createElement('div');
  reel.className = 'reel';
  reel.innerHTML =
    '<i class="rl rl-t"></i><i class="rl rl-b"></i><i class="rl rl-l"></i><i class="rl rl-r"></i>' +
    '<i class="rx rx-1"></i><i class="rx rx-2"></i>' +
    '<div class="frame"><img class="print" alt=""><img class="orig" alt=""><div class="hold"></div>' +
    '<button type="button" class="play" hidden>Play film</button></div>' +
    '<p class="rcap"><span class="rt"></span><button type="button" class="snd">Sound on</button><a class="ext" target="_blank" rel="noopener">Open film</a></p>';
  document.body.appendChild(reel);
  var frame = reel.querySelector('.frame'), img = frame.querySelector('.print'), orig = frame.querySelector('.orig'), hold = frame.querySelector('.hold');
  var play = frame.querySelector('.play'), snd = reel.querySelector('.snd'), ext = reel.querySelector('.ext'), rt = reel.querySelector('.rt');

  var cur = null, shown = null, A = 0, a = 0, raf = 0, last = 0, mounted = false, liveTimer = 0;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* what a project puts in the frame: its film, or the picture marked data-lead */
  function lead(art) { return art.querySelector('img[data-lead]'); }
  function has(art) { return !!art && (art.hasAttribute('data-video') || !!lead(art)); }
  function film() { return !!shown && shown.hasAttribute('data-video'); }

  function src(art, sound) {
    var v = art.getAttribute('data-video').split(':'), q;
    if (v[0] === 'youtube') {
      q = 'autoplay=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=' + v[1] + (sound ? '' : '&mute=1&controls=0');
      return 'https://www.youtube-nocookie.com/embed/' + v[1] + '?' + q;
    }
    q = 'autoplay=1&loop=1&dnt=1&title=0&byline=0&portrait=0&playsinline=1' + (sound ? '' : '&muted=1&controls=0');
    return 'https://player.vimeo.com/video/' + v[1] + '?' + q;
  }
  function unmount() {
    clearTimeout(liveTimer); hold.innerHTML = ''; mounted = false;
    frame.classList.remove('live'); frame.classList.remove('blocked'); frame.classList.remove('dev'); snd.hidden = !film(); play.textContent = 'Play film';
  }
  function mount(sound) {
    if (!film()) return;
    clearTimeout(liveTimer);
    var f = document.createElement('iframe');
    f.src = src(shown, sound); f.title = shown.getAttribute('data-title');
    f.allow = 'autoplay; fullscreen; picture-in-picture'; f.referrerPolicy = 'strict-origin-when-cross-origin'; f.setAttribute('allowfullscreen', '');
    var vimeo = shown.getAttribute('data-video').indexOf('vimeo') === 0;
    f.addEventListener('load', function () {
      if (!vimeo) { liveTimer = setTimeout(function () { frame.classList.add('live'); }, 900); return; }
      /* Vimeo's player answers a ping; a network that blocks Vimeo serves a page that never does.
         Without an answer the still stays up and a button offers to try anyway. */
      try { f.contentWindow.postMessage(JSON.stringify({ method: 'ping' }), 'https://player.vimeo.com'); f.contentWindow.postMessage({ method: 'ping' }, 'https://player.vimeo.com'); } catch (e) {}
      liveTimer = setTimeout(function () { if (!frame.classList.contains('live')) { frame.classList.add('blocked'); play.textContent = 'Film did not load here. Try anyway'; play.hidden = false; } }, 5000);
    });
    frame.classList.remove('blocked');
    hold.innerHTML = ''; hold.appendChild(f); mounted = true; play.hidden = true;
    if (sound) snd.hidden = true;
  }

  function layout() {
    var s = stage.getBoundingClientRect(), hud = stage.querySelector('.hud').getBoundingClientRect();
    var small = s.width < 520, pad = small ? 12 : 44;
    var top = hud.bottom - s.top + (small ? 10 : 26), capH = small ? 34 : 54, bottom = small ? 6 : 92;
    var availH = Math.max(80, s.height - top - capH - bottom), availW = s.width - pad * 2;
    var pic = shown && !film() ? lead(shown) : null;
    var ratio = pic ? pic.getAttribute('width') / pic.getAttribute('height') : shown ? parseFloat(shown.getAttribute('data-ratio')) || 16 / 9 : 16 / 9;
    var w = Math.min(availW, availH * ratio), h = w / ratio;
    var x = (s.width - w) / 2, y = top + (availH - h) / 2;
    reel.style.left = s.left + 'px'; reel.style.top = s.top + 'px'; reel.style.width = s.width + 'px'; reel.style.height = s.height + 'px';
    reel.style.setProperty('--fx', x + 'px'); reel.style.setProperty('--fy', y + 'px');
    reel.style.setProperty('--fw', w + 'px'); reel.style.setProperty('--fh', h + 'px');
    reel.style.setProperty('--gr', (s.width - x - w) + 'px'); reel.style.setProperty('--gb', (s.height - y - h) + 'px');
  }
  function show(art) {
    shown = art; unmount();
    var pic = film() ? null : lead(art), fc;
    frame.classList.toggle('still', !!pic);
    frame.classList.toggle('ln', !!pic && pic.closest('figure').classList.contains('ln'));
    if (pic) {
      fc = pic.closest('figure').querySelector('figcaption');
      img.src = orig.src = pic.getAttribute('src');
      rt.textContent = art.querySelector('h3').textContent + (fc ? ' · ' + fc.textContent : '');
      ext.hidden = true; play.hidden = true;
    } else {
      img.src = art.getAttribute('data-poster'); orig.removeAttribute('src');
      rt.textContent = art.getAttribute('data-title') + ' · film: ' + art.getAttribute('data-by');
      ext.href = art.getAttribute('data-href'); ext.hidden = false;
      play.hidden = !reduce.matches;
    }
    layout();
  }

  function measure() {
    var t = TOUR.read();
    if (has(t.art) && t.pic > 0) { cur = t.art; A = t.pic; } else { cur = null; A = 0; }
  }
  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var target = cur && cur === shown ? A : 0;          /* open the old frame before closing a new one */
    a += (target - a) * (reduce.matches ? 1 : 1 - Math.exp(-dt * 7));
    if (a < 0.02 && cur !== shown) { if (cur) show(cur); else { shown = null; unmount(); } }
    target = cur && cur === shown ? A : 0;              /* the new frame may start closing at once */
    reel.style.setProperty('--a', a.toFixed(4));
    root.style.setProperty('--reel', a.toFixed(4));
    reel.classList.toggle('on', a > 0.9);
    if (a > 0.97 && !mounted && !reduce.matches && film()) mount(false);
    frame.classList.toggle('dev', a > 0.95 && !film());
    if (a < 0.6 && mounted) unmount();
    if (Math.abs(target - a) > 0.002 || (cur !== shown)) kick(); else a = target;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function onScroll() { measure(); kick(); }

  snd.addEventListener('click', function () { mount(true); });
  play.addEventListener('click', function () {
    if (frame.classList.contains('blocked')) { clearTimeout(liveTimer); frame.classList.remove('blocked'); frame.classList.add('live'); play.hidden = true; return; }
    mount(true);
  });
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://player.vimeo.com' || !mounted) return;
    clearTimeout(liveTimer); frame.classList.remove('blocked'); frame.classList.add('live'); play.hidden = true;
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); onScroll(); });
  document.addEventListener('toggle', function () { onScroll(); }, true);   /* opening a story moves everything */
  document.addEventListener('visibilitychange', function () { if (document.hidden && mounted) unmount(); else onScroll(); });
  last = performance.now(); layout(); onScroll();
})();
