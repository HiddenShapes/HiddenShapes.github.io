'use strict';
/* Sorting race: five algorithms sort copies of the same random list, each
   allowed the same number of operations per second (1 comparison or 1
   swap/write = 1 operation). The input kind is random too: sometimes nearly
   sorted (insertion sort wins!), sometimes reversed, sometimes few values. */
defineScene({
  duo: ['#83a598', '#fe8019'],
  id: 'tris', accent: COL.lime, maxDuration: 180,
  chip: { fr: 'Tris · complexité', en: 'Sorting · complexity' },
  title: { fr: 'la course des tris', en: 'sorting race' },
  subtitle: { fr: 'Mêmes données, même vitesse : Θ(n²) contre Θ(n log n)', en: 'Same data, same speed: Θ(n²) versus Θ(n log n)' },
  short: { fr: 'Tris', en: 'Sorting' },
  create: env => new SortRaceScene(env),
});

function* sortSelection(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) { yield ['c', m, j]; if (a[j] < a[m]) m = j; }
    if (m !== i) { yield ['s', i, m]; const t = a[i]; a[i] = a[m]; a[m] = t; }
    yield ['f', i];
  }
}
function* sortInsertion(a) {
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0; j--) {
      yield ['c', j - 1, j];
      if (a[j - 1] > a[j]) { yield ['s', j - 1, j]; const t = a[j]; a[j] = a[j - 1]; a[j - 1] = t; } else break;
    }
  }
}
function* sortBubble(a) {
  let end = a.length - 1, swapped = true;
  while (swapped && end > 0) {
    swapped = false;
    for (let j = 0; j < end; j++) {
      yield ['c', j, j + 1];
      if (a[j] > a[j + 1]) { yield ['s', j, j + 1]; const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swapped = true; }
    }
    yield ['f', end]; end--;
  }
}
function* sortMerge(a) {
  const aux = new Float64Array(a.length);
  function* sort(lo, hi) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    yield* sort(lo, mid); yield* sort(mid + 1, hi);
    yield ['r', lo, hi];
    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    let i = lo, j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) { yield ['w', k]; a[k] = aux[j++]; }
      else if (j > hi) { yield ['w', k]; a[k] = aux[i++]; }
      else { yield ['c', i, j]; if (aux[j] < aux[i]) { yield ['w', k]; a[k] = aux[j++]; } else { yield ['w', k]; a[k] = aux[i++]; } }
    }
  }
  yield* sort(0, a.length - 1);
}
// Python's list.sort() = Timsort: find runs (reversing strictly descending ones), extend short runs to
// `minrun` with binary insertion sort, then merge neighbouring runs.
function* sortTim(a) {
  const n = a.length;
  let minrun = n; { let r = 0, m = n; while (m >= 64) { r |= m & 1; m >>= 1; } minrun = m + r; }
  function* binsort(lo, hi, start) {
    for (let i = start; i < hi; i++) {
      const pivot = a[i];
      let l = lo, r = i;
      while (l < r) { const m = (l + r) >> 1; yield ['c', i, m]; if (pivot < a[m]) r = m; else l = m + 1; }
      if (l === i) continue;
      yield ['m', l, i - l + 1];           // one memmove: shift a[l..i) right and drop the pivot in
      for (let k = i; k > l; k--) a[k] = a[k - 1];
      a[l] = pivot;
      for (let k = l + 1; k <= i; k++) yield ['f0', k];
    }
  }
  function* countRun(lo) {
    if (lo + 1 >= n) return n;
    let hi = lo + 1;
    yield ['c', hi, lo];
    if (a[hi] < a[lo]) {
      hi++;
      while (hi < n) { yield ['c', hi, hi - 1]; if (a[hi] < a[hi - 1]) hi++; else break; }
      for (let i = lo, j = hi - 1; i < j; i++, j--) { yield ['s', i, j]; const t = a[i]; a[i] = a[j]; a[j] = t; }
    } else {
      hi++;
      while (hi < n) { yield ['c', hi, hi - 1]; if (a[hi] >= a[hi - 1]) hi++; else break; }
    }
    return hi;
  }
  function* merge(l0, m, r1) {
    yield ['r', l0, r1 - 1];
    const tmp = a.slice(l0, m);
    let i = 0, j = m, k = l0;
    while (i < tmp.length && j < r1) {
      yield ['c', j, k];
      if (a[j] < tmp[i]) { yield ['w', k]; a[k++] = a[j++]; } else { yield ['w', k]; a[k++] = tmp[i++]; }
    }
    while (i < tmp.length) { yield ['w', k]; a[k++] = tmp[i++]; }
  }
  const runs = [];
  function* mergeAt(i) { const [l0, m] = runs[i], r1 = runs[i + 1][1]; yield* merge(l0, m, r1); runs.splice(i, 2, [l0, r1]); }
  let lo = 0;
  while (lo < n) {
    let hi = yield* countRun(lo);
    if (hi - lo < minrun) { const force = Math.min(n, lo + minrun); yield* binsort(lo, force, hi); hi = force; }
    runs.push([lo, hi]);
    yield ['r', lo, hi - 1];
    for (;;) {                               // keep run lengths balanced (Timsort invariants)
      const k = runs.length; if (k < 2) break;
      const len = r => r[1] - r[0], X = len(runs[k - 1]), Y = len(runs[k - 2]), Z = k >= 3 ? len(runs[k - 3]) : Infinity;
      if (Z <= Y + X) { yield* mergeAt(Z < X ? k - 3 : k - 2); }
      else if (Y <= X) { yield* mergeAt(k - 2); }
      else break;
    }
    lo = hi;
  }
  while (runs.length > 1) yield* mergeAt(runs.length - 2);
}

class SortRaceScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    const rng = env.rng, u = env.u, M = env.main;
    this.algos = [
      { name: { fr: 'tri_selection()', en: 'selection_sort()' }, cx: 'Θ(n²)', color: COL.pink, gen: a => sortSelection(a) },
      { name: { fr: 'tri_insertion()', en: 'insertion_sort()' }, cx: 'Θ(n²)', color: COL.amber, gen: a => sortInsertion(a) },
      { name: { fr: 'tri_bulles()', en: 'bubble_sort()' }, cx: 'Θ(n²)', color: COL.coral, gen: a => sortBubble(a) },
      { name: { fr: 'tri_fusion()', en: 'merge_sort()' }, cx: 'Θ(n log n)', color: COL.cyan, gen: a => sortMerge(a) },
      { name: { fr: 'L.sort()', en: 'L.sort()' }, cx: 'Θ(n log n) · timsort', color: COL.lime, gen: a => sortTim(a) },
    ];
    // list size from panel width
    const cellW = (M.w - 2 * 18 * u) / 3;
    const nFit = Math.floor((cellW - 32 * u) / (5.5 * u));
    this.n = [120, 100, 80, 64, 48].find(k => k <= nFit) || 40;
    this.kind = rng.weighted([['random', 5], ['nearly', 2], ['reversed', 1.4], ['few', 1.6]]);
    this.mode = rng.chance(0.6) ? 'bars' : 'dots';
    const n = this.n;
    let base = Array.from({ length: n }, (_, i) => (i + 1) / n);
    if (this.kind === 'random') rng.shuffle(base);
    else if (this.kind === 'nearly') { for (let k = 0; k < n / 10; k++) { const i = rng.int(0, n - 2), j = Math.min(n - 1, i + rng.int(1, 3)); const t = base[i]; base[i] = base[j]; base[j] = t; } }
    else if (this.kind === 'reversed') base.reverse();
    else base = base.map(() => rng.int(1, 5) / 5);
    // dry run: count operations, so that the slowest algorithm takes ~RACE seconds
    this.totals = this.algos.map(al => { const a = Float64Array.from(base); let c = 0; for (const op of al.gen(a)) if (op[0] === 'c' || op[0] === 's' || op[0] === 'w' || op[0] === 'm') c++; return c; });
    this.maxOps = Math.max(...this.totals);
    this.RACE = 100; // the slowest algorithm takes ~2.7 min; everyone gets the same pace
    this.rate = this.maxOps / this.RACE;
    this.panels = this.algos.map((al, k) => {
      const a = Float64Array.from(base);
      return { al, a, it: al.gen(a), flash: new Float32Array(n), fin: new Uint8Array(n), cmp: 0, wr: 0, ops: 0, budget: 0, done: false, rank: 0, tDone: 0, doneT: 0, hist: [[0, 0]], range: null, total: this.totals[k] };
    });
    this.phase = 'ready'; this.raceT = 0; this.finished = 0; this.firstName = null; this.allDoneT = -1;
  }

  update(dt) {
    this.t += dt;
    if (this.phase === 'ready') { if (this.t > 1.4) this.phase = 'race'; }
    else if (this.phase === 'race') {
      this.raceT += dt;
      for (const P of this.panels) {
        if (P.done) continue;
        P.budget += this.rate * dt;
        this.step(P);
        if (this.raceT - P.hist[P.hist.length - 1][0] >= 0.1 || P.done) P.hist.push([this.raceT, P.ops]);
      }
      if (this.finished === this.panels.length) { this.phase = 'results'; this.allDoneT = this.t; }
    } else if (this.phase === 'results' && this.t - this.allDoneT > 8) this.done = true;
    const decay = Math.exp(-dt * 9);
    for (const P of this.panels) for (let i = 0; i < P.flash.length; i++) P.flash[i] *= decay;
  }
  step(P) {
    let guard = 0;
    while (P.budget >= 1 && !P.done && guard++ < 100000) {
      const r = P.it.next();
      if (r.done) {
        P.done = true; P.tDone = this.raceT; P.doneT = this.t; P.rank = ++this.finished; P.fin.fill(1); P.range = null;
        if (P.rank === 1) this.firstName = P.al.name;
        break;
      }
      const op = r.value;
      if (op[0] === 'c') { P.cmp++; P.ops++; P.budget--; P.flash[op[1]] = 1; if (op[2] >= 0) P.flash[op[2]] = 1; }
      else if (op[0] === 's') { P.wr += 2; P.ops++; P.budget--; P.flash[op[1]] = 1; P.flash[op[2]] = 1; }
      else if (op[0] === 'w') { P.wr++; P.ops++; P.budget--; P.flash[op[1]] = 1; }
      else if (op[0] === 'm') { P.wr += op[2]; P.ops++; P.budget--; P.flash[op[1]] = 1; }
      else if (op[0] === 'f0') P.flash[op[1]] = 0.6;
      else if (op[0] === 'f') P.fin[op[1]] = 1;
      else if (op[0] === 'r') P.range = [op[1], op[2]];
    }
  }

  kindLabel() {
    return { random: { fr: 'aléatoires', en: 'random' }, nearly: { fr: 'presque triées', en: 'nearly sorted' }, reversed: { fr: 'à l’envers', en: 'reversed' }, few: { fr: '5 valeurs', en: '5 values' } }[this.kind];
  }
  hud() {
    return [
      { label: 'n', value: String(this.n) },
      { label: { fr: 'données', en: 'data' }, value: T(this.kindLabel()), color: COL.lime },
      { label: { fr: 'temps', en: 'time' }, value: fmt(this.raceT, 1) + ' s' },
    ];
  }
  caption() {
    const n = this.n;
    if (this.phase === 'ready') return `n=${n} data=${this.kind}`;
    if (this.phase === 'results') {
      const w = this.panels.find(P => P.rank === 1);
      if (this.kind === 'nearly' && (w.al === this.algos[1] || w.al === this.algos[2])) return { fr: 'presque trié → insertion ≈ Θ(n)', en: 'nearly sorted → insertion ≈ Θ(n)' };
      if (w.al === this.algos[4] && this.kind === 'reversed') return { fr: 'L.sort() repère que la liste est à l’envers et la retourne : ~n opérations', en: 'L.sort() spots the reversed list and flips it: ~n operations' };
      if (w.al === this.algos[4]) return { fr: `L.sort() (timsort) : morceaux triés + fusions · n² = ${n * n} vs n·log₂n ≈ ${Math.round(n * Math.log2(n))}`, en: `L.sort() (timsort): sorted runs + merges · n² = ${n * n} vs n·log₂n ≈ ${Math.round(n * Math.log2(n))}` };
      return `n² = ${n * n}  vs  n·log₂n ≈ ${Math.round(n * Math.log2(n))}`;
    }
    if (this.firstName) return { fr: `${T(this.firstName)} termine 1er`, en: `${T(this.firstName)} finishes first` };
    return { random: { fr: 'même cadence pour tous', en: 'same pace for all' }, nearly: { fr: 'presque trié : qui en profite ?', en: 'nearly sorted: who wins?' },
      reversed: { fr: "à l'envers : pire cas", en: 'reversed: worst case' }, few: { fr: '5 valeurs, plein de doublons', en: '5 values, lots of duplicates' } }[this.kind];
  }

  cells() {
    const M = this.env.main, u = this.env.u, gap = 18 * u;
    const cw = (M.w - 2 * gap) / 3, ch = (M.h - gap) / 2, out = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) out.push([M.x + c * (cw + gap), M.y + r * (ch + gap), cw, ch]);
    return out;
  }

  draw(g) {
    const cells = this.cells();
    this.panels.forEach((P, k) => this.drawPanel(g, P, ...cells[k]));
    this.drawChart(g, ...cells[5]);
  }

  drawPanel(g, P, x, y, w, h) {
    const u = this.env.u, t = this.t, n = this.n, col = P.al.color;
    panel(g, x, y, w, h, u, { stroke: P.done ? col : COL.line });
    const pad = 16 * u;
    text(g, T(P.al.name), x + pad, y + pad + 18 * u, 20 * u, { weight: 600, color: col });
    text(g, T(P.al.cx), x + w - pad, y + pad + 17 * u, 15 * u, { fam: F.mono, align: 'right', color: COL.muted });
    text(g, `cmp=${P.cmp}  w=${P.wr}`, x + pad, y + h - pad + 2 * u, 14 * u, { color: COL.muted });
    const ax = x + pad, ay = y + 56 * u, aw = w - 2 * pad, ah = h - 56 * u - 46 * u, bw = aw / n;
    const sweep = -1;
    const gapB = bw >= 5 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const v = P.a[i], c = SPECTRUM.str[Math.round(v * 255)];
      const sw = sweep >= 0 && sweep <= 1.2 ? clamp(1 - Math.abs(i / n - sweep) * 7, 0, 1) : 0;
      if (this.mode === 'bars') {
        const bh = (0.04 + 0.96 * v) * ah, bx = ax + i * bw;
        g.fillStyle = c; g.fillRect(bx + gapB / 2, ay + ah - bh, bw - gapB, bh);
        const f = Math.max(P.flash[i], sw);
        if (f > 0.35) { g.fillStyle = css(mix(RGB.coral, RGB.ink, 0.55)); g.fillRect(bx + gapB / 2, ay + ah - bh, bw - gapB, bh); }
      } else {
        const cx = ax + (i + 0.5) * bw, cy = ay + ah - (0.02 + 0.96 * v) * ah, r = Math.max(1.8 * u, bw * 0.42);
        g.fillStyle = c; dot(g, cx, cy, r);
        const f = Math.max(P.flash[i], sw);
        if (f > 0.35) { g.fillStyle = css(mix(RGB.coral, RGB.ink, 0.55)); dot(g, cx, cy, r * 1.5); }
      }
    }
    if (P.range && !P.done) {
      g.fillStyle = col; g.globalAlpha = 0.8;
      g.fillRect(ax + P.range[0] * bw, ay + ah + 6 * u, (P.range[1] - P.range[0] + 1) * bw, 3 * u);
      g.globalAlpha = 1;
    }
    if (P.done) {
      const a = clamp((t - P.doneT) / 0.5, 0, 1);
      const bx = ax + 2 * u, by = ay + 34 * u;
      text(g, `#${P.rank}`, bx, by, 40 * u, { weight: 600, color: col, alpha: a });
      text(g, `${fmt(P.tDone, 1)}s ${P.ops} ops`, bx, by + 24 * u, 15 * u, { fam: F.mono, color: COL.ink, alpha: a * 0.85 });
    }
  }

  drawChart(g, x, y, w, h) {
    const u = this.env.u;
    panel(g, x, y, w, h, u);
    const pad = 16 * u;
    text(g, 'ops(t)', x + pad, y + pad + 18 * u, 20 * u, { weight: 600, color: COL.ink });
    const px = x + 64 * u, py = y + 60 * u, pw = w - 64 * u - 26 * u, ph = h - 60 * u - 46 * u;
    g.strokeStyle = COL.line; g.lineWidth = 1 * u;
    line(g, px, py + ph, px + pw, py + ph); line(g, px, py, px, py + ph);
    const T0 = this.RACE, Y0 = this.maxOps;
    for (let k = 1; k <= 3; k++) {
      const yy = py + ph - ph * k / 3;
      g.strokeStyle = COL.faint; line(g, px, yy, px + pw, yy);
      text(g, fmt(Math.round(Y0 * k / 3)), px - 8 * u, yy + 4 * u, 12 * u, { fam: F.mono, align: 'right', color: COL.dim });
    }
    text(g, 't →', px + pw, py + ph + 22 * u, 13 * u, { align: 'right', color: COL.dim });
    g.lineJoin = 'round';
    for (const P of this.panels) {
      const H = P.hist; if (H.length < 2) continue;
      g.strokeStyle = P.al.color; g.lineWidth = 2.6 * u;
      g.beginPath();
      H.forEach((p, i) => { const xx = px + pw * p[0] / T0, yy = py + ph - ph * p[1] / Y0; if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); });
      g.stroke();
      const last = H[H.length - 1], ex = px + pw * last[0] / T0, ey = py + ph - ph * last[1] / Y0;
      g.fillStyle = P.al.color; dot(g, ex, ey, 4 * u);
      if (P.done) glow(g, ex, ey, 18 * u, hex(P.al.color), 0.6);
    }
  }
}
