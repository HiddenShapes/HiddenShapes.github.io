'use strict';
/* Fixed-point iteration x_{k+1} = g(x_k) as cobweb diagrams (cos x, then the
   logistic map in a converging/cycling regime, then in chaos), followed by the
   bifurcation diagram of the logistic map drawn column by column. */
defineScene({
  duo: ['#8ec07c', '#d3869b'],
  id: 'pointfixe', accent: COL.violet, maxDuration: 180,
  chip: { fr: 'Analyse numérique', en: 'Numerical analysis' },
  title: { fr: 'x = g(x)', en: 'x = g(x)' },
  subtitle: { fr: 'xₖ₊₁ = g(xₖ) : converger, osciller… ou le chaos', en: 'xₖ₊₁ = g(xₖ): converge, oscillate… or chaos' },
  short: { fr: 'Point fixe', en: 'Fixed points' },
  create: env => new FixedPointScene(env),
});

class FixedPointScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false; this.rng = env.rng;
    this.cob = null; this.bif = null; this.phase = 'cobweb';
    this.script = new Script(this.run());
  }
  makeCobweb(kind) {
    const rng = this.rng;
    let g, lo, hi, label, fx, dg, iters, r = 0;
    if (kind === 'cos') {
      g = Math.cos; lo = 0; hi = 1.6; label = 'g(x) = cos x'; fx = 0.7390851332151607; dg = Math.abs(Math.sin(fx)); iters = 30;
    } else {
      r = kind === 'chaos' ? rng.float(3.7, 3.98) : kind === 'cycle' ? rng.pick([rng.float(3.15, 3.42), rng.float(3.47, 3.54)]) : rng.float(2.6, 2.95);
      g = x => r * x * (1 - x); lo = 0; hi = 1; label = `g(x) = ${fmt(r, 2)} · x(1 − x)`; fx = 1 - 1 / r; dg = Math.abs(2 - r); iters = kind === 'chaos' ? 80 : 30;
    }
    const x0 = lo + (hi - lo) * rng.float(0.06, 0.4);
    const xs = [x0]; for (let i = 0; i < iters; i++) xs.push(g(xs[i]));
    // cobweb vertices: (x0,0) -> (x0,x1) -> (x1,x1) -> (x1,x2) -> ...
    const pts = [[x0, 0]];
    for (let i = 0; i < iters; i++) { pts.push([xs[i], xs[i + 1]]); pts.push([xs[i + 1], xs[i + 1]]); }
    return { kind, g, lo, hi, label, fx, dg, xs, pts, r, shown: 1, t0: this.t, outT: -1 };
  }
  *run() {
    for (const kind of ['cos', 'conv', 'chaos']) {
      const C = this.cob = this.makeCobweb(kind);
      yield 0.9;
      for (let i = 1; i < C.pts.length; i++) { C.shown = i + 1; C.segT = this.t; yield 0.36; }
      yield 2.4;
      C.outT = this.t; yield 0.5;
    }
    this.done = true;
  }
  update(dt) { this.t += dt; this.script.update(dt); if (this.bif) this.stepBif(dt); }

  // ---------- bifurcation diagram ----------
  bifGeo() {
    const M = this.env.main, u = this.env.u;
    const dw = M.w * 0.66, dh = M.h - 40 * u;
    return { M, u, dx: M.x + 60 * u, dy: M.y + 10 * u, dw: dw - 60 * u, dh: dh - 30 * u };
  }
  ensureBif() {
    const B = this.bif, G = this.bifGeo(), d = this.env.dpr;
    const Wp = Math.max(50, Math.round(G.dw * d)), Hp = Math.max(50, Math.round(G.dh * d));
    if (B.cv && B.Wp === Wp && B.Hp === Hp) return;
    B.Wp = Wp; B.Hp = Hp; B.cv = offscreen(Wp, Hp); B.ctx = B.cv.getContext('2d');
    B.img = B.ctx.createImageData(Wp, Hp); B.hits = new Uint16Array(Hp); B.col = 0; B.acc = 0;
  }
  stepBif(dt) {
    const B = this.bif;
    this.ensureBif();
    if (B.col >= B.Wp) return;
    B.acc += dt * B.Wp / 30;
    const n = Math.floor(B.acc); if (n <= 0) return;
    B.acc -= n;
    const c0 = B.col, c1 = Math.min(B.Wp, B.col + n), Hp = B.Hp, data = B.img.data, rng = this.rng;
    for (let c = c0; c < c1; c++) {
      const r = B.r0 + (B.r1 - B.r0) * (c + 0.5) / B.Wp, hue = SPECTRUM.rgbAt((r - B.r0) / (B.r1 - B.r0));
      B.hits.fill(0);
      let x = rng.float(0.2, 0.8);
      for (let i = 0; i < 300; i++) x = r * x * (1 - x);
      for (let i = 0; i < 500; i++) { x = r * x * (1 - x); const y = Math.min(Hp - 1, Math.max(0, Math.round((1 - x) * (Hp - 1)))); B.hits[y]++; }
      for (let y = 0; y < Hp; y++) {
        const h = B.hits[y], o = 4 * (y * B.Wp + c);
        if (!h) { data[o + 3] = 0; continue; }
        const v = Math.min(1, Math.log(1 + h) / Math.log(1 + 30)), w = Math.min(0.55, h / 300);
        data[o] = lerp(hue[0], 255, w); data[o + 1] = lerp(hue[1], 255, w); data[o + 2] = lerp(hue[2], 255, w); data[o + 3] = Math.round(70 + 185 * v);
      }
    }
    B.ctx.putImageData(B.img, 0, 0, c0, 0, c1 - c0, Hp);
    B.col = c1;
  }

  hud() {
    if (this.cob) {
      const C = this.cob, k = Math.max(0, Math.floor((C.shown - 1) / 2));
      return [
        { label: 'k', value: String(k) },
        { label: 'xₖ', value: fmt(C.xs[Math.min(k, C.xs.length - 1)], 4), color: COL.violet },
        { label: '|g′(x*)|', value: fmt(C.dg, 2), color: C.dg < 1 ? COL.lime : COL.coral },
      ];
    }
    if (this.bif && this.bif.Wp) return [{ label: 'r', value: fmt(this.cursorR(), 3), color: COL.violet }];
    return [];
  }
  cursorR() { const B = this.bif; return B.r0 + (B.r1 - B.r0) * Math.min(1, B.col / B.Wp); }
  caption() {
    const C = this.cob;
    if (C) {
      if (C.dg < 1) return { fr: `|g′(x*)| = ${fmt(C.dg, 2)} < 1 → x* attire la suite : elle converge`, en: `|g′(x*)| = ${fmt(C.dg, 2)} < 1 → x* attracts the sequence: it converges` };
      return { fr: `|g′(x*)| = ${fmt(C.dg, 2)} > 1 → x* repousse la suite : elle ne se stabilise jamais (chaos)`, en: `|g′(x*)| = ${fmt(C.dg, 2)} > 1 → x* repels the sequence: it never settles (chaos)` };
    }
    return '';
  }

  draw(g) {
    if (this.cob) this.drawCobwebScene(g); else if (this.bif) this.drawBif(g);
  }

  drawCobweb(g, C, x, y, S, shown, u, alpha, lw) {
    const X = v => x + (v - C.lo) / (C.hi - C.lo) * S, Y = v => y + S - (v - C.lo) / (C.hi - C.lo) * S;
    g.globalAlpha = alpha;
    g.strokeStyle = COL.line; g.lineWidth = 1.2 * u; g.strokeRect(x, y, S, S);
    g.strokeStyle = COL.dim; g.lineWidth = 1.5 * u; line(g, X(C.lo), Y(C.lo), X(C.hi), Y(C.hi));
    g.strokeStyle = COL.ink; g.lineWidth = 2.6 * u; g.beginPath();
    for (let i = 0; i <= 160; i++) { const v = C.lo + (C.hi - C.lo) * i / 160, w = clamp(C.g(v), C.lo - 0.05, C.hi + 0.05); if (i) g.lineTo(X(v), Y(w)); else g.moveTo(X(v), Y(w)); }
    g.stroke();
    const n = Math.min(shown, C.pts.length);
    g.lineWidth = lw; g.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const a = C.pts[i - 1], b = C.pts[i], age = n - i;
      g.strokeStyle = SPECTRUM.str[Math.round(255 * i / C.pts.length)];
      g.globalAlpha = alpha * (age < 40 ? 1 : Math.max(0.25, 1 - (age - 40) / 60));
      let bx = b[0], by = b[1];
      if (i === n - 1 && C.segT != null) { const k = clamp((this.t - C.segT) / 0.12, 0, 1); bx = lerp(a[0], b[0], k); by = lerp(a[1], b[1], k); }
      line(g, X(a[0]), Y(a[1]), X(bx), Y(by));
    }
    g.globalAlpha = alpha;
    const last = C.pts[n - 1];
    glow(g, X(last[0]), Y(last[1]), 22 * u, RGB.white, 0.9 * alpha);
    return { X, Y };
  }

  drawCobwebScene(g) {
    const C = this.cob, env = this.env, u = env.u, M = env.main, t = this.t;
    let alpha = clamp((t - C.t0) / 0.5, 0, 1);
    if (C.outT >= 0) alpha *= 1 - clamp((t - C.outT) / 0.45, 0, 1);
    const S = Math.min(M.h - 50 * u, M.w * 0.46), x = M.x + 70 * u, y = M.y + (M.h - S) / 2 - 10 * u;
    const { X, Y } = this.drawCobweb(g, C, x, y, S, C.shown, u, alpha, 2.2 * u);
    // fixed point marker
    if (C.fx > C.lo && C.fx < C.hi) {
      g.strokeStyle = C.dg < 1 ? COL.lime : COL.coral; g.lineWidth = 2 * u;
      g.beginPath(); g.arc(X(C.fx), Y(C.fx), 9 * u, 0, TAU); g.stroke();
    }
    text(g, 'y = x', X(C.hi) - 8 * u, Y(C.hi) + 22 * u, 15 * u, { align: 'right', color: COL.muted, alpha });
    text(g, C.label, x + 10 * u, y + 26 * u, 20 * u, { color: COL.ink, weight: 600, alpha });
    text(g, fmt(C.lo, C.hi < 1.5 ? 0 : 0), x, y + S + 22 * u, 13 * u, { fam: F.mono, color: COL.dim, alpha });
    text(g, fmt(C.hi, C.hi === 1 ? 0 : 1), x + S, y + S + 22 * u, 13 * u, { fam: F.mono, align: 'right', color: COL.dim, alpha });

    // right side: the sequence and its graph
    const rx = x + S + 70 * u, rw = M.x + M.w - rx;
    const k = Math.max(0, Math.floor((C.shown - 1) / 2));
    text(g, '# xₖ', rx, M.y + 30 * u, 16 * u, { color: COL.dim, alpha });
    const ty = M.y + 50 * u, th = M.h * 0.42;
    g.strokeStyle = COL.line; g.lineWidth = 1 * u; g.globalAlpha = alpha; g.strokeRect(rx, ty, rw, th);
    if (C.fx > C.lo && C.fx < C.hi) { const fy = ty + th - (C.fx - C.lo) / (C.hi - C.lo) * th; g.setLineDash([5 * u, 5 * u]); g.strokeStyle = css(flat(RGB.lime, 0.5)); line(g, rx, fy, rx + rw, fy); g.setLineDash([]); }
    const total = C.xs.length - 1;
    g.lineWidth = 2 * u; g.strokeStyle = COL.violet; g.beginPath();
    for (let i = 0; i <= k; i++) { const xx = rx + rw * i / total, yy = ty + th - (C.xs[i] - C.lo) / (C.hi - C.lo) * th; if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
    g.stroke();
    g.fillStyle = COL.violet;
    for (let i = 0; i <= k; i++) dot(g, rx + rw * i / total, ty + th - (C.xs[i] - C.lo) / (C.hi - C.lo) * th, 2.6 * u);
    // last values
    const ly = ty + th + 44 * u, rows = Math.max(3, Math.floor((M.y + M.h - ly) / (28 * u)));
    const from = Math.max(0, k - rows + 1);
    for (let i = from; i <= k; i++) {
      const yy = ly + (i - from) * 28 * u;
      runs(g, [[`x${String(i).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('')} = `, COL.muted], [C.xs[i].toFixed(6).replace('.', LANG === 'fr' ? ',' : '.'), i === k ? COL.white : COL.ink]], rx, yy, 19 * u, { fam: F.text, alpha: alpha * (i === k ? 1 : 0.75) });
    }
    g.globalAlpha = 1;
  }

  drawBif(g) {
    this.ensureBif();
    const B = this.bif, G = this.bifGeo(), u = G.u, M = G.M, t = this.t;
    const alpha = clamp((t - B.t0) / 0.6, 0, 1);
    g.globalAlpha = alpha;
    g.strokeStyle = COL.line; g.lineWidth = 1.2 * u; g.strokeRect(G.dx, G.dy, G.dw, G.dh);
    g.drawImage(B.cv, G.dx, G.dy, G.dw, G.dh);
    const X = r => G.dx + (r - B.r0) / (B.r1 - B.r0) * G.dw;
    for (let r = 2.5; r <= 4.001; r += 0.5) text(g, fmt(r, 1), X(r), G.dy + G.dh + 22 * u, 14 * u, { fam: F.mono, align: 'center', color: COL.dim });
    text(g, 'r →', G.dx + G.dw, G.dy + G.dh + 42 * u, 14 * u, { align: 'right', color: COL.muted });
    text(g, '1', G.dx - 12 * u, G.dy + 12 * u, 14 * u, { fam: F.mono, align: 'right', color: COL.dim });
    text(g, '0', G.dx - 12 * u, G.dy + G.dh, 14 * u, { fam: F.mono, align: 'right', color: COL.dim });
    text(g, 'x', G.dx - 34 * u, G.dy + G.dh / 2, 16 * u, { color: COL.muted, align: 'center' });
    const rc = this.cursorR(), cx = X(rc);
    // annotations, revealed as the cursor passes them
    const notes = [[3.0, { fr: '2 valeurs', en: '2 values' }], [3.449, { fr: '4 valeurs', en: '4 values' }], [3.5699, { fr: 'chaos', en: 'chaos' }], [3.8284, { fr: 'période 3', en: 'period 3' }]];
    notes.forEach(([r, lab], i) => {
      if (rc < r) return;
      const x = X(r), a = clamp((rc - r) / 0.05, 0, 1);
      g.setLineDash([4 * u, 5 * u]); g.strokeStyle = css(flat(RGB.white, 0.3 * a)); g.lineWidth = 1 * u; line(g, x, G.dy, x, G.dy + G.dh); g.setLineDash([]);
      text(g, T(lab), x + 6 * u, G.dy + 20 * u + (i % 2) * 20 * u, 15 * u, { color: COL.ink, alpha: a * alpha, weight: 600 });
    });
    if (B.col < B.Wp) { g.strokeStyle = COL.ink; g.lineWidth = 2 * u; line(g, cx, G.dy, cx, G.dy + G.dh); glow(g, cx, G.dy + G.dh / 2, 60 * u, RGB.violet, 0.35); }
    // inset: cobweb at the cursor's r
    const ix = G.dx + G.dw + 60 * u, iw = M.x + M.w - ix, S = Math.min(iw, M.h * 0.62), iy = M.y + 40 * u;
    const r = rc, gfun = x => r * x * (1 - x);
    const xs = [0.3]; for (let i = 0; i < 200; i++) xs.push(gfun(xs[i]));
    const pts = []; for (let i = 120; i < 200; i++) { pts.push([xs[i], xs[i + 1]]); pts.push([xs[i + 1], xs[i + 1]]); }
    const C = { g: gfun, lo: 0, hi: 1, pts };
    this.drawCobweb(g, C, ix, iy, S, pts.length, u, alpha, 1.6 * u);
    text(g, `r = ${fmt(r, 3)}`, ix, iy - 12 * u, 20 * u, { fam: F.mono, color: COL.violet, alpha });
    const per = this.period(gfun);
    text(g, per ? (per === 1 ? 'point fixe' : `période ${per}`) : 'chaos', ix, iy + S + 32 * u, 20 * u, { color: per ? COL.lime : COL.coral, weight: 600, alpha });
    g.globalAlpha = 1;
  }
  period(gf) {
    let x = 0.3; for (let i = 0; i < 2000; i++) x = gf(x);
    const x0 = x;
    for (let p = 1; p <= 16; p++) { x = gf(x); if (Math.abs(x - x0) < 1e-6) return p; }
    return 0;
  }
}
