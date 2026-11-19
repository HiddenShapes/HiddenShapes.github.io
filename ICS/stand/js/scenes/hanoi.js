'use strict';
/* Towers of Hanoi, solved recursively. The caption follows the top-level
   recursion (n − 1 disks, the big one, n − 1 disks); the strip at the bottom
   records which disk moved at each step (the fractal "ruler" sequence). */
defineScene({
  duo: ['#83a598', '#d3869b'],
  id: 'hanoi', accent: COL.violet, maxDuration: 180,
  chip: { fr: 'Récursivité', en: 'Recursion' },
  title: { fr: 'hanoi(n, A, C)', en: 'hanoi(n, A, C)' },
  subtitle: { fr: 'Déplacer n disques demande 2ⁿ − 1 coups', en: 'Moving n disks takes 2ⁿ − 1 moves' },
  short: { fr: 'Tours de Hanoï', en: 'Towers of Hanoi' },
  create: env => new HanoiScene(env),
});

class HanoiScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    const rng = env.rng;
    this.n = 7; // 127 moves at a steady pace ≈ 2 min
    this.src = rng.pick([0, 2]); this.dst = 2 - this.src;
    this.pegs = [[], [], []];
    for (let s = this.n; s >= 1; s--) this.pegs[this.src].push(s);
    this.moves = [];
    const solve = (k, a, b, c) => { if (k === 0) return; solve(k - 1, a, c, b); this.moves.push([a, c, k]); solve(k - 1, b, a, c); };
    solve(this.n, this.src, 1, this.dst);
    this.M = this.moves.length; this.doneMoves = 0; this.moving = null; this.ticks = []; this.endT = -1;
    this.moveDur = 0.7;
    this.script = new Script(this.run());
  }
  *run() {
    yield 0.9;
    for (let i = 0; i < this.M; i++) {
      const [a, c, k] = this.moves[i];
      const d = this.moveDur;
      this.pegs[a].pop();
      this.moving = { k, from: a, to: c, t0: this.t, dur: d, fromH: this.pegs[a].length, toH: this.pegs[c].length };
      yield d;
      this.pegs[c].push(k); this.moving = null; this.doneMoves = i + 1; this.ticks.push(k);
      yield 0.1;
    }
    this.endT = this.t; yield 6;
    this.done = true;
  }
  update(dt) { this.t += dt; this.script.update(dt); }

  peg(i) { return 'ABC'[i]; }
  hud() {
    return [
      { label: { fr: 'disques', en: 'disks' }, value: String(this.n) },
      { label: { fr: 'coups', en: 'moves' }, value: `${this.doneMoves} / ${this.M}`, color: this.endT >= 0 ? COL.lime : COL.ink },
      { label: '2**n−1', value: fmt(this.M), color: COL.violet },
    ];
  }
  caption() {
    const n = this.n, half = (1 << (n - 1)) - 1, A = this.peg(this.src), C = this.peg(this.dst);
    if (this.endT >= 0) return { fr: `2**${n} − 1 = ${this.M} coups · 64 disques ≈ 585 milliards d’années`, en: `2**${n} − 1 = ${this.M} moves · 64 disks ≈ 585 billion years` };
    if (this.doneMoves < 2 && !this.moving) return { fr: 'jamais un grand disque sur un petit', en: 'never a big disk on a small one' };
    if (this.doneMoves < half) return `hanoi(${n - 1}, ${A}→B)`;
    if (this.doneMoves === half) return `move(${n}, ${A}→${C})`;
    return `hanoi(${n - 1}, B→${C})`;
  }

  geom() {
    const M = this.env.main, u = this.env.u, n = this.n;
    const rulerH = 50 * u, baseY = M.y + M.h - 200 * u;
    const sp = Math.min(M.w / 3, 640 * u);
    const maxW = sp * 0.9, minW = maxW * 0.26;
    const dh = Math.min((baseY - M.y - 40 * u) / (n + 2.2), 58 * u);
    return { sp, maxW, minW, dh, baseY, pegTop: baseY - dh * (n + 1.3), cx: M.x + M.w / 2, rulerBase: M.y + M.h - 6 * u, rulerH, M, u };
  }
  pegX(G, i) { return G.cx + (i - 1) * G.sp; }
  diskW(G, k) { return this.n > 1 ? lerp(G.minW, G.maxW, (k - 1) / (this.n - 1)) : G.maxW; }
  diskCol(k) { return SPECTRUM.rgbAt(this.n > 1 ? (k - 1) / (this.n - 1) : 0.5); }

  drawDisk(g, G, k, x, y, glowIt) {
    const w = this.diskW(G, k), h = G.dh * 0.86, col = this.diskCol(k), u = G.u;
    if (glowIt) glow(g, x, y, w * 0.75, col, 0.55);
    rrect(g, x - w / 2, y - h / 2, w, h, 2);
    g.fillStyle = css(col); g.fill();
    g.strokeStyle = COL.bg; g.lineWidth = 1 * u; g.stroke();
  }

  draw(g) {
    const G = this.geom(), u = G.u, t = this.t, M = G.M;
    // base and pegs
    const bx0 = this.pegX(G, 0) - G.sp * 0.5, bx1 = this.pegX(G, 2) + G.sp * 0.5;
        rrect(g, bx0, G.baseY, bx1 - bx0, 18 * u, 2); g.fillStyle = COL.line; g.fill();
    for (let i = 0; i < 3; i++) {
      const x = this.pegX(G, i);
            g.fillStyle = COL.dim; g.fillRect(x - 5 * u, G.pegTop - 12 * u, 10 * u, G.baseY - G.pegTop + 12 * u);
      const isSrc = i === this.src, isDst = i === this.dst;
      text(g, this.peg(i), x, G.baseY + 54 * u, 30 * u, { weight: 600, align: 'center', color: isDst ? COL.violet : COL.muted });
      if (isSrc || isDst) text(g, isSrc ? 'src' : 'dst', x, G.baseY + 78 * u, 15 * u, { align: 'center', color: COL.dim });
    }
    // resting disks
    for (let i = 0; i < 3; i++) {
      const x = this.pegX(G, i), st = this.pegs[i];
      for (let h = 0; h < st.length; h++) this.drawDisk(g, G, st[h], x, G.baseY - (h + 0.5) * G.dh, false);
    }
    // moving disk
    const mv = this.moving;
    if (mv) {
      const p = clamp((t - mv.t0) / mv.dur, 0, 1);
      const x0 = this.pegX(G, mv.from), x1 = this.pegX(G, mv.to);
      const y0 = G.baseY - (mv.fromH + 0.5) * G.dh, y1 = G.baseY - (mv.toH + 0.5) * G.dh, yc = G.pegTop - G.dh * 1.1;
      const x = lerp(x0, x1, smoothstep(0.36, 0.64, p));
      const y = p < 0.42 ? lerp(y0, yc, Ease.out(p / 0.42)) : p > 0.58 ? lerp(yc, y1, Ease.in((p - 0.58) / 0.42)) : yc;
      this.drawDisk(g, G, mv.k, x, y, true);
    }
    // ruler: which disk moved at each step
    const rx = M.x + M.w * 0.08, rw = M.w * 0.84, ry = G.rulerBase, bw = rw / this.M;
    g.fillStyle = COL.line; g.fillRect(rx, ry - 1 * u, rw, 1.5 * u);
    for (let i = 0; i < this.ticks.length; i++) {
      const k = this.ticks[i], h = (k / this.n) * G.rulerH;
      g.fillStyle = css(this.diskCol(k));
      g.fillRect(rx + i * bw + bw * 0.15, ry - h, Math.max(1, bw * 0.7), h);
    }
    text(g, '# disque déplacé / coup', rx, ry - G.rulerH - 12 * u, 14 * u, { color: COL.dim });
    // finale
    if (this.endT >= 0) {
      const a = clamp((t - this.endT) / 0.6, 0, 1), x = this.pegX(G, this.dst);
      glow(g, x, G.baseY - this.n * G.dh * 0.5, G.maxW * 0.8, RGB.violet, 0.35 * a * (0.7 + 0.3 * Math.sin(t * 4)));
      text(g, `${this.M} ${T({ fr: 'coups', en: 'moves' })}`, x, G.pegTop - 40 * u, 38 * u, { weight: 600, align: 'center', color: COL.violet, alpha: a });
    }
  }
}
