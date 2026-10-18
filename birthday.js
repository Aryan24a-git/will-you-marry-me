/* ============================================================
     HAPPY BIRTHDAY — an interactive love story in seven acts
     Vanilla canvas 2D for the tree + GSAP for the orchestration.

     ACTS 1–4  a real recurve bow with a Cupid's arrow nocked — you
          DRAW the string down and RELEASE to fire (pointer drag,
          or keyboard). A softly beating heart waits above as the
       target; the arrow flies up and strikes it, and the heart
          jolts, falls, and bursts into a flood of rose that
       swallows the frame. A kinetic wish hinges up out of that
          glyph, under cinema bars and a slow camera push.
       A gold light blooms, and the tree grows into one heart of
       lit blossoms with the hand-lettered wish.
     ACT 5  a proposal chamber asks the big question, with a playful
       runaway No button and a celebration after Yes.
     ACT 6  a 3D memory gallery lets the story move through shared
       photographs.
     ACT 7  a sealed love letter opens into a typewritten promise and
       a choice of vows.

     The opening GSAP timeline runs the shot and hands off to the
     canvas tree, which owns its own rAF and plays once, then holds.
     The soundtrack follows the journey: part 1 covers Acts 1–4,
     part 2 begins the next chapter, part 3 begins the memory lane,
     and part 4 begins the love letter.
   ============================================================ */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

/* the pen-stroke plugin: a `drawn` 0..1 property for the underline */
gsap.registerPlugin({
  name: 'drawn',
  init(target, value) {
    const len = target.getTotalLength();
    target.style.strokeDasharray = len;
    this.target = target; this.len = len; this.value = value;
  },
  render(ratio, data) {
    data.target.style.strokeDashoffset = data.len * (1 - data.value * ratio);
  },
});

const $ = (id) => document.getElementById(id);

const canvas = $('tree');
const ctx    = canvas.getContext('2d');
const wishEl = $('wish');

const hero       = $('hero');
const eyebrow    = $('eyebrow');
const hint       = $('hint');
const motes      = $('motes');
const target     = $('target');
const targetHeart= $('targetHeart');
const heartGlow  = target.querySelector('.heart__glow');
const aim        = $('aim');

const archery = $('archery');
const bow     = $('bow');
const arrow   = $('arrow');
const strL    = $('strL');
const strR    = $('strR');
const serving = $('serving');

const flood   = $('flood');
const field   = $('field');
const camera  = $('camera');
const fgrid   = $('fgrid');
const kEyebrow= $('kEyebrow');
const kSub    = $('kSub');
const barTop  = $('barTop');
const barBot  = $('barBot');
const uline   = $('uline').querySelector('.uline__path');
const bloom   = $('bloom');

/* --- ACT 4-7 DOM SELECTORS --- */
const btnToAct5       = $('btnToAct5');

/* Act 5 Proposal Chamber */
const act5Scene       = $('act5Scene');
const act5Card        = $('act5Card');
const btnAct5Yes      = $('btnAct5Yes');
const btnAct5No       = $('btnAct5No');
const act5Actions     = $('act5Actions');
const act5Celebration = $('act5Celebration');
const btnToAct6       = $('btnToAct6');

/* Act 5 "No" Pleading Modal */
const noPleaModal     = $('noPleaModal');
const modalPleaBackdrop = $('modalPleaBackdrop');
const modalPleaGif    = $('modalPleaGif');
const modalPleaTitle  = $('modalPleaTitle');
const modalPleaText   = $('modalPleaText');
const btnModalSayYes  = $('btnModalSayYes');
const btnModalStillNo = $('btnModalStillNo');

/* Act 6 3D Memories */
const act6Scene       = $('act6Scene');
const carousel3D      = $('carousel3D');
const carouselPrev    = $('carouselPrev');
const carouselNext    = $('carouselNext');
const carouselDots    = $('carouselDots');
const btnToAct7       = $('btnToAct7');

/* Act 7 Love Letter, Envelope & Vow Choices */
const act7Scene          = $('act7Scene');
const envelopeWrapper    = $('envelopeWrapper');
const envelopeBox        = $('envelopeBox');
const envelopeSeal       = $('envelopeSeal');
const envelopeFlap       = $('envelopeFlap');
const letterTyped        = $('letterTyped');
const vowsGrid           = $('vowsGrid');
const vowChips           = document.querySelectorAll('.vow-chip');
const vowChosenBox       = $('vowChosenBox');
const vowChosenText      = $('vowChosenText');
const btnCelebrateAll    = $('btnCelebrateAll');
const btnRestartJourney  = $('btnRestartJourney');

/* Music Controller */
const musicBar          = $('musicBar');
const musicWave         = $('musicWave');
const musicTrackName    = $('musicTrackName');
const musicTogglePlay   = $('musicTogglePlay');
const musicToggleMute   = $('musicToggleMute');
const musicPlayIcon     = $('musicPlayIcon');
const musicPauseIcon    = $('musicPauseIcon');
const musicVolumeIcon   = $('musicVolumeIcon');
const musicMuteIcon     = $('musicMuteIcon');
const actAudioPlayer    = $('actAudioPlayer');

/* Act Navigation */
const actNavDots        = document.querySelectorAll('.act-nav__dot');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isRecord     = new URLSearchParams(location.search).has('record');

/* --- cue log for the recorder: the page stays muted, but it timestamps every
   beat the film crosses, and the offline sound synth fires foley at those exact
   times so the audio can never drift from the picture. --- */
if (isRecord) window.bdayCues = [];
let recT0 = 0;
function cue(name){ if (isRecord && recT0) window.bdayCues.push({ cue: name, t: (performance.now() - recT0) / 1000 }); }

/* ============================================================
   MATH HELPERS
   ============================================================ */
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = (a)    => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack  = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/* ============================================================
   TREE ENGINE (Act 4) — canvas
   ============================================================ */
const BLOSSOM = [
  { c0: '#ffe1ec', c1: '#ff80aa' },
  { c0: '#ffd0e0', c1: '#f4577f' },
  { c0: '#ffc4d2', c1: '#e23b67' },
  { c0: '#ffd9c4', c1: '#ff8a5b' },
  { c0: '#ffeec2', c1: '#f6b13e' },
  { c0: '#ffd2e6', c1: '#e84d9a' },
];

/* timeline (seconds, relative to the tree's own start) — brisk */
const T = {
  trunkStart: 0.10,
  branchSpan: 1.80,
  bloomT0:    1.25,
  bloomSpan:  2.00,
  petalT0:    2.45,
  noteStart:  0.45,
  done:       4.60,
};

const SS = 168;

function heartShape(c, x, top, w, h){
  c.beginPath();
  c.moveTo(x, top + h * 0.28);
  c.bezierCurveTo(x, top, x - w * 0.5, top, x - w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x - w * 0.5, top + h * 0.60, x - w * 0.16, top + h * 0.80, x, top + h);
  c.bezierCurveTo(x + w * 0.16, top + h * 0.80, x + w * 0.5, top + h * 0.60, x + w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x + w * 0.5, top, x, top, x, top + h * 0.28);
  c.closePath();
}

function makeBlossom({ c0, c1 }, soft){
  const cv = document.createElement('canvas'); cv.width = cv.height = SS;
  const c = cv.getContext('2d');
  const w = SS * 0.62, h = SS * 0.58, x = SS / 2, top = SS * 0.17;

  c.save();
  c.shadowColor = 'rgba(150,38,72,0.32)';
  c.shadowBlur = SS * 0.085; c.shadowOffsetY = SS * 0.05;
  c.fillStyle = c1; heartShape(c, x, top, w, h); c.fill();
  c.restore();

  const g = c.createRadialGradient(x - w * 0.20, top + h * 0.20, h * 0.04, x, top + h * 0.42, h * 0.92);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, shade(c1, -26));
  heartShape(c, x, top, w, h); c.fillStyle = g; c.fill();

  c.save(); heartShape(c, x, top, w, h); c.clip();
  const g2 = c.createLinearGradient(0, top, 0, top + h);
  g2.addColorStop(0, 'rgba(255,255,255,0)');
  g2.addColorStop(0.65, 'rgba(110,16,46,0)');
  g2.addColorStop(1, 'rgba(110,16,46,0.26)');
  c.fillStyle = g2; c.fillRect(0, 0, SS, SS);
  c.globalAlpha = 0.55; c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(x - w * 0.15, top + h * 0.24, w * 0.17, h * 0.11, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = SS;
  const c2 = cv2.getContext('2d');
  c2.filter = 'blur(2.6px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.42; c2.fillStyle = '#fff3ea'; c2.fillRect(0, 0, SS, SS);
  return cv2;
}

function makeBokeh(rgb){
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.45, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  return cv;
}

function makeSparkle(){
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'); const m = S / 2;
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = g; c.beginPath(); c.arc(m, m, m, 0, 6.2832); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.translate(m, m);
  for (let k = 0; k < 2; k++){
    c.beginPath();
    c.moveTo(0, -m); c.quadraticCurveTo(0, 0, m, 0); c.quadraticCurveTo(0, 0, 0, m); c.quadraticCurveTo(0, 0, -m, 0); c.quadraticCurveTo(0, 0, 0, -m);
    c.fill(); c.rotate(Math.PI / 4); c.scale(0.5, 0.5);
  }
  return cv;
}

let SPR = { crisp: [], soft: [] }, BOKEH = [], SPARKLE = null;
function buildSprites(){
  SPR = { crisp: BLOSSOM.map((b) => makeBlossom(b, false)), soft: BLOSSOM.map((b) => makeBlossom(b, true)) };
  BOKEH = [makeBokeh('255,224,188'), makeBokeh('255,196,214'), makeBokeh('255,238,210')];
  SPARKLE = makeSparkle();
}

function drawSprite(sprite, x, y, size, rot, alpha){
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, -size * 0.5, -size * 0.47, size, size);
  ctx.restore();
}

let heartPoly = null;
function buildHeartPoly(){
  const raw = []; let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i <= 160; i++){
    const t = (i / 160) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, hw = (maxX - minX) / 2, hh = (maxY - minY) / 2;
  heartPoly = raw.map(([x, y]) => [(x - midX) / hw, (y - midY) / hh]);
}
function pointInPoly(x, y){
  let inside = false; const p = heartPoly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++){
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

let W = 0, H = 0, dpr = 1;
let cx = 0, cy = 0, rx = 0, ry = 0, groundY = 0;
let branches = [], hearts = [], petals = [], rested = [], orbs = [], floaters = [], twinkles = [];
let bgGrad = null, glowGrad = null, groundGrad = null;

const quad = (b, t) => { const m = 1 - t, a = m * m, k = 2 * m * t, d = t * t; return { x: a * b.x1 + k * b.cx + d * b.x2, y: a * b.y1 + k * b.cy + d * b.y2 }; };

function barkGrad(x1, y1, x2, y2, depth){
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, `hsl(348 26% ${26 + depth * 3}%)`);
  g.addColorStop(1, `hsl(346 24% ${40 + depth * 5}%)`);
  return g;
}

function buildScene(){
  branches = []; hearts = []; petals = []; rested = []; twinkles = []; orbs = []; floaters = [];
  buildHeartPoly();

  const wide = W / H > 1.2;
  cx = W * (wide ? 0.57 : 0.5);
  cy = H * (wide ? 0.37 : 0.38);
  ry = Math.min(H * (wide ? 0.33 : 0.33), W * 0.34);
  rx = ry * 1.16;
  groundY = H * 0.93;

  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#fff3e9');
  bgGrad.addColorStop(0.46, '#ffe7d6');
  bgGrad.addColorStop(0.78, '#fcd9c4');
  bgGrad.addColorStop(1, '#f3c4b5');
  glowGrad = ctx.createRadialGradient(cx, cy, ry * 0.1, cx, cy, ry * 1.55);
  glowGrad.addColorStop(0, 'rgba(255,219,170,0.6)');
  glowGrad.addColorStop(0.5, 'rgba(255,170,150,0.2)');
  glowGrad.addColorStop(1, 'rgba(255,170,150,0)');
  groundGrad = ctx.createRadialGradient(cx, H * 1.02, ry * 0.2, cx, H * 1.02, ry * 1.6);
  groundGrad.addColorStop(0, 'rgba(255,205,165,0.5)');
  groundGrad.addColorStop(1, 'rgba(255,205,165,0)');

  for (let i = 0; i < 11; i++){
    orbs.push({ x: rand(0, W), y: rand(0, H), r: rand(W * 0.05, W * 0.17), vy: rand(-6, -16), drift: rand(-0.3, 0.3), phase: rand(0, 6.28), alpha: rand(0.05, 0.13), sprite: pick(BOKEH) });
  }

  const FN = wide ? 18 : 15;
  for (let i = 0; i < FN; i++){
    const depth = Math.random();
    floaters.push({
      x: rand(0, W), y: rand(-H * 0.1, H * 1.1), depth,
      idx: (Math.random() * BLOSSOM.length) | 0,
      box: lerp(Math.min(W, H) * 0.025, Math.min(W, H) * 0.075, depth),
      vy: lerp(7, 20, depth), sway: rand(8, 22), phase: rand(0, 6.28),
      rot: rand(-0.4, 0.4), vrot: rand(-0.5, 0.5),
      baseA: lerp(0.16, 0.5, depth), soft: depth < 0.45,
    });
  }

  const baseX = cx, baseY = H * 1.0;
  const trunkTopY = cy + ry * 0.62;
  const trunkW = Math.max(9, W * 0.024);
  const limbLen = ry * 0.6;
  const insidePx = (x, y, m = 0.9) => pointInPoly((x - cx) / (rx * m), (cy - y) / (ry * m));

  function addBranch(x, y, ang, len, w0, depth, t0){
    let ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, clipped = false;
    if (!insidePx(ex, ey)){
      let lo = 0, hi = 1;
      for (let k = 0; k < 12; k++){ const mid = (lo + hi) / 2; (insidePx(x + Math.cos(ang) * len * mid, y + Math.sin(ang) * len * mid) ? lo = mid : hi = mid); }
      ex = x + Math.cos(ang) * len * lo; ey = y + Math.sin(ang) * len * lo; clipped = true;
    }
    const mx = (x + ex) / 2, my = (y + ey) / 2, perp = ang + Math.PI / 2, bend = rand(-1, 1) * len * 0.12, w1 = w0 * 0.66;
    branches.push({ x1: x, y1: y, cx: mx + Math.cos(perp) * bend, cy: my + Math.sin(perp) * bend, x2: ex, y2: ey, w0, w1, t0, dur: Math.max(0.14, 0.32 - depth * 0.03), depth, grad: barkGrad(x, y, ex, ey, depth) });
    return { ex, ey, w1, clipped };
  }
  function grow(x, y, ang, len, w, depth, t0){
    const r = addBranch(x, y, ang, len, w, depth, t0);
    if (r.clipped || depth >= 6 || len < ry * 0.06) return;
    const childT0 = t0 + (0.32 - depth * 0.03) * 0.6;
    const n = Math.random() < 0.55 ? 2 : 3;
    for (let i = 0; i < n; i++){
      const spread = 0.6 * (i - (n - 1) / 2) + rand(-0.22, 0.22), lift = -0.06 + rand(-0.05, 0.05);
      grow(r.ex, r.ey, ang + spread + lift, len * rand(0.74, 0.84), r.w1, depth + 1, childT0 + i * 0.03);
    }
  }
  addBranch(baseX, baseY, -Math.PI / 2, baseY - trunkTopY, trunkW, 0, T.trunkStart);
  branches[0].dur = 0.55;
  const limbT0 = T.trunkStart + 0.36, L = 3;
  for (let i = 0; i < L; i++){
    const ang = -Math.PI / 2 + 0.62 * (i - (L - 1) / 2) + rand(-0.12, 0.12);
    grow(baseX, trunkTopY, ang, limbLen, trunkW * 0.7, 1, limbT0 + i * 0.05);
  }
  const maxT0 = branches.reduce((m, b) => Math.max(m, b.t0 + b.dur), 0);
  const sc = (T.branchSpan - T.trunkStart) / (maxT0 - T.trunkStart);
  for (const b of branches) b.t0 = T.trunkStart + (b.t0 - T.trunkStart) * sc;

  const COUNT = Math.round(clamp(rx * ry / 56, 250, 440));
  const baseBox = clamp(Math.min(W, H) * 0.115, 30, 74);
  let guard = 0;
  while (hearts.length < COUNT && guard < COUNT * 50){
    guard++;
    const u = rand(-1.06, 1.06), v = rand(-1.06, 1.06);
    if (!pointInPoly(u, v)) continue;
    const x = cx + u * rx, y = cy - v * ry;
    const d = clamp01(Math.hypot(u, v + 1) / 2.4);
    const t0 = T.bloomT0 + d * (T.bloomSpan * 0.82) + rand(0, T.bloomSpan * 0.18);
    const soft = Math.random() < 0.42;
    hearts.push({ x, y, idx: (Math.random() * BLOSSOM.length) | 0, soft, box: baseBox * (soft ? rand(0.6, 0.85) : rand(0.78, 1.12)), rot: rand(-0.55, 0.55), sway: rand(0, 6.28), t0 });
  }
  hearts.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));
}

function drawBackground(){
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1; ctx.fillStyle = groundGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawGodRays(t, intensity){
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ox = cx, oy = cy - ry * 0.35, R = Math.hypot(W, H) * 1.1;
  const rays = 9, sweep = Math.sin(t * 0.07) * 0.18;
  for (let i = 0; i < rays; i++){
    const a = -Math.PI / 2 + sweep + (i - (rays - 1) / 2) * 0.2;
    const hw = 0.035 + 0.02 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.7));
    const a1 = a - hw, a2 = a + hw;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * R, oy + Math.sin(a) * R);
    g.addColorStop(0, `rgba(255,232,190,${0.10 * intensity})`);
    g.addColorStop(0.5, `rgba(255,214,170,${0.05 * intensity})`);
    g.addColorStop(1, 'rgba(255,214,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a1) * R, oy + Math.sin(a1) * R);
    ctx.lineTo(ox + Math.cos(a2) * R, oy + Math.sin(a2) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGlow(t){
  const gi = clamp01((t - T.bloomT0) / (T.bloomSpan * 0.9));
  if (gi <= 0) return;
  ctx.save(); ctx.globalAlpha = gi; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBokeh(t, dt){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const o of orbs){
    o.y += o.vy * dt; o.x += Math.sin(t * 0.3 + o.phase) * o.drift;
    if (o.y < -o.r){ o.y = H + o.r; o.x = rand(0, W); }
    ctx.globalAlpha = o.alpha;
    ctx.drawImage(o.sprite, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  }
  ctx.restore();
}

function drawFloaters(t, dt, front){
  const appear = clamp01((t - 0.2) / 1.4);
  if (appear <= 0) return;
  for (const f of floaters){
    if ((f.depth >= 0.6) !== front) continue;
    f.y -= f.vy * dt;
    f.x += Math.sin(t * 0.5 + f.phase) * f.sway * dt;
    f.rot += f.vrot * dt;
    if (f.y < -f.box){ f.y = H + f.box; f.x = rand(0, W); }
    drawSprite((f.soft ? SPR.soft : SPR.crisp)[f.idx], f.x, f.y, f.box, f.rot, f.baseA * appear);
  }
}

function drawBranches(t){
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of branches){
    const f = clamp01((t - b.t0) / b.dur);
    if (f <= 0) continue;
    const e = easeOutCubic(f);
    ctx.strokeStyle = b.grad;
    const steps = 12, last = Math.max(1, Math.ceil(steps * e));
    let prev = quad(b, 0);
    for (let i = 1; i <= last; i++){
      const tt = Math.min(e, i / steps), p = quad(b, tt);
      ctx.lineWidth = lerp(b.w0, b.w1, tt);
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      prev = p;
    }
  }
}

function drawHearts(t){
  const breathe = 1 + Math.sin(t * 0.8) * 0.012;
  for (const h of hearts){
    const p = clamp01((t - h.t0) / 0.6);
    if (p <= 0) continue;
    const scale = Math.max(0, easeOutBack(p));
    let alpha = clamp01(p * 1.7); if (h.soft) alpha *= 0.8;
    const settled = clamp01((t - h.t0 - 0.6) / 0.7);
    const sway = settled * Math.sin(t * 1.5 + h.sway) * (h.box * 0.05);
    const rise = (1 - easeOutCubic(p)) * h.box * 0.45;
    const hx = cx + (h.x - cx) * breathe + sway;
    const hy = cy + (h.y - cy) * breathe - rise;
    drawSprite((h.soft ? SPR.soft : SPR.crisp)[h.idx], hx, hy, h.box * scale, h.rot + sway * 0.012, alpha);
  }
}

function updateTwinkles(t, dt){
  const active = t > T.bloomT0 + T.bloomSpan * 0.45;
  if (active && twinkles.length < 9 && Math.random() < 0.5){
    const h = hearts[(Math.random() * hearts.length) | 0];
    if (h) twinkles.push({ x: h.x, y: h.y, size: rand(0.6, 1.3) * (Math.min(W, H) * 0.05), age: 0, life: rand(0.7, 1.2), rot: rand(0, 6.28) });
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = twinkles.length - 1; i >= 0; i--){
    const s = twinkles[i]; s.age += dt;
    const k = s.age / s.life;
    if (k >= 1){ twinkles.splice(i, 1); continue; }
    const a = Math.sin(k * Math.PI);
    drawSprite(SPARKLE, s.x, s.y, s.size * (0.6 + 0.4 * a), s.rot + k * 1.2, a);
  }
  ctx.restore();
}

function spawnPetal(){
  const h = hearts[(Math.random() * hearts.length) | 0];
  if (!h) return;
  petals.push({ x: h.x + rand(-8, 8), y: h.y + rand(-8, 8), vy: rand(14, 30), vx: rand(-8, 8), sway: rand(0.6, 1.4), phase: rand(0, 6.28), box: h.box * rand(0.34, 0.6), idx: h.idx, rot: rand(0, 6.28), vrot: rand(-1.4, 1.4), age: 0, land: groundY + rand(-6, H * 0.05) });
}
function drawPetals(t, dt){
  for (let i = petals.length - 1; i >= 0; i--){
    const p = petals[i]; p.age += dt; p.vy += 8 * dt;
    p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 16) * dt;
    p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (p.y >= p.land){
      rested.push({ x: clamp(p.x, 6, W - 6), y: p.land, box: p.box, idx: p.idx, rot: p.rot, a: rand(0.7, 0.95) });
      if (rested.length > 90) rested.shift();
      petals.splice(i, 1); continue;
    }
    const a = p.age < 0.3 ? p.age / 0.3 : 1;
    drawSprite(SPR.crisp[p.idx], p.x, p.y, p.box, p.rot, a);
  }
}
function drawRested(){
  for (const r of rested) drawSprite(SPR.crisp[r.idx], r.x, r.y, r.box, r.rot, r.a);
}

function showWish(on){
  wishEl.classList.toggle('is-in', on);
  if (btnToAct5){
    btnToAct5.style.display = on ? 'inline-flex' : 'none';
  }
}

/* the tree's own rAF: plays once from treeStart(), then holds, living */
let treeStartT = 0, treeLastT = 0, treeRAF = 0, lastPetal = 0, replayArmed = false;
window.bdayDone = false;

function treeFrame(now){
  if (!treeStartT){ treeStartT = now; treeLastT = now; }
  const t  = (now - treeStartT) / 1000;
  const dt = Math.min(0.05, (now - treeLastT) / 1000); treeLastT = now;

  const rays = clamp01((t - T.bloomT0) / T.bloomSpan);

  drawBackground();
  drawGodRays(t, rays);
  drawGlow(t);
  drawBokeh(t, dt);
  drawFloaters(t, dt, false);
  drawBranches(t);
  drawHearts(t);
  updateTwinkles(t, dt);
  if (t > T.petalT0 && now - lastPetal > 150){ spawnPetal(); spawnPetal(); lastPetal = now; }
  drawPetals(t, dt);
  drawRested();
  drawFloaters(t, dt, true);

  showWish(t >= T.noteStart);

  if (!window.bdayDone && t >= T.done) window.bdayDone = true;

  treeRAF = requestAnimationFrame(treeFrame);
}

function treeStart(){
  treeStartT = 0; treeLastT = 0; lastPetal = 0; replayArmed = false; window.bdayDone = false;
  cue('grow');
  buildScene();
  if (!treeRAF) treeRAF = requestAnimationFrame(treeFrame);
}
function treeStop(){
  if (treeRAF){ cancelAnimationFrame(treeRAF); treeRAF = 0; }
  ctx.clearRect(0, 0, W, H);
}

function drawFinal(){
  buildScene();
  drawBackground(); drawGodRays(0, 1); drawGlow(T.done); drawBokeh(0, 0); drawFloaters(99, 0, false);
  drawBranches(99); drawHearts(99);
  for (let i = 0; i < 40; i++){ const h = hearts[(Math.random() * hearts.length) | 0]; if (h) rested.push({ x: clamp(h.x + rand(-W * 0.3, W * 0.3), 6, W - 6), y: groundY + rand(-6, H * 0.05), box: h.box * 0.5, idx: h.idx, rot: rand(0, 6.28), a: 0.85 }); }
  drawRested(); drawFloaters(99, 0, true);
  showWish(true);
  window.bdayDone = true;
}

/* ============================================================
   ACTS 1–3 (GSAP) — the bow, the shot, the wish
   ============================================================ */

/* the two headline words become per-glyph spans so each hinges up on its own */
function splitWord(el){
  const chars = [...el.textContent];
  el.textContent = '';
  return chars.map((c) => {
    const s = document.createElement('span');
    s.className = 'hl__ch';
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    return s;
  });
}
const line1Chars = splitWord($('wLine1'));
const line2Chars = splitWord($('wLine2'));
const lineNameChars = splitWord($('wLineName'));
const kChars = [...line1Chars, ...line2Chars, ...lineNameChars];

/* drifting light motes behind the scene */
function buildMotes(){
  motes.innerHTML = '';
  for (let i = 0; i < 12; i++){
    const m = document.createElement('span');
    m.className = 'mote';
    const s = rand(4, 12);
    m.style.width = m.style.height = `${s}px`;
    m.style.left = `${rand(4, 96)}%`;
    m.style.top  = `${rand(10, 96)}%`;
    motes.appendChild(m);
    gsap.set(m, { opacity: rand(0.25, 0.7) });
    gsap.to(m, { y: -rand(40, 140), x: rand(-30, 30), duration: rand(7, 14), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -rand(0, 8) });
    gsap.to(m, { opacity: rand(0.1, 0.5), duration: rand(2.5, 5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
}

/* --- bow geometry (measured; re-measured on resize) -------------------------
   The rig lives lower-left and is rotated so its local "up" axis points at the
   heart; the shot therefore travels on a diagonal. The draw + arrow math all
   live in the rig's LOCAL space (offset geometry is transform-independent, so
   rotation never corrupts it); only the aim ANGLE and the flight DISTANCE come
   from screen measurements. */
const tip = $('tip');
let svgScale = 1, arrowBaseX = 0, arrowBaseY = 0, maxDraw = 120, curDraw = 0;
let pullUX = 0, pullUY = 1;                               // screen unit: string pull-back
const REST_NOCK = 96;                                    // string nock, in bow viewBox units
const nockProxy = { val: REST_NOCK };

function applyNock(){
  const y = nockProxy.val;
  strL.setAttribute('y2', y); strR.setAttribute('y2', y); serving.setAttribute('cy', y);
}

function refreshRig(){
  // the grip is anchored here, and the heart sits at its layout centre (33% down,
  // centred) — using the layout point, not a live rect, keeps the aim steady even
  // while the heart is scaling in.
  const gripX = W * 0.24, gripY = H * 0.76;
  const heartX = W * 0.5, heartY = H * 0.33;
  // rotation so local "up" (0,-1) maps to the grip→heart direction
  const aimRad = Math.atan2(heartX - gripX, gripY - heartY);
  pullUX = -Math.sin(aimRad); pullUY = Math.cos(aimRad);  // opposite of aim = pull-back

  // #bow / #arrow are SVG — no offset* — so measure rects in the rig's LOCAL
  // frame: neutralise the rig transform first (getBBox-style, sync, no paint).
  nockProxy.val = REST_NOCK; applyNock();
  gsap.set(archery, { rotation: 0, scale: 1, x: 0, y: 0 });
  archery.style.left = '0px'; archery.style.top = '0px';
  gsap.set(arrow, { x: 0, y: 0 });
  const aR = archery.getBoundingClientRect();
  const bR = bow.getBoundingClientRect();
  const sR = serving.getBoundingClientRect();
  const rR = arrow.getBoundingClientRect();
  svgScale = bR.width / 460;
  const gripLX = (bR.left - aR.left) + 0.5 * bR.width;
  const gripLY = (bR.top  - aR.top ) + (240 / 300) * bR.height;   // grip ~y240 in viewBox
  const nockLX = (sR.left - aR.left) + 0.5 * sR.width;
  const nockLY = (sR.top  - aR.top ) + 0.5 * sR.height;
  arrowBaseX = nockLX - ((rR.left - aR.left) + 0.5 * rR.width);
  arrowBaseY = nockLY - ((rR.top  - aR.top ) + (205 / 220) * rR.height);

  // anchor the grip at (gripX,gripY) and rotate the rig around it
  archery.style.left = (gripX - gripLX) + 'px';
  archery.style.top  = (gripY - gripLY) + 'px';
  gsap.set(archery, { transformOrigin: `${gripLX}px ${gripLY}px`, rotation: aimRad * 180 / Math.PI });
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY });
  maxDraw = Math.min(bR.height * 0.72, H * 0.16, 132);
  curDraw = 0;
}

function setDraw(d){
  curDraw = clamp(d, 0, maxDraw);
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY + curDraw });   // local +Y = pull back
  nockProxy.val = REST_NOCK + curDraw / svgScale; applyNock();
  gsap.set(aim, { opacity: 0.55 * (curDraw / maxDraw) });
}

/* the target heart's beat — gentle, alive; killed the instant we fire */
let beatTL = null;
function startBeat(){
  gsap.set(targetHeart, { scale: 1 });
  gsap.set(heartGlow, { scale: 1, opacity: 0.7 });
  beatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  beatTL.to(targetHeart, { scale: 1.07, duration: 0.13, ease: 'power2.out' }, 0)
        .to(heartGlow,   { scale: 1.15, opacity: 0.9, duration: 0.13, ease: 'power2.out' }, 0)
        .to(targetHeart, { scale: 1.0, duration: 0.2, ease: 'power2.in' }, 0.13)
        .to(targetHeart, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, 0.3)
        .to(targetHeart, { scale: 1.0, duration: 0.5, ease: 'power2.inOut' }, 0.42)
        .to(heartGlow,   { scale: 1.0, opacity: 0.7, duration: 0.7, ease: 'power2.inOut' }, 0.3);
}
function stopBeat(){ if (beatTL){ beatTL.kill(); beatTL = null; } gsap.set(targetHeart, { scale: 1 }); }

/* a little burst of hearts + sparks where the arrow strikes */
function miniHeartSVG(fill){
  return `<svg viewBox="0 0 24 22" width="100%" height="100%"><path d="M12 20C5.5 15 1.5 11.4 1.5 6.9 1.5 3.6 4 1.5 7 1.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3 0 5.5 2.1 5.5 5.4C23.5 11.4 19.5 15 12 20Z" fill="${fill}"/></svg>`;
}
function burstHearts(){
  const r = target.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const ox = r.left - hr.left + r.width / 2;
  const oy = r.top - hr.top + r.height * 0.42;
  const cols = ['#ff6f97', '#ffb14e', '#ff8fae', '#ffd36a', '#e23b67'];
  const frag = document.createDocumentFragment();
  const nodes = [];
  for (let i = 0; i < 12; i++){
    const heart = i < 8;
    const el = document.createElement('span');
    el.className = 'burst';
    const s = heart ? rand(12, 22) : rand(4, 8);
    el.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;pointer-events:none;z-index:4;`;
    if (heart) el.innerHTML = miniHeartSVG(pick(cols));
    else { el.style.borderRadius = '50%'; el.style.background = 'radial-gradient(circle,#fff,rgba(255,210,150,0) 70%)'; }
    frag.appendChild(el); nodes.push({ el, heart });
  }
  hero.appendChild(frag);
  nodes.forEach(({ el, heart }) => {
    const ang = rand(-Math.PI, 0);                       // fan upward + out
    const dist = rand(heart ? 70 : 40, heart ? 190 : 120);
    gsap.to(el, {
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - rand(10, 50),
      rotation: rand(-120, 120), scale: heart ? rand(0.7, 1.2) : rand(0.4, 1),
      duration: rand(0.7, 1.15), ease: 'power2.out',
    });
    gsap.to(el, { opacity: 0, duration: 0.5, delay: rand(0.35, 0.6), ease: 'power1.in', onComplete: () => el.remove() });
  });
}

/* --- the shot + Acts 2–3 timeline ------------------------------------------ */
function shotGeom(){
  // flight distance = straight-line from the arrow tip to the heart (measured on
  // screen, rotation-aware). Moving the arrow that far along its local "up" axis
  // — which is aimed at the heart — lands the tip dead-centre on it.
  const tipR = tip.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const tipX = tipR.left + tipR.width / 2, tipY = tipR.top + tipR.height / 2;
  const tcx = tRect.left + tRect.width / 2, tcy = tRect.top + tRect.height / 2;
  const flightDist = Math.hypot(tcx - tipX, tcy - tipY);
  const fallPx = Math.min(H * 0.26, H - tcy - tRect.height * 0.4);
  const impactX = tcx, impactY = tcy + fallPx;
  const distC = Math.hypot(Math.max(impactX, W - impactX), Math.max(impactY, H - impactY));
  const reach = Math.hypot(W / 2, H / 2);
  return {
    arrowStartY: arrowBaseY + curDraw,
    arrowFlyY:   arrowBaseY + curDraw - flightDist,       // local -Y = toward the heart
    drawnNock:   REST_NOCK + curDraw / svgScale,
    fallPx, fx: impactX - W / 2, fy: impactY - H / 2,
    floodScale: (distC * 1.12) / 70, bloomScale: (reach * 1.2) / 30,
  };
}

let filmTL = null;
function buildFilm(m){
  const t = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(field, { autoAlpha: 0 });
      treeStart();
      // fade promptly so the growing tree is revealed with no white hold
      gsap.to(bloom, { autoAlpha: 0, duration: 1.15, ease: 'power2.out' });
    },
  });

  // reset (t=0)
  t.set(target, { y: 0, scaleX: 1, scaleY: 1, opacity: 1 })
   .set(arrow, { opacity: 1, x: arrowBaseX, y: m.arrowStartY, scaleY: 1 })
   .set([flood, bloom], { autoAlpha: 0, scale: 0.001, x: 0, y: 0 })
   .set(flood, { x: m.fx, y: m.fy })
   .set(field, { autoAlpha: 0 })
   .set('.blob', { opacity: 0 })
   .set(camera, { scale: 1, yPercent: 0 })
   .set(fgrid, { xPercent: 0, yPercent: 0 })
   .set(barTop, { yPercent: -100 })
   .set(barBot, { yPercent: 100 })
   .set(kEyebrow, { opacity: 0, y: 12 })
   .set(kSub, { opacity: 0, y: 12 })
   .set(kChars, { transformPerspective: 620, transformOrigin: '50% 100%', yPercent: 135, rotationX: -82 })
   .set(uline, { drawn: 0 });

  // --- the shot: string snaps (twang), arrow flies up into the heart --------
  t.fromTo(nockProxy, { val: m.drawnNock }, { val: REST_NOCK, duration: 0.5, ease: 'elastic.out(1,0.34)', onUpdate: applyNock }, 0)
   .to(arrow, { y: m.arrowFlyY, duration: 0.26, ease: 'power2.in' }, 0)
   .to(arrow, { scaleY: 1.16, duration: 0.14, ease: 'power2.in' }, 0)
   .to(arrow, { scaleY: 1.0, duration: 0.1, ease: 'power1.out' }, 0.16)
   .to(aim, { opacity: 0, duration: 0.18 }, 0)
   .to([eyebrow, hint], { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0);

  // --- the strike: the arrow embeds, the heart recoils, then holds pierced --
  t.add(burstHearts, 0.26)
   // recoil along the arrow's line (up + right), springing back
   .to(target, { x: 7, y: -9, duration: 0.06, ease: 'power2.out' }, 0.26)
   .to(target, { x: 0, y: 0, duration: 0.32, ease: 'power2.out' }, 0.32)
   .to(target, { scale: 1.14, duration: 0.06, ease: 'power2.out' }, 0.26)
   .to(target, { scale: 1.0, duration: 0.26, ease: 'power2.inOut' }, 0.32)
   // the arrow shudders in the wound, holds embedded so the hit reads, then sinks in
   .to(arrow, { rotation: '+=4', duration: 0.05, yoyo: true, repeat: 4, ease: 'sine.inOut' }, 0.27)
   .set(arrow, { rotation: 0 }, 0.52)
   .to(arrow, { opacity: 0, duration: 0.16, ease: 'power1.out' }, 0.56);

  // --- the fall + the burst / flood -----------------------------------------
  t.to(target, { y: m.fallPx, scaleX: 0.84, scaleY: 1.3, duration: 0.34, ease: 'power1.in' }, 0.64)
   .to(target, { scaleX: 1.4, scaleY: 0.6, duration: 0.07, ease: 'power2.out' }, 0.98)
   .set(flood, { autoAlpha: 1 }, 1.00)
   .fromTo(flood, { scale: 0.02 }, { scale: m.floodScale, duration: 0.34, ease: 'power2.in' }, 1.00)
   .to(target, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 1.06);

  // seam: the field is the same rose as the flood
  t.set(field, { autoAlpha: 1 }, 1.32)
   .set(hero, { autoAlpha: 0 }, 1.33)
   .call(() => { unlockAct(3); }, null, 1.34)
   .to('.blob', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.34)
   .set(flood, { autoAlpha: 0 }, 1.36);

  // --- the camera push -------------------------------------------------------
  // duration matched to when the bloom covers (3.98) — a longer push used to
  // keep the timeline (and a white bloom) alive after the tree should already
  // be growing, which read as dead time before the tree appeared.
  t.fromTo(camera, { scale: 1.0, yPercent: 0 }, { scale: 1.07, yPercent: -1.3, duration: 2.6, ease: 'none' }, 1.38)
   .fromTo(fgrid, { xPercent: 0, yPercent: 0 }, { xPercent: -1.5, yPercent: -1.0, duration: 2.6, ease: 'none' }, 1.38);

  // beat markers for the recorder's soundtrack (no-ops off ?record)
  t.call(cue, ['hit'], 0.26)
   .call(cue, ['flood'], 1.00)
   .call(cue, ['wish'], 1.68)
   .call(cue, ['wish2'], 2.06)
   .call(cue, ['bloom'], 3.42);

  // cinema bars ease into a letterbox
  t.to(barTop, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 1.5)
   .to(barBot, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 1.5);

  // --- the kinetic wish ------------------------------------------------------
  t.to(kEyebrow, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 1.54)
   .to(line1Chars, { yPercent: 0, rotationX: 0, duration: 0.52, ease: 'power3.out', stagger: 0.033 }, 1.68)
   .to(line2Chars, { yPercent: 0, rotationX: 0, duration: 0.52, ease: 'power3.out', stagger: 0.033 }, 1.98)
   .to(lineNameChars, { yPercent: 0, rotationX: 0, duration: 0.65, ease: 'back.out(1.4)', stagger: 0.04 }, 2.32)
   .to(uline, { drawn: 1, duration: 0.45, ease: 'power2.inOut' }, 2.72)
   .to(kSub, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 2.92);

  // --- the handoff bloom -----------------------------------------------------
  t.to(barTop, { yPercent: -100, duration: 0.5, ease: 'power2.in' }, 3.52)
   .to(barBot, { yPercent: 100, duration: 0.5, ease: 'power2.in' }, 3.52)
   .call(() => { unlockAct(4); }, null, 3.62)
   .set(bloom, { autoAlpha: 1 }, 3.62)
   .fromTo(bloom, { scale: 0.02 }, { scale: m.bloomScale, duration: 0.58, ease: 'power2.in' }, 3.62);

  return t;
}

/* --- draw / release interaction -------------------------------------------- */
let played = false, drawing = false, startPX = 0, startPY = 0, startDraw = 0;

function fire(){
  if (played) return;
  played = true;
  drawing = false;
  stopBeat();
  cue('release'); cue('whoosh');
  filmTL = buildFilm(shotGeom());
  filmTL.play(0);
}

function springBack(){
  const from = curDraw;
  gsap.to({ d: from }, { d: 0, duration: 0.55, ease: 'elastic.out(1,0.4)', onUpdate() { setDraw(this.targets()[0].d); } });
}

function autoFire(){
  if (played) return;
  recT0 = performance.now(); cue('draw');       // t=0 of the soundtrack
  gsap.to({ d: curDraw }, {
    d: maxDraw * 0.94, duration: 0.62, ease: 'power2.inOut',
    onUpdate() { setDraw(this.targets()[0].d); },
    onComplete: () => gsap.delayedCall(0.16, fire),
  });
}

archery.addEventListener('pointerdown', (e) => {
  if (played) return;
  drawing = true;
  try { archery.setPointerCapture(e.pointerId); } catch (_) {}
  startPX = e.clientX; startPY = e.clientY; startDraw = curDraw;
  e.preventDefault();
});
archery.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  // project the drag onto the pull-back axis, so dragging back along the aim
  // (down + away from the heart) draws the string — on any shot angle.
  const proj = (e.clientX - startPX) * pullUX + (e.clientY - startPY) * pullUY;
  setDraw(startDraw + proj);
});
function endDraw(){
  if (!drawing) return;
  drawing = false;
  if (curDraw > maxDraw * 0.26) fire(); else springBack();
}
archery.addEventListener('pointerup', endDraw);
archery.addEventListener('pointercancel', endDraw);
archery.addEventListener('keydown', (e) => {
  if (played) return;
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); autoFire(); }
});

/* boot Act 1: reveal the target + bow + hint, then start the beat */
function enter(){
  gsap.set(hero, { autoAlpha: 1 });
  refreshRig();
  setDraw(0);
  gsap.set([eyebrow, hint], { opacity: 0, y: 14 });
  gsap.set(target, { opacity: 0, y: 10, scaleX: 0.9, scaleY: 0.9 });
  gsap.set(archery, { opacity: 0, scale: 0.85 });        // scale from the grip; keeps rotation
  gsap.set(heartGlow, { opacity: 0, scale: 1 });
  gsap.set(arrow, { opacity: 1 });

  const tl = gsap.timeline({ onComplete: startBeat });
  tl.to(target,   { opacity: 1, y: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: 'power3.out' }, 0.1)
    .to(heartGlow,{ opacity: 0.7, duration: 0.8, ease: 'power2.out' }, 0.2)
    .to(archery,  { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.28)
    .to(eyebrow,  { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.4)
    .to(hint,     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
}

/* ============================================================
   MUSIC CONTROLLER & SOUNDTRACK ENGINE (Placeholders per Act)
   ============================================================ */
const ACT_TRACKS = {
  1: { name: "Our Beginning", src: "/audio/part%201.mp3", chord: [261.63, 329.63, 392.00, 523.25] },
  2: { name: "Our Beginning", src: "/audio/part%201.mp3", chord: [261.63, 329.63, 392.00, 523.25] },
  3: { name: "Our Beginning", src: "/audio/part%201.mp3", chord: [261.63, 329.63, 392.00, 523.25] },
  4: { name: "Our Beginning", src: "/audio/part%201.mp3", chord: [261.63, 329.63, 392.00, 523.25] },
  5: { name: "Our Next Chapter", src: "/audio/part%202.mp3", chord: [349.23, 440.00, 523.25, 659.25] },
  6: { name: "Our Memory Lane", src: "/audio/part%203.mp3", chord: [392.00, 493.88, 587.33, 783.99] },
  7: { name: "Our Love Letter", src: "/audio/part%204.mp3", chord: [261.63, 329.63, 392.00, 523.25, 659.25] },
};

let audioCtx = null;
let synthOscs = [];
let synthGain = null;
let synthTimer = null;
let isMusicPlaying = false;
let isMusicMuted = false;
let currentActNumber = 1;

function initAudioContext(){
  if (!audioCtx){
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass){
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
}

function startProceduralSynth(chord){
  stopProceduralSynth();
  if (!audioCtx || isMusicMuted) return;
  try {
    synthGain = audioCtx.createGain();
    synthGain.gain.setValueAtTime(0.045, audioCtx.currentTime);
    synthGain.connect(audioCtx.destination);

    let step = 0;
    synthTimer = setInterval(() => {
      if (!audioCtx || !isMusicPlaying || isMusicMuted) return;
      const freq = chord[step % chord.length];
      step++;
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      noteGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.2);

      osc.connect(noteGain);
      noteGain.connect(synthGain);

      osc.start();
      osc.stop(audioCtx.currentTime + 2.3);
    }, 650);
  } catch (_) {}
}

function stopProceduralSynth(){
  if (synthTimer){ clearInterval(synthTimer); synthTimer = null; }
  if (synthGain){
    try { synthGain.disconnect(); } catch (_) {}
    synthGain = null;
  }
}

function playActMusic(actNum){
  currentActNumber = actNum;
  const track = ACT_TRACKS[actNum] || ACT_TRACKS[1];
  if (musicTrackName) musicTrackName.textContent = track.name;

  initAudioContext();

  if (actAudioPlayer){
    actAudioPlayer.src = track.src;
    actAudioPlayer.muted = isMusicMuted;
    actAudioPlayer.loop = true;

    if (isMusicPlaying){
      const playPromise = actAudioPlayer.play();
      if (playPromise !== undefined){
        playPromise.catch(() => {
          // If custom MP3 file is not found, smoothly run the procedural ambient synthesizer
          startProceduralSynth(track.chord);
        });
      }
    }
  }

  updateMusicBarUI();
}

function toggleMusicPlay(){
  initAudioContext();
  isMusicPlaying = !isMusicPlaying;

  if (isMusicPlaying){
    if (actAudioPlayer && actAudioPlayer.src){
      actAudioPlayer.play().catch(() => {
        const track = ACT_TRACKS[currentActNumber] || ACT_TRACKS[1];
        startProceduralSynth(track.chord);
      });
    } else {
      const track = ACT_TRACKS[currentActNumber] || ACT_TRACKS[1];
      startProceduralSynth(track.chord);
    }
  } else {
    if (actAudioPlayer) actAudioPlayer.pause();
    stopProceduralSynth();
  }

  updateMusicBarUI();
}

function toggleMusicMute(){
  isMusicMuted = !isMusicMuted;
  if (actAudioPlayer) actAudioPlayer.muted = isMusicMuted;
  if (isMusicMuted){
    stopProceduralSynth();
  } else if (isMusicPlaying){
    const track = ACT_TRACKS[currentActNumber] || ACT_TRACKS[1];
    startProceduralSynth(track.chord);
  }
  updateMusicBarUI();
}

function updateMusicBarUI(){
  if (musicBar) musicBar.classList.toggle('is-paused', !isMusicPlaying || isMusicMuted);
  if (musicPlayIcon) musicPlayIcon.hidden = isMusicPlaying;
  if (musicPauseIcon) musicPauseIcon.hidden = !isMusicPlaying;
  if (musicVolumeIcon) musicVolumeIcon.hidden = isMusicMuted;
  if (musicMuteIcon) musicMuteIcon.hidden = !isMusicMuted;
}

if (musicTogglePlay) musicTogglePlay.addEventListener('click', toggleMusicPlay);
if (musicToggleMute) musicToggleMute.addEventListener('click', toggleMusicMute);

/* ============================================================
   CONFETTI CELEBRATIONS
   ============================================================ */
function triggerHeartConfetti(){
  const count = 180;
  const colors = ['#ff4d6d', '#ff80b5', '#ffd700', '#ff9aa2', '#ff5c8a', '#ffc2d1'];

  confetti({
    particleCount: count,
    spread: 100,
    origin: { y: 0.65 },
    colors: colors,
    shapes: ['circle', 'square'],
    scalar: 1.15
  });

  // Spawn blossoming petals
  for (let i = 0; i < 20; i++){
    setTimeout(() => spawnPetal(), i * 60);
  }
}

/* ============================================================
   SCENE SWITCHER (Act 1 through Act 7)
   ============================================================ */
/* ============================================================
   SCENE SWITCHER (Act 1 through Act 7) & PROGRESSION LOCK
   ============================================================ */
let highestUnlockedAct = 1;

function unlockAct(actNum){
  highestUnlockedAct = Math.max(highestUnlockedAct, actNum);
  updateNavDots();
}

function updateNavDots(){
  actNavDots.forEach(dot => {
    const act = parseInt(dot.getAttribute('data-act'), 10);
    dot.classList.toggle('active', act === currentActNumber);
    dot.classList.toggle('is-locked', act > highestUnlockedAct);
    dot.classList.toggle('is-unlocked', act <= highestUnlockedAct);
    if (act > highestUnlockedAct){
      dot.title = 'Locked • Complete current chapter first';
    } else {
      dot.title = dot.getAttribute('data-title') || `Chapter ${act}`;
    }
  });
}

function switchAct(targetAct){
  currentActNumber = targetAct;
  unlockAct(targetAct);

  if (targetAct <= 4){
    if (act5Scene){ act5Scene.classList.remove('is-active'); act5Scene.hidden = true; }
    if (act6Scene){ act6Scene.classList.remove('is-active'); act6Scene.hidden = true; }
    if (act7Scene){ act7Scene.classList.remove('is-active'); act7Scene.hidden = true; }
    if (targetAct === 4){
      treeStart();
      showWish(true);
    }
  } else if (targetAct === 5){
    if (act6Scene){ act6Scene.classList.remove('is-active'); act6Scene.hidden = true; }
    if (act7Scene){ act7Scene.classList.remove('is-active'); act7Scene.hidden = true; }
    if (act5Scene){
      act5Scene.hidden = false;
      requestAnimationFrame(() => act5Scene.classList.add('is-active'));
    }
  } else if (targetAct === 6){
    if (act5Scene){ act5Scene.classList.remove('is-active'); act5Scene.hidden = true; }
    if (act7Scene){ act7Scene.classList.remove('is-active'); act7Scene.hidden = true; }
    if (act6Scene){
      act6Scene.hidden = false;
      requestAnimationFrame(() => act6Scene.classList.add('is-active'));
      updateCoverflow();
    }
  } else if (targetAct === 7){
    if (act5Scene){ act5Scene.classList.remove('is-active'); act5Scene.hidden = true; }
    if (act6Scene){ act6Scene.classList.remove('is-active'); act6Scene.hidden = true; }
    if (act7Scene){
      act7Scene.hidden = false;
      requestAnimationFrame(() => act7Scene.classList.add('is-active'));
    }
  }

  playActMusic(targetAct);
}

// Act Navigation Dots Click: allow going back or current; block upcoming
actNavDots.forEach(dot => {
  dot.addEventListener('click', () => {
    const act = parseInt(dot.getAttribute('data-act'), 10);
    if (act > highestUnlockedAct){
      dot.classList.add('is-locked-shake');
      setTimeout(() => dot.classList.remove('is-locked-shake'), 400);
      return;
    }
    switchAct(act);
  });
});

/* ============================================================
   ACT 4 -> ACT 5 STEP BUTTON
   ============================================================ */
if (btnToAct5){
  btnToAct5.addEventListener('click', () => {
    switchAct(5);
  });
}

/* ============================================================
   ACT 5 — PROPOSAL & RUNAWAY "NO" BUTTON
   ============================================================ */
let noDodgeCount = 0;
const noPhrases = [
  "No 😔",
  "Nice try! 😜",
  "Can't touch me! 🏃💨",
  "Say Yes already! 🥰",
  "Still running! 💖",
  "Destiny says Yes! 💍",
  "Only YES allowed! ✨",
  "You know you love me! 💕"
];

function dodgeNoButton(e){
  if (e){
    e.preventDefault();
    e.stopPropagation();
  }
  noDodgeCount++;
  
  if (btnAct5No){
    btnAct5No.textContent = noPhrases[noDodgeCount % noPhrases.length];

    const padding = 24;
    const btnW = btnAct5No.offsetWidth || 130;
    const btnH = btnAct5No.offsetHeight || 48;
    const maxW = Math.max(window.innerWidth - btnW - padding, padding);
    const maxH = Math.max(window.innerHeight - btnH - padding, padding);

    const randLeft = Math.floor(Math.random() * (maxW - padding)) + padding;
    const randTop = Math.floor(Math.random() * (maxH - padding)) + padding;

    gsap.to(btnAct5No, {
      position: 'fixed',
      left: randLeft,
      top: randTop,
      zIndex: 9999,
      duration: 0.22,
      ease: 'power2.out',
      boxShadow: '0 12px 28px rgba(186, 25, 75, 0.45)'
    });
  }

  // Playfully scale up the Yes button
  if (btnAct5Yes){
    const yesScale = Math.min(1 + noDodgeCount * 0.04, 1.25);
    gsap.to(btnAct5Yes, { scale: yesScale, duration: 0.25, ease: 'back.out(1.5)' });
  }

  if (noDodgeCount >= 2 && noPleaModal){
    if (modalPleaGif) modalPleaGif.src = '/gif/tears.gif';
    if (modalPleaTitle) modalPleaTitle.textContent = 'Please open your heart...';
    if (modalPleaText) modalPleaText.textContent = 'You can run from the question, but you cannot run from how much I love you.';
    noPleaModal.hidden = false;
  }
}

if (btnAct5No){
  btnAct5No.addEventListener('mouseenter', dodgeNoButton);
  btnAct5No.addEventListener('pointerenter', dodgeNoButton);
  btnAct5No.addEventListener('touchstart', dodgeNoButton, { passive: false });
  btnAct5No.addEventListener('pointerdown', dodgeNoButton);
  btnAct5No.addEventListener('click', dodgeNoButton);
}

function handleYesClick(){
  if (noPleaModal) noPleaModal.hidden = true;
  
  // Both Yes and No buttons completely vanish
  if (act5Actions){
    act5Actions.classList.add('is-hidden');
    act5Actions.style.display = 'none';
  }
  if (btnAct5No){
    btnAct5No.style.display = 'none';
  }
  if (btnAct5Yes){
    btnAct5Yes.style.display = 'none';
  }

  // Reveal celebration: "SHE SAID YES! 💍" and "Walk Down Our Memory Lane"
  if (act5Celebration){
    act5Celebration.hidden = false;
    act5Celebration.style.display = 'block';
  }

  triggerHeartConfetti();
  setTimeout(() => triggerHeartConfetti(), 400);

  unlockAct(6);
}

if (btnAct5Yes) btnAct5Yes.addEventListener('click', handleYesClick);
if (btnModalSayYes) btnModalSayYes.addEventListener('click', handleYesClick);

if (modalPleaBackdrop){
  modalPleaBackdrop.addEventListener('click', () => {
    if (noPleaModal) noPleaModal.hidden = true;
  });
}

if (btnModalStillNo){
  btnModalStillNo.addEventListener('mouseenter', (e) => {
    const x = rand(-40, 40);
    const y = rand(-30, 30);
    gsap.to(btnModalStillNo, { x, y, duration: 0.2, ease: 'power2.out' });
  });
  btnModalStillNo.addEventListener('pointerdown', (e) => {
    const x = rand(-60, 60);
    const y = rand(-40, 40);
    gsap.to(btnModalStillNo, { x, y, duration: 0.2, ease: 'power2.out' });
    e.preventDefault();
  });
}

if (btnToAct6){
  btnToAct6.addEventListener('click', () => {
    switchAct(6);
  });
}

/* ============================================================
   ACT 6 — 3D INTERACTIVE MEMORY GALLERY (Coverflow)
   ============================================================ */
let currentPhotoIndex = 0;
const cards3D = document.querySelectorAll('.c3d-card');
const dots3D = document.querySelectorAll('.c-dot');

function updateCoverflow(){
  const total = cards3D.length;
  cards3D.forEach((card, i) => {
    let diff = i - currentPhotoIndex;
    if (diff < -Math.floor(total / 2)) diff += total;
    if (diff > Math.floor(total / 2)) diff -= total;

    if (diff === 0){
      card.style.transform = `translate3d(0, 0, 140px) rotateY(0deg) scale(1)`;
      card.style.opacity = '1';
      card.style.zIndex = '6';
      card.style.filter = 'none';
      card.style.pointerEvents = 'auto';
    } else if (diff === -1){
      card.style.transform = `translate3d(-175px, 0, 0px) rotateY(28deg) scale(0.85)`;
      card.style.opacity = '0.75';
      card.style.zIndex = '4';
      card.style.filter = 'brightness(0.92)';
      card.style.pointerEvents = 'auto';
    } else if (diff === 1){
      card.style.transform = `translate3d(175px, 0, 0px) rotateY(-28deg) scale(0.85)`;
      card.style.opacity = '0.75';
      card.style.zIndex = '4';
      card.style.filter = 'brightness(0.92)';
      card.style.pointerEvents = 'auto';
    } else {
      card.style.transform = `translate3d(${diff < 0 ? -280 : 280}px, 0, -120px) rotateY(${diff < 0 ? 42 : -42}deg) scale(0.72)`;
      card.style.opacity = '0.35';
      card.style.zIndex = '2';
      card.style.filter = 'brightness(0.8)';
      card.style.pointerEvents = 'none';
    }
  });

  dots3D.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentPhotoIndex);
  });
}

if (carouselPrev){
  carouselPrev.addEventListener('click', () => {
    currentPhotoIndex = (currentPhotoIndex - 1 + cards3D.length) % cards3D.length;
    updateCoverflow();
  });
}
if (carouselNext){
  carouselNext.addEventListener('click', () => {
    currentPhotoIndex = (currentPhotoIndex + 1) % cards3D.length;
    updateCoverflow();
  });
}

cards3D.forEach((card, idx) => {
  card.addEventListener('click', () => {
    if (currentPhotoIndex !== idx){
      currentPhotoIndex = idx;
      updateCoverflow();
    }
  });
});

dots3D.forEach(dot => {
  dot.addEventListener('click', () => {
    const idx = parseInt(dot.getAttribute('data-index'), 10);
    currentPhotoIndex = idx;
    updateCoverflow();
  });
});

// Touch swipe support for 3D carousel
let touchStartX = 0;
if (carousel3D){
  carousel3D.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  carousel3D.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40){
      if (diff > 0){
        currentPhotoIndex = (currentPhotoIndex - 1 + cards3D.length) % cards3D.length;
      } else {
        currentPhotoIndex = (currentPhotoIndex + 1) % cards3D.length;
      }
      updateCoverflow();
    }
  }, { passive: true });
}

if (btnToAct7){
  btnToAct7.addEventListener('click', () => {
    switchAct(7);
  });
}

/* ============================================================
   ACT 7 — LOVE LETTER & WAX ENVELOPE
   ============================================================ */
const loveLetterText = `My Dearest Sweety,

From the moment you walked into my life, every ordinary day became extraordinary. You brought warmth into my quietest moments, endless laughter into my soul, and a love deeper than I ever dreamed possible.

Every morning is brighter knowing you exist. Every dream feels within reach because your smile inspires me. You are my greatest blessing, my sweetest comfort, and my lifelong home.

I promise to cherish you, laugh with you, stand by you through every storm, and choose you with every single beat of my heart.

Today, tomorrow, and through all our forevers to come... I love you unconditionally.`;

let isLetterOpened = false;
let letterTypingInterval = null;

function openLoveLetter(){
  if (isLetterOpened) return;
  isLetterOpened = true;

  if (envelopeSeal){
    gsap.to(envelopeSeal, { scale: 1.35, opacity: 0, duration: 0.45, ease: 'power2.in' });
  }

  // Typewriter effect for handwritten letter
  if (letterTyped){
    letterTyped.textContent = '';
    let charIdx = 0;
    if (letterTypingInterval) clearInterval(letterTypingInterval);

    letterTypingInterval = setInterval(() => {
      if (charIdx < loveLetterText.length){
        letterTyped.textContent = loveLetterText.slice(0, charIdx + 1);
        charIdx++;
      } else {
        clearInterval(letterTypingInterval);
        triggerHeartConfetti();
      }
    }, 28);
  }
}

if (envelopeSeal) envelopeSeal.addEventListener('click', openLoveLetter);
if (envelopeWrapper) envelopeWrapper.addEventListener('click', openLoveLetter);

/* Romantic Vows Choices with Specific Emojis */
const vowQuotes = {
  close: {
    emoji: '💕',
    quote: 'When you are in my arms, the noise of the world fades away. I promise to hold you tight through every storm, comfort your tired soul, and wrap you in endless warmth every single day.'
  },
  laugh: {
    emoji: '🌸',
    quote: 'I promise to cherish your radiant smile, laugh at every silly joke, dance with you in the quiet moments, and make sure joy is the heartbeat of our home forever.'
  },
  dreams: {
    emoji: '✨',
    quote: 'Hand in hand, we will chase every horizon. Whatever we imagine, we will build together with patience, wild ambition, and unwavering faith in one another.'
  },
  forever: {
    emoji: '💍',
    quote: 'From this breath until my very last, my heart is wholly yours. Not just for this life, but for all of eternity. You are my home, my partner, and my forever.'
  }
};

vowChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const vowKey = chip.getAttribute('data-vow');
    const data = vowQuotes[vowKey];
    if (!data) return;

    vowChips.forEach(c => c.classList.remove('is-selected'));
    chip.classList.add('is-selected');

    if (vowChosenBox && vowChosenText){
      vowChosenBox.hidden = false;
      vowChosenText.textContent = `${data.emoji} “${data.quote}” ${data.emoji}`;
      gsap.fromTo(vowChosenBox, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' });
    }

    try {
      confetti({
        particleCount: 24,
        spread: 60,
        origin: { y: 0.72 },
        shapes: ['circle'],
        scalar: 1.15
      });
    } catch (_) {}
  });
});

if (btnCelebrateAll){
  btnCelebrateAll.addEventListener('click', () => {
    triggerHeartConfetti();
    setTimeout(() => triggerHeartConfetti(), 400);
  });
}

if (btnRestartJourney){
  btnRestartJourney.addEventListener('click', () => {
    window.location.reload();
  });
}

/* back to Act 1, ready to be drawn again */
function resetAll(){
  treeStop();
  showWish(false);
  noPleaCount = 0;
  noDodgeCount = 0;
  isLetterOpened = false;
  if (letterTypingInterval) clearInterval(letterTypingInterval);
  if (letterTyped) letterTyped.textContent = '';
  if (envelopeSeal) gsap.set(envelopeSeal, { scale: 1, opacity: 1 });
  if (act5Actions){
    act5Actions.classList.remove('is-hidden');
    act5Actions.style.display = 'flex';
  }
  if (btnAct5No){
    btnAct5No.style.display = 'inline-flex';
    btnAct5No.textContent = 'No 😔';
    gsap.set(btnAct5No, { clearProps: 'position,left,top,zIndex,boxShadow,transform' });
  }
  if (btnAct5Yes){
    btnAct5Yes.style.display = 'inline-flex';
    gsap.set(btnAct5Yes, { scale: 1 });
  }
  if (act5Celebration){
    act5Celebration.hidden = true;
    act5Celebration.style.display = 'none';
  }
  if (noPleaModal) noPleaModal.hidden = true;
  if (vowChosenBox) vowChosenBox.hidden = true;
  vowChips.forEach(c => c.classList.remove('is-selected'));

  highestUnlockedAct = 1;
  updateNavDots();

  window.bdayDone = false; replayArmed = false;
  if (filmTL){ filmTL.pause(0); }
  gsap.set([flood, bloom], { autoAlpha: 0 });
  gsap.set(field, { autoAlpha: 0 });
  gsap.set(arrow, { opacity: 1, scaleY: 1 });
  played = false;

  switchAct(1);
  enter();
}

/* ============================================================
   SIZING + BOOT
   ============================================================ */
function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildSprites();
  buildScene();
  if (reduceMotion){ drawFinal(); return; }
  if (played && filmTL){
    const at = filmTL.time(); const active = filmTL.isActive();
    filmTL = buildFilm(shotGeom());
    filmTL.pause(at);
    if (active) filmTL.play(at);
  } else {
    refreshRig(); setDraw(0);
  }
}
let resizeRAF = 0;
window.addEventListener('resize', () => { if (resizeRAF) return; resizeRAF = requestAnimationFrame(() => { resizeRAF = 0; resize(); }); });

resize();

if (reduceMotion){
  drawFinal();
  showWish(true);
} else {
  buildMotes();
  document.fonts && document.fonts.ready.then(() => { refreshRig(); setDraw(0); });
  enter();
  updateNavDots();
}

// Try to start Act 1 immediately. Browsers that block audible autoplay retry
// from the first user gesture below.
isMusicPlaying = true;
playActMusic(1);

function handleFirstUserGesture(){
  if (actAudioPlayer && actAudioPlayer.paused){
    actAudioPlayer.play().catch(() => {
      const track = ACT_TRACKS[currentActNumber] || ACT_TRACKS[1];
      startProceduralSynth(track.chord);
    });
  }
  window.removeEventListener('pointerdown', handleFirstUserGesture);
  window.removeEventListener('keydown', handleFirstUserGesture);
}
window.addEventListener('pointerdown', handleFirstUserGesture, { once: true });
window.addEventListener('keydown', handleFirstUserGesture, { once: true });

/* ============================================================
   RECORDING HOOK — the rig draws + fires after its pre-roll
   ============================================================ */
if (isRecord){
  window.bdayAPI = {
    start(){ autoFire(); },
    replay(){ resetAll(); },
  };
}
