/* The drawings, in one hand, written once and placed by all three versions.
   <figure data-fig="finike"> and friends receive their drawing here; captions
   stay in each page. Two line weights (hair, cut), ink and red, mono notes.
   Nothing here imitates a scan or a photograph. Runs before scale.js and tree.js. */
(function () {
  'use strict';

  var NORTH = '<g transform="translate(410,560)"><circle r="12" class="hair" fill="none"/><polygon points="0,-9 2.5,4 0,0 -2.5,4" class="solid"/></g>';

  var FIG = {
    /* Finike: contours, building footprints, section cut A to A'. */
    finike:
      '<svg viewBox="0 0 460 620" role="img" aria-label="Diagram of the hillside at Finike: contour lines, five building footprints and a red section line from A to A prime">' +
      '<g class="hair soft d">' +
      '<path pathLength="1" d="M30 560 C80 530 150 540 210 500 C270 460 310 480 370 440"/>' +
      '<path pathLength="1" d="M10 520 C60 490 130 500 190 460 C250 420 290 440 350 400"/>' +
      '<path pathLength="1" d="M0 480 C40 450 120 460 180 420 C240 380 280 400 340 360"/>' +
      '<path pathLength="1" d="M0 440 C30 410 110 420 170 380 C230 340 270 360 330 320"/>' +
      '<path pathLength="1" d="M0 400 C20 370 100 380 160 340 C220 300 260 320 320 280"/>' +
      '<path pathLength="1" d="M0 360 C10 330 90 340 150 300 C210 260 250 280 310 240"/>' +
      '<path pathLength="1" d="M10 320 C30 290 80 300 140 260 C200 220 240 240 300 200"/>' +
      '<path pathLength="1" d="M20 280 C40 250 70 260 130 220 C190 180 230 200 290 160"/>' +
      '</g>' +
      '<g class="cut">' +
      '<rect x="115" y="360" width="38" height="26" transform="rotate(-7 134 373)"/>' +
      '<rect x="195" y="320" width="50" height="30" transform="rotate(-4 220 335)"/>' +
      '<rect x="300" y="260" width="32" height="42" transform="rotate(-10 316 281)"/>' +
      '<rect x="75" y="420" width="28" height="18"/>' +
      '<rect x="250" y="380" width="44" height="22" transform="rotate(3 272 391)"/>' +
      '</g>' +
      '<g class="red late">' +
      '<line class="cut" x1="60" y1="250" x2="380" y2="450" stroke-dasharray="12 4"/>' +
      '<polygon class="solid" points="56,246 64,242 60,250"/><polygon class="solid" points="384,454 376,458 380,450"/>' +
      '<text x="44" y="238">A</text><text x="388" y="468">A′</text>' +
      '<g class="hair"><line x1="115" y1="350" x2="260" y2="350"/><line x1="115" y1="346" x2="115" y2="354"/><line x1="260" y1="346" x2="260" y2="354"/></g>' +
      '<text x="168" y="343">142 m</text>' +
      '</g>' +
      NORTH +
      '<g transform="translate(28,598)"><line class="cut" x1="0" y1="0" x2="70" y2="0"/><line class="hair" x1="0" y1="-3" x2="0" y2="3"/><line class="hair" x1="70" y1="-3" x2="70" y2="3"/>' +
      '<text class="quiet" x="0" y="14">0</text><text class="quiet" x="52" y="14">100 m</text></g>' +
      '</svg>',

    /* Intersect: four notation panels after Tschumi. */
    notation:
      '<svg viewBox="0 0 400 400" role="img" aria-label="Notation diagram in four panels, labelled route, building, event and object, with red traces of movement across them">' +
      '<g class="hair"><rect x="20" y="20" width="170" height="170"/><rect x="210" y="20" width="170" height="170"/><rect x="20" y="210" width="170" height="170"/><rect x="210" y="210" width="170" height="170"/></g>' +
      '<g class="cut">' +
      '<rect x="80" y="100" width="30" height="20" transform="rotate(-15 95 110)"/><rect x="120" y="60" width="25" height="35"/>' +
      '<rect x="250" y="80" width="40" height="25" transform="rotate(5 270 92)"/><rect x="290" y="230" width="50" height="30"/>' +
      '<rect x="240" y="280" width="35" height="45" transform="rotate(-8 258 302)"/>' +
      '</g>' +
      '<g class="hair"><circle cx="100" cy="330" r="2.5"/><line x1="100" y1="333" x2="100" y2="342"/><circle cx="140" cy="270" r="2.5"/><line x1="140" y1="273" x2="140" y2="282"/></g>' +
      '<g class="cut red d">' +
      '<path pathLength="1" d="M40 160 C60 100 120 80 160 50"/><path pathLength="1" d="M50 140 C80 110 130 90 170 60"/>' +
      '<path pathLength="1" d="M230 50 L300 100 L250 160 L350 130"/><path pathLength="1" d="M40 250 C80 280 120 240 170 300 C140 350 60 330 40 360"/>' +
      '</g>' +
      '<g class="red"><text x="24" y="201">ROUTE</text><text x="214" y="201">BUILDING</text><text x="24" y="391">EVENT</text><text x="214" y="391">OBJECT</text></g>' +
      '</svg>',

    /* Pedestrian counts: a set table, not a facsimile. The figures are the
       benchmark's and are waiting for Elif's field sheets. */
    counts:
      '<table class="counts"><caption class="vh">Pedestrian counts on the sidewalk, draft figures</caption>' +
      '<thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Hour</th><th scope="col">0 to 4</th><th scope="col">5 to 12</th><th scope="col">Adult</th><th scope="col">65+</th><th scope="col">Total</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>12.09.19</td><td>Thu</td><td>15:30</td><td>2</td><td>5</td><td>18</td><td>2</td><td>27</td></tr>' +
      '<tr><td>12.09.19</td><td>Thu</td><td>17:15</td><td>1</td><td>3</td><td>14</td><td>0</td><td>18</td></tr>' +
      '<tr><td>13.09.19</td><td>Fri</td><td>16:00</td><td>5</td><td>21</td><td>19</td><td>1</td><td>46</td></tr>' +
      '<tr><td>13.09.19</td><td>Fri</td><td>17:45</td><td>3</td><td>8</td><td>22</td><td>2</td><td>35</td></tr>' +
      '<tr class="key"><td>20.09.19</td><td>Fri</td><td>08:30</td><td>20</td><td>42</td><td>43</td><td>0</td><td><b>136</b></td></tr>' +
      '</tbody></table>',

    /* The scale instrument (shared/scale.js draws it). */
    scale:
      '<div class="scalebox" id="scalebox">' +
      '<fieldset class="scale-pick"><legend class="vh">Choose the scale of the drawing</legend>' +
      '<label><input type="radio" name="sc" value="10000" checked><span><span class="sc-n">City</span><span class="sc-r">1 : 10 000</span></span></label>' +
      '<label><input type="radio" name="sc" value="1000"><span><span class="sc-n">Building</span><span class="sc-r">1 : 1000</span></span></label>' +
      '<label><input type="radio" name="sc" value="100"><span><span class="sc-n">Room</span><span class="sc-r">1 : 100</span></span></label>' +
      '<label><input type="radio" name="sc" value="10"><span><span class="sc-n">Object</span><span class="sc-r">1 : 10</span></span></label>' +
      '<label><input type="radio" name="sc" value="1"><span><span class="sc-n">Screen</span><span class="sc-r">1 : 1</span></span></label>' +
      '</fieldset>' +
      '<figure class="scale-stage">' +
      '<div class="scale-view"><canvas id="scale-canvas" role="img" aria-label="An elevation of a square that zooms between five drawing scales. A three year old, drawn in red and 95 centimetres tall, stands beside an adult, a bench and a planter. At the scale of the city she is too small to draw. At full size she is taller than the sheet."></canvas>' +
      '<div class="sbar" aria-hidden="true"><div class="sbar-blocks"><i></i><i></i><i></i><i></i><i></i></div><p id="sbar-text">500 m at 1 : 10 000</p></div></div>' +
      '<figcaption id="scale-read" aria-live="polite">At 1 : 10 000 a three year old is a third of a pixel tall. The drawing cannot see her.</figcaption>' +
      '</figure></div>',

    /* Tree of Life (shared/tree.js draws it). */
    tree:
      '<div class="tree" id="tree">' +
      '<canvas id="tree-canvas" role="img" aria-label="A tree made of points of light. The control steps through the seven iterations of the project: each one has fewer particles and breathes more slowly than the last."></canvas>' +
      '<div class="iter"><label for="iter">Iteration <output id="iter-n" for="iter">7</output> of 7</label>' +
      '<input id="iter" type="range" min="1" max="7" step="1" value="7">' +
      '<p id="iter-note" aria-live="polite">Review 7. Leaf particles reduced by 40%. Let it breathe.</p></div>' +
      '</div>'
  };

  [].forEach.call(document.querySelectorAll('[data-fig]'), function (el) {
    var html = FIG[el.getAttribute('data-fig')];
    if (html) el.insertAdjacentHTML('afterbegin', html);
  });
})();
