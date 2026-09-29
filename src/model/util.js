// Small DSL shared by the region builders.
//
//   part(kit, 'D5', R.leg.L.hip, [
//     [sidePlate(outline, 3), [8, -26, 0]],               // [geometry, position?, rotation?, material?, scale?]
//     [cyl(1.5, 1.5, 6, 12, 'x'), [5, -20, 4], null, MAT.frameGray],
//   ], { from: [30, 0, 0] });
//
// The material defaults to the colour of the part's runner (see materials.partMat).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mk } from '../kit.js';
import { MAT, partMat } from '../materials.js';
import { plate, cyl, lathe, cbox } from '../geom.js';

const toMesh = (def) => (s) => {
  if (s.isObject3D) return s;
  const [geo, p, r, mat, sc] = s;
  return mk(geo, mat || def, p || [0, 0, 0], r || [0, 0, 0], sc);
};

/** Register one kit part built from shapes (see header). */
export function part(kit, id, parent, shapes, opts = {}) {
  const def = opts.mat || partMat(id);
  return kit.part(id, parent, shapes.map(toMesh(def)), opts);
}

/** Another piece of the previous part (e.g. the MSF insert frame spans hip, knee and ankle groups). */
export function segment(kit, id, parent, shapes, opts = {}) {
  return part(kit, id, parent, shapes, { ...opts, segment: true });
}

const stickerMats = new Map();
/** Sticker material from a colour ('#ffcc00') or a MAT key ('etching'). */
export function stickerMat(c) {
  if (c && c.isMaterial) return c;
  if (MAT[c]) return MAT[c];
  if (!stickerMats.has(c)) {
    stickerMats.set(c, new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.35, metalness: 0, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2,
    }));
  }
  return stickerMats.get(c);
}

/**
 * Sticker / decal: a 0.15 mm thin plate. `shape` is a 2D outline in the sticker plane (default w×h rectangle),
 * placed at p with rotation r (plane faces +z before rotation).
 */
export function sticker(kit, id, parent, { w = 4, h = 4, shape, p = [0, 0, 0], r = [0, 0, 0], color = '#d8dadd', extra = [] }, opts = {}) {
  const outline = shape || [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const g = plate(outline, 0.15, 0);
  const m = mk(g, stickerMat(color), p, r);
  m.castShadow = false;
  m.userData.noEdges = true;
  const extras = extra.map(([geo, pp, rr, c]) => {
    const e = mk(geo, stickerMat(c), pp, rr);
    e.castShadow = false; e.userData.noEdges = true;
    return e;
  });
  return kit.part(id, parent, [m, ...extras], { kind: 'sticker', dist: 22, ...opts });
}

// ───────────────────────── part-shape helpers ─────────────────────────

/** Plate whose outline is given in (z, y) and whose thickness runs along x (a side panel). */
export function sidePlate(outlineZY, t, bevel = 0.5) {
  const g = plate(outlineZY, t, Math.min(bevel, t / 3));
  g.rotateY(-Math.PI / 2);
  return g;
}

/** Plate whose outline is given in (x, z) and whose thickness runs along y (a floor / sole plate). */
export function flatPlate(outlineXZ, t, bevel = 0.5) {
  const g = plate(outlineXZ.map(([x, z]) => [x, -z]), t, Math.min(bevel, t / 3));
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Front plate: outline in (x, y), thickness along z. */
export const frontPlate = (outlineXY, t, bevel = 0.5) => plate(outlineXY, t, Math.min(bevel, t / 3));

/** Round cap with concentric rings (gold knee / ankle caps etc.). Axis 'x' | 'y' | 'z', faces +axis. */
export function capDisc(r, t, axis = 'x', seg = 28) {
  return lathe([
    [0.01, 0], [r, 0], [r, t * 0.7], [r * 0.82, t], [r * 0.7, t], [r * 0.62, t * 0.75],
    [r * 0.45, t * 0.75], [r * 0.4, t * 1.05], [0.01, t * 1.05],
  ], seg, axis);
}

/** Tube / ring: outer radius ro, inner ri, length l, centred, along axis. */
export function tube(ro, ri, l, axis = 'y', seg = 24) {
  return lathe([[ri, -l / 2], [ro, -l / 2], [ro, l / 2], [ri, l / 2], [ri, -l / 2]], seg, axis);
}

/** Cylinder with n circumferential ribs (ribbed stubs, pistons). */
export function ribbed(r, l, n = 4, axis = 'y', seg = 20) {
  const prof = [[0.01, -l / 2]];
  for (let i = 0; i < n; i++) {
    const y0 = -l / 2 + (i / n) * l, y1 = -l / 2 + ((i + 1) / n) * l;
    prof.push([r * 0.86, y0], [r, y0 + (y1 - y0) * 0.2], [r, y1 - (y1 - y0) * 0.2], [r * 0.86, y1]);
  }
  prof.push([0.01, l / 2]);
  return lathe(prof, seg, axis);
}

/** Louvre: n slats across w×h (in xy), each tilted, depth d along z. */
export function slats(w, h, d, n = 4, tilt = 0.5) {
  const gs = [];
  const step = h / n;
  for (let i = 0; i < n; i++) {
    const g = new THREE.BoxGeometry(w, Math.max(0.35, step * 0.35), d);
    g.rotateX(tilt);
    g.translate(0, -h / 2 + step * (i + 0.5), 0);
    gs.push(g);
  }
  return mergeGeometries(gs.map((g) => g.toNonIndexed()));
}

/** Frame border (w×h outer, b border) in xy, thickness t: a rectangle ring. */
export function frame2d(w, h, b, t) {
  const s = new THREE.Shape([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => new THREE.Vector2(x, y)));
  const hole = new THREE.Path([[-w / 2 + b, -h / 2 + b], [w / 2 - b, -h / 2 + b], [w / 2 - b, h / 2 - b], [-w / 2 + b, h / 2 - b]].map(([x, y]) => new THREE.Vector2(x, y)));
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  return g;
}

/** Merge several [geometry, {p, r, s}] into one geometry (a single kit part made of several volumes). */
export function merge(...items) {
  const gs = items.map((it) => {
    const [g, o = {}] = Array.isArray(it) ? it : [it];
    const c = (g.index ? g.toNonIndexed() : g.clone());
    for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k);
    if (!c.attributes.normal) c.computeVertexNormals();
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...(o.p || [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, 0]))),
      new THREE.Vector3(...(o.s || [1, 1, 1])),
    );
    c.applyMatrix4(m);
    return c;
  });
  return mergeGeometries(gs);
}

/** Small raised rectangular detail (panel / boss) helper: returns a chamfered box geometry. */
export const nub = (w, h, d, c = 0.3) => cbox(w, h, d, c);
export const pin = (r, l, axis = 'x') => cyl(r, r, l, 12, axis);
