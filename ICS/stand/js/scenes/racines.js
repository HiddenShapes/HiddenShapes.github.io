'use strict';
/* Solving f(x) = 0 on a random function with one root in [0, 4], drawn as a
   textbook figure: first bisection (keep the half where f changes sign), then
   Newton (follow the tangent to the axis). The table lists the iterates; the
   correct digits are highlighted, so the difference in speed is plain to see. */
defineScene({
  duo: ['#83a598', '#fe8019'],
  id: 'racines', maxDuration: 180,
  title: { fr: 'f(x) = 0 : bissection et newton', en: 'f(x) = 0: bisection and newton' },
  short: { fr: 'f(x) = 0', en: 'f(x) = 0' },
  create: env => new RootScene(env),
});

class RootScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    this.TOL = 1e-12; this.a = 0; this.b = 4;
    this.build(env.rng);
    this.phase = 'show'; this.kb = 0; this.kn = -1; this.stepT = 0;
    this.script = new Script(this.run());
  }

  build(rng) {
    const a = this.a, b = this.b, TOL = this.TOL;
    for (let tries = 0; tries < 600; tries++) {
      const r = rng.float(1.0, 3.0), al = rng.float(0.6, 1.4), om = rng.float(1.2, 2.6), ph = rng.float(0, TAU), be = rng.float(0, 0.2);
      const h = x => al * (1.2 + 0.6 * Math.sin(om * x + ph)) + be * (x - r) * (x - r);
      const hp = x => 0.6 * al * om * Math.cos(om * x + ph) + 2 * be * (x - r);
      const f = x => (x - r) * h(x), fp = x => h(x) + (x - r) * hp(x);
      const x0 = rng.chance(0.5) ? b - 0.2 : a + 0.2;
      const nw = [x0];
      for (let k = 0; k < 12 && Math.abs(nw[k] - r) > 1e-15; k++) { const d = fp(nw[k]); if (Math.abs(d) < 1e-6) break; nw.push(nw[k] - f(nw[k]) / d); }
      const ok = Math.abs(nw[nw.length - 1] - r) < TOL && nw.length >= 4 && nw.length <= 9 && nw.every(x => isFinite(x) && x > a - 0.15 && x < b + 0.15);
      if (!ok) continue;
      const bi = [[a, b]];
      while (bi[bi.length - 1][1] - bi[bi.length - 1][0] > 2 * TOL && bi.length < 60) {
        const [lo, hi] = bi[bi.length - 1], m = (lo + hi) / 2;
        bi.push(f(lo) * f(m) <= 0 ? [lo, m] : [m, hi]);
      }
      Object.assign(this, { r, f, nw, bi, nn: nw.findIndex(x => Math.abs(x - r) < TOL), nb: bi.length - 1 });
      return;
    }
    throw new Error('no suitable random function found');
  }

  *run() {
    for (let round = 0; this.t < 75; round++) {
      if (round > 0) { this.build(this.env.rng); this.phase = 'show'; this.kb = 0; this.kn = -1; this.stepT = this.t; }
      yield 2;
      this.phase = 'bis';
      this.KB = Math.min(10, this.bi.length - 1);
      for (let k = 0; k < this.KB; k++) { this.kb = k; this.stepT = this.t; yield 2.4; }
      this.kb = this.KB; this.stepT = this.t; yield 2.4;
      this.phase = 'newton';
      for (let k = 0; k < this.nn; k++) { this.kn = k; this.stepT = this.t; yield 2.8; }
      this.kn = this.nn; this.stepT = this.t;
      this.phase = 'end'; yield 8;
    }
    this.done = true;
  }
  update(dt) { this.t += dt; this.script.update(dt); }

  hud() {
    const k = this.phase === 'bis' ? this.kb : Math.max(0, this.kn);
    return [
      { label: { fr: 'méthode', en: 'method' }, value: this.phase === 'bis' || this.phase === 'show' ? T({ fr: 'bissection', en: 'bisection' }) : 'newton', color: this.phase === 'bis' || this.phase === 'show' ? COL.cyan : COL.coral },
      { label: 'k', value: String(k) },
    ];
  }
  caption() {
    if (this.phase === 'show') return { fr: 'un seul zéro dans [0, 4] : où ?', en: 'a single zero in [0, 4]: where?' };
    if (this.phase === 'bis') return { fr: 'bissection : garder la moitié où f change de signe', en: 'bisection: keep the half where f changes sign' };
    if (this.phase === 'newton') return { fr: 'newton : suivre la tangente jusqu’à l’axe', en: 'newton: follow the tangent down to the axis' };
    return { fr: `12 décimales exactes : bissection ${this.nb} itérations, newton ${this.nn}`, en: `12 exact decimals: bisection ${this.nb} iterations, newton ${this.nn}` };
  }

  draw(g) {
    const env = this.env, u = env.u, M = env.main;
    const fw = M.w * 0.56;
    panel(g, M.x, M.y, fw, M.h, u);
    this.drawFigure(g, M.x + 64 * u, M.y + 30 * u, fw - 90 * u, M.h - 90 * u, u);
    this.drawTable(g, M.x + fw + 50 * u, M.y + 10 * u, M.w - fw - 50 * u, M.h - 10 * u, u);
  }

  // Layers, bottom to top: shaded intervals, grid frame, axes, curve, constructions, labels.
  drawFigure(g, px, py, pw, ph, u) {
    const f = this.f, x0 = -0.25, x1 = 4.25, A = RGB.cyan, B = RGB.coral, t = this.t;
    let ymin = 0, ymax = 0;
    for (let s = 0; s <= 120; s++) { const y = f(x0 + (x1 - x0) * s / 120); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    const pad = (ymax - ymin) * 0.08; ymin -= pad; ymax += pad;   // the range always contains y = 0
    const X = x => px + (x - x0) / (x1 - x0) * pw, Y = y => py + ph - (y - ymin) / (ymax - ymin) * ph;
    const clip = () => { g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip(); };
    const p = clamp((t - this.stepT) / 2.4, 0, 1), pn = clamp((t - this.stepT) / 2.8, 0, 1);
    const bis = this.phase === 'bis', nwt = this.phase === 'newton' || this.phase === 'end';

    // 1. shaded intervals (bisection)
    clip();
    if (bis) {
      const [lo, hi] = this.bi[this.kb];
      g.fillStyle = css(flat(A, 0.16)); g.fillRect(X(lo), py, X(hi) - X(lo), ph);
      if (this.kb < this.KB && p > 0.5) { const [nlo, nhi] = this.bi[this.kb + 1]; g.fillStyle = css(flat(A, 0.34)); g.fillRect(X(nlo), py, X(nhi) - X(nlo), ph); }
    }
    g.restore();

    // 2. frame and ticks
    g.strokeStyle = COL.line; g.lineWidth = 1; g.strokeRect(Math.round(px) + 0.5, Math.round(py) + 0.5, Math.round(pw), Math.round(ph));
    g.strokeStyle = COL.dim;
    for (let v = 0; v <= 4; v++) {
      line(g, X(v), py + ph, X(v), py + ph + 6 * u);
      text(g, String(v), X(v), py + ph + 26 * u, 15 * u, { align: 'center', color: COL.dim });
    }

    // 3. axes, always on top of the shading
    g.strokeStyle = COL.muted; g.lineWidth = 1.5 * u;
    line(g, px, Y(0), px + pw, Y(0));
    line(g, X(0), py, X(0), py + ph);
    g.fillStyle = COL.muted;
    g.beginPath(); g.moveTo(px + pw, Y(0)); g.lineTo(px + pw - 9 * u, Y(0) - 4 * u); g.lineTo(px + pw - 9 * u, Y(0) + 4 * u); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(X(0), py); g.lineTo(X(0) - 4 * u, py + 9 * u); g.lineTo(X(0) + 4 * u, py + 9 * u); g.closePath(); g.fill();
    text(g, 'x', px + pw - 4 * u, Y(0) - 10 * u, 15 * u, { align: 'right', color: COL.muted });
    text(g, 'f(x)', X(0) + 10 * u, py + 18 * u, 15 * u, { color: COL.muted });

    // 4. the function
    clip();
    g.strokeStyle = COL.ink; g.lineWidth = 2 * u; g.lineJoin = 'round';
    g.beginPath();
    for (let s = 0; s <= 240; s++) { const x = x0 + (x1 - x0) * s / 240, y = Y(f(x)); if (s) g.lineTo(X(x), y); else g.moveTo(X(x), y); }
    g.stroke();

    // 5. constructions
    if (bis) {
      const [lo, hi] = this.bi[this.kb], m = (lo + hi) / 2;
      g.strokeStyle = css(A); g.lineWidth = 1.5 * u; line(g, X(lo), py, X(lo), py + ph); line(g, X(hi), py, X(hi), py + ph);
      if (this.kb < this.KB) {
        g.setLineDash([3 * u, 3 * u]); line(g, X(m), Y(0), X(m), Y(f(m))); g.setLineDash([]);
        g.fillStyle = css(A); dot(g, X(m), Y(f(m)), 4.5 * u);
      }
    }
    const labels = [];
    if (nwt) {
      for (let i = 0; i <= this.kn && i < this.nn; i++) {
        const xi = this.nw[i], partial = i === this.kn && this.phase === 'newton' && pn < 0.45;
        const shade = partial ? B : mix(BG, B, 0.45 + 0.55 * (i + 1) / Math.max(1, this.kn + 1));
        g.setLineDash([3 * u, 3 * u]); g.strokeStyle = css(shade); g.lineWidth = 1.2 * u; line(g, X(xi), Y(0), X(xi), Y(f(xi))); g.setLineDash([]);
        if (!partial) { g.lineWidth = 1.6 * u; line(g, X(xi), Y(f(xi)), X(this.nw[i + 1]), Y(0)); }
        g.fillStyle = css(shade); dot(g, X(xi), Y(f(xi)), 4 * u);
        g.fillStyle = css(B); dot(g, X(xi), Y(0), 3 * u);
        if (i < 4) labels.push([i, xi]);
      }
      if (this.kn >= 0 && this.kn < 4 && !(this.phase === 'newton' && pn < 0.45) && this.kn <= this.nn) labels.push([this.kn + 1 <= this.nn ? this.kn + 1 : this.kn, this.nw[Math.min(this.kn + 1, this.nn)]]);
    }
    g.restore();

    // 6. labels with a solid background so lines never run through them; skip ones that would collide
    const below = Y(0) < py + ph - 40 * u, placed = [];
    for (const [i, xv] of labels) {
      if (i > 3) continue;
      const lx = X(xv);
      if (placed.some(q => Math.abs(q - lx) < 30 * u)) continue;
      placed.push(lx);
      const s = 'x' + '₀₁₂₃'[i], ly = below ? Y(0) + 22 * u : Y(0) - 12 * u, w = measure(g, s, 15 * u, 500) + 8 * u;
      g.fillStyle = COL.panel; g.fillRect(lx - w / 2, ly - 15 * u, w, 20 * u);
      text(g, s, lx, ly, 15 * u, { align: 'center', color: css(B) });
    }
  }

  drawTable(g, x, y, w, h, u) {
    const fs = Math.min(19 * u, w / 34), lh = fs * 1.6, dec = LANG === 'fr' ? ',' : '.';
    const cK = x, cB = x + fs * 3.2, cN = x + fs * 3.2 + (w - fs * 3.2) / 2;
    text(g, 'k', cK, y + lh, fs, { color: COL.dim });
    text(g, T({ fr: 'bissection', en: 'bisection' }), cB, y + lh, fs, { color: COL.cyan });
    text(g, 'newton', cN, y + lh, fs, { color: COL.coral });
    g.strokeStyle = COL.line; g.lineWidth = 1; line(g, x, y + lh * 1.4, x + w, y + lh * 1.4);
    const sr = this.r.toFixed(12);
    const cell = (v, cx, cy, col) => {
      const s = v.toFixed(12); let j = 0; while (j < s.length && s[j] === sr[j]) j++;
      runs(g, [[s.slice(0, j).replace('.', dec), col], [s.slice(j).replace('.', dec), COL.dim]], cx, cy, fs, {});
    };
    const rows = Math.min(12, Math.floor((h - lh * 4) / lh));
    const showB = this.phase === 'bis' ? this.kb : this.KB;
    for (let k = 0; k < rows; k++) {
      const yy = y + lh * (k + 2.5);
      const hasB = k <= showB && (this.phase !== 'show'), hasN = this.kn >= 0 && k <= this.kn && k <= this.nn;
      if (!hasB && !hasN) continue;
      text(g, String(k), cK, yy, fs, { color: COL.dim });
      if (hasB) cell((this.bi[k][0] + this.bi[k][1]) / 2, cB, yy, COL.cyan);
      if (hasN) cell(this.nw[k], cN, yy, COL.coral);
    }
    if (this.phase === 'newton' || this.phase === 'end') {
      const yy = y + lh * (rows + 2.5);
      text(g, '⋮', cB, yy - lh * 0.4, fs, { color: COL.dim });
      text(g, String(this.nb), cK, yy + lh * 0.6, fs, { color: COL.dim });
      const [lo, hi] = this.bi[this.nb];
      cell((lo + hi) / 2, cB, yy + lh * 0.6, COL.cyan);
    }
  }
}
