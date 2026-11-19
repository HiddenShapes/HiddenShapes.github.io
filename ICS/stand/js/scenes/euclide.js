'use strict';
/* Euclid's algorithm as geometry: repeatedly cut the largest possible squares off
   an a × b rectangle. The last square is gcd(a, b) and tiles the whole rectangle.
   Consecutive Fibonacci numbers (the worst case, Lamé) draw a golden spiral. */
defineScene({
  duo: ['#83a598', '#fabd2f'],
  id: 'euclide', accent: COL.amber, maxDuration: 180,
  chip: { fr: 'Algorithmes · correctitude', en: 'Algorithms · correctness' },
  title: { fr: 'pgcd(a, b) — Euclide', en: 'gcd(a, b) — Euclid' },
  subtitle: { fr: 'pgcd(a, b) : découper un rectangle en carrés', en: 'gcd(a, b): cutting a rectangle into squares' },
  short: { fr: 'Euclide', en: 'Euclid' },
  create: env => new EuclideScene(env),
});

class EuclideScene {
  constructor(env) {
    this.env = env; this.rng = env.rng; this.t = 0; this.done = false;
    this.prob = null; this.cap = '';
    const kinds = this.rng.shuffle(['gen', 'fib', 'gen']);
    if (kinds[0] === 'fib') kinds.push(kinds.shift()); // open with a general case
    this.kinds = kinds;
    this.script = new Script(this.run());
  }

  makeProblem(kind) {
    const rng = this.rng;
    if (kind === 'fib') {
      const n = rng.int(8, 10), Fb = [0, 1];
      for (let i = 2; i <= n + 1; i++) Fb.push(Fb[i - 1] + Fb[i - 2]);
      const g = rng.pick([1, 1, 2, 3]);
      return this.tile(Fb[n + 1] * g, Fb[n] * g, true);
    }
    for (let tries = 0; tries < 500; tries++) {
      // build a/b from a random continued fraction, so the number of steps stays watchable
      const k = rng.int(3, 6), qs = [];
      for (let i = 0; i < k; i++) qs.push(rng.weighted([[1, 5], [2, 4], [3, 2], [4, 1], [5, 1]]));
      if (qs[k - 1] < 2) qs[k - 1] = 2;
      let num = qs[k - 1], den = 1;
      for (let i = k - 2; i >= 0; i--) { const t = qs[i] * num + den; den = num; num = t; }
      if (num > 110 || den > 70 || num / den > 3.0 || num < 12) continue;
      const g = rng.int(3, 29);
      return this.tile(num * g, den * g, false);
    }
    return this.tile(1071, 462, false);
  }

  // Squares are cut alternately from the left, top, right, bottom: an inward spiral.
  tile(A, B, fib) {
    const steps = [], squares = [];
    let x = 0, y = 0, w = A, h = B, hc = 0, vc = 0;
    while (w > 0 && h > 0) {
      const horiz = w >= h, big = horiz ? w : h, small = horiz ? h : w;
      const q = Math.floor(big / small), r = big - q * small;
      const st = { big, small, q, r, idx: steps.length, sq: [] };
      for (let i = 0; i < q; i++) {
        let sx, sy, side;
        if (horiz) { sy = y; if (hc % 2 === 0) { sx = x + i * small; side = 'L'; } else { sx = x + w - (i + 1) * small; side = 'R'; } }
        else { sx = x; if (vc % 2 === 0) { sy = y + i * small; side = 'T'; } else { sy = y + h - (i + 1) * small; side = 'B'; } }
        const s = { x: sx, y: sy, s: small, step: st.idx, side, first: i === 0, t0: -1 };
        st.sq.push(s); squares.push(s);
      }
      if (horiz) { if (hc % 2 === 0) x += q * small; w -= q * small; hc++; }
      else { if (vc % 2 === 0) y += q * small; h -= q * small; vc++; }
      steps.push(st);
    }
    return { A, B, fib, steps, squares, gcd: steps[steps.length - 1].small };
  }

  *run() {
    for (let round = 0; this.t < 105; round++) {
      const P = this.prob = this.makeProblem(round % 3 === 1 ? 'fib' : 'gen');
      this.shown = 0; this.t0 = this.t; this.finalT = this.gridT = this.spiralT = this.outT = -1;
      this.cap = { fr: `pgcd(${P.A}, ${P.B}) = ?`, en: `gcd(${P.A}, ${P.B}) = ?` };
      yield 1.4;
      const sp = 1;
      for (let k = 0; k < P.steps.length; k++) {
        const st = P.steps[k];
        this.shown = k + 1; this.stepT = this.t;
        const pl = st.q > 1 ? 's' : '';
        this.cap = st.r > 0
          ? { fr: `−${st.q} carré${pl} ${st.small}×${st.small}, reste ${st.small}×${st.r}`, en: `−${st.q} square${pl} ${st.small}×${st.small}, left ${st.small}×${st.r}` }
          : { fr: 'reste 0 → stop', en: 'remainder 0 → stop' };
        yield 0.6 * sp;
        const stagger = clamp(1.2 / st.q, 0.12, 0.34) * sp;
        for (const sq of st.sq) { sq.t0 = this.t; yield stagger; }
        yield 0.6 * sp;
      }
      this.finalT = this.t;
      this.cap = { fr: `pgcd(${P.A}, ${P.B}) = ${P.gcd}`, en: `gcd(${P.A}, ${P.B}) = ${P.gcd}` };
      yield 1.8;
      if (P.fib) {
        this.spiralT = this.t;
        this.cap = { fr: 'fibonacci = pire cas (Lamé) → spirale d’or', en: 'fibonacci = worst case (Lamé) → golden spiral' };
        yield 3.6;
      }
      this.gridT = this.t;
      this.cap = P.gcd === 1
        ? { fr: 'pgcd = 1 → premiers entre eux', en: 'gcd = 1 → coprime' }
        : { fr: `${P.gcd}×${P.gcd} pave tout : ${P.A / P.gcd}×${P.B / P.gcd} carrés`, en: `${P.gcd}×${P.gcd} tiles it all: ${P.A / P.gcd}×${P.B / P.gcd} squares` };
      yield 3.2;
      this.outT = this.t;
      yield 0.7;
    }
    this.done = true;
  }

  update(dt) { this.t += dt; this.script.update(dt); }

  stepColor(k) {
    const n = this.prob.steps.length;
    return SPECTRUM.rgbAt(n > 1 ? 0.05 + 0.9 * k / (n - 1) : 0.6);
  }

  geom() {
    const M = this.env.main, u = this.env.u, P = this.prob;
    const pw = Math.max(440 * u, M.w * 0.3);
    const aw = M.w - pw - 120 * u, ah = M.h - 60 * u;
    const s = Math.min(aw / P.A, ah / P.B);
    const rw = P.A * s, rh = P.B * s;
    return { s, rw, rh, rx: M.x + 50 * u + (aw - rw) / 2, ry: M.y + 30 * u + (ah - rh) / 2, px: M.x + M.w - pw, pw };
  }

  hud() {
    const P = this.prob; if (!P) return [];
    return [
      { label: 'a', value: fmt(P.A) },
      { label: 'b', value: fmt(P.B) },
      { label: { fr: 'divisions', en: 'divisions' }, value: String(this.shown || 0) },
      { label: { fr: 'pgcd', en: 'gcd' }, value: this.finalT >= 0 ? fmt(P.gcd) : '?', color: this.finalT >= 0 ? COL.amber : COL.dim },
    ];
  }
  caption() { return this.cap; }

  draw(g) {
    const P = this.prob; if (!P) return;
    const u = this.env.u, M = this.env.main, G = this.geom(), t = this.t;
    let alpha = clamp((t - this.t0) / 0.5, 0, 1);
    if (this.outT >= 0) alpha *= 1 - clamp((t - this.outT) / 0.6, 0, 1);
    g.globalAlpha = alpha;

    // rectangle + its dimensions
    g.fillStyle = COL.panel; g.fillRect(G.rx, G.ry, G.rw, G.rh);
    g.strokeStyle = COL.dim; g.lineWidth = 1.5 * u; g.strokeRect(G.rx, G.ry, G.rw, G.rh);
    text(g, 'a = ' + fmt(P.A), G.rx + G.rw / 2, G.ry - 14 * u, 20 * u, { fam: F.mono, align: 'center', color: COL.muted });
    g.save(); g.translate(G.rx - 14 * u, G.ry + G.rh / 2); g.rotate(-Math.PI / 2);
    text(g, 'b = ' + fmt(P.B), 0, 0, 20 * u, { fam: F.mono, align: 'center', color: COL.muted });
    g.restore();

    // squares
    const last = P.squares[P.squares.length - 1];
    for (const sq of P.squares) {
      if (sq.t0 < 0) continue;
      const k = clamp((t - sq.t0) / 0.15, 0, 1);
      const col = this.stepColor(sq.step);
      const S = sq.s * G.s, cx = G.rx + (sq.x + sq.s / 2) * G.s, cy = G.ry + (sq.y + sq.s / 2) * G.s;
      const Sd = S, lw = Math.min(2.2 * u, S * 0.07), gap = Math.min(1.5 * u, S * 0.05);
      if (k < 1) glow(g, cx, cy, S * 0.9 + 20 * u, col, alpha * 0.55 * (1 - k));
      g.globalAlpha = alpha * k;
      g.fillStyle = css(flat(col, 0.22));
      g.fillRect(cx - Sd / 2 + gap, cy - Sd / 2 + gap, Sd - 2 * gap, Sd - 2 * gap);
      g.strokeStyle = css(col); g.lineWidth = lw;
      g.strokeRect(cx - Sd / 2 + gap + lw / 2, cy - Sd / 2 + gap + lw / 2, Sd - 2 * gap - lw, Sd - 2 * gap - lw);
      if (S > 56 * u && this.spiralT < 0) text(g, fmt(sq.s), cx, cy, clamp(S * 0.15, 12 * u, 28 * u), { fam: F.mono, align: 'center', base: 'middle', color: css(col), alpha: alpha * k * 0.85 });
    }
    g.globalAlpha = alpha;

    // the gcd square pulses
    if (this.finalT >= 0) {
      const S = last.s * G.s, cx = G.rx + (last.x + last.s / 2) * G.s, cy = G.ry + (last.y + last.s / 2) * G.s;
      const pulse = 1;
      glow(g, cx, cy, Math.max(S * 1.6, 40 * u), RGB.amber, alpha * pulse * clamp((t - this.finalT) / 0.4, 0, 1));
      g.strokeStyle = COL.amber; g.lineWidth = 2.5 * u;
      g.strokeRect(cx - S / 2, cy - S / 2, S, S);
    }

    // golden spiral (Fibonacci case)
    if (this.spiralT >= 0) {
      const arcs = P.squares.filter(s => s.first);
      const prog = clamp((t - this.spiralT) / 2.6, 0, 1) * arcs.length;
      g.save();
      g.strokeStyle = COL.amber; g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i < arcs.length && i < prog; i++) {
        const q = arcs[i], S = q.s * G.s, x0 = G.rx + q.x * G.s, y0 = G.ry + q.y * G.s, x1 = x0 + S, y1 = y0 + S;
        const f = Math.min(1, prog - i);
        let cx, cy, a0;
        if (q.side === 'L') { cx = x1; cy = y1; a0 = Math.PI; }
        else if (q.side === 'T') { cx = x0; cy = y1; a0 = 1.5 * Math.PI; }
        else if (q.side === 'R') { cx = x0; cy = y0; a0 = 0; }
        else { cx = x1; cy = y0; a0 = 0.5 * Math.PI; }
        g.arc(cx, cy, S, a0, a0 + f * Math.PI / 2);
      }
      g.globalAlpha = 1; g.lineWidth = 3 * u; g.stroke();
      g.restore();
    }

    // grid of gcd squares
    if (this.gridT >= 0) {
      const cell = P.gcd * G.s, k = clamp((t - this.gridT) / 1.6, 0, 1);
      if (cell >= 5) {
        const sweep = G.rx + G.rw;
        g.save();
        g.beginPath(); g.rect(G.rx, G.ry, sweep - G.rx, G.rh); g.clip();
        g.strokeStyle = COL.muted; g.lineWidth = Math.max(0.6, Math.min(1.3 * u, cell * 0.12));
        g.beginPath();
        for (let j = 1; j < P.A / P.gcd; j++) { const x = G.rx + j * cell; g.moveTo(x, G.ry); g.lineTo(x, G.ry + G.rh); }
        for (let j = 1; j < P.B / P.gcd; j++) { const y = G.ry + j * cell; g.moveTo(G.rx, y); g.lineTo(G.rx + G.rw, y); }
        g.stroke();
        g.restore();
      }
    }

    // trace of the divisions
    const px = G.px, size = 25 * u, lh = Math.min(50 * u, (M.h - 190 * u) / Math.max(6, P.steps.length));
    let y = M.y + 50 * u;
    text(g, '>>> while b: a, b = b, a % b', px, y, 15 * u, { color: COL.dim });
    y += 22 * u;
    for (let k = 0; k < this.shown; k++) {
      const st = P.steps[k], col = this.stepColor(k);
      const a = k === this.shown - 1 ? clamp((t - this.stepT) / 0.35, 0, 1) : 1;
      y += lh;
      g.globalAlpha = alpha * a;
      g.fillStyle = css(col); rrect(g, px, y - size * 0.62, 10 * u, size * 0.62, 3 * u); g.fill();
      runs(g, [[fmt(st.big) + ' = ', COL.ink], [String(st.q), css(col)], [' × ' + fmt(st.small) + ' + ', COL.ink], [fmt(st.r), st.r === 0 ? COL.lime : COL.muted]],
        px + 24 * u, y, size, { fam: F.mono, alpha: 1 });
    }
    g.globalAlpha = alpha;
    if (this.finalT >= 0) {
      const a = clamp((t - this.finalT) / 0.5, 0, 1);
      y += 74 * u;
      text(g, '>>> ' + fmt(P.gcd), px, y, 46 * u, { weight: 600, color: COL.amber, alpha: alpha * a });
    }
    g.globalAlpha = 1;
  }
}
