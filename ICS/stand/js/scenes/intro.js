'use strict';
/* Boot screen shown at the start of every loop: a terminal session that
   "launches" the show, next to the multiplication-table-modulo-N circle
   (lines i -> k·i mod N, k drifting). */
defineScene({
  duo: ['#83a598', '#fabd2f'],
  id: 'intro', noHeader: true, maxDuration: 14, accent: COL.lime,
  title: { fr: 'algorithmes', en: 'algorithms' },
  short: { fr: 'intro', en: 'intro' },
  create: env => new IntroScene(env),
});

class IntroScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    this.N = 240;
    this.k0 = env.rng.float(1.85, 2.6);
    this.rate = env.rng.float(0.15, 0.22);
  }
  update(dt) { this.t += dt; if (this.t > 11) this.done = true; }
  caption() { return `i → k·i mod ${this.N}`; }
  k() { return this.k0 + this.rate * Math.max(0, this.t - 0.6); }
  draw(g) {
    const env = this.env, u = env.u, M = env.main, t = this.t, W = env.W, H = env.H;
    const wide = W / H > 1.95;
    const R = Math.min(M.h * 0.5, W * (wide ? 0.19 : 0.225));
    const cx = M.x + M.w - R - (wide ? 220 : 30) * u, cy = M.y + M.h * 0.5;
    const N = this.N, k = this.k(), a0 = -Math.PI / 2;
    const fade = Ease.out(clamp(t / 1.6, 0, 1));

    // the circle
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = 1.2 * u;
    g.globalAlpha = 0.45 * fade;
    for (let i = 1; i < N; i++) {
      const j = (k * i) % N;
      const ai = a0 + TAU * i / N, aj = a0 + TAU * j / N;
      g.strokeStyle = SPECTRUM.str[Math.floor(255 * i / N)];
      line(g, cx + R * Math.cos(ai), cy + R * Math.sin(ai), cx + R * Math.cos(aj), cy + R * Math.sin(aj));
    }
    g.restore();
    g.globalAlpha = fade;
    text(g, `k = ${k.toFixed(3)}`, cx + R * 0.72, cy + R + 8 * u, 18 * u, { color: COL.dim });
    g.globalAlpha = 1;

    // the terminal
    const x = M.x + 10 * u, lh = 34 * u, cmd = '$ ./algos --random --loop';
    const on = Math.floor(performance.now() / 530) % 2 === 0;
    const typ = (s, t0, cps = 30) => { const n = Math.max(0, Math.floor((t - t0) * cps)); return n >= s.length ? s : s.slice(0, n); };
    let y = M.y + M.h * 0.16;
    const c1 = typ(cmd, 0.2);
    text(g, c1 + (c1.length < cmd.length ? '█' : ''), x, y, 24 * u, { color: COL.lime, weight: 500 });
    y += lh;
    if (t > 1.2) text(g, T({ fr: 'informatique & calcul scientifique — MAN', en: 'computer science & scientific computing — MAN' }), x, y, 18 * u, { color: COL.dim });
    // big word
    const word = T(this.constructor.word || { fr: 'algorithmes', en: 'algorithms' });
    let ts = 118 * u;
    const maxW = cx - R - 80 * u - x, wm = measure(g, word + '_', ts, 600);
    if (wm > maxW) ts *= maxW / wm;
    y += ts * 1.25;
    if (t > 1.5) {
      const w = typ(word, 1.5, 16);
      text(g, w + (w.length < word.length || on ? '_' : ''), x - 4 * u, y, ts, { weight: 600, color: COL.ink });
    }
    y += 70 * u;
    if (t > 2.6) text(g, typ(T({ fr: '# données aléatoires, calculé en direct', en: '# random data, computed live' }), 2.6, 45), x, y, 20 * u, { color: COL.muted });
    y += 64 * u;
    if (t > 3.6) {
      const ls = '$ ls algos/';
      text(g, typ(ls, 3.6), x, y, 20 * u, { color: COL.lime });
      y += lh;
      const ids = env.playlist().filter(id => id !== 'intro');
      let xx = x;
      ids.forEach((id, i) => {
        if (t < 4.2 + i * 0.06) return;
        const s = id + '.py', w = measure(g, s, 19 * u, 400) + 26 * u;
        if (xx + w > x + maxW) { xx = x; y += lh * 0.9; }
        text(g, s, xx, y, 19 * u, { color: i % 3 === 0 ? COL.cyan : COL.ink });
        xx += w;
      });
    }
  }
}
