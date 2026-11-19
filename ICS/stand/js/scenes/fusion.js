'use strict';
/* Merge sort drawn as its full "diamond": the list is split down to single
   elements (top half), then sorted halves are merged pairwise (bottom half),
   comparing the heads of the two halves at each step. */
defineScene({
  duo: ['#b8bb26', '#83a598'],
  id: 'fusion', accent: COL.cyan, maxDuration: 180,
  chip: { fr: 'Diviser pour régner', en: 'Divide and conquer' },
  title: { fr: 'tri fusion', en: 'merge sort' },
  subtitle: { fr: 'Couper en deux, trier chaque moitié, fusionner : Θ(n log n)', en: 'Split in two, sort each half, merge: Θ(n log n)' },
  short: { fr: 'Tri fusion', en: 'Merge sort' },
  create: env => new MergeTreeScene(env),
});

class MergeTreeScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false; this.rng = env.rng; this.n = 0;
    this.script = new Script(this.run());
  }
  *run() {
    const big = this.slotFor(32) >= 40 * this.env.u ? 32 : 16;
    for (let r = 0; this.t < 90; r++) yield* this.play(r % 2 === 0 ? big : 16, 1);
    this.done = true;
  }
  slotFor(n) { return this.env.main.w / (n + 0.3 * (n - 1)); }

  *play(n, sp) {
    const L = Math.log2(n);
    Object.assign(this, { n, L, R: 2 * L + 1, tiles: [], grid: [], cmps: 0, phase: 'split', curRow: 0, hl: [], runT0: this.t, endT: -1, outT: -1 });
    this.vals = Array.from({ length: n }, () => this.rng.int(1, 99));
    for (let r = 0; r < this.R; r++) this.grid.push(new Array(n).fill(null));
    const add = (r, i, v, src, dur) => { const tl = { v, r, i, src, t0: this.t, dur, used: false }; this.tiles.push(tl); this.grid[r][i] = tl; };
    this.vals.forEach((v, i) => add(0, i, v, null, 0.4));
    yield 1.1 * sp;
    for (let r = 1; r <= L; r++) {
      this.curRow = r;
      for (let i = 0; i < n; i++) add(r, i, this.vals[i], [r - 1, i], 0.55 * sp);
      yield 0.85 * sp;
    }
    this.phase = 'merge';
    let prev = this.vals.slice();
    for (let m = 1; m <= L; m++) {
      const r = L + m, gs = 1 << m, half = gs >> 1, out = new Array(n), ptr = [];
      this.curRow = r;
      for (let gi = 0; gi < n / gs; gi++) ptr.push({ i: gi * gs, iEnd: gi * gs + half, j: gi * gs + half, jEnd: (gi + 1) * gs, k: gi * gs });
      const d = 0.6 * sp;
      for (let s = 0; s < gs; s++) {
        this.hl = [];
        for (const p of ptr) {
          let take;
          if (p.i < p.iEnd && p.j < p.jEnd) { this.cmps++; take = prev[p.j] < prev[p.i] ? 'j' : 'i'; this.hl.push([r - 1, p.i], [r - 1, p.j]); }
          else take = p.i < p.iEnd ? 'i' : 'j';
          const src = take === 'i' ? p.i++ : p.j++;
          out[p.k] = prev[src];
          this.grid[r - 1][src].used = true;
          add(r, p.k, prev[src], [r - 1, src], d * 0.9);
          p.k++;
        }
        this.hlT = this.t;
        yield d;
      }
      this.hl = [];
      prev = out;
      yield 0.35 * sp;
    }
    this.phase = 'end'; this.endT = this.t;
    yield 4;
    this.outT = this.t; yield 0.6;
  }

  update(dt) { this.t += dt; this.script.update(dt); }

  geo() {
    const M = this.env.main, u = this.env.u, n = this.n;
    const slot = this.slotFor(n), gap = 0.3 * slot, rowH = M.h / this.R;
    return { M, u, slot, gap, rowH, tw: slot * 0.68, th: Math.min(rowH * 0.5, slot * 0.68, 50 * u) };
  }
  gs(r) { return r <= this.L ? this.n >> r : 1 << (r - this.L); }
  pos(G, r, i) {
    const gs = this.gs(r), groups = this.n / gs;
    const totalW = this.n * G.slot + (groups - 1) * G.gap;
    const x0 = G.M.x + (G.M.w - totalW) / 2;
    return [x0 + i * G.slot + Math.floor(i / gs) * G.gap + G.slot / 2, G.M.y + (r + 0.5) * G.rowH];
  }

  hud() {
    if (!this.n) return [];
    return [
      { label: 'n', value: String(this.n) },
      { label: { fr: 'niveaux', en: 'levels' }, value: `log₂ ${this.n} = ${this.L}` },
      { label: { fr: 'comparaisons', en: 'comparisons' }, value: String(this.cmps), color: COL.cyan },
      { label: 'n log₂ n', value: String(this.n * this.L), color: COL.dim },
    ];
  }
  caption() {
    if (!this.n) return '';
    if (this.phase === 'split') return { fr: 'diviser jusqu’à 1 élément', en: 'split down to 1 element' };
    if (this.phase === 'merge') return { fr: 'fusionner : prendre la plus petite tête', en: 'merge: take the smaller head' };
    return `${this.L} × ${this.n} ≥ ${this.cmps} cmp  →  Θ(n log n)`;
  }

  draw(g) {
    if (!this.n) return;
    const G = this.geo(), u = G.u, t = this.t;
    let alpha = clamp((t - this.runT0) / 0.4, 0, 1);
    if (this.outT >= 0) alpha *= 1 - clamp((t - this.outT) / 0.55, 0, 1);
    g.globalAlpha = alpha;

    // tree connectors
    g.strokeStyle = css(mix(RGB.cyan, RGB.ink, 0.35)); g.lineWidth = 2.2 * u;
    g.beginPath();
    for (let r = 1; r <= Math.min(this.curRow, this.R - 1); r++) {
      const gsC = this.gs(r), gsP = this.gs(r - 1);
      if (r <= this.L) {
        for (let gi = 0; gi < this.n / gsC; gi++) {
          const c = this.groupCenter(G, r, gi, gsC), p = this.groupCenter(G, r - 1, Math.floor(gi * gsC / gsP), gsP);
          g.moveTo(p[0], p[1] + G.th / 2 + 2 * u); g.lineTo(c[0], c[1] - G.th / 2 - 2 * u);
        }
      } else {
        for (let gi = 0; gi < this.n / gsP; gi++) {
          const c = this.groupCenter(G, r - 1, gi, gsP), p = this.groupCenter(G, r, Math.floor(gi * gsP / gsC), gsC);
          g.moveTo(c[0], c[1] + G.th / 2 + 2 * u); g.lineTo(p[0], p[1] - G.th / 2 - 2 * u);
        }
      }
    }
    g.stroke();

    // tiles
    const fs = Math.min(G.th * 0.5, G.tw * 0.44, 26 * u);
    for (const tl of this.tiles) {
      const k = clamp((t - tl.t0) / tl.dur, 0, 1), e = Ease.inOut(k);
      const [x1, y1] = this.pos(G, tl.r, tl.i);
      let x = x1, y = y1, a = 1;
      if (tl.src) { const [x0, y0] = this.pos(G, tl.src[0], tl.src[1]); x = lerp(x0, x1, e); y = lerp(y0, y1, e); }
      else a = k;
      const col = SPECTRUM.rgbAt((tl.v - 1) / 98);
      const dimmed = tl.used && this.phase !== 'end' ? 0.42 : 1;
      g.globalAlpha = alpha * a * dimmed;
      rrect(g, x - G.tw / 2, y - G.th / 2, G.tw, G.th, Math.min(9 * u, G.th * 0.25));
      g.fillStyle = css(col); g.fill();
      text(g, String(tl.v), x, y + 1 * u, fs, { fam: F.mono, weight: 600, align: 'center', base: 'middle', color: COL.bg });
    }
    g.globalAlpha = alpha;
    // compared heads
    const hk = this.hl.length ? 1 - clamp((t - this.hlT) / 0.5, 0, 1) : 0;
    if (hk > 0) {
      g.strokeStyle = COL.white; g.lineWidth = 2.5 * u;
      for (const [r, i] of this.hl) {
        const [x, y] = this.pos(G, r, i);
        rrect(g, x - G.tw / 2 - 3 * u, y - G.th / 2 - 3 * u, G.tw + 6 * u, G.th + 6 * u, 10 * u);
        g.globalAlpha = alpha * hk; g.stroke();
      }
      g.globalAlpha = alpha;
    }
    // final row celebration
    if (this.endT >= 0) {
      const k = clamp((t - this.endT) / 1.2, 0, 1);
      for (let i = 0; i < this.n; i++) {
        const [x, y] = this.pos(G, this.R - 1, i);
        const w = clamp(1 - Math.abs(i / this.n - k * 1.2 + 0.1) * 6, 0, 1);
        if (w > 0) glow(g, x, y, G.tw * 1.2, RGB.white, 0.45 * w * alpha);
      }
    }
    g.globalAlpha = 1;
  }
  groupCenter(G, r, gi, gs) {
    const a = this.pos(G, r, gi * gs), b = this.pos(G, r, gi * gs + gs - 1);
    return [(a[0] + b[0]) / 2, a[1]];
  }
}
