/* X-wing patrol — a minimalist line-art animation / mini-game.
 *
 * Idle: the X-wing flies on autopilot, tracking and shooting down
 * TIE fighters that drift in from the right.
 * Interactive: move the pointer over the strip to take the stick
 * (for a few seconds), click/tap to fire.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('hangar-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var INK = '#1a1a1a';
  var H = 180;
  var W = 640;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.parentElement.clientWidth;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- drawing helpers (stroke-only line art) ---------- */

  function poly(g, pts, close) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) g.closePath();
    g.stroke();
  }

  function line(g, x1, y1, x2, y2) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  function circle(g, x, y, r) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
  }

  function drawXWing(g, x, y) {
    g.save();
    g.translate(x, y);
    g.strokeStyle = INK;
    g.lineWidth = 1.25;
    g.lineJoin = 'round';

    // S-foils (upper and lower wings) with wingtip cannons
    poly(g, [[-8, -5], [-1, -16], [-11, -16], [-16, -5]]);
    line(g, -1, -16, 14, -16);
    line(g, 14, -18, 14, -14);
    poly(g, [[-8, 5], [-1, 16], [-11, 16], [-16, 5]]);
    line(g, -1, 16, 14, 16);
    line(g, 14, 18, 14, 14);

    // fuselage with long nose
    poly(g, [[30, 0], [8, -4], [-24, -4], [-24, 4], [8, 4]]);
    line(g, 8, -4, 8, 4);

    // cockpit canopy
    poly(g, [[-2, -4], [-6, -9], [-13, -9], [-17, -4]], false);

    // engines
    line(g, -24, -2, -29, -2);
    line(g, -24, 2, -29, 2);

    g.restore();
  }

  function drawTie(g, x, y) {
    g.save();
    g.translate(x, y);
    g.strokeStyle = INK;
    g.lineWidth = 1.25;
    g.lineJoin = 'round';

    // hexagonal solar panels
    poly(g, [[-10, -13], [-7, -9], [-7, 9], [-10, 13], [-13, 9], [-13, -9]]);
    poly(g, [[10, -13], [13, -9], [13, 9], [10, 13], [7, 9], [7, -9]]);

    // struts and ball cockpit
    line(g, -7, 0, -5, 0);
    line(g, 5, 0, 7, 0);
    circle(g, 0, 0, 5);
    circle(g, 0, 0, 2.2);
    line(g, -5, 0, -2.2, 0);
    line(g, 2.2, 0, 5, 0);
    line(g, 0, -5, 0, -2.2);
    line(g, 0, 2.2, 0, 5);

    g.restore();
  }

  /* ---------- state ---------- */

  var ship = { x: 70, y: H / 2, ty: H / 2, bob: 0, cooldown: 0 };
  var stars = [];
  var ties = [];
  var lasers = [];
  var debris = [];
  var score = 0;
  var controlUntil = -1; // seconds-timestamp until which the player has the stick
  var pointerY = H / 2;
  var spawnIn = 0.8;
  var now = 0;

  for (var i = 0; i < 42; i++) {
    stars.push({ x: Math.random() * 800, y: Math.random() * H, depth: rand(0.25, 1) });
  }

  function fire() {
    if (ship.cooldown > 0) return;
    ship.cooldown = (now < controlUntil) ? 0.25 : 1.2;
    var y = ship.y + ship.bob;
    lasers.push({ x: ship.x + 14, y: y - 16 });
    lasers.push({ x: ship.x + 14, y: y + 16 });
  }

  function explode(x, y) {
    for (var i = 0; i < 10; i++) {
      var a = rand(0, Math.PI * 2);
      debris.push({
        x: x, y: y,
        vx: Math.cos(a) * rand(30, 90),
        vy: Math.sin(a) * rand(30, 90),
        rot: rand(0, Math.PI), vr: rand(-6, 6),
        len: rand(3, 8), life: 1
      });
    }
  }

  /* ---------- simulation ---------- */

  function update(dt) {
    now += dt;
    ship.bob = Math.sin(now * 1.4) * 3;
    ship.cooldown = Math.max(0, ship.cooldown - dt);

    // spawn TIE fighters from the right
    spawnIn -= dt;
    if (spawnIn <= 0 && ties.length < 5) {
      ties.push({
        x: W + 30,
        baseY: rand(30, H - 30),
        y: 0,
        vx: rand(28, 55),
        phase: rand(0, Math.PI * 2),
        wobble: rand(4, 10)
      });
      spawnIn = rand(1.6, 3.2);
    }

    // steer: player or autopilot
    if (now < controlUntil) {
      ship.ty = pointerY;
    } else {
      var target = null;
      for (var i = 0; i < ties.length; i++) {
        if (!target || ties[i].x < target.x) target = ties[i];
      }
      if (target) {
        ship.ty = target.y;
        // hold fire until the target is well on screen, and let it drift
        // for a while so the scene reads as an animation, not a shooting gallery
        if (Math.abs(ship.y - target.y) < 12 &&
            target.x > ship.x + 80 &&
            target.x < W - 120) fire();
      } else {
        ship.ty = H / 2;
      }
    }
    ship.ty = Math.max(24, Math.min(H - 24, ship.ty));
    ship.y += (ship.ty - ship.y) * Math.min(1, dt * 3.5);

    // starfield drift (slow parallax)
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      st.x -= (6 + st.depth * 16) * dt;
      if (st.x < -2) { st.x = W + 2; st.y = Math.random() * H; }
    }

    // TIE fighters drift left with a gentle wobble
    for (var t = ties.length - 1; t >= 0; t--) {
      var tie = ties[t];
      tie.x -= tie.vx * dt;
      tie.y = tie.baseY + Math.sin(now * 1.8 + tie.phase) * tie.wobble;
      if (tie.x < -30) ties.splice(t, 1);
    }

    // lasers travel right; check hits
    for (var l = lasers.length - 1; l >= 0; l--) {
      var la = lasers[l];
      la.x += 420 * dt;
      var hit = false;
      for (var k = ties.length - 1; k >= 0; k--) {
        if (ties[k].x > W - 20) continue; // no kills at the spawn edge
        var dx = la.x - ties[k].x;
        var dy = la.y - ties[k].y;
        if (dx * dx + dy * dy < 16 * 16) {
          explode(ties[k].x, ties[k].y);
          ties.splice(k, 1);
          score++;
          hit = true;
          break;
        }
      }
      if (hit || la.x > W + 20) lasers.splice(l, 1);
    }

    // debris fragments fade out
    for (var d = debris.length - 1; d >= 0; d--) {
      var fr = debris[d];
      fr.x += fr.vx * dt;
      fr.y += fr.vy * dt;
      fr.rot += fr.vr * dt;
      fr.life -= dt * 1.8;
      if (fr.life <= 0) debris.splice(d, 1);
    }
  }

  /* ---------- rendering ---------- */

  function render() {
    ctx.clearRect(0, 0, W, H);

    // stars
    ctx.fillStyle = INK;
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      if (st.x > W) continue;
      var r = st.depth > 0.7 ? 1.2 : 0.7;
      ctx.globalAlpha = 0.25 + st.depth * 0.45;
      ctx.fillRect(st.x, st.y, r, r);
    }
    ctx.globalAlpha = 1;

    for (var t = 0; t < ties.length; t++) drawTie(ctx, ties[t].x, ties[t].y);

    drawXWing(ctx, ship.x, ship.y + ship.bob);

    // lasers
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    for (var l = 0; l < lasers.length; l++) {
      line(ctx, lasers[l].x - 12, lasers[l].y, lasers[l].x, lasers[l].y);
    }

    // debris
    for (var d = 0; d < debris.length; d++) {
      var fr = debris[d];
      ctx.globalAlpha = Math.max(0, fr.life);
      ctx.save();
      ctx.translate(fr.x, fr.y);
      ctx.rotate(fr.rot);
      line(ctx, -fr.len / 2, 0, fr.len / 2, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // score
    ctx.fillStyle = INK;
    ctx.font = '12px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('TIEs downed: ' + score, W - 10, 18);
  }

  /* ---------- input ---------- */

  canvas.addEventListener('pointermove', function (e) {
    var rect = canvas.getBoundingClientRect();
    pointerY = e.clientY - rect.top;
    controlUntil = now + 4; // player keeps the stick for 4s after last move
  });

  canvas.addEventListener('pointerdown', function (e) {
    var rect = canvas.getBoundingClientRect();
    pointerY = e.clientY - rect.top;
    controlUntil = now + 4;
    fire();
  });

  /* ---------- main loop ---------- */

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    // static scene, no animation
    ties.push({ x: W * 0.62, y: H / 2 - 20, baseY: 0, vx: 0, phase: 0, wobble: 0 });
    ties.push({ x: W * 0.85, y: H / 2 + 28, baseY: 0, vx: 0, phase: 0, wobble: 0 });
    render();
    return;
  }

  var last = performance.now();
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
