'use strict';
/* core.js — shared helpers for the stall animations: maths, randomness,
   colours, text, timing. Plain script (no modules) so index.html also works
   when opened straight from disk (file://). */

const TAU = Math.PI * 2;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ramp = (a, b, x) => clamp((x - a) / (b - a), 0, 1);

const Ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};

/* ---------- randomness (seedable, so a run can be replayed with ?seed=) ---------- */
function makeRNG(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    float: (a = 0, b = 1) => a + (b - a) * next(),
    int: (a, b) => a + Math.floor(next() * (b - a + 1)), // inclusive
    pick: arr => arr[Math.floor(next() * arr.length)],
    chance: p => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    gauss() { let u = 0; while (u === 0) u = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * next()); },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    },
    weighted(pairs) { // [[value, weight], ...]
      let tot = 0; for (const p of pairs) tot += p[1];
      let x = next() * tot;
      for (const p of pairs) { x -= p[1]; if (x <= 0) return p[0]; }
      return pairs[pairs.length - 1][0];
    },
    seed32: () => Math.floor(next() * 4294967296) >>> 0,
  };
}

/* ---------- colour ---------- */
// OKLCH -> sRGB [r,g,b] (0..255), perceptually even hues.
function oklch(L, C, hDeg) {
  const h = hDeg * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const f = x => { x = clamp(x, 0, 1); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)); };
  return [f(r), f(g), f(bl)];
}
const css = (c, a = 1) => (a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a < 0 ? 0 : a.toFixed(3)})`);
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(c1, c2, t) { return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))]; }

function makeLUT(fn, n = 256) {
  const rgb = [], str = [];
  for (let i = 0; i < n; i++) { const c = fn(i / (n - 1)); rgb.push(c); str.push(css(c)); }
  const idx = t => clamp(Math.round(t * (n - 1)), 0, n - 1);
  return { rgb, str, n, at: t => str[idx(t)], rgbAt: t => rgb[idx(t)] };
}
function refillLUT(L, fn) { for (let i = 0; i < L.n; i++) { const c = fn(i / (L.n - 1)); L.rgb[i] = c; L.str[i] = css(c); } }
// Main value colormap: violet -> blue -> cyan -> green -> yellow -> orange -> pink.
// Flat terminal palette (gruvbox-like). Value ramp: blue -> aqua -> green -> yellow -> orange -> red.
const RAMP = ['#83a598', '#8ec07c', '#b8bb26', '#fabd2f', '#fe8019', '#fb4934'].map(h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
const rampAt = (stops, t) => { const x = clamp(t, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i, a = stops[i], b = stops[i + 1]; return [0, 1, 2].map(k => Math.round(a[k] + (b[k] - a[k]) * f)); };
const SPECTRUM = makeLUT(t => rampAt(RAMP, t));
const CYCLIC = makeLUT(t => rampAt(RAMP.concat([RAMP[0]]), t), 360);

const COL = {
  bg: '#1d2021', ink: '#ebdbb2', muted: '#a89984', dim: '#7c6f64',
  faint: '#32302f', line: '#504945', panel: '#242424',
  cyan: '#83a598', pink: '#d3869b', amber: '#fabd2f', lime: '#b8bb26', violet: '#b48ead', coral: '#fe8019', white: '#fbf1c7',
};
const RGB = {}; const BG = hex(COL.bg);
// what a translucent colour would look like on the background, as a solid colour
const flat = (c, a) => mix(BG, c, clamp(a, 0, 1));

// Each scene is drawn with two colours and their shades. 'cool' accents map to A, 'warm' ones to B;
// the value ramp goes from a dark shade of A, through A, to B.
function setDuo(duo) {
  const [A, B] = duo || ['#83a598', '#fe8019'];
  for (const k of ['cyan', 'lime', 'violet']) COL[k] = A;
  for (const k of ['pink', 'amber', 'coral']) COL[k] = B;
  for (const k of ['cyan', 'pink', 'amber', 'lime', 'violet', 'coral']) RGB[k] = hex(COL[k]);
  const a = hex(A), b = hex(B), a0 = mix(BG, a, 0.45);
  refillLUT(SPECTRUM, t => (t < 0.5 ? mix(a0, a, t / 0.5) : mix(a, b, (t - 0.5) / 0.5)));
  refillLUT(CYCLIC, t => (t < 0.5 ? mix(a, b, t / 0.5) : mix(b, a, (t - 0.5) / 0.5)));
} for (const k of ['cyan', 'pink', 'amber', 'lime', 'violet', 'coral', 'white', 'ink']) RGB[k] = hex(COL[k]);

/* ---------- language & numbers ---------- */
let LANG = 'fr';
function T(o) { if (o == null) return ''; if (typeof o === 'string') return o; return o[LANG] ?? o.fr ?? ''; }
function fmt(n, digits = 0) {
  if (!isFinite(n)) return String(n);
  const neg = n < 0; n = Math.abs(n);
  const s = digits > 0 ? n.toFixed(digits) : String(Math.round(n));
  let [ip, fp] = s.split('.');
  ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, LANG === 'fr' ? ' ' : ',');
  return (neg ? '−' : '') + ip + (fp ? (LANG === 'fr' ? ',' : '.') + fp : '');
}
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻' };
const sup = s => String(s).split('').map(c => SUP[c] ?? c).join('');
// programmer notation: 3.2e-7, 4e+4 -> 4e4
function sci(x, d = 1) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return fmt(x, Math.max(0, d + 1 - e));
  return x.toExponential(d).replace('e+', 'e').replace(/\.0e/, 'e');
}
function ordinal(k) {
  if (LANG === 'fr') return k === 1 ? '1er' : k + 'e';
  const s = ['th', 'st', 'nd', 'rd'], v = k % 100;
  return k + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ---------- drawing helpers ---------- */
// Everything is monospace: it should feel like a terminal, not a slide deck.
const F = { disp: '"FiraC","Fira Code",monospace', text: '"FiraC","Fira Code",monospace', mono: '"FiraC","Fira Code",monospace' };
const font = (size, weight = 500, fam = F.text) => `${weight} ${Math.max(1, Math.round(size * 10) / 10)}px ${fam}`;
const HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;

function text(g, s, x, y, size, o = {}) {
  g.font = font(size, o.weight ?? 500, o.fam ?? F.text);
  g.textAlign = o.align ?? 'left';
  g.textBaseline = o.base ?? 'alphabetic';
  g.fillStyle = o.color ?? COL.ink;
  const a0 = g.globalAlpha;
  if (o.alpha != null) g.globalAlpha = a0 * clamp(o.alpha, 0, 1);
  if (o.spacing && HAS_LS) { g.letterSpacing = o.spacing.toFixed(1) + 'px'; g.fillText(s, x, y); g.letterSpacing = '0px'; }
  else g.fillText(s, x, y);
  g.globalAlpha = a0;
}
function measure(g, s, size, weight = 500, fam = F.text, spacing = 0) {
  g.font = font(size, weight, fam);
  return g.measureText(s).width + (spacing && HAS_LS ? spacing * s.length : 0);
}
// Draw text made of [string, colour] runs, left-aligned.
function runs(g, parts, x, y, size, o = {}) {
  g.font = font(size, o.weight ?? 500, o.fam ?? F.text);
  g.textBaseline = o.base ?? 'alphabetic';
  g.textAlign = 'left';
  let total = 0; for (const p of parts) total += g.measureText(p[0]).width;
  if (o.align === 'center') x -= total / 2; else if (o.align === 'right') x -= total;
  const a0 = g.globalAlpha; if (o.alpha != null) g.globalAlpha = a0 * clamp(o.alpha, 0, 1);
  for (const p of parts) { g.fillStyle = p[1] || COL.ink; g.fillText(p[0], x, y); x += g.measureText(p[0]).width; }
  g.globalAlpha = a0;
  return total;
}
function rrect(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, 2, w / 2, h / 2)); // hard corners
  g.beginPath();
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
// plain box
function panel(g, x, y, w, h, u, o = {}) {
  g.fillStyle = o.fill ?? COL.panel; g.fillRect(x, y, w, h);
  g.lineWidth = 1; g.strokeStyle = o.stroke ?? COL.line;
  g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}
function line(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function dot(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); }

// Soft additive glow, using cached radial-gradient sprites (much cheaper than shadowBlur).
const _glowCache = new Map();
function glowSprite(rgb) {
  const key = rgb.join(',');
  let s = _glowCache.get(key);
  if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 128;
  const c = s.getContext('2d'), gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, css(rgb, 0.9)); gr.addColorStop(0.18, css(rgb, 0.45)); gr.addColorStop(0.45, css(rgb, 0.12)); gr.addColorStop(1, css(rgb, 0));
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
  if (_glowCache.size > 600) _glowCache.clear();
  _glowCache.set(key, s);
  return s;
}
function glow(g, x, y, r, rgb, alpha = 1) {
  return; // flat look: no glows
  if (alpha <= 0.003 || r <= 0) return;
  const a0 = g.globalAlpha, op = g.globalCompositeOperation;
  g.globalAlpha = a0 * Math.min(1, alpha); g.globalCompositeOperation = 'lighter';
  g.drawImage(glowSprite(rgb), x - r, y - r, 2 * r, 2 * r);
  g.globalAlpha = a0; g.globalCompositeOperation = op;
}
function offscreen(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

/* ---------- timing ---------- */
// Runs a generator that yields durations (seconds). Leftover time carries over,
// so the scene stays in sync even when fast-forwarded.
class Script {
  constructor(gen) { this.it = gen; this.wait = 0; this.done = false; }
  update(dt) {
    if (this.done) return;
    this.wait -= dt;
    let guard = 0;
    while (this.wait <= 0 && !this.done && guard++ < 20000) {
      const r = this.it.next();
      if (r.done) { this.done = true; break; }
      this.wait += typeof r.value === 'number' ? r.value : 0;
    }
  }
}
class Tweens {
  constructor() { this.list = []; }
  to(obj, props, dur, ease = Ease.inOut, delay = 0) {
    const tw = { obj, props, dur: Math.max(1e-6, dur), t: -delay, ease, from: null };
    this.list.push(tw); return tw;
  }
  update(dt) {
    const L = this.list; let w = 0;
    for (let i = 0; i < L.length; i++) {
      const tw = L[i]; tw.t += dt;
      if (tw.t >= 0) {
        if (!tw.from) { tw.from = {}; for (const k in tw.props) tw.from[k] = tw.obj[k]; }
        const k = clamp(tw.t / tw.dur, 0, 1), e = tw.ease(k);
        for (const p in tw.props) tw.obj[p] = tw.from[p] + (tw.props[p] - tw.from[p]) * e;
        if (k >= 1) continue;
      }
      L[w++] = tw;
    }
    L.length = w;
  }
  get busy() { return this.list.length > 0; }
}

/* ---------- scene registry ---------- */
const SCENES = {};
function defineScene(def) { SCENES[def.id] = def; }
