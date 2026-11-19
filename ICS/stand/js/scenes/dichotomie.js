'use strict';
/* Binary search in a short sorted list of small random numbers, all visible at
   once (no zoom): lo / mid / hi pointers, the discarded half greys out, the
   range halves at every comparison. Repeated with new lists for ~3 minutes. */
defineScene({
  duo: ['#83a598', '#fb4934'],
  id: 'dichotomie', maxDuration: 180,
  title: { fr: 'recherche dichotomique', en: 'binary search' },
  short: { fr: 'Dichotomie', en: 'Binary search' },
  create: env => new BinSearchScene(env),
});

class BinSearchScene {
  constructor(env) {
    this.env = env; this.rng = env.rng; this.t = 0; this.done = false; this.R = null;
    const u = env.u, M = env.main;
    this.N = [64, 48, 40, 32, 24].find(n => (M.w - 60 * u) / n >= 34 * u) || 16;
    this.searches = 0;
    this.script = new Script(this.run());
  }
  *run() {
    while (this.t < 100) yield* this.search(); // ~2 min
    this.done = true;
  }
  makeList() {
    const rng = this.rng, N = this.N, vals = new Set();
    while (vals.size < N) vals.add(rng.int(1, 999));
    const a = [...vals].sort((x, y) => x - y);
    let target;
    if (rng.chance(0.8)) target = a[rng.int(0, N - 1)];
    else { do { target = rng.int(1, 999); } while (vals.has(target)); }
    return { a, target, lo: 0, hi: N - 1, mid: -1, comps: 0, cmp: 0, phase: 'show', found: false, sizes: [N], t0: this.t, outT: -1 };
  }
  *search() {
    const R = this.R = this.makeList();
    this.searches++;
    yield 3;
    while (R.lo <= R.hi) {
      R.mid = Math.floor((R.lo + R.hi) / 2); R.comps++; R.phase = 'mid';
      yield 1.4;
      R.cmp = Math.sign(R.a[R.mid] - R.target); R.phase = 'cmp';
      yield 1.7;
      if (R.cmp === 0) { R.found = true; break; }
      if (R.cmp < 0) R.lo = R.mid + 1; else R.hi = R.mid - 1;
      R.sizes.push(Math.max(0, R.hi - R.lo + 1));
      R.phase = 'cut';
      yield 1.3;
    }
    R.phase = 'end';
    yield 6;
    R.outT = this.t; yield 0.5;
  }
  update(dt) { this.t += dt; this.script.update(dt); }

  hud() {
    const R = this.R; if (!R) return [];
    return [
      { label: 'n', value: String(this.N) },
      { label: { fr: 'cible', en: 'target' }, value: String(R.target), color: COL.coral },
      { label: { fr: 'comparaisons', en: 'comparisons' }, value: String(R.comps) },
    ];
  }
  caption() {
    const R = this.R; if (!R) return '';
    if (R.phase === 'end') return R.found
      ? { fr: `trouvé en ${R.comps} comparaisons · log₂(${this.N}) ≈ ${Math.ceil(Math.log2(this.N + 1))}`, en: `found in ${R.comps} comparisons · log₂(${this.N}) ≈ ${Math.ceil(Math.log2(this.N + 1))}` }
      : { fr: `absent · prouvé en ${R.comps} comparaisons`, en: `not there · proven in ${R.comps} comparisons` };
    if (R.comps === 0) return { fr: `liste triée de ${this.N} nombres · où est ${R.target} ?`, en: `sorted list of ${this.N} numbers · where is ${R.target}?` };
    return { fr: 'comparer au milieu, garder une moitié', en: 'compare with the middle, keep one half' };
  }

  draw(g) {
    const R = this.R; if (!R) return;
    const u = this.env.u, M = this.env.main, t = this.t, N = this.N;
    let alpha = clamp((t - R.t0) / 0.4, 0, 1);
    if (R.outT >= 0) alpha *= 1 - clamp((t - R.outT) / 0.4, 0, 1);
    g.globalAlpha = alpha;
    const cw = (M.w - 60 * u) / N, ch = Math.min(64 * u, cw * 1.6), sx = M.x + 30 * u, sy = M.y + M.h * 0.3;
    const fs = Math.min(18 * u, cw * 0.42);
    const A = RGB.cyan, B = RGB.coral;
    text(g, `t = [${R.a[0]}, ${R.a[1]}, … , ${R.a[N - 1]}]`, sx, sy - 92 * u, 17 * u, { color: COL.dim });
    // cells
    for (let i = 0; i < N; i++) {
      const x = sx + i * cw, inside = i >= R.lo && i <= R.hi, isMid = i === R.mid && R.phase !== 'show';
      let fill = inside ? css(flat(A, 0.32)) : COL.faint, ink = inside ? COL.ink : COL.dim;
      if (isMid) { fill = R.phase === 'end' && R.found ? css(B) : css(flat(B, 0.55)); ink = COL.bg; }
      g.fillStyle = fill; g.fillRect(x + 1, sy, cw - 2, ch);
      text(g, String(R.a[i]), x + cw / 2, sy + ch / 2 + 1, fs, { align: 'center', base: 'middle', color: ink });
      if (N <= 48 || i % 2 === 0) text(g, String(i), x + cw / 2, sy + ch + 16 * u, 12 * u, { align: 'center', color: COL.dim });
    }
    // pointers
    const ptr = (i, lab, col, below) => {
      if (i < 0 || i >= N) return;
      const x = sx + (i + 0.5) * cw, y = below ? sy + ch + 30 * u : sy - 12 * u;
      g.fillStyle = col; g.beginPath();
      if (below) { g.moveTo(x - 6 * u, y + 10 * u); g.lineTo(x + 6 * u, y + 10 * u); g.lineTo(x, y); }
      else { g.moveTo(x - 7 * u, y - 12 * u); g.lineTo(x + 7 * u, y - 12 * u); g.lineTo(x, y); }
      g.closePath(); g.fill();
      text(g, lab, x, below ? y + 30 * u : y - 20 * u, 15 * u, { align: 'center', color: col });
    };
    if (R.lo <= R.hi && R.phase !== 'end') { ptr(R.lo, 'lo', COL.cyan, true); if (R.hi !== R.lo) ptr(R.hi, 'hi', COL.cyan, true); }
    if (R.mid >= 0 && R.phase !== 'show') ptr(R.mid, 'mid', COL.coral, false);
    // the comparison, as code
    const ly = sy + ch + 104 * u;
    if (R.mid >= 0 && R.phase !== 'show' && R.phase !== 'mid') {
      const v = R.a[R.mid];
      let s;
      if (R.cmp === 0) s = `t[${R.mid}] = ${v} == ${R.target}  →  return ${R.mid}`;
      else if (R.cmp < 0) s = `t[${R.mid}] = ${v} < ${R.target}  →  lo = mid + 1`;
      else s = `t[${R.mid}] = ${v} > ${R.target}  →  hi = mid − 1`;
      if (R.phase === 'end' && !R.found) s = `lo > hi  →  return None`;
      text(g, s, sx, ly, 24 * u, { color: R.phase === 'end' ? COL.coral : COL.ink });
    } else if (R.phase === 'mid') text(g, `mid = (${R.lo} + ${R.hi}) // 2 = ${R.mid}`, sx, ly, 24 * u, { color: COL.ink });
    // sizes of the range
    const cy = ly + 66 * u;
    text(g, '# hi − lo + 1', sx, cy, 15 * u, { color: COL.dim });
    let x = sx;
    R.sizes.forEach((sz, i) => {
      const s = String(sz), w = measure(g, s, 19 * u, 500) + 26 * u, last = i === R.sizes.length - 1;
      g.fillStyle = last ? css(flat(A, 0.4)) : COL.faint; g.fillRect(x, cy + 14 * u, w, 34 * u);
      text(g, s, x + w / 2, cy + 31 * u, 19 * u, { align: 'center', base: 'middle', color: last ? COL.ink : COL.muted });
      x += w + 10 * u;
    });
    // binary vs linear search, same scale
    const by = M.y + M.h - 60 * u, bx = sx + 300 * u, bw = M.w - 300 * u - 200 * u;
    text(g, '# comparaisons', sx, by - 36 * u, 15 * u, { color: COL.dim });
    [[T({ fr: 'dichotomie', en: 'binary' }), R.comps, COL.cyan], [T({ fr: 'linéaire (moy.)', en: 'linear (avg)' }), Math.round(N / 2), COL.coral]].forEach(([lab, v, col], i) => {
      const y = by + i * 40 * u, w = Math.max(4 * u, bw * v / N);
      text(g, lab, sx, y, 19 * u, { base: 'middle', color: COL.ink });
      g.fillStyle = col; g.fillRect(bx, y - 10 * u, w, 20 * u);
      text(g, String(v), bx + w + 12 * u, y + 1 * u, 20 * u, { base: 'middle', color: col });
    });
    g.globalAlpha = 1;
  }
}
