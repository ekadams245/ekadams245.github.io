/* Background field: a dot grid walked by boxes, each drawing the four
   legs behind and ahead of it. Canvas, because a full viewport at this
   density is several hundred marks a frame. */
(function () {
  var cv = document.querySelector('.field');
  if (!cv) return;

  var ctx     = cv.getContext('2d');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');

  var GAP  = 46;     // dot spacing
  var DOT  = 3;      // dot size
  var BOX  = 17;     // walker size
  var LEGS = 4;      // legs either side of the box
  var STEP = 620;    // ms per leg
  var STRAIGHT = 0.58;   // chance of carrying straight on at a dot

  var DOT_A = 0.15, TAIL_A = 0.32, HEAD_A = 0.14;

  var cols = 0, rows = 0, ox = 0, oy = 0, W = 0, H = 0;
  var walkers = [], raf = null, last = 0;
  var zones = [];   // regions the field is drawn faintly behind

  function ink() {
    return getComputedStyle(document.documentElement)
             .getPropertyValue('--ink').trim() || '#000';
  }
  function red() {
    return getComputedStyle(document.documentElement)
             .getPropertyValue('--red').trim() || '#e5331f';
  }

  // measure the regions occupied by text
  function measureZones() {
    zones = [];
    ['.id', '.meta'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var r = el.getBoundingClientRect();
      zones.push({ x1: r.left - 12, y1: r.top - 12, x2: r.right + 12, y2: r.bottom + 12 });
    });
  }
  function quiet(x, y) {
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2) return 0.16;
    }
    return 1;
  }

  var X = function (c) { return ox + c * GAP; };
  var Y = function (r) { return oy + r * GAP; };

  function step(node, dir) {
    var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    var opts = [];

    // bias toward continuing in the same direction
    if (dir && Math.random() < STRAIGHT) {
      var sc = node.c + dir[0], sr = node.r + dir[1];
      if (sc >= 0 && sc < cols && sr >= 0 && sr < rows) {
        return { c: sc, r: sr, dir: dir };
      }
    }

    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      if (dir && d[0] === -dir[0] && d[1] === -dir[1]) continue;  // no reversing
      var c = node.c + d[0], r = node.r + d[1];
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      opts.push({ c: c, r: r, dir: d });
    }
    if (!opts.length) return { c: node.c, r: node.r, dir: dir || [1,0] };
    return opts[(Math.random() * opts.length) | 0];
  }

  function makeWalker(accent) {
    var n = { c: (Math.random() * cols) | 0, r: (Math.random() * rows) | 0 };
    var path = [n], dir = null;
    for (var i = 0; i < LEGS * 2; i++) {
      var nx = step(path[path.length - 1], dir);
      dir = nx.dir;
      path.push({ c: nx.c, r: nx.r });
    }
    return { path: path, dir: dir, t: Math.random(), accent: !!accent };
  }

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(W / GAP) + 1;
    rows = Math.ceil(H / GAP) + 1;
    ox = (W - (cols - 1) * GAP) / 2;
    oy = (H - (rows - 1) * GAP) / 2;

    measureZones();

    var n = Math.round((W * H) / 190000);
    n = Math.max(3, Math.min(9, n));

    walkers = [];
    for (var i = 0; i < n; i++) walkers.push(makeWalker(i === 0));
  }

  function advance(w) {
    var nx = step(w.path[w.path.length - 1], w.dir);
    w.dir = nx.dir;
    w.path.push({ c: nx.c, r: nx.r });
    w.path.shift();
  }

  function drawWalker(w, colInk, colRed) {
    var p = w.path;
    var mid = LEGS;                       // index of the box's current node

    // stronger behind the box, fainter ahead
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (var i = 0; i < p.length - 1; i++) {
      var mx = (X(p[i].c) + X(p[i+1].c)) / 2;
      var my = (Y(p[i].r) + Y(p[i+1].r)) / 2;
      ctx.globalAlpha = (i < mid ? TAIL_A : HEAD_A) * quiet(mx, my);
      ctx.strokeStyle = w.accent ? colRed : colInk;
      ctx.beginPath();
      ctx.moveTo(X(p[i].c),     Y(p[i].r));
      ctx.lineTo(X(p[i+1].c),   Y(p[i+1].r));
      ctx.stroke();
    }

    // the box, interpolating toward the next node
    var a = p[mid], b = p[mid + 1];
    var x = X(a.c) + (X(b.c) - X(a.c)) * w.t;
    var y = Y(a.r) + (Y(b.r) - Y(a.r)) * w.t;

    ctx.globalAlpha = (w.accent ? 0.95 : 0.8) * quiet(x, y);
    ctx.fillStyle = w.accent ? colRed : colInk;
    ctx.fillRect(x - BOX / 2, y - BOX / 2, BOX, BOX);
  }

  function frame(now) {
    var dt = last ? now - last : 16;
    last = now;

    ctx.clearRect(0, 0, W, H);

    var colInk = ink(), colRed = red();

    // the dot grid
    ctx.globalAlpha = DOT_A;
    ctx.fillStyle = colInk;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        ctx.fillRect(X(c) - DOT / 2, Y(r) - DOT / 2, DOT, DOT);
      }
    }

    for (var i = 0; i < walkers.length; i++) {
      var w = walkers[i];
      w.t += dt / STEP;
      while (w.t >= 1) { w.t -= 1; advance(w); }
      drawWalker(w, colInk, colRed);
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } last = 0; }
  function start() { if (!raf && !reduced.matches) raf = requestAnimationFrame(frame); }

  function still() {
    // reduced motion: render a single static frame
    ctx.clearRect(0, 0, W, H);
    var colInk = ink(), colRed = red();
    ctx.globalAlpha = DOT_A;
    ctx.fillStyle = colInk;
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++)
        ctx.fillRect(X(c) - DOT / 2, Y(r) - DOT / 2, DOT, DOT);
    for (var i = 0; i < walkers.length; i++) { walkers[i].t = 0; drawWalker(walkers[i], colInk, colRed); }
    ctx.globalAlpha = 1;
  }

  build();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureZones);   // text reflows once the font loads
  }
  if (reduced.matches) still(); else start();

  addEventListener('resize', function () {
    stop(); build();
    if (reduced.matches) still(); else start();
  });

  // pause while the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (reduced.matches) still();
  });
})();

/* Rail marker: a box travels to the entry currently in view, with the
   line solid above it and faint below.

   Driven by progress through the whole block rather than by "last entry
   whose top cleared the reading line" - that approach can never reach
   the final entry, because the page runs out of scroll before its top
   gets high enough. Progress reaches 1 by construction. */
(function () {
  var exp = document.querySelector('.exp');
  if (!exp) return;

  var roles = [].slice.call(exp.querySelectorAll('.role'));
  if (!roles.length) return;

  var dots = [], ticking = false;

  function measure() {
    var base = exp.getBoundingClientRect().top + window.scrollY;
    dots = roles.map(function (r) {
      var top = r.getBoundingClientRect().top + window.scrollY;
      return top - base + parseFloat(getComputedStyle(r).fontSize) * 0.62;
    });
  }

  function update() {
    var vh  = window.innerHeight;
    var y0  = exp.getBoundingClientRect().top + window.scrollY;
    var y1  = y0 + exp.offsetHeight;

    var maxScroll = document.documentElement.scrollHeight - vh;

    var from = y0 - vh * 0.38;
    var to   = y1 - vh * 0.85;

    // the page can run out of scroll before `to`, stranding the final entry.
    // clamping to maxScroll guarantees progress reaches 1.
    if (to > maxScroll) to = maxScroll;
    if (to <= from) to = from + 1;

    var p = (window.scrollY - from) / (to - from);
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    var target = dots[0] + p * (dots[dots.length - 1] - dots[0]);

    var best = 0, bestD = Infinity;
    for (var i = 0; i < dots.length; i++) {
      var d = Math.abs(dots[i] - target);
      if (d < bestD) { bestD = d; best = i; }
    }

    for (var j = 0; j < roles.length; j++) {
      roles[j].classList.toggle('is-active', j === best);
    }
    exp.style.setProperty('--y', dots[best].toFixed(1) + 'px');

    ticking = false;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  function onResize() { measure(); update(); }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  measure();
  update();
})();

/* Reading progress on the right edge tape; static on the landing page. */
(function () {
  var tape = document.querySelector('.tape');
  if (!tape || document.body.classList.contains('landing')) return;

  var ticking = false;
  function update() {
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    tape.style.setProperty('--p', (max > 0 ? (d.scrollTop / max) * 100 : 0) + '%');
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
