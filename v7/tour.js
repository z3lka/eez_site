/* Where the reader is. One project is being read at a time: the last one whose
   top has crossed the reading line. From how far it has crossed come three
   numbers, all 0 to 1 and all driven by scroll alone:
   wire: how present the project's line drawing is; f: how much of it is drawn;
   pic: how far the picture frame has closed over it.
   The drawing comes first, the picture or film after it, and both leave
   before the next project starts. */
(function () {
  'use strict';
  var arts = [].slice.call(document.querySelectorAll('.pj'));
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function read() {
    var vh = window.innerHeight, small = window.innerWidth <= 900, L = vh * (small ? 0.8 : 0.62);
    var i, r, cur = -1, top = 0, bottom = 0, end, next, d, out;
    for (i = 0; i < arts.length; i++) {
      r = arts[i].getBoundingClientRect();
      if (r.top <= L) { cur = i; top = r.top; bottom = r.bottom; } else break;
    }
    if (cur < 0) return { art: null, wire: 0, f: 0, pic: 0, u: 0 };
    next = arts[cur + 1];
    end = next && next.parentNode === arts[cur].parentNode ? next.getBoundingClientRect().top : bottom + vh * 0.1;
    d = (L - top) / vh;
    out = clamp((end - L) / (vh * 0.12), 0, 1);
    return {
      art: arts[cur],
      wire: clamp(d / 0.1, 0, 1) * out,
      f: clamp(d / (small ? 0.22 : 0.3), 0, 1),
      u: clamp(d / 0.7, 0, 1),
      pic: clamp((d - (small ? 0.26 : 0.36)) / (small ? 0.14 : 0.16), 0, 1) * out   /* a phone has less scroll per project */
    };
  }
  window.TOUR = { read: read };
})();
