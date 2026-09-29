// Hard-surface geometry helpers. All units are millimetres at 1/60 kit scale.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Rectangle (w along x, d along z) at height y with chamfered corners -> 4 or 8 points.
function ring(pts, { y, w, d, c = 0, x = 0, z = 0 }) {
  const hw = w / 2, hd = d / 2;
  c = Math.min(c, hw * 0.98, hd * 0.98);
  if (c <= 0.01) {
    pts.push(V(x - hw, y, z - hd), V(x + hw, y, z - hd), V(x + hw, y, z + hd), V(x - hw, y, z + hd));
    return;
  }
  pts.push(
    V(x - hw + c, y, z - hd), V(x + hw - c, y, z - hd), V(x + hw, y, z - hd + c), V(x + hw, y, z + hd - c),
    V(x + hw - c, y, z + hd), V(x - hw + c, y, z + hd), V(x - hw, y, z + hd - c), V(x - hw, y, z - hd + c),
  );
}

/** Convex loft through a stack of chamfered rectangles: [{y,w,d,c,x,z}, ...]. */
export function loft(sections) {
  const pts = [];
  for (const s of sections) ring(pts, s);
  return new ConvexGeometry(pts);
}

/** Convex hull of arbitrary [x,y,z] points. */
export function hull(points) {
  return new ConvexGeometry(points.map((p) => V(p[0], p[1], p[2])));
}

/** Box with every edge chamfered by c, centred at origin. */
export function cbox(w, h, d, c = 1) {
  c = Math.min(c, w / 2.1, h / 2.1, d / 2.1);
  return loft([
    { y: -h / 2, w: w - 2 * c, d: d - 2 * c, c: c * 0.6 },
    { y: -h / 2 + c, w, d, c },
    { y: h / 2 - c, w, d, c },
    { y: h / 2, w: w - 2 * c, d: d - 2 * c, c: c * 0.6 },
  ]);
}

/**
 * Tapered chamfered block: bottom rect (w1,d1) at y=-h/2, top rect (w2,d2) at +h/2.
 * opts: c chamfer, dz/dx shift of the top face, cb/ct bevel of the caps.
 */
export function tbox(w1, d1, w2, d2, h, { c = 1.5, dx = 0, dz = 0, cb = c, ct = c } = {}) {
  const s = [];
  s.push({ y: -h / 2, w: w1 - 2 * cb, d: d1 - 2 * cb, c: c * 0.6 });
  s.push({ y: -h / 2 + cb, w: w1, d: d1, c });
  s.push({ y: h / 2 - ct, w: w2, d: d2, c, x: dx, z: dz });
  s.push({ y: h / 2, w: w2 - 2 * ct, d: d2 - 2 * ct, c: c * 0.6, x: dx, z: dz });
  return loft(s);
}

/** Extruded 2D outline (in XY), thickness along Z, centred on z=0, with chamfer bevel. */
export function plate(outline, depth, bevel = 0.6) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 6,
  });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  return g;
}

/** Cylinder along an axis ('x' | 'y' | 'z'). */
export function cyl(r1, r2, h, seg = 24, axis = 'y') {
  const g = new THREE.CylinderGeometry(r2, r1, h, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

/** Lathe from [[r, y], ...] profile around Y (or rotated to axis). */
export function lathe(profile, seg = 28, axis = 'y') {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

export function sphere(r, seg = 20) {
  return new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7));
}

export function torus(r, t, seg = 28, axis = 'y') {
  const g = new THREE.TorusGeometry(r, t, 8, seg);
  if (axis === 'y') g.rotateX(Math.PI / 2);
  if (axis === 'x') g.rotateY(Math.PI / 2);
  return g;
}

/**
 * Truss lattice plate: w x h in the XY plane, thickness t along Z.
 * The inside is cut into cells, each with X-bracing, like the PG Unleashed truss frame.
 */
export function lattice(w, h, t = 1, cols = 2, rows = 2, rim = 1.4, web = 0.9) {
  const hw = w / 2, hh = h / 2;
  const shape = new THREE.Shape();
  const c = Math.min(1.2, rim);
  shape.moveTo(-hw + c, -hh); shape.lineTo(hw - c, -hh); shape.lineTo(hw, -hh + c);
  shape.lineTo(hw, hh - c); shape.lineTo(hw - c, hh); shape.lineTo(-hw + c, hh);
  shape.lineTo(-hw, hh - c); shape.lineTo(-hw, -hh + c); shape.closePath();
  const iw = w - 2 * rim, ih = h - 2 * rim;
  const cw = (iw - (cols - 1) * web) / cols, ch = (ih - (rows - 1) * web) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = -hw + rim + i * (cw + web), y0 = -hh + rim + j * (ch + web);
      const x1 = x0 + cw, y1 = y0 + ch, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const k = web * 0.7;
      if (cw > 5 && ch > 5 && (i + j) % 2 === 0) {
        // X-braced cell: four triangles
        const tri = (a, b, cc) => { const p = new THREE.Path(); p.moveTo(...a); p.lineTo(...b); p.lineTo(...cc); p.closePath(); shape.holes.push(p); };
        tri([x0 + k * 1.6, y0], [x1 - k * 1.6, y0], [cx, cy - k]);
        tri([x1, y0 + k * 1.6], [x1, y1 - k * 1.6], [cx + k, cy]);
        tri([x1 - k * 1.6, y1], [x0 + k * 1.6, y1], [cx, cy + k]);
        tri([x0, y1 - k * 1.6], [x0, y0 + k * 1.6], [cx - k, cy]);
      } else if (cw > 1.5 && ch > 1.5) {
        const p = new THREE.Path();
        const m = Math.min(1, cw * 0.2, ch * 0.2);
        p.moveTo(x0 + m, y0); p.lineTo(x1 - m, y0); p.lineTo(x1, y0 + m); p.lineTo(x1, y1 - m);
        p.lineTo(x1 - m, y1); p.lineTo(x0 + m, y1); p.lineTo(x0, y1 - m); p.lineTo(x0, y0 + m); p.closePath();
        shape.holes.push(p);
      }
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  return g;
}

/** Frame "ring": rectangular outline with a rectangular hole (w,h outer, border b), thickness t. */
export function rimPlate(w, h, b, t, c = 1) {
  const hw = w / 2, hh = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw + c, -hh); s.lineTo(hw - c, -hh); s.lineTo(hw, -hh + c); s.lineTo(hw, hh - c);
  s.lineTo(hw - c, hh); s.lineTo(-hw + c, hh); s.lineTo(-hw, hh - c); s.lineTo(-hw, -hh + c); s.closePath();
  const p = new THREE.Path();
  const iw = hw - b, ih = hh - b;
  p.moveTo(-iw, -ih); p.lineTo(iw, -ih); p.lineTo(iw, ih); p.lineTo(-iw, ih); p.closePath();
  s.holes.push(p);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  return g;
}

/** Apply a transform to a geometry in place and return it. */
export function xf(g, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const m = new THREE.Matrix4().compose(
    V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), V(...s),
  );
  g.applyMatrix4(m);
  if (s[0] * s[1] * s[2] < 0) flipWinding(g);
  return g;
}

function flipWinding(g) {
  if (g.index) {
    const a = g.index.array;
    for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
  } else {
    for (const name of Object.keys(g.attributes)) {
      const at = g.attributes[name]; const n = at.itemSize; const arr = at.array;
      for (let i = 0; i < at.count; i += 3) {
        for (let k = 0; k < n; k++) {
          const t = arr[(i + 1) * n + k]; arr[(i + 1) * n + k] = arr[(i + 2) * n + k]; arr[(i + 2) * n + k] = t;
        }
      }
    }
  }
  g.computeVertexNormals();
}

// ───────────── CSG (three-bvh-csg) ─────────────
import { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg';

// three-bvh-csg still passes a deprecated BVH option; silence that one message
const _warn = console.warn;
console.warn = (...a) => { if (typeof a[0] === 'string' && a[0].includes('maxLeafSize')) return; _warn(...a); };
const evaluator = new Evaluator();
evaluator.attributes = ['position', 'normal'];
evaluator.useGroups = false;
const _csgMat = new THREE.MeshBasicMaterial();

function brush(g, t) {
  let geo = g.index ? g : g; // three-bvh-csg handles both
  geo = geo.clone();
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (t) xf(geo, t);
  const b = new Brush(geo, _csgMat);
  b.updateMatrixWorld();
  return b;
}

/** Normalises [geo | [geo, {p,r,s}]] */
function asBrush(x) { return Array.isArray(x) ? brush(x[0], x[1]) : brush(x); }

function run(a, list, op) {
  let res = asBrush(a);
  for (const b of list) res = evaluator.evaluate(res, asBrush(b), op);
  const g = res.geometry;
  g.clearGroups();
  return g;
}

/** a − b − c …  (each operand: geometry or [geometry, {p, r, s}]) */
export const sub = (a, ...b) => run(a, b, SUBTRACTION);
/** a ∪ b ∪ … */
export const add = (a, ...b) => run(a, b, ADDITION);
/** a ∩ b ∩ … */
export const isect = (a, ...b) => run(a, b, INTERSECTION);

/**
 * Keep the part of `g` on the positive side of a plane through `point` with normal `n`
 * (used to split one volume into the kit's real armor parts).
 */
export function clip(g, n, point = [0, 0, 0], size = 400) {
  const N = new THREE.Vector3(...n).normalize();
  const box = new THREE.BoxGeometry(size, size, size);
  box.translate(0, 0, size / 2);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), N);
  box.applyQuaternion(q);
  box.translate(...point);
  return isect(g, box);
}

/**
 * Hollow shell from a convex loft: outer sections, inner = same sections shrunk by `t` (walls),
 * optionally open at the ends (openTop / openBottom) or on one face (open: '+z' | '-z' | '+x' | '-x').
 */
export function shellLoft(sections, t = 1.2, { openTop = true, openBottom = true, open = null } = {}) {
  const outer = loft(sections);
  const inner = sections.map((s) => ({ ...s, w: s.w - 2 * t, d: s.d - 2 * t, c: Math.max(0, (s.c || 0) - t * 0.5) }));
  const ext = 50;
  if (openTop) inner.push({ ...inner[inner.length - 1], y: inner[inner.length - 1].y + ext });
  if (openBottom) inner.unshift({ ...inner[0], y: inner[0].y - ext });
  if (!openTop) inner[inner.length - 1].y -= t;
  if (!openBottom) inner[0].y += t;
  const innerG = loft(inner);
  if (open) {
    const ax = open[1], sg = open[0] === '+' ? 1 : -1;
    const shifted = innerG.clone();
    shifted.translate(ax === 'x' ? sg * 40 : 0, 0, ax === 'z' ? sg * 40 : 0);
    return sub(outer, add(innerG, shifted));
  }
  return sub(outer, innerG);
}
