/* Page behaviour: section entrances, the work index, the verbs, the letter form. */
(function () {
  'use strict';

  // TODO before launch: Elif's real address.
  var CONTACT_EMAIL = 'hello@example.com';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Entrances: each part of a section rises in turn, once. */
  var sections = document.querySelectorAll('[data-rv]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    sections.forEach(function (s) { io.observe(s); });
  } else sections.forEach(function (s) { s.classList.add('in'); });

  /* Parts that arrive on their own: the blocks down the 95 cm sheet, every photograph. */
  var items = [].slice.call(document.querySelectorAll('[data-ri], .photo'));
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in', 'seen-it'); io2.unobserve(e.target);
        [].forEach.call(e.target.querySelectorAll('[data-count]'), count);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    items.forEach(function (el) { io2.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in', 'seen-it'); });
  [].forEach.call(document.querySelectorAll('.row'), function (r, i) { r.style.setProperty('--i', i); });
  [].forEach.call(document.querySelectorAll('.back-name span'), function (l, i) { l.style.setProperty('--i', i); });

  /* A measured figure counts up to its value, once. */
  function count(el) {
    var m = /^(\D*)([\d.]+)(\D*)$/.exec(el.textContent.trim());
    if (!m || reduce) return;
    var end = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), final = el.textContent;
    (function step(now) {
      var k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 4);
      el.textContent = k < 1 ? m[1] + (end * e).toFixed(dec) + m[3] : final;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* The bar says which sheet is on the desk. */
  var links = [].slice.call(document.querySelectorAll('.bar ul a'));
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var ioNav = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = byId[e.target.id]; if (!a) return;
        if (e.isIntersecting) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) ioNav.observe(el); });
  }

  /* 95 cm at 1 : 1. The rule is 95 CSS centimetres long; the figure reads the
     height above the ground at the middle of the window. */
  var rule = document.getElementById('rule95'), cm = document.getElementById('cm');
  if (rule && cm) {
    for (var c = 0; c <= 95; c += 5) {
      var tk = document.createElement('i');
      tk.className = 'tick' + (c % 10 === 0 ? ' major' : '');
      tk.style.top = ((95 - c) / 95 * 100) + '%';
      if (c % 10 === 0 && c > 0) { var lb = document.createElement('span'); lb.textContent = c; tk.appendChild(lb); }
      rule.appendChild(tk);
    }
    var busy = false, shown = 95;
    var readRule = function () {
      busy = false;
      var r = rule.getBoundingClientRect();
      var h = Math.round(95 * (r.bottom - window.innerHeight * 0.5) / r.height);
      h = Math.max(0, Math.min(95, h));
      if (h !== shown) { shown = h; cm.textContent = h; }
    };
    var onRule = function () { if (!busy) { busy = true; requestAnimationFrame(readRule); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) window.addEventListener('scroll', onRule, { passive: true });
        else window.removeEventListener('scroll', onRule);
        readRule();
      }).observe(rule);
    }
  }

  /* The index: point at a line, its plate comes up in the frame. */
  var index = document.querySelector('.index');
  if (index) {
    var frame = index.querySelector('.frame');
    var rows = [].slice.call(index.querySelectorAll('.row'));
    var wide = window.matchMedia('(min-width: 900px)');
    var place = function () {
      rows.forEach(function (r) {
        var p = r._plate || (r._plate = r.querySelector('.plate'));
        (wide.matches ? frame : r).appendChild(p);
      });
      index.classList.toggle('is-framed', wide.matches);
    };
    var select = function (row) {
      rows.forEach(function (r) {
        var on = r === row;
        r.classList.toggle('is-on', on);
        r._plate.classList.toggle('is-on', on);
        r.querySelector('button').setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
    place(); select(rows[0]);
    if (wide.addEventListener) wide.addEventListener('change', place);
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    rows.forEach(function (r) {
      var b = r.querySelector('button');
      b.addEventListener('click', function () { select(r); });
      b.addEventListener('focus', function () { select(r); });
      r.addEventListener('pointerenter', function () { if (fine.matches) select(r); });
    });
  }

  /* The seven verbs light up one at a time as they cross the reading line. */
  var wordsEl = document.querySelector('[data-words]');
  if (wordsEl) {
    var spans = [].slice.call(wordsEl.children);
    if (reduce || !('IntersectionObserver' in window)) spans.forEach(function (s) { s.classList.add('on'); });
    else {
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = wordsEl.getBoundingClientRect(), vh = window.innerHeight;
        var p = (vh * 0.82 - r.top) / (r.height + vh * 0.32);
        var n = Math.floor(Math.max(0, Math.min(1, p)) * (spans.length + 0.999));
        spans.forEach(function (s, i) { s.classList.toggle('on', i < n); });
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) window.addEventListener('scroll', onScroll, { passive: true });
        else window.removeEventListener('scroll', onScroll);
        update();
      }).observe(wordsEl);
    }
  }

  /* The coupon: validate, then hand a written email to the visitor's mail app. */
  var form = document.getElementById('write');
  if (form) {
    var err = document.getElementById('form-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
      var bad = null, why = '';
      if (!name.value.trim()) { bad = name; why = 'Add your name so Elif knows who is writing.'; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { bad = email; why = 'That email address looks incomplete. Check it and try again.'; }
      else if (!msg.value.trim()) { bad = msg; why = 'Add a line or two about the project.'; }
      [name, email, msg].forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (bad) { err.textContent = why; err.hidden = false; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
      err.hidden = true;
      var scale = form.elements.scale.value;
      var body = msg.value.trim() + '\n\nScale: ' + scale + '\n' + name.value.trim() + '\n' + email.value.trim();
      location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(scale + ', from ' + name.value.trim()) + '&body=' + encodeURIComponent(body);
    });
  }
})();
