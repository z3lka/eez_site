/* Behaviour shared by the three versions: one entrance, measured figures that
   count up, the 95 cm rule, the letter form. Lifted from the root main.js. */
(function () {
  'use strict';

  // TODO before launch: Elif's real address.
  var CONTACT_EMAIL = 'hello@example.com';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* One entrance for everything marked data-rv; drawings draw on with it. */
  var items = [].slice.call(document.querySelectorAll('[data-rv], [data-fig]'));
  function show(el) {
    el.classList.add('in');
    [].forEach.call(el.querySelectorAll('[data-count]'), count);
    if (el.hasAttribute('data-count')) count(el);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(show);

  /* Running head and folio (v2): name the spread on the reading line. */
  var rs = document.getElementById('rs'), pg = document.getElementById('pg');
  if (rs && 'IntersectionObserver' in window) {
    var chrome = [].slice.call(document.querySelectorAll('.rh, .fl'));
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        rs.textContent = e.target.getAttribute('data-s');
        if (pg) pg.textContent = e.target.getAttribute('data-p');
        var dk = e.target.classList.contains('dk');
        chrome.forEach(function (c) { c.classList.toggle('dk', dk); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    [].forEach.call(document.querySelectorAll('[data-s]'), function (s) { spy.observe(s); });
  }

  /* 95 cm at 1 : 1 (v3). The rule is 95 CSS centimetres long; the figure reads
     the height above the ground at the middle of the window. */
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

  /* The letter: validate, then hand a written email to the visitor's mail app. */
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
      var body = msg.value.trim() + '\n\n' + name.value.trim() + '\n' + email.value.trim();
      location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('From ' + name.value.trim()) + '&body=' + encodeURIComponent(body);
    });
  }
})();
