// WAIST. Manual pp.20-22 (PHASE 01▶02 WAIST-FRAME), pp.35-36 (PHASE 03 WAIST-TRUSS-FRAME),
// pp.44-45 (PHASE 04 WAIST-ARMOR), hatch gimmicks p.62.
// Everything is mounted in R.waist (identity = world coordinates: mm, ground y = 0, +z front, +x model's LEFT).
// Mirrored halves live in two side groups: SL (model's left, +x) and SR (model's right, scale.x = -1), so each
// side builder is written once in "left space" (+x = outward).
//   crotch block : x ±12, y 147..199 (hip bosses at y 163, upper connector collar top y 199)
//   side units   : x 12..29, y 166..192, z ±14 (MSF-1 core + E2 plates + A/B hanging plates)
//   armor        : front skirts ≈ [±22.5,178,21.5], side skirts x ±38.5, rear skirts ≈ [±19,177,-21]
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp } from '../kit.js';
import { BENCH } from './rig.js';
import { cbox, tbox, cyl, hull, sub } from '../geom.js';
import { part, sticker, sidePlate, flatPlate, frontPlate, capDisc, tube, slats, frame2d, merge, nub, pin } from './util.js';

const PI = Math.PI;

// ───────────────────────── local helpers ─────────────────────────

/** Plate in XY with holes (arrays of [x,y]), thickness t along z, centred. */
function holedPlate(outline, holes, t, bevel = 0.3) {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.01, t - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 1, curveSegments: 8,
  });
  g.translate(0, 0, -(t - 2 * bevel) / 2);
  return g;
}
/** Same, outline in (z, y), thickness along x (like util.sidePlate). */
function holedSide(outlineZY, holes, t, bevel = 0.3) {
  const g = holedPlate(outlineZY, holes, t, bevel);
  g.rotateY(-PI / 2);
  return g;
}
const circ = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (2 * PI * i) / n;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** Side groups (created once): SL = model's left (+x), SR = model's right (mirrored). */
function sides(R) {
  const W = R.waist;
  if (!W.userData.wside) {
    const SL = grp(); SL.name = 'waist.L';
    const SR = grp(); SR.name = 'waist.R'; SR.scale.x = -1;
    W.add(SL, SR);
    W.userData.wside = { L: SL, R: SR, unit: {}, sub: {} };
  }
  return W.userData.wside;
}

// ───────────────────────── PHASE 01 ▶ 02 · WAIST-FRAME ─────────────────────────

export function waistFrame(kit, R) {
  const W = R.waist;
  const S = sides(R);
  kit.section('WAIST-FRAME', { pp: 20 });
  kit.block('WAIST-FRAME ASSEMBLE', { pp: 20 });

  // 1 ── X2-6 sleeve into B3-15 (front half of the centre column)
  kit.step('Put the X2-6 sleeve into B3-15', {
    pp: 20, view: 'frontR', focus: W, minDist: 60,
    desc: 'Cut B3-15 carefully (thin tab) and press the flanged X2-6 poly sleeve into its large bore. Note the orientation of X2-6: the short side faces the front.',
    caution: 'Cut the B3-15 tab carefully. Mind the X2-6 orientation (!).',
  });
  part(kit, 'X2-6', W, [
    [tube(3.3, 1.8, 5.6, 'x'), [0, 181, 0]],
    [tube(4.2, 1.8, 0.8, 'x'), [2.4, 181, 0]],
  ], { from: [0, 0, 25] });
  part(kit, 'B3-15', W, [
    [sub(cbox(6, 16, 5.5, 0.8), [cyl(3.4, 3.4, 8, 20, 'x'), { p: [0, 0, -2.75] }]), [0, 181, 2.75]],
    [nub(3, 2, 1), [0, 175.5, 5.8]],
    [nub(4, 1, 0.8), [0, 186.5, 5.7]],
  ], { from: [0, 0, 30] });

  // 2 ── X2-5 cap, then B3-16 closes the column
  kit.step('Add the X2-5 cap and close with B3-16', {
    pp: 20, view: 'backR', focus: W, minDist: 60,
    desc: 'Set the keyed X2-5 cap on top of the sleeve (tab to the front), then close the column from behind with B3-16.',
  });
  part(kit, 'X2-5', W, [
    [cyl(2.4, 2.4, 3, 16, 'y'), [0, 188, 0]],
    [nub(1, 2, 1.4), [0, 188, 2.6]],
  ], { from: [0, 20, 0] });
  part(kit, 'B3-16', W, [
    [sub(cbox(6, 16, 5.5, 0.8), [cyl(3.4, 3.4, 8, 20, 'x'), { p: [0, 0, 2.75] }]), [0, 181, -2.75]],
    [cbox(4, 5, 4.5, 0.6), [0, 185, -7.6]],     // rear hinge lug (M2-14 later)
    [nub(3, 2, 1), [0, 175.5, -5.8]],
  ], { from: [0, 0, -30] });

  // 3 ── B3-17 with X2-7 and B3-13
  kit.step('B3-17 with X2-7 and B3-13', {
    pp: 20, view: 'right', focus: W, minDist: 70,
    desc: 'Press the X2-7 cap into the centre bore of B3-17 and fit the small B3-13 spacer between the lower bosses.',
    caution: 'Do not forget B3-13.',
  });
  const halfOutline = [[9, 187.5], [9, 152], [7.5, 149], [3, 149], [1.5, 152], [1.5, 158], [-6, 158], [-8, 161],
    [-8, 187.5], [-6, 189.5], [7, 189.5]];
  const centreHalf = (x) => [
    [holedSide(halfOutline, [circ(0, 168, 2.3)], 6, 0.5), [x, 0, 0]],
    [slats(5.4, 9, 1.2, 4, 0), [x, 182.5, 9.4]],
    [cyl(3.5, 3.5, 6, 18, 'x'), [x, 152.5, 5]],
    [cbox(5.4, 2, 1.2, 0.3), [x, 163, -8.4]],
  ];
  part(kit, 'X2-7', W, [[tube(2.2, 1, 6.4, 'x'), [-6, 168, 0]]], { from: [-25, 0, 0] });
  part(kit, 'B3-13', W, [[cbox(5, 5, 4, 0.5), [0, 152.5, 5]]], { from: [0, -20, 15] });
  part(kit, 'B3-17', W, centreHalf(-6), { from: [-30, 0, 0] });

  // 4 ── column into B3-17, B3-18 closes
  kit.step('Close the centre block with B3-18', {
    pp: 20, view: 'frontL', focus: W, minDist: 70,
    desc: 'Peg the B3-15/B3-16 column into B3-17, then close the other face with B3-18.',
  });
  part(kit, 'B3-18', W, centreHalf(6), { from: [30, 0, 0] });

  // 5, 6 ── hip side plates (built on the bench, joined at p.21)
  const hip = {};
  for (const side of ['R', 'L']) {
    const right = side === 'R';
    const G = grp(); G.name = `waist.hip${side}`; S[side].add(G); hip[side] = G;
    kit.step(`X2-3 into B3-${right ? 19 : 20} (${right ? 'right' : 'left'} hip plate)`, {
      pp: 20, view: right ? 'right' : 'left', focus: G, minDist: 60,
      desc: `Press an X2-3 poly cap into the hip-joint boss of B3-${right ? 19 : 20}${right ? '' : ' (mirror of B3-19)'}.`,
    });
    hipPlate(kit, G, right ? 'B3-19' : 'B3-20');
  }

  // p.21 ── sandwich
  kit.step('Sandwich the centre block', {
    pp: 21, view: 'front', focus: W, minDist: 80,
    desc: 'Sandwich the centre block between the B3-19 (right) and B3-20 (left) assemblies. Push until there is no gap.',
  });
  kit.join(hip.R, [25, -5, 20]);
  kit.join(hip.L, [25, -5, 20]);

  kit.step('B3-14, V1-3 caps and stickers', {
    pp: 21, view: 'frontR', focus: W, minDist: 80,
    desc: 'Fit the slotted B3-14 cap on top, press the two gold V1-3 caps into the lower-front side holes and apply the round Sticker B-25 (right) / B-24 (left) on their faces (optional).',
    caution: 'Mind the V1-3 orientation. Sticker B on the frame is optional.',
  });
  part(kit, 'B3-14', W, [
    [merge([cbox(5.5, 4, 7, 0.6), { p: [-4.25, 0, 0] }], [cbox(5.5, 4, 7, 0.6), { p: [4.25, 0, 0] }],
      [cbox(3.2, 2, 7, 0.3), { p: [0, -1, 0] }]), [0, 191.5, 0]],
  ], { from: [0, 25, 0] });
  for (const side of ['R', 'L']) {
    part(kit, 'V1-3', hip[side], [[capDisc(2, 0.9, 'x', 20), [12, 152, 4.5]]], { from: [20, 0, 0] });
  }
  const dot = circ(0, 0, 1.5, 16);
  sticker(kit, 'StickerB-25', hip.R, { shape: dot, p: [13.0, 152, 4.5], r: [0, PI / 2, 0], color: '#c9ccd1' });
  sticker(kit, 'StickerB-24', hip.L, { shape: dot, p: [13.0, 152, 4.5], r: [0, PI / 2, 0], color: '#c9ccd1' });

  kit.step('B3-12 on top · insert the legs', {
    pp: 21, view: 'front', focus: 'all',
    desc: 'Push B3-12 into the top of the waist frame (the peg underneath goes into the B3-14 slot). Then insert the hip shafts of the right and left leg frames into the side sockets.',
    caution: 'Tightly fit the legs as far as they will go. All B3 parts are now used.',
  });
  part(kit, 'B3-12', W, [
    [flatPlate([[-11, -5], [-8, -8], [8, -8], [11, -5], [11, 5], [8, 8], [-8, 8], [-11, 5]], 3.5, 0.6), [0, 195.25, 0]],
    [cbox(2.8, 2.4, 5, 0.3), [0, 192.4, 0]],
    [tube(5.5, 3.2, 2, 'y'), [0, 198, 0]],
    [nub(3, 1, 2), [-8.5, 197.4, 0]], [nub(3, 1, 2), [8.5, 197.4, 0]],
  ], { from: [0, 30, 0] });
  kit.join(R.leg.R.root, BENCH.legR);
  kit.join(R.leg.L.root, BENCH.legL);

  // ×2 A / ×2 B sub-units (both copies built at once)
  const unit = S.unit, subs = S.sub;
  for (const side of ['R', 'L']) {
    const U = grp(); U.name = `waist.unit${side}`; S[side].add(U); unit[side] = U;
    subs[side] = { A: grp(), B: grp() };
    subs[side].A.name = `waist.A${side}`; subs[side].B.name = `waist.B${side}`;
    U.add(subs[side].A, subs[side].B);
  }
  kit.block('×2 A', { pp: 21 });
  kit.step('Build sub-unit A ×2', {
    pp: 21, view: 'frontR', focus: subs.R.A, minDist: 60,
    desc: 'Build two: fit the E2-19 loop (mind the ! orientation) through E2-20, rotate the pair 180° and slide it into the slot of the E2-17 bracket.',
  });
  for (const side of ['R', 'L']) subUnit(kit, subs[side].A, 1, 'E2-20', 'E2-17');
  kit.block('×2 B', { pp: 21 });
  kit.step('Build sub-unit B ×2', {
    pp: 21, view: 'backR', focus: subs.R.B, minDist: 60,
    desc: 'Build two: E2-19 through E2-21, rotate 180° and slide into the slot of E2-18 (mirror of unit A).',
  });
  for (const side of ['R', 'L']) subUnit(kit, subs[side].B, -1, 'E2-21', 'E2-18');

  // Right side unit (one step per panel)
  kit.block('RIGHT SIDE', { pp: 21 });
  sideUnit(kit, S, 'R');
  kit.block('LEFT SIDE ASSEMBLE', {
    pp: 22, compact: true,
    desc: 'Build the left side unit like the right one: cut MSF-1① from the runner, straighten it, sandwich it between E2-15 (top) and E2-14 (bottom), hook sub-unit B (rear) and A (front) into the end slots and press the E2-16 cover onto the top hinge peg, then swing it down. All E2 parts are now used.',
  });
  sideUnit(kit, S, 'L');

  kit.block('WAIST-FRAME ASSEMBLE', { pp: 22 });
  kit.step('Attach the side units', {
    pp: 22, view: 'front', focus: W,
    desc: 'Push the right side unit onto the two pegs on the right of the upper crotch block, and the left unit onto the left. The units span front to back with the A/B plates hanging at their front and rear ends; the hip blocks swing and slide for articulation.',
  });
  kit.join(unit.R, [30, 0, 25]);
  kit.join(unit.L, [30, 0, 25]);
}

/** B3-19 / B3-20: hip side plate (left space, outer face x = 12) with its X2-3 poly cap. */
function hipPlate(kit, G, id) {
  const outline = [[7, 172]];
  const arc = (a) => [7.5 * Math.cos(a * PI / 180), 163 + 7.5 * Math.sin(a * PI / 180)];
  for (let a = 45; a >= -15; a -= 15) outline.push(arc(a));
  outline.push([7, 152], [4.5, 149.5], [1.5, 150.5]);
  for (let a = -105; a >= -225; a -= 15) outline.push(arc(a));
  outline.push([-7, 172], [-7, 188], [-5.5, 190], [5.5, 190], [7, 188]);
  part(kit, 'X2-3', G, [[tube(4.2, 2, 3.4, 'x'), [11.2, 163, 0]]], { from: [20, 0, 0] });
  part(kit, id, G, [
    [sidePlate(outline, 3, 0.5), [10.5, 0, 0]],
    [tube(6.2, 4.2, 1, 'x'), [12.3, 163, 0]],
    [cbox(7, 2.5, 3.5, 0.5), [7.5, 190.5, 5.5]],
    [cbox(7, 2.5, 3.5, 0.5), [7.5, 190.5, -5.5]],
    [pin(1.2, 2.4), [13, 184, 5]], [pin(1.2, 2.4), [13, 184, -5]],
    [cbox(1, 10, 3, 0.3), [12.3, 180, 0]],
  ], { from: [25, 0, 0] });
}

/** Sub-unit A (fz = +1, front) or B (fz = -1, rear): E2-19 loop + E2-20/21 block + E2-17/18 bracket (left space). */
function subUnit(kit, G, fz, blockId, plateId) {
  const z = (v) => v * fz;
  part(kit, 'E2-19', G, [[frame2d(5, 5, 1.2, 1.6), [15.8, 176, z(14)]]], { from: [0, 0, z(15)] });
  part(kit, blockId, G, [
    [cbox(7, 6, 4.5, 0.6), [20.5, 176, z(14.25)]],
    [merge([cbox(7, 0.6, 0.8, 0.2), { p: [0, 0, -1.3] }], [cbox(7, 0.6, 0.8, 0.2), { p: [0, 0, 0] }],
      [cbox(7, 0.6, 0.8, 0.2), { p: [0, 0, 1.3] }]), [20.5, 179.3, z(14.25)]],
  ], { from: [10, 0, z(15)] });
  part(kit, plateId, G, [
    [holedPlate([[13.5, 166], [24.5, 166], [25, 168], [25, 180], [23, 182.5], [15, 182.5], [13, 180], [13, 168]],
      [rect(16, 169, 22, 172.5)], 3, 0.4), [0, 0, z(10.5)]],
    [cbox(10, 1.8, 3.4, 0.4), [19, 183.2, z(10.5)]],
    [cbox(3, 3, 1.4, 0.3), [15, 176, z(12.4)]],
  ], { from: [0, -10, z(25)] });
}

/** Side unit (left space): MSF-1 core, E2 top/bottom plates, joins A/B, E2-16 cover. */
function sideUnit(kit, S, side) {
  const right = side === 'R';
  const U = S.unit[side];
  const sv = right ? 'right' : 'left';
  const ids = right ? { msf: 'MSF-1-2', top: 'E2-12', bot: 'E2-13' } : { msf: 'MSF-1-1', top: 'E2-15', bot: 'E2-14' };

  kit.step(`Cut out MSF-1${right ? '②' : '①'} and straighten it`, {
    pp: right ? 21 : 22, view: sv, focus: U, minDist: 60,
    desc: 'Cut the insert-molded multi-link frame from the runner, swing its arms out and rotate the end blocks 90° as shown.',
  });
  part(kit, ids.msf, U, [
    [cbox(8, 6, 16, 1), [18, 184, 0]],
    [tube(3.3, 1.8, 8, 'x'), [18, 184, 10]],
    [tube(3.3, 1.8, 8, 'x'), [18, 184, -10]],
    [cbox(2.5, 5, 3, 0.4), [13.3, 184, 5]],
    [cbox(2.5, 5, 3, 0.4), [13.3, 184, -5]],
    [cyl(2.2, 2.2, 1.5, 16, 'x'), [22.6, 184, 4]],
    [cyl(2.2, 2.2, 1.5, 16, 'x'), [22.6, 184, -4]],
  ], { from: [15, 0, 30] });

  kit.step(`${ids.top} and ${ids.bot} top / bottom plates`, {
    pp: right ? 21 : 22, view: right ? 'frontR' : 'frontL', focus: U, minDist: 60,
    desc: `Sandwich the frame between ${ids.top} (top, hinge peg to the outside) and ${ids.bot} (bottom).`,
  });
  part(kit, ids.top, U, [
    [cbox(10, 2.2, 20, 0.6), [18, 188.6, 0]],
    [cyl(1.2, 1.2, 14, 12, 'z'), [22.5, 190.1, 0]],
    [nub(2, 0.6, 3), [15, 190, 0]],
  ], { from: [0, 20, 0] });
  part(kit, ids.bot, U, [
    [cbox(10, 2.2, 20, 0.6), [18, 179.4, 0]],
    [cbox(6, 0.8, 2, 0.2), [18, 177.9, 6]], [cbox(6, 0.8, 2, 0.2), [18, 177.9, -6]],
  ], { from: [0, -20, 0] });

  kit.step('Attach sub-units B and A', {
    pp: 22, view: sv, focus: U, minDist: 60,
    desc: 'Hook sub-unit B into the rear end slot and sub-unit A into the front end slot, then swing both down so the plates hang at the ends.',
  });
  kit.join(S.sub[side].B, [0, -15, -25]);
  kit.join(S.sub[side].A, [0, -15, 25]);

  kit.step('E2-16 cover', {
    pp: 22, view: sv, focus: U, minDist: 60,
    desc: 'Press E2-16 onto the hinge peg on top and swing it down along the outer side.',
    caution: right ? '' : 'All E2 parts are now used.',
  });
  const cov = [[-11, 176], [11, 176], [11, 186.5], [9, 190.5], [-9, 190.5], [-11, 186.5]];
  part(kit, 'E2-16', U, [
    [sidePlate(cov, 3, 0.6), [24, 0, 0]],
    [cyl(1.8, 1.8, 14, 16, 'z'), [23.5, 190.2, 0]],
    [cbox(1.4, 1.6, 4, 0.3), [25.9, 183, 8.5]], [cbox(1.4, 1.6, 4, 0.3), [25.9, 183, -8.5]],
    [pin(1, 2.4), [26.6, 186, 10]], [pin(1, 2.4), [26.6, 186, -10]],
  ], { from: [20, 15, 0] });
}

// ───────────────────────── PHASE 03 · WAIST-TRUSS-FRAME ─────────────────────────

/** T3-7 / T3-11 dog-bone link hanging from the front (fz 1) or rear (fz -1) pivot peg (left space). */
function trussLink(kit, U, id, fz) {
  const z = (v) => v * fz;
  const o = [[7, 184], [8, 187.5], [12, 187.5], [13, 184], [12, 180], [11.5, 176], [12.5, 173], [11, 170.5],
    [8, 170.5], [6.5, 173], [7.5, 176], [8, 180]].map(([a, b]) => [z(a), b]);
  const holes = [circ(z(10), 186, 1.1, 12), rect(z(9), 181, z(11), 183.2), rect(z(9), 176.8, z(11), 179.2),
    circ(z(9.75), 172.8, 1.1, 12)];
  part(kit, id, U, [[holedSide(o, holes, 2, 0.3), [28.2, 0, 0]]], {
    from: [15, 0, z(10)],
  });
}

function trussBlock(kit, U) {
  part(kit, 'T3-10', U, [
    [merge([cbox(3.4, 1.8, 10, 0.4), { p: [-2.3, 0, 0] }], [cbox(3.4, 1.8, 10, 0.4), { p: [2.3, 0, 0] }],
      [cbox(1.4, 1, 10, 0.2), { p: [0, -0.4, 0] }]), [17.2, 190.6, 0]],
    [cbox(2, 1.4, 2, 0.3), [17.2, 189.2, 3.5]],
  ], { from: [0, 20, 0] });
  part(kit, 'T3-9', U, [
    [cbox(1.5, 12, 9, 0.4), [26.3, 183, 0]],
    [cbox(3, 2.5, 2, 0.4), [28.4, 186, 3.5]], [cbox(3, 2.5, 2, 0.4), [28.4, 186, -3.5]],
    [cbox(3, 2, 7, 0.4), [28.4, 178.5, 0]],
    [cyl(1, 1, 9, 12, 'z'), [29.2, 186, 0]],
  ], { from: [20, 0, 0] });
  part(kit, 'T3-8', U, [
    [cbox(8, 1.8, 10, 0.4), [18, 177.4, 0]],
    [cbox(1.4, 2, 1.4, 0.2), [15, 178.4, 4]], [cbox(1.4, 2, 1.4, 0.2), [21, 178.4, -4]],
  ], { from: [0, -20, 0] });
}

export function waistTruss(kit, R) {
  const S = sides(R);
  const W = R.waist;
  kit.section('WAIST-TRUSS-FRAME', { pp: 35 });
  kit.block('WAIST-TRUSS-FRAME ASSEMBLE', { pp: 35 });

  kit.step('T3-7 / T3-11 on the front pivots', {
    pp: 35, view: 'front', focus: W,
    desc: 'Hook T3-7 onto the front pivot peg of the right hip-side block and T3-11 onto the left one, then swing them down.',
  });
  trussLink(kit, S.unit.R, 'T3-7', 1);
  trussLink(kit, S.unit.L, 'T3-11', 1);

  kit.step('Right hip block: T3-10, T3-9, T3-8', {
    pp: 35, view: 'right', focus: S.unit.R, minDist: 70,
    desc: 'Slowly pull the right hip-side block straight out sideways. Add T3-10 on top, the T3-9 fork on the outer face and T3-8 underneath, then push the block back in.',
    caution: 'Pull the block out slowly and straight.',
  });
  trussBlock(kit, S.unit.R);

  kit.step('Left hip block: T3-10, T3-9, T3-8', {
    pp: 35, view: 'left', focus: S.unit.L, minDist: 70,
    desc: 'Same on the left: pull the block out, add T3-10, T3-9 and T3-8, and push it back in (p.36).',
  });
  trussBlock(kit, S.unit.L);

  kit.step('T3-11 / T3-7 on the rear pivots', {
    pp: 36, view: 'back', focus: W,
    desc: 'From the rear: hook T3-11 onto the right rear pivot peg and T3-7 onto the left one and swing them down.',
  });
  trussLink(kit, S.unit.R, 'T3-11', -1);
  trussLink(kit, S.unit.L, 'T3-7', -1);

  const etch = (U, id, fz) => sticker(kit, id, U, {
    w: 7, h: 1.5, p: [17, 189.75, 7.6 * fz], r: [-PI / 2, 0, 0], color: 'etching',
    extra: [[slats(6, 1.1, 0.12, 4, 0), [17, 189.85, 7.6 * fz], [PI / 2, 0, PI / 2], 'etching']],
  });
  kit.step('Etching stickers ETCH-6 / ETCH-7 (front)', {
    pp: 36, view: [0, 1, 0.9], focus: W, minDist: 70,
    desc: 'Apply ETCH-6 on the top front of the right hip block and ETCH-7 on the left one.',
    caution: 'Mind the orientation. Peel the etching stickers off carefully.',
  });
  etch(S.unit.R, 'ETCH-6', 1);
  etch(S.unit.L, 'ETCH-7', 1);

  kit.step('Etching stickers ETCH-6 / ETCH-7 (rear)', {
    pp: 36, view: [0, 1, -0.9], focus: W, minDist: 70,
    desc: 'From the rear: ETCH-6 on the top rear of the left hip block, ETCH-7 on the right one.',
  });
  etch(S.unit.L, 'ETCH-6', -1);
  etch(S.unit.R, 'ETCH-7', -1);
}

// ───────────────────────── PHASE 04 · WAIST-ARMOR ─────────────────────────

/** Skirt (front or rear) mount + face: ids.m = inner hook frame, ids.k = outer C-notched face (local, +x outward, +z outward). */
function skirtShell(kit, P, ids, Wd) {
  const hw = Wd / 2;
  part(kit, ids.m, P, [
    [frontPlate([[-hw + 1.5, -15], [hw - 1.5, -16], [hw - 1.5, 15], [-hw + 1.5, 15]], 2.5, 0.5), [0, 0, -3]],
    [cbox(8, 4, 8, 0.8), [-1, 3.5, -7.5]],
    [cbox(8, 4, 1.5, 0.4), [-1, 0.5, -11]],
    [cbox(16, 3.5, 3, 0.8), [0.5, 15, -0.8]],
  ], { from: [0, 0, 25] });
  const face = [[-hw, -15], [-hw + 3, -17.5], [hw - 1, -17.5], [hw, -16], [hw, 15.5], [hw - 1.5, 17], [8.5, 17],
    [8.5, -5.5], [-7.5, -5.5], [-7.5, 17], [-hw + 1.5, 17], [-hw, 15.5]];
  part(kit, ids.k, P, [
    [frontPlate(face, 3, 0.7), [0, 0, 0.5]],
    [sidePlate([[-4, -17], [2, -17.5], [2, 17], [-4, 17]], 1.8, 0.4), [hw - 0.9, 0, 0]],
    [cbox(8, 2, 4.5, 0.5), [-2, -18, -0.5]],
    [cbox(Wd - 5, 1.4, 1, 0.3), [0, -12.5, 2.3]],
    [tube(1.2, 0.6, 0.8, 'z'), [-4, -8, 2.2]], [tube(1.2, 0.6, 0.8, 'z'), [1, -8, 2.2]],
  ], { from: [0, 0, 30] });
}

/** Helium-core hatch: H19/H20 bracket + G2-12/13 yellow box (opens upward about its top hinge). */
function skirtHatch(kit, P, ids) {
  part(kit, ids.h, P, [
    [merge([cbox(12, 12, 1.2, 0.3)], [cbox(12, 1.2, 4, 0.3), { p: [0, -6.6, 2] }],
      [cbox(4, 4, 1, 0.3), { p: [0, 1, 1] }]), [0.5, 1.5, -1]],
  ], { from: [0, 0, 20], mat: MAT.darkYellow });
  const hatch = { axis: [1, 0, 0], angle: -1.1, pivot: [0.5, 9, 2.5] };
  part(kit, ids.g, P, [
    [cbox(15.5, 13.5, 4, 1.5), [0.5, 2, 3.5]],
    [cbox(10, 5, 1, 0.35), [0.5, 3, 5.8]],
    [cyl(1.2, 1.2, 12, 12, 'x'), [0.5, 9, 2.5]],
  ], { from: [0, 0, 25], hatch });
}

export function waistArmor(kit, R) {
  const S = sides(R);
  const W = R.waist;
  kit.section('WAIST-ARMOR', { pp: 44 });
  kit.block('WAIST-ARMOR ASSEMBLE', { pp: 44 });

  // skirt groups (left space; the rear ones mirrored in z so the builders face outward)
  const sk = {};
  for (const side of ['R', 'L']) {
    const F = grp([22.5, 178, 21.5], [-0.12, 0.22, 0]); F.name = `waist.skirtF${side}`;
    const Rr = grp([19, 177, -21], [0.14, -0.18, 0]); Rr.name = `waist.skirtB${side}`;
    const Ri = grp(); Ri.scale.z = -1; Rr.add(Ri);
    const Sd = grp([38.5, 180, 0], [0, 0, 0.12]); Sd.name = `waist.skirtS${side}`;
    S[side].add(F, Rr, Sd);
    sk[side] = { F, B: Ri, S: Sd };
  }
  const setR = { m: 'M2-15', k: 'K2-19', h: 'H19', g: 'G2-13' };
  const setL = { m: 'M2-16', k: 'K2-20', h: 'H20', g: 'G2-12' };

  // 1 ── red crotch front with the yellow V
  kit.step('G2-20 into N4-11 · front centre', {
    pp: 44, view: 'front', focus: W, minDist: 80,
    desc: 'Cut the yellow V (G2-20) out cleanly and fit it into the red N4-11 wedge, then press it into the front centre at the top of the crotch.',
    caution: 'Cut G2-20 out cleanly. All N4 parts are now used.',
  });
  const lift = { axis: [1, 0, 0], angle: -0.35, pivot: [0, 190.5, 9] };
  part(kit, 'G2-20', W, [
    [frontPlate([[-6.5, 3], [0, -1.5], [6.5, 3], [6.5, 0.6], [0, -4], [-6.5, 0.6]], 1.4, 0.3), [0, 186, 25.2], [-0.233, 0, 0]],
  ], { from: [0, 0, 20], hatch: lift });
  part(kit, 'N4-11', W, [
    [hull([[-7.5, 180, 9], [7.5, 180, 9], [-7.5, 190.5, 9], [7.5, 190.5, 9],
      [-8, 180, 24.5], [8, 180, 24.5], [-6.5, 180, 26], [6.5, 180, 26],
      [-7, 190.5, 22], [7, 190.5, 22], [-5.5, 190.5, 23.5], [5.5, 190.5, 23.5]]), null],
  ], { from: [0, 0, 30], hatch: lift });

  // 2 ── K2-21 lower crotch plate + M2-12 collar
  kit.step('K2-21 and M2-12 · crotch front', {
    pp: 44, view: 'frontR', focus: W, minDist: 80,
    desc: 'Fit the bent K2-21 plate on the crotch front, then slide the M2-12 window collar over it.',
  });
  part(kit, 'K2-21', W, [
    [frontPlate([[-6, 150], [6, 150], [7.5, 160], [7.5, 178], [-7.5, 178], [-7.5, 160]], 2.5, 0.6), [0, 0, 21.75]],
    [flatPlate([[-6, 9], [6, 9], [6, 21], [-6, 21]], 2.5, 0.5), [0, 151.25, 0]],
    [cbox(6, 3, 12, 0.6), [0, 176.5, 14.5]],
    [cbox(5, 1.2, 1, 0.3), [0, 156, 23.2]],
  ], { from: [0, -10, 30] });
  part(kit, 'M2-12', W, [
    [frame2d(16, 12, 2.5, 2.5), [0, 172, 24.25]],
    [sidePlate([[12, 166], [25.5, 166], [25.5, 175.5], [23, 178], [12, 178]], 1.4, 0.4), [-8.2, 0, 0]],
    [sidePlate([[12, 166], [25.5, 166], [25.5, 175.5], [23, 178], [12, 178]], 1.4, 0.4), [8.2, 0, 0]],
  ], { from: [0, 0, 25] });

  // 3 ── M2-13 underside
  kit.step('M2-13 · crotch underside', {
    pp: 44, view: [0.3, -1, 0.8], focus: W, minDist: 80,
    desc: 'Push the boomerang-shaped M2-13 into the crotch from below (square peg up).',
  });
  part(kit, 'M2-13', W, [
    [flatPlate([[-7, 6], [0, 2], [7, 6], [7, 10], [0, 6.5], [-7, 10]], 2.5, 0.5), [0, 147.75, 0]],
    [cbox(2.5, 3, 2.5, 0.3), [0, 150.2, 5]],
  ], { from: [0, -25, 0] });

  // 4 ── rear centre
  kit.step('M2-14 and K2-18 · rear centre', {
    pp: 44, view: 'backR', focus: W, minDist: 80,
    desc: 'Insert the M2-14 pin into the rear centre hinge hole, then push the K2-18 rear block on from behind.',
  });
  part(kit, 'M2-14', W, [
    [cyl(1.5, 1.5, 8, 12, 'z'), [0, 185, -14]],
    [cyl(2.2, 2.2, 1.2, 14, 'z'), [0, 185, -17.6]],
  ], { from: [0, 0, -20] });
  const RC = grp([0, 174, -22], [0.1, 0, 0]); RC.name = 'waist.rearCentre'; W.add(RC);
  part(kit, 'K2-18', RC, [
    [sub(tbox(14, 9, 16, 9, 28, { c: 2 }), [cbox(3, 16, 4, 0.4), { p: [0, 2, -4.2] }]), [0, -4, 0]],
    [cyl(8, 8, 9, 20, 'z'), [0, 9.5, 0]],
    [cbox(4, 4, 5, 0.5), [0, 11.3, 5]],
    [cbox(9, 2, 1.2, 0.4), [0, 12, -4.8]],
  ], { from: [0, 0, -30] });

  // 5-7 ── front skirts
  kit.step('M2-15 and K2-19 · right front skirt', {
    pp: 44, view: 'frontR', focus: W,
    desc: 'Hook M2-15 onto the right front hip-corner peg (sub-unit A) and fit the K2-19 face over it.',
  });
  skirtShell(kit, sk.R.F, setR, 27);
  kit.step('H19 and G2-13 · right front hatch', {
    pp: 44, view: 'frontR', focus: sk.R.F, minDist: 70,
    desc: 'Set the small H19 bracket deep in the recess, then press the yellow G2-13 helium-core hatch into the right front mount.',
    caution: 'Tightly fit G2-13.',
  });
  skirtHatch(kit, sk.R.F, setR);
  kit.step('M2-16 and K2-20 · left front skirt', {
    pp: 44, view: 'frontL', focus: W,
    desc: 'Same on the left front: M2-16, then K2-20.',
  });
  skirtShell(kit, sk.L.F, setL, 27);
  kit.step('H20 and G2-12 · left front hatch', {
    pp: 45, view: 'frontL', focus: sk.L.F, minDist: 70,
    desc: 'H20 bracket in the recess, then the yellow G2-12 hatch.',
  });
  skirtHatch(kit, sk.L.F, setL);

  // side skirts (both sides in one panel)
  kit.step('M2-17 and K2-17 ×2 · side skirts', {
    pp: 45, view: 'left', focus: W,
    desc: 'On each side, cap the U-socket with the curved M2-17 and hook the K2-17 side skirt onto the hip-side block (both sides the same).',
  });
  for (const side of ['R', 'L']) {
    const P = sk[side].S;
    const cap = [];
    for (let a = 0; a <= 180; a += 30) {
      const c = Math.cos(a * PI / 180), s = Math.sin(a * PI / 180);
      cap.push([-4 + 4.5 * c, 8 + 4.5 * s, 6.5], [-4 + 4.5 * c, 8 + 4.5 * s, -6.5]);
    }
    part(kit, 'M2-17', P, [[hull(cap), null]], { from: [0, 20, 0] });
    part(kit, 'K2-17', P, [
      [sidePlate([[-13, -15], [13, -15], [14, 11], [12, 14], [-12, 14], [-14, 11]], 4, 0.8), [1, 0, 0]],
      [sidePlate([[-8, -10], [8, -10], [9, 5], [-9, 5]], 1.2, 0.3), [3.5, 0, 0]],
      [cbox(10, 3, 3, 0.6), [-5, 6, 5]], [cbox(10, 3, 3, 0.6), [-5, 6, -5]],
      [cbox(3, 1.5, 6, 0.4), [3.6, -12, 4]],
    ], { from: [25, 0, 0], hatch: { axis: [0, 0, 1], angle: 0.45, pivot: [-9, 6, 0] } });
  }

  // rear skirts
  kit.step('M2-16 and K2-20 · left rear skirt', {
    pp: 45, view: 'backL', focus: W,
    desc: 'Hook M2-16 onto the left rear hip-corner peg (sub-unit B) and fit K2-20 over it.',
  });
  skirtShell(kit, sk.L.B, setL, 24);
  kit.step('H20 and G2-12 · left rear hatch', {
    pp: 45, view: 'backL', focus: sk.L.B, minDist: 70,
    desc: 'H20 bracket, then the yellow G2-12 hatch on the left rear skirt.',
  });
  skirtHatch(kit, sk.L.B, setL);
  kit.step('M2-15 and K2-19 · right rear skirt', {
    pp: 45, view: 'backR', focus: W,
    desc: 'M2-15 and K2-19 on the right rear. All K2 and M2 parts are now used.',
  });
  skirtShell(kit, sk.R.B, setR, 24);
  kit.step('H19 and G2-13 · right rear hatch', {
    pp: 45, view: 'backR', focus: sk.R.B, minDist: 70,
    desc: 'H19 bracket, then the yellow G2-13 hatch on the right rear skirt. Open hatches (p.62): the yellow helium-core hatches flip up, the side skirts swing out and the red front centre lifts.',
  });
  skirtHatch(kit, sk.R.B, setR);
}
