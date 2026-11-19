'use strict';
/* player.js — runs the playlist fullscreen: layout, title cards, HUD, captions,
   transitions, presenter keys and a deterministic debug mode (?scene=&at=&seed=). */
(function () {
  const P = new URLSearchParams(location.search);
  const CFG = Object.assign({ lang: 'fr', speed: 1, playlist: Object.keys(SCENES) }, window.CONFIG || {});
  LANG = P.get('lang') || CFG.lang;
  const SPEED = parseFloat(P.get('speed') || CFG.speed) || 1;
  const AT = P.has('at') ? parseFloat(P.get('at')) : null;      // fast-forward to t seconds, draw one frame, stop
  const DEBUG = AT != null || P.has('debug');
  let showFps = P.has('fps');
  const SEED0 = P.has('seed') ? parseInt(P.get('seed'), 10) >>> 0 : (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  let master = makeRNG(SEED0);

  let playlist = (P.get('scene') ? P.get('scene').split(',') : CFG.playlist).filter(id => SCENES[id] && (!SCENES[id].available || SCENES[id].available()));
  if (!playlist.length) playlist = Object.keys(SCENES);
  if (P.has('shuffle')) {
    const head = playlist[0] === 'intro' ? ['intro'] : [];
    const rest = playlist.filter(id => id !== 'intro');
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    playlist = head.concat(rest);
  }

  const cvs = document.getElementById('stage');
  const g = cvs.getContext('2d', { alpha: false });
  const errBox = document.getElementById('err');
  let W = 0, H = 0, DPR = 1, U = 1, bg = null;
  const L = {};
  const env = {
    get W() { return W; }, get H() { return H; }, get u() { return U; }, get dpr() { return DPR; },
    get main() { return L.main; }, get layout() { return L; },
    rng: null, still: AT != null, playlist: () => playlist,
  };
  window.ENV = env;

  let nResize = 0, nStart = 0;
  function resize() {
    nResize++;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, window.innerWidth); H = Math.max(240, window.innerHeight);
    cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
    cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    U = Math.min(W / 1920, H / 1080);
    const m = Math.round(56 * U), headH = Math.round(150 * U), footH = Math.round(54 * U), capH = Math.round(54 * U);
    L.margin = m;
    L.header = { x: m, y: 0, w: W - 2 * m, h: headH };
    L.main = { x: m, y: headH + Math.round(8 * U), w: W - 2 * m, h: H - headH - footH - capH - Math.round(14 * U) };
    L.caption = { x: m, y: L.main.y + L.main.h + Math.round(4 * U), w: W - 2 * m, h: capH };
    L.footer = { x: m, y: H - footH, w: W - 2 * m, h: footH };
    buildBackground();
    if (!booted) return;
    if (AT != null) boot();                                   // debug: replay deterministically at the new size
    else if (cur && cur.t < 1.5) start(idx);                  // window still settling (kiosk start): restart scene
    else if (cur && cur.inst && cur.inst.resize) safe(() => cur.inst.resize());
  }

  function buildBackground() {
    bg = offscreen(W * DPR, H * DPR);
    const b = bg.getContext('2d');
    b.fillStyle = COL.bg; b.fillRect(0, 0, bg.width, bg.height);
  }
  let scan = null;

  /* ---------- scene lifecycle ---------- */
  const RUN_AT = 0.3, FADE_IN = 0.3, FADE_OUT = 0.4;
  let idx = -1, cur = null, capPrev = '', capCur = '', capT = 9;
  const errors = [];

  function start(i) {
    nStart++;
    idx = ((i % playlist.length) + playlist.length) % playlist.length;
    const def = SCENES[playlist[idx]];
    setDuo(def.duo);
    env.rng = makeRNG(P.has('seed') && playlist.length === 1 ? parseInt(P.get('seed'), 10) >>> 0 : master.seed32());
    cur = { def, inst: null, t: 0, out: -1, failed: false };
    capPrev = capCur = ''; capT = 9;
    try { cur.inst = def.create(env); } catch (e) { fail(e); }
  }

  function update(dt) {
    if (!cur) return;
    cur.t += dt; capT += dt;
    const runAt = cur.def.noHeader ? 0.3 : RUN_AT;
    if (cur.inst && cur.t >= runAt) safe(() => cur.inst.update(dt));
    pollCaption();
    if (cur.out < 0 && (!cur.inst || cur.inst.done || cur.t > (cur.def.maxDuration || 90))) cur.out = 0;
    if (cur.out >= 0) { cur.out += dt; if (cur.out >= FADE_OUT) start(idx + 1); }
  }

  function safe(fn) { try { fn(); } catch (e) { fail(e); } }
  function fail(e) {
    const msg = (cur ? '[' + cur.def.id + '] ' : '') + (e && e.stack ? e.stack : String(e));
    if (errors.length < 20) errors.push(msg);
    console.error(msg);
    document.title = 'ERROR ' + String(e);
    if (DEBUG) { errBox.style.display = 'block'; errBox.textContent = errors.join('\n\n'); }
    if (cur && !cur.failed) { cur.failed = true; if (!DEBUG && cur.out < 0) cur.out = 0; }
  }

  /* ---------- drawing ---------- */
  function draw() {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(bg, 0, 0, W, H);
    if (cur && cur.inst) safe(() => { g.save(); cur.inst.draw(g); g.restore(); });
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (cur) {
      if (!cur.def.noHeader) drawTitle(cur.def, cur.t);
      if (!cur.def.noHeader && cur.inst && cur.inst.hud) drawHud(cur.t);
      drawCaption();
      drawFooter();
      let fade = 1 - clamp(cur.t / FADE_IN, 0, 1);
      if (cur.out >= 0) fade = Math.max(fade, clamp(cur.out / FADE_OUT, 0, 1));
      if (fade > 0.002) { g.globalAlpha = Ease.inOut(fade); g.fillStyle = COL.bg; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    }
    if (showFps) drawFps();
  }

  const cursorOn = () => Math.floor(performance.now() / 530) % 2 === 0;
  function typed(s, t, cps) { const n = Math.max(0, Math.floor(t * cps)); return n >= s.length ? s : s.slice(0, n); }

  // header: the command line + a short title (no title card)
  function drawTitle(def, t) {
    const m = L.margin, a = clamp(t / 0.3, 0, 1);
    text(g, `[${String(idx).padStart(2, '0')}/${String(playlist.length - 1).padStart(2, '0')}] $ python3 ${def.id}.py`, m, 50 * U, 17 * U, { color: COL.dim, alpha: a });
    text(g, T(def.title), m, 98 * U, 40 * U, { weight: 600, color: COL.ink, alpha: a });
  }

  function drawHud(t) {
    const a = clamp((t - RUN_AT) / 0.6, 0, 1);
    if (a <= 0) return;
    let items = null; try { items = cur.inst.hud(); } catch (e) { fail(e); }
    if (!items || !items.length) return;
    let x = W - L.margin;
    const vs = 30 * U, ls = 14 * U;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]; if (!it) continue;
      const v = String(T(it.value)), lab = T(it.label).toLowerCase().replace(/ /g, '_');
      const w = Math.max(measure(g, v, vs, 500), measure(g, lab, ls, 400));
      text(g, v, x, 96 * U, vs, { weight: 500, align: 'right', color: it.color || COL.ink, alpha: a });
      text(g, lab, x, 122 * U, ls, { align: 'right', color: COL.dim, alpha: a });
      x -= w + 40 * U;
    }
  }

  function pollCaption() {
    let s = '';
    if (cur.inst && cur.inst.caption && cur.t >= 0.3) { try { s = T(cur.inst.caption()) || ''; } catch (e) { fail(e); } }
    if (s !== capCur) { capPrev = capCur; capCur = s; capT = 0; }
  }
  // captions are typed like terminal output
  function drawCaption() {
    if (!capCur) return;
    const y = L.caption.y + L.caption.h * 0.55, size = 22 * U, x = L.caption.x;
    const s = (capCur.startsWith('#') ? '' : '# ') + capCur;
    text(g, s, x, y, size, { color: COL.muted, base: 'middle', alpha: clamp(capT / 0.25, 0, 1) });
  }

  // tmux-like status bar
  function drawFooter() {
    const h = Math.round(L.footer.h * 0.56), y0 = H - h, ym = y0 + h / 2 + 1, s = 14 * U;
    g.fillStyle = '#3c3836'; g.fillRect(0, y0, W, h);
    let x = 10 * U;
    const tag = `[${T(CFG.tag || 'ics')}] `;
    text(g, tag, x, ym, s, { color: COL.lime, base: 'middle', weight: 600 });
    x += measure(g, tag, s, 600) + 6 * U;
    playlist.forEach((id, i) => {
      const lab = `${i}:${id}${i === idx ? '*' : ''}`, w = measure(g, lab, s, 500);
      if (i === idx) { g.fillStyle = COL.lime; g.fillRect(x - 4 * U, y0, w + 8 * U, h); }
      text(g, lab, x, ym, s, { color: i === idx ? COL.bg : COL.muted, base: 'middle', weight: 500 });
      x += w + 14 * U;
    });
    if (paused || performance.now() - toastT < 1600) {
      const msg = paused ? '[paused]' : `[${toast}]`;
      text(g, msg, x + 10 * U, ym, s, { color: COL.amber, base: 'middle', weight: 600 });
    }
    const d = new Date(), clock = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}-${['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'][d.getMonth()]}`;
    text(g, `"${T(CFG.footer)}" ${clock}`, W - 10 * U, ym, s, { color: COL.muted, align: 'right', base: 'middle' });
  }

  const frameTimes = [];
  function drawFps() {
    if (frameTimes.length < 2) return;
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const worst = Math.max(...frameTimes);
    text(g, `${(1000 / avg).toFixed(0)} fps · pire ${worst.toFixed(0)} ms · ${W}×${H}@${DPR}`, W - 12, 18, 13, { fam: F.mono, align: 'right', color: '#8f8' });
  }

  /* ---------- presenter controls (optional; the show runs on its own) ---------- */
  let paused = false, toast = '', toastT = -9;
  const say = msg => { toast = msg; toastT = performance.now(); };
  const act = {
    next: () => { start(idx + 1); say('>> ' + playlist[idx]); },
    prev: () => { start(idx - 1); say('<< ' + playlist[idx]); },
    replay: () => { start(idx); say('reload ' + playlist[idx]); },
    pause: () => { paused = !paused; say(paused ? 'pause' : 'play'); },
    lang: () => { LANG = LANG === 'fr' ? 'en' : 'fr'; pollCaption(); say('lang=' + LANG); },
  };
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === 'Enter' || k === 'n') act.next();
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace' || k === 'p') act.prev();
    else if (k === 'r') act.replay();
    else if (k === ' ' || k === 'k') act.pause();
    else if (k === 'l') act.lang();
    else if (k === 'd') showFps = !showFps;
    else if (/^[0-9]$/.test(k) && +k < playlist.length) { start(+k); say('>> ' + playlist[idx]); }
    else if (k === 'f') toggleFullscreen();
    else return;
    e.preventDefault();
  }, true);
  // mouse / clicker fallback: left click = next, right click = previous, wheel = next/previous
  addEventListener('mousedown', e => { window.focus(); if (e.button === 0) act.next(); else if (e.button === 2) act.prev(); });
  addEventListener('contextmenu', e => e.preventDefault());
  let wheelT = 0;
  addEventListener('wheel', e => { const now = performance.now(); if (now - wheelT < 600) return; wheelT = now; if (e.deltaY > 0) act.next(); else act.prev(); }, { passive: true });
  // make sure the page itself has keyboard focus (kiosk windows sometimes start without it)
  cvs.tabIndex = -1;
  const grabFocus = () => { try { window.focus(); cvs.focus({ preventScroll: true }); } catch (e) {} };
  addEventListener('load', grabFocus); setTimeout(grabFocus, 500); setTimeout(grabFocus, 2000);
  addEventListener('resize', resize);
  // fullscreen, with the webkit-prefixed API for Safari older than 16.4
  function toggleFullscreen() {
    const d = document, el = d.documentElement;
    if (!(d.fullscreenElement || d.webkitFullscreenElement)) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else if (d.exitFullscreen) d.exitFullscreen().catch(() => {}); else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
  }
  // keep the display awake (Screen Wake Lock: Safari 16.4+, Chrome, Firefox 126+; silently ignored elsewhere).
  // Browsers drop the lock when the tab is hidden, so take it again when it comes back or on any key/click.
  let wakeLock = null, wakePending = false;
  const keepAwake = () => {
    if (wakeLock || wakePending || !navigator.wakeLock || document.visibilityState !== 'visible') return;
    wakePending = true;
    navigator.wakeLock.request('screen')
      .then(l => { wakeLock = l; l.addEventListener('release', () => { wakeLock = null; }); })
      .catch(() => {}).then(() => { wakePending = false; });
  };
  document.addEventListener('visibilitychange', keepAwake);
  addEventListener('keydown', keepAwake); addEventListener('mousedown', keepAwake);
  keepAwake();

  /* ---------- ?perf: report frame rate in the window title (readable from sway) ---------- */
  const perfFrames = [];
  if (P.has('perf')) {
    let gpu = '?';
    try { const gl = (typeof NewtonGL !== 'undefined' && NewtonGL.gl) || document.createElement('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); gpu = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 60); } catch (e) { gpu = 'none'; }
    setInterval(() => {
      const ft = perfFrames.splice(0); if (!ft.length || !cur) return;
      const avg = ft.reduce((x, y) => x + y, 0) / ft.length, worst = Math.max(...ft);
      const rs = (cur.inst && cur.inst.rs ? ` rs=${cur.inst.rs.toFixed(2)}` : '') + (cur.inst && cur.inst.phase ? ` phase=${cur.inst.phase}` : '') + ` t=${cur.t.toFixed(0)} resizes=${nResize} starts=${nStart} inner=${innerWidth}x${innerHeight}`;
      document.title = `Algorithmes en action | perf ${cur.def.id} ${(1000 / avg).toFixed(1)}fps worst=${worst.toFixed(0)}ms ${W}x${H}@${DPR}${rs} gpu=${gpu}`;
    }, 2000);
  }

  /* ---------- go ---------- */
  let last = 0;
  function frame(now) {
    const realDt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    frameTimes.push(realDt * 1000); if (frameTimes.length > 90) frameTimes.shift();
    if (perfFrames.length < 1000) perfFrames.push(realDt * 1000);
    env.realDt = realDt;
    if (!paused) update(Math.min(realDt, 0.1) * SPEED);
    draw();
    requestAnimationFrame(frame);
  }
  const faces = ['400 20px FiraC', '500 20px FiraC', '600 20px FiraC'];
  const fontsReady = Promise.race([Promise.all(faces.map(f => document.fonts.load(f))).catch(() => {}), new Promise(r => setTimeout(r, 3000))]);
  let booted = false;
  function boot() {
    booted = true;
    master = makeRNG(SEED0); idx = -1;
    start(0);
    if (AT != null) {
      const step = 1 / 60;
      for (let t = 0; t < AT; t += step) update(step);
      document.body.dataset.ready = W + 'x' + H + ' U=' + U.toFixed(3);
    }
  }
  // ?selftest: run every scene to completion off-screen, report errors and draw cost
  function selftest() {
    const out = [];
    playlist.forEach((id, i) => {
      const def = SCENES[id], t0 = performance.now(), e0 = errors.length;
      let sim = 0, draws = 0, drawMs = 0, worst = 0;
      idx = i; env.rng = makeRNG(SEED0 + i);
      cur = { def, inst: null, t: 0, out: -1, failed: false };
      try {
        cur.inst = def.create(env);
        const dt = 1 / 30;
        while (!cur.inst.done && sim < (def.maxDuration || 90)) {
          cur.t += dt; sim += dt;
          if (cur.t >= (def.noHeader ? 0.3 : RUN_AT)) cur.inst.update(dt);
          pollCaption();
          if (draws < 400 && Math.round(sim * 30) % 6 === 0) { const a = performance.now(); draw(); const d = performance.now() - a; drawMs += d; worst = Math.max(worst, d); draws++; }
        }
      } catch (e) { fail(e); }
      out.push(`${id.padEnd(11)} sim ${sim.toFixed(1).padStart(5)}s  done ${cur.inst && cur.inst.done ? 'yes' : 'NO '}  draw avg ${(drawMs / Math.max(1, draws)).toFixed(1).padStart(5)} ms  worst ${worst.toFixed(0).padStart(4)} ms  cpu ${((performance.now() - t0) / 1000).toFixed(1)}s` + (errors.length > e0 ? '  ERROR' : ''));
    });
    errBox.style.display = 'block';
    errBox.textContent = `${W}x${H}\n` + out.join('\n') + (errors.length ? '\n\n' + errors.join('\n\n') : '');
    document.title = 'SELFTEST ' + (errors.length ? 'FAIL' : 'OK');
  }
  fontsReady.then(() => {
    resize();
    if (P.has('selftest')) { booted = true; selftest(); return; }
    boot();
    if (AT != null) { const still = () => { draw(); requestAnimationFrame(still); }; still(); } // keep presenting the frozen frame
    else requestAnimationFrame(frame);
  });
})();
