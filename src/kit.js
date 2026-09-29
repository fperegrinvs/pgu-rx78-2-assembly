// Part registry. The model builders declare the manual's structure while they build:
//   kit.phase(1); kit.section('LEGS-FRAME', {pp: 14}); kit.block('Right leg frame');
//   kit.step('Hip joint', {pp: 15, desc}); kit.part('D1', parent, meshes, opts); kit.join(group, bench)
// Every call to kit.part() is one physical kit part (one manual part number) with its own fly-in.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function mk(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p[0], p[1], p[2]);
  m.rotation.set(r[0], r[1], r[2]);
  if (s) m.scale.set(s[0], s[1], s[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function grp(p = [0, 0, 0], r = [0, 0, 0], children = []) {
  const g = new THREE.Group();
  g.position.set(p[0], p[1], p[2]);
  g.rotation.set(r[0], r[1], r[2]);
  for (const c of children) g.add(c);
  return g;
}

const CIRCLED = '⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿';

/** 'D13' -> {runner:'D', n:13, label:'D⑬'}; 'P3-13' -> P3⑬; 'MSF-2-1' -> MSF-2①; stickers / metal parts. */
export function parseId(id) {
  let m;
  if ((m = id.match(/^MSF-?(\d)-?(\d)$/))) return { runner: 'MSF', n: +m[2], label: `MSF-${m[1]}${CIRCLED[+m[2]]}` };
  if ((m = id.match(/^Sticker([AB])-?(\d+)$/i))) return { runner: 'STICKER', n: +m[2], label: `Sticker ${m[1].toUpperCase()}-${m[2]}` };
  if ((m = id.match(/^(ETCH|Etching)-?(\d+)$/i))) return { runner: 'STICKER', n: +m[2], label: `Etching ${m[2]}` };
  if ((m = id.match(/^Metallic3D-?(\d+)$/i))) return { runner: 'STICKER', n: +m[1], label: `Metallic 3D ${m[1]}` };
  if (/^METAL|^screw|^LED|^LR41/i.test(id)) {
    const label = id.replace(/^METAL-/i, 'Metal ').replace(/-/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    return { runner: 'METAL', n: null, label };
  }
  m = id.match(/^([A-Z]\d?)-(\d+)$/) || id.match(/^([A-Z])(\d+)$/);
  if (!m) return { runner: null, n: null, label: id };
  const n = +m[2];
  return { runner: m[1], n, label: m[1] + (CIRCLED[n] || n) };
}

export class Kit {
  constructor() {
    this.steps = [];
    this.parts = [];
    this.assemblies = [];
    this.ctx = { phase: 0, section: '', block: '', pp: 0, compact: false };
    this.cur = null;
  }

  phase(p) { this.ctx.phase = p; }
  section(name, { pp } = {}) {
    Object.assign(this.ctx, { section: name, block: '', compact: false, blockDesc: '' });
    if (pp) this.ctx.pp = pp;
    this.cur = null;
  }
  /** A titled sub-assembly block. compact=true merges all its steps into one (used for mirrored "same as other side" builds). */
  block(title, { pp, compact = false, desc = '' } = {}) {
    Object.assign(this.ctx, { block: title, compact, blockDesc: desc });
    if (pp) this.ctx.pp = pp;
    this.cur = null;
  }

  /**
   * Start a manual step. opts: {pp (printed page), desc, caution, view ('front'|'back'|'side'|'top'|'under'),
   * focus ('all'|'lower'|'upper'|...), id, minDist}
   */
  step(title, opts = {}) {
    if (opts.pp) this.ctx.pp = opts.pp;
    if (this.ctx.compact && this.cur && this.cur.block === this.ctx.block) {
      if (opts.caution && !this.cur.caution) this.cur.caution = opts.caution;
      return this.cur;
    }
    const st = {
      index: this.steps.length,
      phase: this.ctx.phase, section: this.ctx.section, block: this.ctx.block,
      title: this.ctx.compact ? this.ctx.block : title,
      desc: this.ctx.compact ? (this.ctx.blockDesc || opts.desc || '') : (opts.desc || ''),
      caution: opts.caution || '', pp: this.ctx.pp,
      view: opts.view, focus: opts.focus, id: opts.id, minDist: opts.minDist,
      parts: [], assemblies: [],
    };
    this.steps.push(st);
    this.cur = st;
    return st;
  }

  /**
   * Register one kit part.
   * @param id     manual part id ('D1', 'P3-13', 'MSF-2', 'stk:12', 'metal:vernier')
   * @param parent group the part is mounted in
   * @param meshes Mesh | Mesh[] positioned in parent space
   * @param opts   {from:[x,y,z] approach offset in parent space (auto when omitted), dist, hatch:{axis,angle,pivot}, name,
   *                segment: true = another piece of the previous part (articulated insert frames spanning several joints)}
   */
  part(id, parent, meshes, opts = {}) {
    if (!this.cur) throw new Error(`kit.part(${id}) outside a step`);
    const g = new THREE.Group();
    for (const m of [].concat(meshes)) g.add(m);
    parent.add(g);
    const info = parseId(id);
    const rec = {
      obj: g, id, label: opts.name || info.label, runner: info.runner,
      step: this.cur.index, order: this.cur.parts.length,
      final: g.position.clone(), finalQ: g.quaternion.clone(),
      from: opts.from ? new THREE.Vector3(...opts.from) : null, dist: opts.dist,
      hatch: opts.hatch || null, kind: opts.kind || null, segment: !!opts.segment,
    };
    g.userData.part = rec;
    g.name = id;
    this.parts.push(rec);
    this.cur.parts.push(rec);
    return g;
  }

  /**
   * Swap-out: every part already mounted inside `group` is taken off at the current step (flies away and stays hidden),
   * e.g. the fists replaced by a weapon-holding hand. Parts added to `group` afterwards are unaffected.
   */
  swapOut(group) {
    const inside = (o) => { for (; o; o = o.parent) if (o === group) return true; return false; };
    for (const p of this.parts) if (p.until == null && p.step < this.cur.index && inside(p.obj)) p.until = this.cur.index;
  }

  /** The sub-assembly `group` sits on the bench (offset / extra rotation) until the current step, where it is joined. */
  join(group, benchOffset = [0, 0, 0], benchRot = [0, 0, 0]) {
    const rec = {
      group, step: this.cur.index,
      final: group.position.clone(), finalQ: group.quaternion.clone(),
      benchPos: group.position.clone().add(new THREE.Vector3(...benchOffset)),
      benchQ: group.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...benchRot))),
    };
    group.userData.assembly = rec;
    this.assemblies.push(rec);
    this.cur.assemblies.push(rec);
    return rec;
  }

  /**
   * After building: merge each part's meshes per material (fewer draw calls), add panel-line edges,
   * and compute automatic fly-in directions (away from the owning sub-assembly's centre).
   */
  finalize(root, edgeMaterial) {
    root.updateMatrixWorld(true);
    const _b = new THREE.Box3();
    // centres of sub-assemblies (world)
    const centre = new Map();
    const centreOf = (g) => {
      if (!centre.has(g)) centre.set(g, new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()));
      return centre.get(g);
    };
    const ownerOf = (o) => {
      let p = o.parent;
      while (p && p !== root && !p.userData.assembly) p = p.parent;
      return p || root;
    };

    for (const rec of this.parts) {
      mergePart(rec.obj);
      // panel lines
      rec.obj.traverse((o) => {
        if (!o.isMesh || o.userData.noEdges || o.material.transparent || o.material.map) return;
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), edgeMaterial);
        e.raycast = () => {};
        o.add(e);
      });
      rec.obj.updateMatrixWorld(true);
      _b.setFromObject(rec.obj);
      const size = _b.getSize(new THREE.Vector3()).length();
      rec.size = size;
      if (!rec.from) {
        const c = _b.getCenter(new THREE.Vector3());
        const dir = c.sub(centreOf(ownerOf(rec.obj)));
        if (dir.length() < 3) dir.set(0, 0.35, 1);
        dir.normalize();
        dir.y += 0.25;
        // world direction -> parent space
        const inv = new THREE.Matrix4().copy(rec.obj.parent.matrixWorld).invert();
        const pd = dir.transformDirection(inv);
        rec.from = pd.multiplyScalar(rec.dist ?? 28 + Math.min(40, size * 0.5));
      }
    }
  }
}

/** Merge all plain meshes in a part group into one mesh per (material, noEdges). */
function mergePart(g) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const buckets = new Map();
  const keep = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.map || o.userData.keep) { keep.push(o); return; }
    const key = o.material.uuid + (o.userData.noEdges ? ':n' : '') + (o.castShadow ? ':s' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, noEdges: o.userData.noEdges, shadow: o.castShadow, geos: [] });
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    geo.applyMatrix4(m);
    // mirrored transforms flip the winding
    if (m.determinant() < 0) flipWinding(geo);
    buckets.get(key).geos.push(geo);
  });
  // detach kept meshes (with world transform relative to g), clear the rest
  const kept = keep.map((o) => {
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    return { o, m };
  });
  for (const c of [...g.children]) g.remove(c);
  for (const { mat, noEdges, shadow, geos } of buckets.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    mesh.userData.noEdges = noEdges;
    g.add(mesh);
  }
  for (const { o, m } of kept) {
    o.matrixAutoUpdate = true;
    m.decompose(o.position, o.quaternion, o.scale);
    g.add(o);
  }
}

function flipWinding(geo) {
  for (const name of ['position', 'normal']) {
    const a = geo.attributes[name];
    if (!a) continue;
    const arr = a.array, is = a.itemSize;
    for (let i = 0; i < a.count; i += 3) {
      for (let k = 0; k < is; k++) {
        const t = arr[(i + 1) * is + k];
        arr[(i + 1) * is + k] = arr[(i + 2) * is + k];
        arr[(i + 2) * is + k] = t;
      }
    }
  }
}
