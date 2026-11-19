'use strict';
/* BFS and DFS side by side on the same random graph (Poisson-disc points,
   Gabriel-graph edges), from the same source. BFS uses a queue and grows in
   rings of equal distance; DFS uses a stack and snakes as far as it can.
   Their spanning trees come out very different. */
defineScene({
  duo: ['#83a598', '#fb4934'],
  id: 'graphes', accent: COL.cyan, maxDuration: 180,
  chip: { fr: 'Graphes', en: 'Graphs' },
  title: { fr: 'bfs vs dfs', en: 'bfs vs dfs' },
  subtitle: { fr: 'Même graphe, même départ : une file ou une pile change tout', en: 'Same graph, same start: a queue or a stack changes everything' },
  short: { fr: 'BFS / DFS', en: 'BFS / DFS' },
  create: env => new GraphTraversalScene(env),
});

function poissonDisc(rng, w, h, r, k = 30) {
  const cell = r / Math.SQRT2, gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  const grid = new Int32Array(gw * gh).fill(-1), pts = [], active = [];
  const add = p => { pts.push(p); active.push(pts.length - 1); grid[Math.floor(p[1] / cell) * gw + Math.floor(p[0] / cell)] = pts.length - 1; };
  add([rng.float(w * 0.3, w * 0.7), rng.float(h * 0.3, h * 0.7)]);
  while (active.length) {
    const ai = Math.floor(rng.next() * active.length), p = pts[active[ai]];
    let found = false;
    for (let j = 0; j < k && !found; j++) {
      const a = rng.float(0, TAU), d = rng.float(r, 2 * r), q = [p[0] + d * Math.cos(a), p[1] + d * Math.sin(a)];
      if (q[0] < 0 || q[1] < 0 || q[0] >= w || q[1] >= h) continue;
      const gx = Math.floor(q[0] / cell), gy = Math.floor(q[1] / cell);
      let ok = true;
      for (let yy = Math.max(0, gy - 2); yy <= Math.min(gh - 1, gy + 2) && ok; yy++)
        for (let xx = Math.max(0, gx - 2); xx <= Math.min(gw - 1, gx + 2); xx++) {
          const id = grid[yy * gw + xx];
          if (id >= 0) { const o = pts[id]; if ((o[0] - q[0]) ** 2 + (o[1] - q[1]) ** 2 < r * r) { ok = false; break; } }
        }
      if (ok) { add(q); found = true; }
    }
    if (!found) active.splice(ai, 1);
  }
  return pts;
}
function gabrielEdges(pts, maxD) {
  const n = pts.length, edges = [], adj = pts.map(() => []);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], d2 = dx * dx + dy * dy;
    if (d2 > maxD * maxD) continue;
    const mx = (pts[i][0] + pts[j][0]) / 2, my = (pts[i][1] + pts[j][1]) / 2, r2 = d2 / 4;
    let ok = true;
    for (let k = 0; k < n && ok; k++) {
      if (k === i || k === j) continue;
      const ex = pts[k][0] - mx, ey = pts[k][1] - my;
      if (ex * ex + ey * ey < r2) ok = false;
    }
    if (ok) { edges.push([i, j]); adj[i].push(j); adj[j].push(i); }
  }
  return { edges, adj };
}

class GraphTraversalScene {
  constructor(env) {
    this.env = env; this.t = 0; this.done = false;
    const rng = env.rng, G = this.geo();
    const aw = G.gw / G.gh, ah = 1, target = G.gw * G.gh > 600 * 400 * env.u * env.u ? 260 : 200;
    const r = Math.sqrt(0.68 * aw * ah / target);
    this.pts = poissonDisc(rng, aw, ah, r);
    this.norm = { aw, ah, r };
    const { edges, adj } = gabrielEdges(this.pts, 2.6 * r);
    this.edges = edges; this.adj = adj; this.N = this.pts.length;
    const tx = aw * rng.float(0.35, 0.65), ty = ah * rng.float(0.35, 0.65);
    let best = 0, bd = 1e9;
    this.pts.forEach((p, i) => { const d = (p[0] - tx) ** 2 + (p[1] - ty) ** 2; if (d < bd) { bd = d; best = i; } });
    this.src = best;
    this.dfsAdj = adj.map(a => rng.shuffle(a.slice()));
    // dry runs for colour scales
    const bfs = this.newBFS(); while (!bfs.done) this.tickBFS(bfs, 0);
    const dfs = this.newDFS(); while (!dfs.done) this.tickDFS(dfs, 0);
    this.maxDist = Math.max(1, ...bfs.dist); this.maxDepth = Math.max(1, ...dfs.depth);
    this.B = this.newBFS(); this.D = this.newDFS();
    this.RUN = 100; this.accB = 0; this.accD = 0; this.started = false; this.endT = -1;
  }
  newBFS() {
    const n = this.N, s = { queue: [this.src], head: 0, seen: new Uint8Array(n), dist: new Int32Array(n), parent: new Int32Array(n).fill(-1), tDisc: new Float64Array(n).fill(-1), cur: -1, done: false, ticks: 0 };
    s.seen[this.src] = 1; s.tDisc[this.src] = 0; return s;
  }
  newDFS() {
    const n = this.N, s = { stack: [this.src], it: new Int32Array(n), seen: new Uint8Array(n), depth: new Int32Array(n), parent: new Int32Array(n).fill(-1), tDisc: new Float64Array(n).fill(-1), fin: new Uint8Array(n), done: false, ticks: 0 };
    s.seen[this.src] = 1; s.tDisc[this.src] = 0; return s;
  }
  tickBFS(s, now) {
    if (s.head >= s.queue.length) { s.done = true; s.cur = -1; return; }
    const u = s.queue[s.head++]; s.cur = u; s.ticks++;
    for (const v of this.adj[u]) if (!s.seen[v]) { s.seen[v] = 1; s.dist[v] = s.dist[u] + 1; s.parent[v] = u; s.tDisc[v] = now; s.queue.push(v); }
    if (s.head >= s.queue.length) s.done = true;
  }
  tickDFS(s, now) {
    if (!s.stack.length) { s.done = true; return; }
    const u = s.stack[s.stack.length - 1], nb = this.dfsAdj[u];
    s.ticks++;
    while (s.it[u] < nb.length && s.seen[nb[s.it[u]]]) s.it[u]++;
    if (s.it[u] < nb.length) {
      const v = nb[s.it[u]++];
      s.seen[v] = 1; s.depth[v] = s.depth[u] + 1; s.parent[v] = u; s.tDisc[v] = now; s.stack.push(v);
    } else { s.fin[u] = 1; s.stack.pop(); if (!s.stack.length) s.done = true; }
  }
  update(dt) {
    this.t += dt;
    if (!this.started) { if (this.t > 1.2) this.started = true; else return; }
    const ib = this.RUN / this.N, id = this.RUN / (2 * this.N - 1);
    this.accB += dt; this.accD += dt;
    while (this.accB >= ib && !this.B.done) { this.accB -= ib; this.tickBFS(this.B, this.t); }
    while (this.accD >= id && !this.D.done) { this.accD -= id; this.tickDFS(this.D, this.t); }
    if (this.B.done && this.D.done && this.endT < 0) this.endT = this.t;
    if (this.endT >= 0 && this.t - this.endT > 8) this.done = true;
  }

  geo() {
    const M = this.env.main, u = this.env.u, gap = 24 * u, pw = (M.w - gap) / 2;
    const head = 70 * u, strip = 74 * u;
    return { M, u, gap, pw, head, strip, gw: pw - 40 * u, gh: M.h - head - strip - 20 * u };
  }
  hud() {
    return [
      { label: { fr: 'sommets', en: 'vertices' }, value: String(this.N) },
      { label: { fr: 'arêtes', en: 'edges' }, value: String(this.edges.length) },
      { label: { fr: 'profondeur BFS', en: 'BFS depth' }, value: this.B.done ? String(this.maxDist) : '…', color: COL.cyan },
      { label: { fr: 'profondeur DFS', en: 'DFS depth' }, value: this.D.done ? String(this.maxDepth) : '…', color: COL.pink },
    ];
  }
  caption() {
    if (this.endT >= 0) return { fr: `profondeur : bfs ${this.maxDist} · dfs ${this.maxDepth}`, en: `depth: bfs ${this.maxDist} · dfs ${this.maxDepth}` };
    if (!this.started) return { fr: 'même graphe, même départ', en: 'same graph, same start' };
    return { fr: 'bfs : file (FIFO) · dfs : pile (LIFO)', en: 'bfs: queue (FIFO) · dfs: stack (LIFO)' };
  }

  draw(g) {
    const G = this.geo();
    this.drawSide(g, G, this.B, G.M.x, true);
    this.drawSide(g, G, this.D, G.M.x + G.pw + G.gap, false);
  }
  drawSide(g, G, s, x0, isBFS) {
    const u = G.u, t = this.t, y0 = G.M.y, accent = isBFS ? COL.cyan : COL.pink;
    panel(g, x0, y0, G.pw, G.M.h, u);
    text(g, isBFS ? 'bfs(graphe, s)' : 'dfs(graphe, s)', x0 + 20 * u, y0 + 40 * u, 24 * u, { weight: 600, color: accent });
        const gx = x0 + 20 * u, gy = y0 + G.head, sc = G.gw / this.norm.aw;
    const P = i => [gx + this.pts[i][0] * sc, gy + this.pts[i][1] * sc];
    const colOf = i => SPECTRUM.rgbAt(isBFS ? s.dist[i] / this.maxDist : s.depth[i] / this.maxDepth);
    const fadeOthers = this.endT >= 0 ? clamp((t - this.endT) / 1.2, 0, 1) : 0;
    // all edges
    g.strokeStyle = css(mix(BG, hex(COL.line), 1 - 0.8 * fadeOthers)); g.lineWidth = 1.2 * u;
    g.beginPath();
    for (const [a, b] of this.edges) { const pa = P(a), pb = P(b); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); }
    g.stroke();
    // tree edges
    g.lineCap = 'round'; g.lineWidth = 3.2 * u;
    for (let v = 0; v < this.N; v++) {
      const p = s.parent[v]; if (p < 0) continue;
      const k = 1;
      const pa = P(p), pb = P(v);
      g.strokeStyle = css(colOf(v));
      line(g, pa[0], pa[1], lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k));
    }
    // DFS: current path (= the stack)
    if (!isBFS && s.stack.length > 1) {
      g.strokeStyle = css(mix(RGB.pink, RGB.ink, 0.5)); g.lineWidth = 2 * u; g.lineJoin = 'round';
      g.beginPath();
      s.stack.forEach((v, i) => { const p = P(v); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      g.stroke();
    }
    // nodes
    for (let v = 0; v < this.N; v++) {
      const p = P(v);
      if (!s.seen[v]) { g.fillStyle = COL.dim; dot(g, p[0], p[1], 3.2 * u); continue; }
      const k = 1;
      g.fillStyle = css(colOf(v)); dot(g, p[0], p[1], 6 * u * k);
    }
    const src = P(this.src);
    g.strokeStyle = COL.white; g.lineWidth = 2.2 * u; g.beginPath(); g.arc(src[0], src[1], 11 * u, 0, TAU); g.stroke();
    const cur = isBFS ? s.cur : (s.stack.length ? s.stack[s.stack.length - 1] : -1);
    if (cur >= 0 && !s.done) { const p = P(cur); glow(g, p[0], p[1], 34 * u, RGB.white, 0.9); g.fillStyle = COL.white; dot(g, p[0], p[1], 6.5 * u); }
    if (isBFS) for (let i = s.head; i < s.queue.length; i++) { const p = P(s.queue[i]); g.strokeStyle = COL.white; g.lineWidth = 1.5 * u; g.beginPath(); g.arc(p[0], p[1], 9 * u, 0, TAU); g.stroke(); }

    // the data structure
    const sy = y0 + G.M.h - G.strip + 8 * u, sx = x0 + 20 * u, sw = G.pw - 40 * u;
    text(g, isBFS ? 'queue = deque()' : 'stack = []', sx, sy + 12 * u, 15 * u, { color: accent });
    const items = isBFS ? s.queue.slice(s.head) : s.stack;
        const step = 17 * u, maxItems = Math.floor(sw / step);
    let list = items, prefix = false, suffix = false;
    if (items.length > maxItems) { if (isBFS) { list = items.slice(0, maxItems - 1); suffix = true; } else { list = items.slice(items.length - maxItems + 1); prefix = true; } }
    let xx = sx + (prefix ? step : 0) + step / 2;
    if (prefix) text(g, '…', sx + 2 * u, sy + 42 * u, 18 * u, { color: COL.muted });
    for (const v of list) { g.fillStyle = css(colOf(v)); dot(g, xx, sy + 36 * u, 6.5 * u); xx += step; }
    if (suffix) text(g, '…', xx - step / 2, sy + 42 * u, 18 * u, { color: COL.muted });
    if (!items.length && s.done) text(g, '[]', sx, sy + 42 * u, 16 * u, { color: COL.muted });
  }
}
