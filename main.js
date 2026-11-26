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
