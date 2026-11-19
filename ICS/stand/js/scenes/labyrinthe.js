'use strict';
/* A maze is a spanning tree of the grid graph. Randomised DFS carves it (the
   glowing snake is the DFS stack), BFS floods it from the entrance (colour =
   distance), the shortest path is read back through the parents, and a last BFS
   from the centre shows the distance rings. */
defineScene({
  duo: ['#8ec07c', '#fabd2f'],
  id: 'labyrinthe', accent: COL.lime, maxDuration: 180,
  chip: { fr: 'Graphes · arbres couvrants', en: 'Graphs · spanning trees' },
  title: { fr: 'labyrinthe', en: 'maze' },
  subtitle: { fr: 'Un labyrinthe parfait est un arbre couvrant de la grille', en: 'A perfect maze is a spanning tree of the grid' },
  short: { fr: 'Labyrinthes', en: 'Mazes' },
  create: env => new MazeScene(env),
});

class MazeScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false; this.rng = env.rng;
    const u = env.u, M = env.main, target = 26 * u;
    this.cols = Math.max(10, Math.floor((M.w - 120 * u) / target));
    this.rows = Math.max(8, Math.floor(M.h / target));
    const C = this.cols, N = this.N = C * this.rows;
    this.links = new Uint8Array(N);   // bit 1: open to the right, bit 2: open below
    this.vis = new Uint8Array(N);
    const s0 = this.rng.int(0, N - 1);
    this.stack = [s0]; this.vis[s0] = 1; this.carved = []; // [a, b] in carving order
    this.entry = this.rng.int(0, this.rows - 1) * C;
    this.exit = this.rng.int(0, this.rows - 1) * C + C - 1;
    this.phase = 'gen'; this.acc = 0;
    this.genRate = (2 * N) / 50; // ~50 s of carving
    this.bfs = null; this.path = null; this.pathT = -1; this.layers = null;
    this.script = new Script(this.run());
  }
  nbrs(i) {
    const C = this.cols, out = [], x = i % C;
    if (x < C - 1 && (this.links[i] & 1)) out.push(i + 1);
    if (x > 0 && (this.links[i - 1] & 1)) out.push(i - 1);
    if (this.links[i] & 2) out.push(i + C);
    if (i >= C && (this.links[i - C] & 2)) out.push(i - C);
    return out;
  }
  genStep() {
    const st = this.stack; if (!st.length) return false;
    const C = this.cols, cur = st[st.length - 1], x = cur % C, y = (cur / C) | 0, v = this.vis, nb = [];
    if (x > 0 && !v[cur - 1]) nb.push(cur - 1);
    if (x < C - 1 && !v[cur + 1]) nb.push(cur + 1);
    if (y > 0 && !v[cur - C]) nb.push(cur - C);
    if (y < this.rows - 1 && !v[cur + C]) nb.push(cur + C);
    if (nb.length) {
      const nx = this.rng.pick(nb);
      if (nx === cur + 1) this.links[cur] |= 1; else if (nx === cur - 1) this.links[nx] |= 1; else if (nx === cur + C) this.links[cur] |= 2; else this.links[nx] |= 2;
      v[nx] = 1; st.push(nx); this.carved.push([cur, nx]);
      if (this.layers) this.carve(this.layers.maze.getContext('2d'), cur, nx);
    } else st.pop();
    return st.length > 0;
  }
  newBFS(src, cyclic) {
    const N = this.N, b = { src, cyclic, dist: new Int32Array(N).fill(-1), parent: new Int32Array(N).fill(-1), frontier: [src], level: 0, order: [src], done: false, acc: 0 };
    b.dist[src] = 0;
    // dry run for the maximum distance (colour scale)
    const d = new Int32Array(N).fill(-1), q = [src]; d[src] = 0; let h = 0, mx = 0;
    while (h < q.length) { const a = q[h++]; for (const c of this.nbrs(a)) if (d[c] < 0) { d[c] = d[a] + 1; mx = Math.max(mx, d[c]); q.push(c); } }
    b.max = Math.max(1, mx); b.rate = b.max / (cyclic ? 20 : 25);
    return b;
  }
  bfsLevel(b) {
    const next = [];
    for (const a of b.frontier) for (const c of this.nbrs(a)) if (b.dist[c] < 0) { b.dist[c] = b.dist[a] + 1; b.parent[c] = a; next.push(c); b.order.push(c); if (this.layers) this.paint(this.layers.bfs.getContext('2d'), b, c); }
    b.frontier = next; b.level++;
    if (!next.length) b.done = true;
  }
  colorFor(b, d) { return b.cyclic ? CYCLIC.rgbAt((d / 70) % 1) : SPECTRUM.rgbAt(d / b.max); }

  *run() {
    yield 0.8;
    while (this.phase === 'gen') yield 0.25; // update() advances the generation
    this.phase = 'genDone'; yield 3;
    this.bfs = this.newBFS(this.entry, false); this.phase = 'bfs';
    while (!this.bfs.done) yield 0.25;
    this.path = []; for (let c = this.exit; c >= 0; c = this.bfs.parent[c]) this.path.push(c);
    this.path.reverse(); this.pathT = this.t; this.phase = 'path';
    yield 7;
    const C = this.cols, center = ((this.rows / 2) | 0) * C + ((C / 2) | 0);
    this.bfs = this.newBFS(center, true); this.path = null; this.phase = 'bfs2';
    if (this.layers) { const g = this.layers.bfs.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.layers.bfs.width, this.layers.bfs.height); g.restore(); this.paint(g, this.bfs, center); }
    while (!this.bfs.done) yield 0.25;
    this.phase = 'end'; yield 4;
    this.done = true;
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'gen') {
      this.acc += dt * this.genRate;
      while (this.acc >= 1) { this.acc--; if (!this.genStep()) { this.phase = 'genEnd'; break; } }
      if (this.phase === 'genEnd') this.phase = 'genDone0';
    } else if ((this.phase === 'bfs' || this.phase === 'bfs2') && this.bfs && !this.bfs.done) {
      this.bfs.acc += dt * this.bfs.rate;
      while (this.bfs.acc >= 1 && !this.bfs.done) { this.bfs.acc--; this.bfsLevel(this.bfs); }
    }
    if (this.phase === 'genDone0') this.phase = 'wait';
    this.script.update(dt);
  }

  geo() {
    const M = this.env.main, u = this.env.u;
    const c = Math.min((M.w - 120 * u) / this.cols, M.h / this.rows);
    return { M, u, c, ox: M.x + (M.w - this.cols * c) / 2, oy: M.y + (M.h - this.rows * c) / 2 };
  }
  ctr(G, i) { return [G.ox + (i % this.cols + 0.5) * G.c, G.oy + (((i / this.cols) | 0) + 0.5) * G.c]; }
  carve(g, a, b) {
    const G = this.geo(), pa = this.ctr(G, a), pb = this.ctr(G, b);
    g.strokeStyle = '#3c3836'; g.lineWidth = G.c * 0.58; g.lineCap = 'round';
    line(g, pa[0], pa[1], pb[0], pb[1]);
  }
  paint(g, b, c) {
    const G = this.geo(), p = this.ctr(G, c), col = css(this.colorFor(b, b.dist[c]));
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = G.c * 0.58; g.lineCap = 'round';
    if (b.parent[c] >= 0) { const q = this.ctr(G, b.parent[c]); line(g, q[0], q[1], p[0], p[1]); }
    else dot(g, p[0], p[1], G.c * 0.29);
  }
  ensureLayers() {
    const env = this.env, M = env.main, d = env.dpr, w = Math.round(M.w * d), h = Math.round(M.h * d);
    if (this.layers && this.layers.w === w && this.layers.h === h && this.layers.x === M.x) return;
    const mk = () => { const c = offscreen(w, h), g = c.getContext('2d'); g.setTransform(d, 0, 0, d, -M.x * d, -M.y * d); return c; };
    this.layers = { w, h, x: M.x, maze: mk(), bfs: mk() };
    const gm = this.layers.maze.getContext('2d');
    for (const [a, b] of this.carved) this.carve(gm, a, b);
    if (this.bfs) { const gb = this.layers.bfs.getContext('2d'); for (const c of this.bfs.order) this.paint(gb, this.bfs, c); }
  }

  hud() {
    const items = [{ label: { fr: 'cases', en: 'cells' }, value: fmt(this.N) }];
    if (this.phase === 'gen') items.push({ label: { fr: 'pile DFS', en: 'DFS stack' }, value: fmt(this.stack.length), color: COL.lime });
    if (this.bfs) items.push({ label: 'distance', value: fmt(this.bfs.level), color: COL.cyan });
    if (this.path) items.push({ label: { fr: 'plus court chemin', en: 'shortest path' }, value: fmt(this.path.length - 1), color: COL.white });
    return items;
  }
  caption() {
    switch (this.phase) {
      case 'gen': return { fr: 'dfs aléatoire : avancer, sinon dépiler', en: 'random dfs: advance, else pop' };
      case 'wait': case 'genDone': return { fr: `arbre couvrant : ${this.N - 1} passages, 1 seul chemin`, en: `spanning tree: ${this.N - 1} passages, 1 path` };
      case 'bfs': return { fr: 'bfs depuis l’entrée · couleur = distance', en: 'bfs from the entrance · colour = distance' };
      case 'path': return { fr: `plus court chemin : ${this.path.length - 1} pas`, en: `shortest path: ${this.path.length - 1} steps` };
      default: return { fr: 'bfs depuis le centre', en: 'bfs from the centre' };
    }
  }

  draw(g) {
    this.ensureLayers();
    const G = this.geo(), u = G.u, M = G.M, t = this.t;
    g.drawImage(this.layers.maze, M.x, M.y, M.w, M.h);
    if (this.bfs) g.drawImage(this.layers.bfs, M.x, M.y, M.w, M.h);
    // entrance / exit
    const pe = this.ctr(G, this.entry), px = this.ctr(G, this.exit);
    const arrow = (x, y, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 9 * u, y - 9 * u); g.lineTo(x + 7 * u, y); g.lineTo(x - 9 * u, y + 9 * u); g.closePath(); g.fill(); };
    arrow(G.ox - 22 * u, pe[1], COL.lime); arrow(G.ox + this.cols * G.c + 22 * u, px[1], COL.pink);
    text(g, 'in', G.ox - 26 * u, pe[1] - 18 * u, 15 * u, { align: 'center', color: COL.lime, weight: 600 });
    text(g, 'out', G.ox + this.cols * G.c + 20 * u, px[1] - 18 * u, 15 * u, { align: 'center', color: COL.pink, weight: 600 });
    // DFS stack while carving: a rainbow snake
    if (this.phase === 'gen' && this.stack.length > 1) {
      const st = this.stack, n = st.length, chunk = Math.max(8, Math.ceil(n / 90));
      g.lineWidth = G.c * 0.3; g.lineCap = 'round'; g.lineJoin = 'round';
      for (let s = 0; s < n - 1; s += chunk) {
        g.strokeStyle = SPECTRUM.str[Math.round(255 * s / n)];
        g.beginPath();
        for (let i = s; i <= Math.min(n - 1, s + chunk); i++) { const p = this.ctr(G, st[i]); if (i === s) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }
        g.stroke();
      }
      const h = this.ctr(G, st[n - 1]);
      glow(g, h[0], h[1], G.c * 2.4, RGB.white, 0.9); g.fillStyle = COL.white; dot(g, h[0], h[1], G.c * 0.25);
    }
    // BFS frontier glows
    if (this.bfs && !this.bfs.done && this.bfs.frontier.length < 400) {
      for (const c of this.bfs.frontier) { const p = this.ctr(G, c); glow(g, p[0], p[1], G.c * 1.6, RGB.white, 0.55); }
    }
    // shortest path
    if (this.path) {
      const k = clamp((t - this.pathT) / 4, 0, 1), n = Math.max(2, Math.ceil(this.path.length * Ease.inOut(k)));
      g.save();
      g.strokeStyle = COL.white; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      for (let i = 0; i < n && i < this.path.length; i++) { const p = this.ctr(G, this.path[i]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
      g.globalAlpha = 1; g.lineWidth = G.c * 0.26; g.stroke();
      g.restore();
      const head = this.ctr(G, this.path[Math.min(n, this.path.length) - 1]);
      glow(g, head[0], head[1], G.c * 3, RGB.white, 0.8);
    }
  }
}
