// HEAD. Manual p.32 (PHASE 01▶02 HEAD-FRAME), p.39 (PHASE 03 HEAD-TRUSS-FRAME), p.51 (PHASE 04 HEAD-ARMOR),
// hatch gimmick p.62 (HEAD HATCH OPEN).
// Head space (R.head, already scaled 0.88 in the chest): neck joint at the origin, face towards +z,
// +x = the model's LEFT. Helmet dome y 18..34.5, V-fin tips ≈ y 40, faceplate front z ≈ 16.5.
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp } from '../kit.js';
import { cbox, tbox, cyl, hull, lathe, sub } from '../geom.js';
import { part, sticker, sidePlate, frontPlate, tube, ribbed, merge, nub } from './util.js';
import { BENCH } from './rig.js';

const PI = Math.PI;

// Machined brass vulcans (METAL-VULCAN-PART). MAT.metalPart is the grey vernier metal, the vulcans are brass.
const BRASS = new THREE.MeshPhysicalMaterial({ color: '#b8913a', metalness: 1, roughness: 0.3, clearcoat: 0.3 });

// ───────────────────────── local convex helpers ─────────────────────────

/** Points of a chamfered rectangle ring (same as geom.loft's sections). */
function ringPts({ y, w, d, c = 0, x = 0, z = 0 }) {
  const hw = w / 2, hd = d / 2;
  c = Math.min(c, hw * 0.98, hd * 0.98);
  return [
    [x - hw + c, y, z - hd], [x + hw - c, y, z - hd], [x + hw, y, z - hd + c], [x + hw, y, z + hd - c],
    [x + hw - c, y, z + hd], [x - hw + c, y, z + hd], [x - hw, y, z + hd - c], [x - hw, y, z - hd + c],
  ];
}

/** Exact clip of the convex hull of `pts` by half-spaces [[nx,ny,nz], d] (keeps n·p >= d); returns points. */
function clipPts(pts, planes) {
  let P = pts;
  for (const [n, d] of planes) {
    const g = hull(P);
    const a = g.attributes.position;
    const f = (p) => n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - d;
    const seen = new Map();
    const push = (p) => {
      const k = p.map((v) => v.toFixed(3)).join(',');
      if (!seen.has(k)) seen.set(k, p);
    };
    for (let i = 0; i < a.count; i += 3) {
      const tri = [0, 1, 2].map((k) => [a.getX(i + k), a.getY(i + k), a.getZ(i + k)]);
      for (let k = 0; k < 3; k++) {
        const p = tri[k], q = tri[(k + 1) % 3];
        const fp = f(p), fq = f(q);
        if (fp >= -1e-6) push(p);
        if ((fp > 1e-6 && fq < -1e-6) || (fp < -1e-6 && fq > 1e-6)) {
          const t = fp / (fp - fq);
          push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
        }
      }
    }
    P = [...seen.values()];
  }
  return P;
}
const clipHull = (pts, planes) => hull(clipPts(pts, planes));
const mirrorX = (pts, sx) => pts.map(([x, y, z]) => [x * sx, y, z]);

// Verified exterior envelope (old model): helmet dome, brow, faceplate, chin.
const DOME = [
  { y: 18, w: 33, d: 33, z: -1.5, c: 9 },
  { y: 27, w: 31, d: 31, z: -2, c: 10 },
  { y: 32, w: 23, d: 25, z: -3, c: 8 },
  { y: 34.5, w: 12, d: 16, z: -4, c: 4 },
];
const DOME_PTS = DOME.flatMap(ringPts);
const BROW_PTS = [
  [-14, 20, 9], [14, 20, 9], [-13, 21, 15.8], [13, 21, 15.8],
  [-13, 26, 9], [13, 26, 9], [-10, 25, 14.5], [10, 25, 14.5],
];
const EYE = [[1.2, -2.2], [8.6, -1.4], [9.6, 1.8], [1.8, 1.9]];          // left eye outline (x, y) around y 17.5
const eyeOutline = (sx, k = 1) => {
  const o = EYE.map(([x, y]) => [x * sx * k + (1 - k) * 5.4 * sx, y * k]);
  return sx < 0 ? o.reverse() : o;
};

// ───────────────────────── PHASE 01 ▶ 02 · HEAD-FRAME (p.32) ─────────────────────────

export function headFrame(kit, R) {
  const H = R.head;
  kit.section('HEAD-FRAME', { pp: 32 });
  kit.block('HEAD-FRAME ASSEMBLE', { pp: 32 });

  // 1 ── G1② crown half + P2① light guide
  kit.step('Crown frame and eye light guide', {
    pp: 32, view: 'frontL', focus: H, minDist: 70,
    desc: 'Insert the clear light guide P2① into the crown frame half G1②. The guide carries the LED light up to both eyes.',
    caution: 'Remove all the P2 parts from the runner. Mind the FRONT mark.',
  });
  part(kit, 'G1-2', H, crownHalf(1), { from: [30, 6, 0] });
  const lg = merge(
    [cbox(1.6, 7, 1.6, 0.3), { p: [0, 11.5, 2] }],
    [cbox(1.6, 1.6, 8.5, 0.3), { p: [0, 15, 6] }],
    [cbox(12, 1.4, 1.4, 0.3), { p: [0, 16.2, 10.2] }],
  );
  part(kit, 'P2-1', H, [
    [lg],
    [frontPlate(eyeOutline(1), 1.6, 0.3), [0, 17.5, 13.3], null, MAT.eye],
    [frontPlate(eyeOutline(-1), 1.6, 0.3), [0, 17.5, 13.3], null, MAT.eye],
  ], { from: [0, 4, 30] });

  // 2 ── eye bar G1⑤ + cap G1⑥, eye stickers A-1 / A-2, close with G1③
  kit.step('Twin-eye bar and eye stickers', {
    pp: 32, view: 'front', focus: H, minDist: 70,
    desc: 'Press the cap G1⑥ onto the W-shaped eye bar G1⑤ (Short / Long ends), apply the eye stickers A-1 / A-2 (or the Metallic 3D eye seals ①/②), set the bar in G1② and close the frame with G1③.',
    caution: 'Apply the stickers before assembling. Do not apply the eye stickers when you light the LED. Do not cut the tab on G1⑥.',
  });
  part(kit, 'G1-5', H, [
    [frontPlate([[-11, -3], [-3, -3], [0, -1.4], [3, -3], [11, -3], [11, 3], [3, 3], [0, 1.6], [-3, 3], [-11, 3]], 2.5, 0.4), [0, 17.5, 11.2]],
    [cbox(1.6, 4, 5, 0.4), [10.2, 17.5, 7.5]],   // long end
    [cbox(1.6, 4, 3, 0.4), [-10.2, 17.5, 8.5]],  // short end
    [nub(3, 1.4, 1.6), [0, 20.6, 10.6]],
  ], { from: [0, 0, 32] });
  part(kit, 'G1-6', H, [
    [cbox(8, 2, 3, 0.5), [0, 21.4, 10.4]],
    [cbox(5, 1.4, 2, 0.4), [0, 22.9, 10.2]],
    [cbox(1.2, 1.2, 2.4, 0.2), [0, 23.8, 11.2]],       // the "do not cut" tab
  ], { from: [0, 24, 10] });
  sticker(kit, 'StickerA-1', H, { shape: eyeOutline(-1, 0.9), p: [0, 17.5, 14.2], color: MAT.eye });
  sticker(kit, 'StickerA-2', H, { shape: eyeOutline(1, 0.9), p: [0, 17.5, 14.2], color: MAT.eye });
  part(kit, 'G1-3', H, crownHalf(-1), { from: [-30, 6, 0] });

  // 3 ── side brackets
  kit.step('Crown side brackets', {
    pp: 32, view: 'backL', focus: H, minDist: 70,
    desc: 'Clip the side brackets G1① (right) and G1④ (left) onto the crown frame.',
  });
  part(kit, 'G1-1', H, sideBracket(-1), { from: [-26, 6, -6] });
  part(kit, 'G1-4', H, sideBracket(1), { from: [26, 6, -6] });

  // 4 ── G1⑦ face unit + metal vulcans (built on the bench, joined in panel 6)
  const fu = grp();
  fu.name = 'head-face-unit';
  H.add(fu);
  kit.step('Face unit and metal vulcans', {
    pp: 32, view: 'frontR', focus: fu, minDist: 60,
    desc: 'Push the two machined METAL VULCAN PARTS into the C-shaped sockets at the top corners of the face unit G1⑦.',
    caution: 'Attach the metal parts slowly and carefully.',
  });
  part(kit, 'G1-7', fu, [
    [cbox(18, 2, 11, 0.6), [0, 4, 4]],                               // floor
    [cbox(2, 19, 10.5, 0.6), [9.5, 13.5, 4.2]],                      // side walls
    [cbox(2, 19, 10.5, 0.6), [-9.5, 13.5, 4.2]],
    [cbox(1, 4, 4, 0.3), [10.5, 8, 4]],                               // W17 / W18 slots
    [cbox(1, 4, 4, 0.3), [-10.5, 8, 4]],
    [cbox(3.4, 3, 5, 0.6), [11, 24.2, 7.2]],                          // socket arms
    [cbox(3.4, 3, 5, 0.6), [-11, 24.2, 7.2]],
    [tube(2.2, 1.5, 3.5, 'z', 16), [12.2, 25.5, 9]],                  // C sockets
    [tube(2.2, 1.5, 3.5, 'z', 16), [-12.2, 25.5, 9]],
    [cbox(20, 1.8, 2.4, 0.4), [0, 14.2, 12.8]],                      // front lip under the eyes (A-3 / A-4)
    [cbox(1.6, 1.8, 3.8, 0.3), [9.4, 14.2, 10.8]],
    [cbox(1.6, 1.8, 3.8, 0.3), [-9.4, 14.2, 10.8]],
  ], { from: [0, 0, 26] });
  for (const sx of [1, -1]) {
    part(kit, 'METAL-VULCAN-PART', fu, [
      [lathe([[0.01, 0], [1.5, 0], [1.5, 6.4], [1.75, 6.6], [1.75, 8.4], [0.9, 8.4], [0.9, 7.6], [0.01, 7.6]], 18, 'z'), [sx * 12.2, 25.5, 6]],
      [cyl(0.8, 0.8, 0.3, 12, 'z'), [sx * 12.2, 25.5, 14.2], null, MAT.black],
    ], { from: [sx * 4, 6, 26], mat: BRASS });
  }

  // 5 ── chrome strips W17 / W18
  kit.step('Chrome strips', {
    pp: 32, view: 'right', focus: fu, minDist: 60,
    desc: 'Insert the chrome parts W17 (left) and W18 (right) into the lower side slots of G1⑦.',
  });
  part(kit, 'W17', fu, [[ribbed(0.9, 7, 5, 'z', 12), [11.2, 8, 4]]], { from: [22, 0, 0] });
  part(kit, 'W18', fu, [[ribbed(0.9, 7, 5, 'z', 12), [-11.2, 8, 4]]], { from: [-22, 0, 0] });

  // 6 ── neck socket X2②, sticker B-71, join the face unit
  kit.step('Neck socket and face unit', {
    pp: 32, view: 'backR', focus: H, minDist: 75,
    desc: 'Fit the neck socket X2② into the bottom of the crown frame (mind its orientation), apply sticker B-71 below the crest rib at the back, then slide the G1⑦ face unit onto the frame.',
    caution: 'Mind the orientation of X2② (!).',
  });
  part(kit, 'X2-2', H, [
    [tube(3.3, 2.2, 3, 'y', 18), [0, 2.4, -2]],
    [cbox(8, 1.2, 8, 0.4), [0, 4.3, -2]],
    [cbox(2, 1.6, 2.4, 0.3), [0, 4.3, 2.8]],          // orientation key
  ], { from: [0, -24, 0] });
  sticker(kit, 'StickerB-71', H, { w: 4, h: 3, p: [0, 26, -9.8], r: [0.2, PI, 0], color: '#c8ccd0' });
  kit.join(fu, [0, -4, 30]);

  // 7 ── chin / mouth mount G1⑧ + G1⑨
  kit.step('Chin mount', {
    pp: 32, view: 'frontR', focus: H, minDist: 70,
    desc: 'Clip G1⑨ onto G1⑧, then push the assembly onto the vertical peg at the front centre, below the eyes. It carries the faceplate later.',
    caution: 'All G1 parts are now used.',
  });
  part(kit, 'G1-8', H, [
    [sub(cbox(7, 4, 4, 0.6), [cbox(2.4, 2.4, 6, 0.1), { p: [0, -1.6, 0], r: [0, 0, PI / 4] }]), [0, 7, 9]],
    [cyl(1.1, 1.1, 3.4, 12, 'z'), [0, 7.4, 12.4]],
  ], { from: [0, -6, 24] });
  part(kit, 'G1-9', H, [
    [cbox(4, 1.4, 3, 0.4), [0, 9.7, 9.3]],
    [cbox(1.2, 2, 1, 0.3), [0, 10.4, 11]],
  ], { from: [0, 18, 10] });

  // 8 ── under-eye stickers, head onto the neck
  kit.step('Mount the head on the neck', {
    pp: 32, view: 'frontL', focus: R.chest, minDist: 120,
    desc: 'Apply the red sensor stickers A-3 / A-4 under the eyes, then push the head straight down onto the neck ball. Check that the head turns and nods (photo 9).',
    caution: 'Do not apply stickers A-3 / A-4 when you light the LED.',
  });
  sticker(kit, 'StickerA-3', H, { w: 6.4, h: 1.3, shape: [[-3.4, -0.6], [3.4, -0.6], [3.2, 0.7], [-3.0, 0.7]], p: [-5.4, 14.2, 14.05], color: '#d23a33' });
  sticker(kit, 'StickerA-4', H, { w: 6.4, h: 1.3, shape: [[-3.4, -0.6], [3.4, -0.6], [3.0, 0.7], [-3.2, 0.7]], p: [5.4, 14.2, 14.05], color: '#d23a33' });
  kit.join(H, BENCH.head);
}

/** Crown frame half (G1② = +x, G1③ = -x): thick side plate with ribs, crest rib, slots. */
function crownHalf(sx) {
  const prof = [[-8, 2], [3, 2], [5, 5], [5, 13], [8, 14], [8, 21], [5, 28], [-1, 31.5], [-7, 30.5], [-9.5, 26], [-9.5, 8]];
  const shapes = [
    [sidePlate(prof, 4.4, 0.5), [sx * 2.3, 0, 0]],
    [sidePlate([[-7, 9], [2, 9], [4, 13], [4, 22], [1, 27], [-6, 27], [-8, 22], [-8, 13]], 1.8, 0.4), [sx * 5.4, 0, 0]],
    [cbox(1.2, 2, 22, 0.3), [sx * 0.7, 31.8, -2.5], [0.12, 0, 0]],          // crest rib
    [nub(1, 8, 2.4), [sx * 6.5, 18, -2], null, MAT.frameDark],              // slot
    [nub(1, 2.4, 6), [sx * 6.5, 12, -2], null, MAT.frameDark],
  ];
  if (sx < 0) shapes.push([cyl(2.4, 2.4, 1.6, 16, 'x'), [-7, 18, -4]]);   // round boss on G1③
  else shapes.push([nub(1.4, 3, 3), [7, 23, -1]]);
  return shapes;
}

/** Side bracket with a C-clip (G1① right, G1④ left). */
function sideBracket(sx) {
  return [
    [cbox(3.4, 8, 6, 0.6), [sx * 7.9, 23.5, -5]],
    [tube(2.4, 1.5, 3, 'x', 16), [sx * 10.6, 26, -5]],
    [cbox(2.4, 3, 2, 0.4), [sx * 10.2, 20.5, -5]],
  ];
}

// ───────────────────────── PHASE 03 · HEAD-TRUSS-FRAME (p.39) ─────────────────────────

export function headTruss(kit, R) {
  const H = R.head;
  kit.section('HEAD-TRUSS-FRAME', { pp: 39 });
  kit.block('HEAD TRUSS-FRAME', { pp: 39 });

  kit.step('Head truss: top and front brackets', {
    pp: 39, view: 'frontL', focus: H, minDist: 70,
    desc: 'Mount the L-bracket S2⑩ on top of the head frame and the curved brackets S2⑪ (left) and S2⑨ (right) on the pegs at the upper front corners.',
    caution: 'All S2 parts are UNDER GATE parts.',
  });
  part(kit, 'S2-10', H, [
    [merge(
      [cbox(7, 1.3, 8.5, 0.4), { p: [0, 32.3, -3] }],
      [cbox(7, 4.5, 1.3, 0.4), { p: [0, 30.4, -7.2] }],
      [cbox(1.4, 1.4, 7, 0.3), { p: [2.6, 33.1, -3] }],
      [cbox(1.4, 1.4, 7, 0.3), { p: [-2.6, 33.1, -3] }],
    )],
  ], { from: [0, 26, 0] });
  const arc = [[0, -4], [2, -4], [5.2, -1.2], [6.4, 3], [4.6, 3], [3.6, -0.2], [1, -2.2], [0, -2.2]];
  part(kit, 'S2-11', H, [
    [sidePlate(arc, 1.4, 0.3), [7.1, 25, 3.5]],
    [cyl(0.9, 0.9, 2.4, 12, 'x'), [6.2, 21.9, 4.5]],
  ], { from: [22, 8, 8] });
  part(kit, 'S2-9', H, [
    [sidePlate(arc, 1.4, 0.3), [-7.1, 25, 3.5]],
    [cyl(0.9, 0.9, 2.4, 12, 'x'), [-6.2, 21.9, 4.5]],
  ], { from: [-22, 8, 8] });

  kit.step('Head truss: side plates', {
    pp: 39, view: 'left', focus: H, minDist: 70,
    desc: 'Fit the side plates S2⑦ (left) and S2⑧ (right) with their two round holes onto the sides of the head frame.',
    caution: 'All S2 parts are now used.',
  });
  for (const [id, sx] of [['S2-7', 1], ['S2-8', -1]]) {
    const holes = sub(
      sidePlate([[-9, 5], [-1, 5], [0.4, 7], [0.4, 19], [-2, 21], [-9, 21]], 1.4, 0.3),
      [cyl(1.7, 1.7, 4, 16, 'x'), { p: [0, 9.5, -5] }],
      [cyl(1.7, 1.7, 4, 16, 'x'), { p: [0, 16.5, -5] }],
    );
    part(kit, id, H, [
      [holes, [sx * 7.3, 0, 0]],
      [nub(1, 1.4, 6, 0.2), [sx * 7.9, 13, -4.5]],
    ], { from: [sx * 24, 0, 0] });
  }
}

// ───────────────────────── PHASE 04 · HEAD-ARMOR (p.51) ─────────────────────────

export function headArmor(kit, R) {
  const H = R.head;
  kit.section('HEAD-ARMOR', { pp: 51 });
  kit.block('HEAD ARMOR', { pp: 51 });

  // 4 ── faceplate K1① on the red chin N3④
  kit.step('Faceplate and chin', {
    pp: 51, view: 'frontR', focus: H, minDist: 70,
    desc: 'Set the faceplate K1① (mouth slits) onto the red chin N3④, then push the pair onto the lower front peg of the head frame.',
  });
  part(kit, 'K1-1', H, [
    [hull([
      [-10.5, 13.2, 13], [10.5, 13.2, 13], [-9, 13.2, 15.5], [9, 13.2, 15.5],
      [-8.5, 4, 13], [8.5, 4, 13], [-5, 4, 16.5], [5, 4, 16.5],
      [-10, 12, 6], [10, 12, 6], [-8, 4, 6], [8, 4, 6],
    ])],
    [cbox(1.2, 5, 1, 0.2), [2, 8.5, 16.1], [-0.18, 0, 0], MAT.black],
    [cbox(1.2, 5, 1, 0.2), [-2, 8.5, 16.1], [-0.18, 0, 0], MAT.black],
    [cbox(1.5, 5, 1, 0.2), [6, 9, 14.8], [-0.18, 0.4, 0], MAT.black],
    [cbox(1.5, 5, 1, 0.2), [-6, 9, 14.8], [-0.18, -0.4, 0], MAT.black],
  ], { mat: MAT.whiteGray, from: [0, -4, 30] });
  part(kit, 'N3-4', H, [
    [hull([
      [-6, 4.5, 16.4], [6, 4.5, 16.4], [-4, 0, 15], [4, 0, 15], [0, -1.6, 15.8],
      [-7, 4.5, 8], [7, 4.5, 8], [-5, -0.5, 8], [5, -0.5, 8],
    ])],
  ], { from: [0, -10, 30] });

  // 5 ── top arch K1⑤, side shells K1④ / K1②
  kit.step('Helmet top and side shells', {
    pp: 51, view: 'frontL', focus: H, minDist: 80,
    desc: 'Fit the top arch K1⑤ over the crown, then the left side shell K1④ (with the ear and the vulcan port) and the right side shell K1②.',
    caution: 'K1② is an UNDER GATE part.',
  });
  part(kit, 'K1-5', H, [
    [clipHull(DOME_PTS, [[[1, 0, 0], -3.5], [[-1, 0, 0], -3.5], [[0, 1, 0], 26], [[0, 0, 1], -6]])],
    [tbox(7, 15, 5, 13, 5, { c: 1.4 }), [0, 33, 1.5]],
  ], { from: [0, 28, 6] });
  part(kit, 'K1-4', H, sideShell(1), { from: [30, 4, 0] });
  part(kit, 'K1-2', H, sideShell(-1), { from: [-30, 4, 0] });

  // 6 ── cheek plates M1④ / M1② (hatch: swing outwards)
  kit.step('Cheek vent plates', {
    pp: 51, view: 'front', focus: H, minDist: 70,
    desc: 'Push the small vented plates M1④ (left) and M1② (right) with their round pegs into the sockets either side of the face.',
    caution: 'Mind the orientation (!).',
  });
  for (const [id, sx] of [['M1-4', 1], ['M1-2', -1]]) {
    const pos = [sx * 12.9, 9, 11.4], rot = [0.1, sx * 0.55, 0];
    const slits = merge(...[0, 1, 2, 3, 4].map((i) => [cbox(3, 0.75, 0.6, 0.1), { p: [0, -4.2 + i * 2.1, 0.75] }]));
    part(kit, id, H, [
      [frontPlate([[-2.2, -6], [2.2, -6], [2.2, 5], [1, 6.5], [-2.2, 6.5]], 1.6, 0.35), pos, rot],
      [slits, pos, rot, MAT.black],
      [cyl(0.9, 0.9, 2.5, 12, 'z'), [sx * 12.1, 9, 9.8], [0, sx * 0.55, 0]],
    ], {
      from: [sx * 20, 0, 18],
      hatch: { axis: [0, 1, 0], angle: sx * 0.6, pivot: [sx * 14.2, 9, 10.4] },
    });
  }

  // 7 ── rear hood M1③ (hatch: lifts up) and back shell K1③
  kit.step('Rear hood and back shell', {
    pp: 51, view: 'backL', focus: H, minDist: 80,
    desc: 'Fit the rear hood M1③ with its two pegs beside the top ridge, then close the back of the head with K1③ (centre groove, rear camera).',
    caution: 'Tightly fit the parts as far as they will go. All K1 parts are now used.',
  });
  part(kit, 'M1-3', H, [
    [clipHull(DOME_PTS, [[[0, 0, -1], 6], [[0, 1, 0], 24]])],
    [tbox(7, 7, 5, 5, 4.5, { c: 1.2 }), [0, 32.8, -9.2]],
  ], {
    from: [0, 22, -20],
    hatch: { axis: [1, 0, 0], angle: 0.95, pivot: [0, 34.6, -6] },
  });
  part(kit, 'K1-3', H, [
    [clipHull(DOME_PTS, [[[0, 0, -1], 6], [[0, -1, 0], -24]])],
    [tbox(26, 10, 28, 11, 22, { c: 3 }), [0, 11, -13]],
    [cbox(1, 9, 1, 0.2), [0, 16.5, -18.4], [0.02, 0, 0], MAT.frameDark],       // centre groove
    [cbox(10, 5, 1.4, 0.4), [0, 8, -18.2], null, MAT.black],                  // rear camera housing
    [cyl(1.1, 1.1, 0.6, 14, 'z'), [3, 8.2, -19], null, MAT.sensorGreen],      // rear camera lens
    [cbox(4, 0.8, 0.6, 0.1), [-2.2, 7, -19], null, MAT.frameDark],
  ], { from: [0, 4, -30] });

  // 8 ── V-fin M1① with the red forehead block N3③
  kit.step('V-fin and forehead block', {
    pp: 51, view: 'frontR', focus: H, minDist: 90,
    desc: 'Turn the parts over: press the red forehead block N3③ (main camera) onto the centre of the V-fin M1①, then plug it into the forehead socket.',
    caution: 'All M1 and N3 parts are now used.',
  });
  part(kit, 'M1-1', H, [
    [frontPlate([[-2.4, 0], [2.4, 0], [28, 15.8], [27.6, 17.2], [0, 4.6], [-27.6, 17.2], [-28, 15.8]], 1.3, 0.3), [0, 23, 16.8], [-0.22, 0, 0]],
    [tbox(8, 4, 5, 3, 6, { c: 0.8 }), [0, 23.5, 16.5]],
  ], { from: [0, 10, 34], mat: MAT.yellow });   // the RX-78-2 V-fin is yellow
  part(kit, 'N3-3', H, [
    [hull([
      [-3, 24.5, 17.5], [3, 24.5, 17.5], [-2.2, 33, 14], [2.2, 33, 14],
      [-3, 24.5, 12], [3, 24.5, 12], [-2.2, 34.5, 10], [2.2, 34.5, 10],
    ])],
    [cbox(2.4, 2.6, 0.8, 0.2), [0, 28, 16.5], [-0.4, 0, 0], MAT.sensorGreen],   // main camera
  ], { from: [0, 6, 30] });

  // marking stickers (marking guide p.71)
  kit.step('Head marking stickers', {
    pp: 51, view: 'backR', focus: H, minDist: 80,
    desc: 'Apply the marking stickers: caution markings B-35 (left) / B-34 (right) on the head sides, B-76 on top of the rear hood and the red B-77 on the back of the helmet (marking guide p.71).',
  });
  sticker(kit, 'StickerB-35', H, { w: 3.2, h: 1.6, p: [18.1, 16.4, -10.5], r: [0, PI / 2, 0], color: '#b9bdc2' });
  sticker(kit, 'StickerB-34', H, { w: 3.2, h: 1.6, p: [-18.1, 16.4, -10.5], r: [0, -PI / 2, 0], color: '#b9bdc2' });
  sticker(kit, 'StickerB-76', H, { w: 3, h: 3.5, p: [4.2, 34.4, -8.5], r: [-PI / 2 + 0.12, 0, 0], color: '#b9bdc2' });
  sticker(kit, 'StickerB-77', H, { w: 6, h: 3, p: [0, 29, -16.85], r: [0.38, PI, 0], color: '#c6303b' });
}

/** Helmet side shell (K1④ = +x left, K1② = -x right): dome side, brow half, cheek block, ear, vulcan port. */
function sideShell(sx) {
  return [
    [clipHull(DOME_PTS, [[[sx, 0, 0], 3.5], [[0, 0, 1], -6]])],
    [clipHull(BROW_PTS, [[[sx, 0, 0], 0]])],
    [tbox(6, 24, 7, 28, 20, { c: 2 }), [sx * 14.6, 10, -2.5]],
    [cyl(4.2, 4.2, 1.6, 24, 'x'), [sx * 18.2, 11, -4], null, MAT.whiteGray],   // ear
    [cbox(1, 6, 1.4, 0.2), [sx * 18.8, 11, -4], null, MAT.frameDark],
    [cbox(5.6, 5.8, 9.5, 1.4), [sx * 12.2, 25.4, 6.6]],                          // vulcan housing
    [tube(2.4, 1.55, 3, 'z', 18), [sx * 12.2, 25.5, 11.8]],                      // vulcan port
    [cbox(0.5, 12, 0.6, 0.1), [sx * 17.9, 9, -9], null, MAT.frameDark],      // panel line
  ];
}
