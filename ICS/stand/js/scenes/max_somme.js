'use strict';
/* Cours 6, "la somme maximale": the largest sum of two elements of a list (different
   indices). max_somme tries every pair (two nested loops, Θ(n²)); max_somme_lin
   keeps the two largest values in a single pass (Θ(n)). Same answer.
   The code shown is the course's own. */
defineScene({
  duo: ['#83a598', '#fabd2f'],
  id: 'max_somme', maxDuration: 180,
  title: { fr: 'somme maximale de deux éléments', en: 'largest sum of two elements' },
  short: { fr: 'max_somme', en: 'max_somme' },
  create: env => new MaxSumScene(env),
});

const CODE_QUAD = ['def max_somme(L):', '    n = len(L)', '    max_s = L[0] + L[1]', '    for i in range(n):', '        for j in range(i+1, n):',
  '            if L[i] + L[j] > max_s:', '                max_s = L[i] + L[j]', '    return max_s'];
const CODE_LIN = ['def max_somme_lin(L):', '    n = len(L)', "    max_1, max_2 = -float('inf'), -float('inf')", '    for i in range(n):',
  '        if L[i] > max_1:', '            max_2 = max_1', '            max_1 = L[i]', '        elif L[i] > max_2:', '            max_2 = L[i]', '    return max_1 + max_2'];

class MaxSumScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    const rng = env.rng, n = this.n = 14;
    const vals = new Set(); while (vals.size < n) vals.add(rng.int(5, 99));
    this.L = rng.shuffle([...vals]);
    this.phase = 'show'; this.i = -1; this.j = -1; this.maxS = null; this.bestPair = null; this.pairs = 0;
    this.m1 = -Infinity; this.m2 = -Infinity; this.i1 = -1; this.i2 = -1; this.steps = 0; this.line = -1; this.lastLin = '';
    this.script = new Script(this.run());
  }
  *run() {
    const L = this.L, n = this.n;
    yield 2.5;
    this.phase = 'quad';
    this.maxS = L[0] + L[1]; this.bestPair = [0, 1]; this.line = 2;
    yield 1.5;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        this.i = i; this.j = j; this.pairs++;
        const s = L[i] + L[j];
        this.line = 5;
        if (s > this.maxS) { yield 0.45; this.maxS = s; this.bestPair = [i, j]; this.line = 6; yield 0.45; }
        else yield 0.9;
      }
    }
    this.line = 7; this.phase = 'quadEnd'; yield 4;
    this.phase = 'lin'; this.i = -1; this.j = -1; this.line = 2;
    yield 2;
    for (let i = 0; i < n; i++) {
      this.i = i; this.steps++; this.line = 4;
      yield 0.8;
      if (L[i] > this.m1) { this.m2 = this.m1; this.i2 = this.i1; this.m1 = L[i]; this.i1 = i; this.line = 6; this.lastLin = 'max1'; }
      else if (L[i] > this.m2) { this.m2 = L[i]; this.i2 = i; this.line = 8; this.lastLin = 'max2'; }
      else { this.line = 7; this.lastLin = 'none'; }
      yield 1.4;
    }
    this.line = 9; this.phase = 'end'; this.i = -1;
    yield 9;
    this.done = true;
  }
  update(dt) { this.t += dt; this.script.update(dt); }

  hud() {
    const lin = this.phase === 'lin' || this.phase === 'end';
    return [
      { label: 'n', value: String(this.n) },
      { label: lin ? { fr: 'passages', en: 'steps' } : { fr: 'paires testées', en: 'pairs tried' }, value: String(lin ? this.steps : this.pairs), color: lin ? COL.amber : COL.cyan },
      { label: { fr: 'somme max', en: 'max sum' }, value: lin ? (this.m2 > -Infinity ? String(this.m1 + this.m2) : '?') : (this.maxS === null ? '?' : String(this.maxS)) },
    ];
  }
  caption() {
    const n = this.n, P = n * (n - 1) / 2;
    if (this.phase === 'show') return { fr: `${n} nombres : quelle est la plus grande somme de deux d’entre eux ?`, en: `${n} numbers: what is the largest sum of two of them?` };
    if (this.phase === 'quad' || this.phase === 'quadEnd') return { fr: `max_somme : toutes les paires (i, j), soit n(n−1)/2 = ${P} → Θ(n²)`, en: `max_somme: every pair (i, j), n(n−1)/2 = ${P} of them → Θ(n²)` };
    if (this.phase === 'lin') return { fr: 'max_somme_lin : garder les deux plus grands en un seul passage → Θ(n)', en: 'max_somme_lin: keep the two largest in a single pass → Θ(n)' };
    return { fr: `même réponse (${this.m1 + this.m2}) : ${P} paires contre ${n} passages`, en: `same answer (${this.m1 + this.m2}): ${P} pairs versus ${n} steps` };
  }

  draw(g) {
    const env = this.env, u = env.u, M = env.main, n = this.n, L = this.L;
    const lw = M.w * 0.55, rx = M.x + lw + 60 * u, rw = M.w - lw - 60 * u;
    const lin = this.phase === 'lin' || this.phase === 'end';
    const A = RGB.cyan, B = RGB.amber;

    // --- the list, as bars with their values
    const top = M.y + 40 * u, bh = M.h * 0.42, base = top + bh, bw = lw / n;
    g.strokeStyle = COL.line; g.lineWidth = 1; line(g, M.x, base, M.x + lw, base);
    for (let k = 0; k < n; k++) {
      const v = L[k], h = bh * v / 100, x = M.x + k * bw;
      let col = mix(BG, hex(COL.muted), 0.45), ink = COL.muted;
      if (!lin) {
        if (k === this.i) { col = A; ink = COL.ink; }
        if (k === this.j) { col = B; ink = COL.ink; }
      } else {
        if (k === this.i1) { col = A; ink = COL.ink; }
        if (k === this.i2) { col = mix(BG, A, 0.6); ink = COL.ink; }
        if (k === this.i) { col = B; ink = COL.ink; }
      }
      g.fillStyle = css(col); g.fillRect(x + bw * 0.12, base - h, bw * 0.76, h);
      text(g, String(v), x + bw / 2, base - h - 8 * u, Math.min(17 * u, bw * 0.4), { align: 'center', color: ink });
      text(g, String(k), x + bw / 2, base + 18 * u, 12 * u, { align: 'center', color: COL.dim });
    }
    const tag = (k, s, col, row) => {
      if (k < 0) return;
      text(g, s, M.x + (k + 0.5) * bw, base + 38 * u + row * 18 * u, 14 * u, { align: 'center', color: col });
    };
    if (!lin) {
      tag(this.i, 'i', COL.cyan, 0); tag(this.j, 'j', COL.amber, 0);
      if (this.bestPair && this.phase !== 'show') {
        // the best pair so far: outlined bars
        g.strokeStyle = COL.white; g.lineWidth = 2 * u;
        for (const k of this.bestPair) { const h = bh * L[k] / 100; g.strokeRect(M.x + k * bw + bw * 0.12, base - h, bw * 0.76, h); }
      }
    } else {
      tag(this.i, 'i', COL.amber, 0); tag(this.i1, 'max_1', COL.cyan, 1); tag(this.i2, 'max_2', COL.cyan, 2);
    }

    // --- what is happening, in one line of arithmetic
    const ly = base + 110 * u, fs = 22 * u;
    if (this.phase === 'quad' && this.i >= 0) {
      const s = L[this.i] + L[this.j], better = this.bestPair && this.bestPair[0] === this.i && this.bestPair[1] === this.j;
      runs(g, [[`L[${this.i}] + L[${this.j}] = ${L[this.i]} + ${L[this.j]} = `, COL.ink], [String(s), better ? COL.amber : COL.ink], [better ? '   → nouveau max_s' : `   ≤ max_s`, COL.dim]], M.x, ly, fs, {});
    }
    if (!lin && this.maxS !== null && this.phase !== 'show') text(g, `max_s = ${this.maxS}   (L[${this.bestPair[0]}] + L[${this.bestPair[1]}])`, M.x, ly + 40 * u, fs, { color: COL.muted });
    if (lin) {
      const f = v => (v === -Infinity ? '-inf' : String(v));
      text(g, `max_1 = ${f(this.m1)}     max_2 = ${f(this.m2)}`, M.x, ly, fs, { color: COL.ink });
      if (this.phase === 'end') text(g, `return max_1 + max_2 = ${this.m1 + this.m2}`, M.x, ly + 40 * u, fs, { color: COL.amber });
    }

    // --- the work done: pairs vs single pass, same scale
    const P = n * (n - 1) / 2, by = M.y + M.h - 50 * u, bx = M.x + 230 * u, bwid = lw - 230 * u - 70 * u;
    [['max_somme', this.pairs, COL.cyan], ['max_somme_lin', this.steps, COL.amber]].forEach(([lab, v, col], k) => {
      const y = by + k * 34 * u;
      text(g, lab, M.x, y, 17 * u, { base: 'middle', color: COL.muted });
      g.fillStyle = COL.faint; g.fillRect(bx, y - 8 * u, bwid, 16 * u);
      g.fillStyle = col; g.fillRect(bx, y - 8 * u, bwid * v / P, 16 * u);
      text(g, String(v), bx + bwid * v / P + 10 * u, y + 1, 16 * u, { base: 'middle', color: col });
    });

    // --- the course's code, current line highlighted
    const cf = Math.min(18 * u, rw / 46), lh = cf * 1.5;
    let y = M.y + 24 * u;
    const block = (lines, on) => {
      lines.forEach((s, k) => {
        if (on && k === this.line) { g.fillStyle = css(flat(on === 'quad' ? A : B, 0.25)); g.fillRect(rx - 8 * u, y - cf * 1.05, rw, lh); }
        text(g, s, rx, y, cf, { color: on ? COL.ink : COL.dim }); y += lh;
      });
      y += lh * 0.8;
    };
    block(CODE_QUAD, !lin ? 'quad' : false);
    block(CODE_LIN, lin ? 'lin' : false);
  }
}
