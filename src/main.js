import * as THREE from 'three';
import { createScene } from './scene.js';
import { buildModel, edgeMaterial } from './model/index.js';
import { Assembly } from './assembly.js';
import { PHASES } from './steps.js';
import { MAT, EMISSIVE_MATS, RUNNERS } from './materials.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('c');

const S = createScene(canvas);
const { kit, root } = buildModel();
S.scene.add(root);
const engine = new Assembly(kit, root);
const STEPS = kit.steps;
$('loading').remove();

// ───────────────────────── camera framing ─────────────────────────
const VIEWS = {
  front: new THREE.Vector3(0.55, 0.28, 1),
  back: new THREE.Vector3(-0.55, 0.3, -1),
  side: new THREE.Vector3(1, 0.25, 0.25),     // model's left side
  left: new THREE.Vector3(1, 0.25, 0.35),
  right: new THREE.Vector3(-1, 0.25, 0.35),
  frontL: new THREE.Vector3(0.9, 0.3, 1),
  frontR: new THREE.Vector3(-0.9, 0.3, 1),
  backL: new THREE.Vector3(0.8, 0.3, -1),
  backR: new THREE.Vector3(-0.8, 0.3, -1),
  top: new THREE.Vector3(0.3, 1.4, 0.8),
  under: new THREE.Vector3(0.4, -0.9, 0.8),
};
let autoCam = true;
let camAnim = null;
let userOrbiting = false;

function frame(box, viewDir, minDist = 95) {
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = THREE.MathUtils.degToRad(S.camera.fov);
  const aspect = Math.min(1, canvas.clientWidth / canvas.clientHeight);
  let dist = (sphere.radius / Math.sin(fov / 2)) * 1.08 * viewZoom();
  if (aspect < 1) dist /= Math.max(0.45, aspect);
  dist = Math.max(minDist, dist);
  const dir = viewDir.clone().normalize();
  flyTo(sphere.center, sphere.center.clone().addScaledVector(dir, dist));
}

function flyTo(target, pos, dur = 1.2) {
  camAnim = {
    t: 0, dur,
    fromT: S.controls.target.clone(), toT: target.clone(),
    fromP: S.camera.position.clone(), toP: pos.clone(),
  };
}

function focusCurrent(force = false) {
  if (!autoCam && !force) return;
  const st = STEPS[engine.cur];
  const box = engine.focusBox(engine.cur, st.focus);
  if (box.isEmpty()) return;
  // keep some of the surrounding model in view for tiny parts
  const view = Array.isArray(st.view) ? new THREE.Vector3(...st.view) : VIEWS[st.view || 'front'] || VIEWS.front;
  frame(box, view, st.minDist ?? 120);
}

S.controls.addEventListener('start', () => { camAnim = null; userOrbiting = true; });
S.controls.addEventListener('end', () => { userOrbiting = false; });

// ───────────────────────── LED / effects ─────────────────────────
let led = false;
function setLed(on) {
  led = on;
  $('optLed').checked = on;
  for (const m of EMISSIVE_MATS) m.emissiveIntensity = on ? 4 : 0.25;
  MAT.finGlow.opacity = on ? 0.9 : 0;
  MAT.finGlow.emissiveIntensity = on ? 7 : 0;
  S.bloom.enabled = on;
}
setLed(false);

// ───────────────────────── UI: step list & timeline ─────────────────────────
const list = $('stepList');
const stepBtns = [];
let lastPhase = null, lastSec = null, lastBlock = null;
STEPS.forEach((st, i) => {
  if (st.phase !== lastPhase) {
    const ph = PHASES[st.phase];
    const h = document.createElement('div');
    h.className = 'phase';
    h.innerHTML = `<i style="background:${ph.color}"></i>${ph.name}`;
    list.appendChild(h);
    lastPhase = st.phase; lastSec = null;
  }
  if (st.section !== lastSec && st.phase !== 0) {
    const s = document.createElement('div');
    s.className = 'sec';
    s.textContent = st.section;
    list.appendChild(s);
    lastSec = st.section; lastBlock = null;
  }
  if (st.block && st.block !== lastBlock) {
    const s = document.createElement('div');
    s.className = 'blk';
    s.textContent = st.block;
    list.appendChild(s);
  }
  lastBlock = st.block;
  const b = document.createElement('button');
  b.className = 'step';
  b.innerHTML = `<span class="n">${i}</span><span>${st.title}</span>${realCount(st.parts) ? `<span class="pc">${realCount(st.parts)}</span>` : ''}`;
  b.onclick = () => { stopPlay(); goto(i); if (innerWidth <= 820) app.classList.remove('sideOpen'); };
  list.appendChild(b);
  stepBtns.push(b);
});

const tl = $('timeline');
const tlSegs = STEPS.map((st, i) => {
  const d = document.createElement('div');
  d.style.background = PHASES[st.phase].color;
  d.title = `${i}. ${st.title}`;
  d.onclick = () => { stopPlay(); goto(i); };
  tl.appendChild(d);
  return d;
});

const swatchCache = new Map();
function swatchOf(p) {
  if (swatchCache.has(p)) return swatchCache.get(p);
  let best = null, n = -1;
  p.obj.traverse((o) => {
    if (!o.isMesh || !o.material.color) return;
    const c = o.geometry.attributes.position.count;
    if (c > n) { n = c; best = o.material; }
  });
  const col = best ? '#' + best.color.getHexString() : '#777';
  swatchCache.set(p, col);
  return col;
}

/** segments (extra pieces of one articulated kit part) are not separate parts */
function realCount(parts) { return parts.filter((p) => !p.segment).length; }

function partChips(parts) {
  parts = parts.filter((p) => !p.segment);
  const groups = new Map();
  for (const p of parts) {
    const g = groups.get(p.label) || { p, n: 0 };
    g.n++;
    groups.set(p.label, g);
  }
  return [...groups.values()];
}

function renderCard() {
  const i = engine.cur, st = STEPS[i], ph = PHASES[st.phase];
  $('phaseBadge').textContent = st.phase === 0 ? 'OVERVIEW' : `PHASE ${ph.short}`;
  $('phaseBadge').style.background = ph.color;
  $('stepNo').textContent = i === 0 ? `${STEPS.length - 1} steps · ${realCount(kit.parts)} parts` : `Step ${i} / ${STEPS.length - 1}`;
  $('section').textContent = st.block ? `${st.section} · ${st.block}` : st.section;
  $('title').textContent = st.title;
  $('desc').textContent = st.desc;
  $('desc').hidden = !st.desc;
  $('caution').textContent = st.caution;
  $('caution').hidden = !st.caution;
  const parts = $('parts');
  parts.innerHTML = '';
  $('partsWrap').hidden = realCount(st.parts) === 0;
  $('partsCount').textContent = realCount(st.parts) ? `(${realCount(st.parts)})` : '';
  for (const { p, n } of partChips(st.parts)) {
    const info = (RUNNERS[p.runner] || RUNNERS[p.runner?.[0]]);
    const el = document.createElement('span');
    el.className = 'part';
    el.innerHTML = `<i style="background:${swatchOf(p)}"></i>${p.label}${n > 1 ? `<b>×${n}</b>` : ''}`;
    el.title = info ? `Runner ${p.runner}: ${info[0]}` : p.label;
    el.onmouseenter = () => { S.outline.selectedObjects = st.parts.filter((q) => q.label === p.label).map((q) => q.obj); };
    el.onmouseleave = () => { S.outline.selectedObjects = [...engine.currentParts(), ...engine.currentAssemblies()]; };
    parts.appendChild(el);
  }
  if (scans) $('thumbImg').src = `manual/pp/${String(st.pp).padStart(2, '0')}.jpg`;
  $('thumbPage').textContent = st.pp;

  stepBtns.forEach((b, k) => { b.classList.toggle('cur', k === i); b.classList.toggle('done', i !== 0 && k < i); });
  stepBtns[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
  tlSegs.forEach((d, k) => { d.classList.toggle('cur', k === i); d.classList.toggle('done', i === 0 || k < i); });
  $('counter').innerHTML = `<span>${i === 0 ? 'Completed model' : `Step ${i} of ${STEPS.length - 1}`}</span><span>${ph.name}</span>`;
  $('prev').disabled = i === 0;
  $('next').disabled = i === STEPS.length - 1;
}

// The manual page scans (public/manual) are optional and are not part of the public build: without them the
// thumbnail links to the page in Bandai's official PDF (each PDF page is a spread of two printed pages).
const MANUAL_PDF = 'https://manual.bandai-hobby.net/pdf/1066.pdf';
const pdfPage = (pp) => `${MANUAL_PDF}#page=${Math.floor(pp / 2) + 1}`;
let scans = true;
$('thumbImg').onerror = () => { scans = false; document.body.classList.add('noScans'); $('thumbImg').removeAttribute('src'); };

function goto(i) {
  const prev = engine.cur;
  engine.go(i);
  const st = STEPS[engine.cur];
  S.outline.selectedObjects = [...engine.currentParts(), ...engine.currentAssemblies()];
  const lit = (k) => k === 0 || ['final', 'led'].includes(STEPS[k].id);
  if (lit(engine.cur)) setLed(true);
  else if (lit(prev)) setLed(false);
  if (engine.cur !== 0) autoRotate = false;
  renderCard();
  focusCurrent();
}

// ───────────────────────── transport ─────────────────────────
let playing = false, holdT = 0;
function stopPlay() { playing = false; $('play').textContent = '▶'; }
function startPlay() {
  playing = true; holdT = 0; $('play').textContent = '❚❚';
  if (engine.cur === STEPS.length - 1) goto(0);
  if (!engine.busy) goto(engine.cur + 1);
}
$('play').onclick = () => (playing ? stopPlay() : startPlay());
$('next').onclick = () => { stopPlay(); goto(engine.cur + 1); };
$('prev').onclick = () => { stopPlay(); goto(engine.cur - 1); };
$('replay').onclick = () => { engine.replay(); focusCurrent(); };

$('optCam').onchange = (e) => { autoCam = e.target.checked; if (autoCam) focusCurrent(); };
$('optGhost').onchange = (e) => { engine.ghost = e.target.checked; engine.refresh(); };
$('optEdges').onchange = (e) => { engine.edges = e.target.checked; engine.refresh(); };
$('optHatch').onchange = (e) => { engine.hatchTarget = e.target.checked ? 1 : 0; };
$('optLed').onchange = (e) => setLed(e.target.checked);

function wholeBox() { return engine.focusBox(engine.cur, 'all'); }
$('viewFront').onclick = () => frame(wholeBox(), VIEWS.front);
$('viewBack').onclick = () => frame(wholeBox(), VIEWS.back);
$('viewFit').onclick = () => frame(wholeBox(), S.camera.position.clone().sub(S.controls.target));

$('menuBtn').onclick = () => {
  if (innerWidth <= 820) app.classList.toggle('sideOpen');
  else app.classList.toggle('noSide');
};
$('cardToggle').onclick = () => {
  $('card').classList.toggle('collapsed');
  $('cardToggle').textContent = $('card').classList.contains('collapsed') ? '▸' : '▾';
};

// manual modal (printed pages 0-71)
let modalPage = 1;
function showPage(p) {
  modalPage = Math.max(0, Math.min(71, p));
  $('mImg').src = `manual/pp/${String(modalPage).padStart(2, '0')}.jpg`;
  $('mLabel').textContent = `Manual page ${modalPage}`;
  $('mPdf').href = pdfPage(modalPage);
}
$('manualThumb').onclick = () => {
  const pp = STEPS[engine.cur].pp;
  if (!scans) { window.open(pdfPage(pp), '_blank', 'noopener'); return; }
  showPage(pp); $('modal').hidden = false;
};
$('mPrev').onclick = () => showPage(modalPage - 1);
$('mNext').onclick = () => showPage(modalPage + 1);
$('mClose').onclick = () => { $('modal').hidden = true; };
$('modal').onclick = (e) => { if (e.target.id === 'modal') $('modal').hidden = true; };

// hover: name the part under the cursor
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = $('tip');
let hoverAt = null;
canvas.addEventListener('pointermove', (e) => { hoverAt = e; });
canvas.addEventListener('pointerleave', () => { hoverAt = null; tip.hidden = true; });
function hoverPick() {
  if (!hoverAt || userOrbiting) { if (userOrbiting) tip.hidden = true; return; }
  const e = hoverAt; hoverAt = null;
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, S.camera);
  const hits = ray.intersectObject(root, true);
  let part = null;
  for (const h of hits) {
    let o = h.object;
    if (!o.visible) continue;
    while (o && !o.userData.part) o = o.parent;
    if (o && o.visible) { part = o.userData.part; break; }
  }
  if (!part) { tip.hidden = true; return; }
  const st = STEPS[part.step];
  const info = (RUNNERS[part.runner] || RUNNERS[part.runner?.[0]]);
  tip.innerHTML = `<b>${part.label}</b>${info ? ` <span>${info[0]}</span>` : ''}<br><small>Step ${part.step} · ${st.block || st.section}</small>`;
  tip.style.left = `${e.clientX - r.left + 14}px`;
  tip.style.top = `${e.clientY - r.top + 12}px`;
  tip.hidden = false;
}

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
  if (!$('modal').hidden) {
    if (e.key === 'Escape') $('modal').hidden = true;
    if (e.key === 'ArrowLeft') showPage(modalPage - 1);
    if (e.key === 'ArrowRight') showPage(modalPage + 1);
    return;
  }
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown') { stopPlay(); goto(engine.cur + 1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { stopPlay(); goto(engine.cur - 1); }
  else if (k === ' ') { e.preventDefault(); playing ? stopPlay() : startPlay(); }
  else if (k === 'Home') { stopPlay(); goto(0); }
  else if (k === 'End') { stopPlay(); goto(STEPS.length - 1); }
  else if (k === 'r' || k === 'R') $('replay').click();
  else if (k === 'f' || k === 'F') $('viewFront').click();
  else if (k === 'b' || k === 'B') $('viewBack').click();
  else if (k === 'a' || k === 'A') $('viewFit').click();
  else if (k === 's' || k === 'S') $('menuBtn').click();
  else if (k === 'm' || k === 'M') $('manualThumb').click();
  else return;
  e.preventDefault();
});

// ───────────────────────── render loop ─────────────────────────
let autoRotate = true;
const timer = new THREE.Timer();
function updateViewOffset() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const card = $('card');
  const cw = innerWidth > 820 && !card.classList.contains('collapsed') ? card.offsetWidth + 14 : 0;
  // phones: the step card sits at the bottom, so centre the model in the area above it
  const ch = innerWidth <= 820 && !card.classList.contains('collapsed') ? card.offsetHeight + 10 : 0;
  if (cw > 0 && w > 700) S.camera.setViewOffset(w + cw, h, cw, 0, w, h);
  else if (ch > 0 && ch < h * 0.6) S.camera.setViewOffset(w, h + ch, 0, ch, w, h);
  else if (S.camera.view?.enabled) {
    S.camera.clearViewOffset();
    S.camera.aspect = w / h;
    S.camera.updateProjectionMatrix();
  }
}
/** Zoom factor introduced by a vertical view offset (the virtual image is taller than the canvas). */
const viewZoom = () => (S.camera.view?.enabled ? S.camera.view.fullHeight / S.camera.view.height : 1);

function loop(ts) {
  timer.update(ts);
  const dt = Math.min(0.05, timer.getDelta());
  S.resize();
  updateViewOffset();
  const finished = engine.update(dt);
  if (finished) {
    S.outline.selectedObjects = [...engine.currentParts(), ...engine.currentAssemblies()];
    holdT = 0;
  }
  if (playing && !engine.busy) {
    holdT += dt;
    if (holdT > 1.1) {
      holdT = 0;
      if (engine.cur >= STEPS.length - 1) stopPlay();
      else goto(engine.cur + 1);
    }
  }
  if (camAnim) {
    camAnim.t += dt / camAnim.dur;
    const k = camAnim.t >= 1 ? 1 : 1 - Math.pow(1 - camAnim.t, 3);
    S.controls.target.lerpVectors(camAnim.fromT, camAnim.toT, k);
    S.camera.position.lerpVectors(camAnim.fromP, camAnim.toP, k);
    if (camAnim.t >= 1) camAnim = null;
  }
  S.controls.autoRotate = autoRotate && engine.cur === 0 && !userOrbiting && !camAnim;
  S.controls.autoRotateSpeed = 0.6;
  S.controls.update(dt);
  hoverPick();
  S.composer.render(dt);
  requestAnimationFrame(loop);
}

// start on the overview
edgeMaterial.opacity = 0.3;
goto(0);
S.controls.addEventListener('start', () => { autoRotate = false; });
requestAnimationFrame(loop);

// debugging hooks
window.__rx = { engine, kit, root, S, goto, STEPS, focusCurrent };
window.__rx.cam = (t, p) => { S.controls.target.set(...t); S.camera.position.set(...p); autoRotate = false; camAnim = null; S.controls.update(); };
window.__rx.inspect = () => { app.classList.add('noSide'); $('card').style.display = 'none'; autoCam = false; $('optCam').checked = false; autoRotate = false; };
window.__rx.box = (keys) => {
  const b = new THREE.Box3(), t = new THREE.Box3();
  root.updateMatrixWorld(true);
  kit.parts.filter((p) => keys.some((k) => p.id.startsWith(k) || (STEPS[p.step].block || '').startsWith(k))).forEach((p) => p.obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    b.union(t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
  }));
  return [b.min, b.max].map((v) => v.toArray().map((x) => x.toFixed(0)).join(',')).join(' → ');
};
