// ARMS. Manual pp.28-31 (PHASE 01▶02 ARMS-FRAME), pp.38-39 (PHASE 03 truss), pp.48-51 (PHASE 04 ARMS-ARMOR).
// Every arm is modelled as the LEFT arm in its own space (+x = outward, +z = front); the right arm root is
// mirrored (scale.x = -1), so the same code builds both.
//   sh group    : origin = shoulder ball (in the chest socket); shoulder ring at x 13, upper arm hangs along x = 13
//   elbow group : origin = elbow (sh 13,-48); forearm down to the wrist block at y -46
//   hand group  : origin = wrist ball; fist group inside (the gripping hand, swapped out for weapon hands later)
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp } from '../kit.js';
import { cbox, tbox, cyl, sphere, hull, lattice, torus } from '../geom.js';
import { part, segment, sticker, sidePlate, flatPlate, frontPlate, capDisc, ribbed, merge, nub } from './util.js';
import { BENCH } from './rig.js';

const PI = Math.PI;
const RY = [0, PI / 2, 0];
const FINGER_Z = [5.6, 1.9, -1.8, -5.5];

// ───────────────────────── local shape helpers (plates with holes, no CSG) ─────────────────────────

const v2 = (pts) => pts.map(([a, b]) => new THREE.Vector2(a, b));
/** Extruded outline with holes in XY, thickness t along z (centred). */
function holed(outline, holes, t, bevel = 0.5) {
  bevel = Math.min(bevel, t / 3);
  const s = new THREE.Shape(v2(outline));
  for (const h of holes) s.holes.push(new THREE.Path(v2(h)));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.01, t - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 1, curveSegments: 8,
  });
  g.translate(0, 0, -(t - 2 * bevel) / 2);
  return g;
}
/** Holed plate lying flat: outline in (x, z), thickness (height) along y. */
function holedXZ(outline, holes, t, bevel) {
  const g = holed(outline.map(([x, z]) => [x, -z]), holes.map((h) => h.map(([x, z]) => [x, -z])), t, bevel);
  g.rotateX(-PI / 2);
  return g;
}
/** Holed side plate: outline in (z, y), thickness along x. */
function holedZY(outline, holes, t, bevel) {
  const g = holed(outline, holes, t, bevel);
  g.rotateY(-PI / 2);
  return g;
}
const circ = (cx, cy, r, n = 20) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * PI * i) / n), cy + r * Math.sin((2 * PI * i) / n)]);
const mirZ = (pts) => pts.map(([x, z]) => [x, -z]).reverse();
const mirX = (pts) => pts.map(([x, z]) => [-x, z]).reverse();

// ───────────────────────── PHASE 01 ▶ 02 · ARMS-FRAME ─────────────────────────

export function armsFrame(kit, R) {
  kit.section('ARMS-FRAME', { pp: 28 });
  kit.block('ARM-FRAME-RIGHT ASSEMBLE', { pp: 29 });
  armFrameSide(kit, R, 'R');
  kit.block('Gripping Hand (Right)', { pp: 29 });
  gripHand(kit, R, 'R');
  kit.block('Open Hand (Right)', { pp: 29 });
  openHand(kit, R, 'R');
  kit.block('ARM-FRAME-RIGHT ASSEMBLE · shoulder block', { pp: 30 });
  shoulderBlock(kit, R, 'R');

  kit.block('ARM-FRAME-LEFT ASSEMBLE', {
    pp: 30, compact: true,
    desc: 'Build the left arm frame exactly like the right one, mirrored: cut MSF-1③, check that the elbow moves (it is stiff by design), sandwich the elbow with C2② (outer) and C2⑧ (inner), turn the shoulder pipe 90° inward and close the shoulder ring with C2③ + C2④, the roll joint with C2⑦ + C2①. Fit the gold V1② cylinders, build the wrist block (W③ ×2, C2⑥, C2⑤) and push it onto the wrist ball, close the forearm with the METAL ARM PART, C1⑫ and C1⑪, add Sticker B-81 on the back and the gold V1⑤ elbow caps with Sticker B-24 (pp.30-31).',
  });
  armFrameSide(kit, R, 'L');
  kit.block('LEFT HANDS · SHOULDER BLOCK · ATTACH', {
    pp: 31, compact: true,
    desc: 'Build the left gripping hand (W⑪, W⑫, F2⑩, R④, R③) and the left open hand (W⑲, F2⑩, R⑧, R⑦), then the left shoulder block (F2⑭ between F2⑬ and F2⑮, sandwiched by F2⑫ and F2⑪). Set the block on the arm, push the ribbed shoulder pipe into the left socket of the chest frame and plug in a hand (gripping or open: choose one).',
  });
  gripHand(kit, R, 'L');
  openHand(kit, R, 'L');
  shoulderBlock(kit, R, 'L');
}

function armFrameSide(kit, R, side) {
  const A = R.arm[side];
  const { sh, elbow } = A;
  const right = side === 'R';
  const C = right ? 'C1' : 'C2';
  const V = right ? 'right' : 'left';
  const sv = right ? 'right' : 'left';   // outer side of this arm
  const iv = right ? 'left' : 'right';   // inner side
  const pp = right ? 29 : 30;
  const focus = A.root;

  // 1-2 ── MSF-1 insert frame: shoulder pipe + ring, upper arm, double elbow, forearm, wrist ball
  kit.step(`Cut out the ${V} arm frame MSF-1${right ? '④' : '③'}`, {
    pp, view: 'frontR', focus, minDist: 110,
    caution: 'The frame is structurally rigid: move the joints carefully.',
    desc: 'Cut the pre-articulated arm frame from the MSF-1 runner at the marked gates and stand it upright. Check that it moves: flex the elbow up to the shown point and back, then carefully move the lower joint.',
  });
  const msf = right ? 'MSF-1-4' : 'MSF-1-3';
  const mFrom = [0, 10, 50];
  part(kit, msf, sh, [
    [sphere(4.2, 18), [0, 0, 0]],                                   // ball end (inside the chest socket)
    [ribbed(3.6, 10, 4, 'x'), [5, 0, 0]],                           // ribbed shoulder pipe
    [cyl(6, 6, 8, 24, 'z'), [13, 0, 0]],                            // shoulder joint ring
    [cyl(2.8, 2.8, 8.4, 16, 'z'), [13, 0, 0], null, MAT.frameDark],
    [cbox(6, 9, 6, 1), [13, -8, 0]],
    [cyl(4.8, 4.8, 9, 20), [13, -15, 0]],                           // roll-joint band
    [cbox(7.5, 25, 8, 1.4), [13, -31, 0]],                          // upper-arm bar
    [cyl(1.8, 1.8, 10.5, 12, 'x'), [13, -27, 1.5]],                 // pegs for the elbow side covers
    [cyl(1.8, 1.8, 10.5, 12, 'x'), [13, -37, -1.5]],
    [cbox(11, 8, 9, 1.4), [13, -43, 0]],                            // elbow fork
  ], { from: mFrom });
  segment(kit, msf, elbow, [
    [cyl(4.5, 4.5, 12, 20, 'x'), [0, 3.5, 0]],                     // double elbow joint
    [cyl(4.5, 4.5, 12, 20, 'x'), [0, -3.5, 0]],
    [cbox(12.5, 11, 6.5, 1.2), [0, 0, 0]],
    [cbox(7, 26, 8, 1.4), [0, -20, 0]],                              // forearm bar
    [cyl(2, 2, 4, 12), [0, -34.5, 0]],
    [sphere(3.4, 16), [0, -37, 0]],                                  // wrist ball
  ], { from: mFrom });

  // 3 ── elbow side covers
  const cIn = right ? `${C}-2` : `${C}-8`;
  const cOut = right ? `${C}-8` : `${C}-2`;
  kit.step('Elbow side covers', {
    pp, view: iv, focus, minDist: 100,
    desc: right ? 'Press C1② onto the elbow / lower upper-arm pegs from the inner (body) side, then close it with C1⑧ from the outer side.'
      : 'Press C2② onto the elbow / lower upper-arm pegs from the outer side, then close it with C2⑧ from the inner side.',
  });
  const coverOutline = [[-8, -25], [6.5, -25], [8, -28], [8, -40], [5.5, -47.5], [-5.5, -47.5], [-8, -41]];
  const cover = (x, sgn) => [
    [sidePlate(coverOutline, 3.5), [x, 0, 0]],
    [nub(1, 8, 5), [x + sgn * 2.1, -33, 0]],
    [cyl(2.6, 2.6, 1, 16, 'x'), [x + sgn * 2.1, -44.5, 0]],
  ];
  const coverIn = () => part(kit, cIn, sh, cover(7.25, -1), { from: [-28, 0, 0] });
  const coverOut = () => part(kit, cOut, sh, cover(18.75, 1), { from: [28, 0, 0] });
  if (right) { coverIn(); coverOut(); } else { coverOut(); coverIn(); }

  // 4-5 ── shoulder joint block around the ring
  kit.step('Shoulder joint block', {
    pp, view: 'frontR', focus, minDist: 100,
    desc: `Rotate the shoulder pipe joint 90° so that the ribbed pipe points inward (towards the body). Push the pink peg of ${C}③ into the shoulder ring and close it with ${C}④ from the other side.`,
  });
  const jHalf = (z, peg) => [
    [cbox(13, 13, 5.2, 1.6), [13, 0, z]],
    [nub(9, 1, 1), [13, 4, z + Math.sign(z) * 2.6]],
    ...(peg ? [[cyl(2.6, 2.6, 5, 16, 'z'), [13, 0, 0]]] : []),
  ];
  part(kit, `${C}-3`, sh, jHalf(2.9, right), { from: [0, 0, 26] });
  part(kit, `${C}-4`, sh, jHalf(-2.9, !right), { from: [0, 0, -26] });

  // 6 ── upper-arm roll joint shells
  kit.step('Upper arm roll joint', {
    pp, view: 'frontR', focus, minDist: 100,
    desc: `Enclose the pink roll-joint band just below the shoulder with ${C}⑦ (front) and ${C}① (rear).`,
  });
  const rHalf = (z) => [
    [cbox(14, 10, 7.8, 1.4), [13, -15, z]],
    [nub(10, 0.8, 0.8), [13, -13, z + Math.sign(z) * 3.9]],
    [nub(0.8, 6, 0.8), [9, -16, z + Math.sign(z) * 3.9]],
  ];
  part(kit, `${C}-7`, sh, rHalf(3.9), { from: [0, 0, 26] });
  part(kit, `${C}-1`, sh, rHalf(-3.9), { from: [0, 0, -26] });

  // 7 ── gold hydraulic cylinders
  kit.step('Wrist cylinders', {
    pp, view: iv, focus, minDist: 90,
    desc: 'Insert the two gold V1② cylinders into the pin holes on both sides of the lower forearm frame, just above the wrist ball.',
  });
  for (const sx of [1, -1]) {
    part(kit, 'V1-2', elbow, [
      [cyl(1.75, 1.75, 6, 16), [sx * 5.3, -33.5, 0]],
      [cyl(0.9, 0.9, 2.2, 10, 'x'), [sx * 4.1, -31.5, 0]],
    ], { from: [sx * 20, 0, 0] });
  }

  // 8 ── wrist block
  const wr = grp();
  wr.name = `wrist${side}`;
  elbow.add(wr);
  kit.step('Wrist block', {
    pp, view: 'frontR', focus, minDist: 90,
    desc: `Push the two chrome W③ piston rods into the holes on top of ${C}⑥ and set ${C}⑥ on the base plate ${C}⑤.`,
  });
  const rods = () => {
    for (const sx of [-1, 1]) {
      part(kit, 'W3', wr, [[cyl(0.95, 0.95, 12, 12), [sx * 5.3, -31.5, 0]]], { from: [0, 18, 0] });
    }
  };
  if (right) rods();
  part(kit, `${C}-6`, wr, [
    [cbox(12, 5, 10, 1.8), [0, -40, 0]],
    [cyl(1.4, 1.4, 0.4, 12), [5.3, -37.4, 0], null, MAT.frameInsert],
    [cyl(1.4, 1.4, 0.4, 12), [-5.3, -37.4, 0], null, MAT.frameInsert],
  ], { from: [0, -14, 10] });
  if (!right) rods();
  part(kit, `${C}-5`, wr, [
    [flatPlate([[-6, -3], [-4, -5], [4, -5], [6, -3], [6, 3], [4, 5], [-4, 5], [-6, 3]], 3), [0, -44, 0]],
    [cyl(3.4, 3.4, 0.6, 18), [0, -45.6, 0], null, MAT.frameInsert],
  ], { from: [0, -20, 0] });

  // 9 ── wrist block onto the wrist ball
  kit.step('Wrist block onto the wrist ball', {
    pp, view: 'frontR', focus, minDist: 90,
    desc: 'Push the wrist block up onto the wrist ball at the bottom of the forearm: the two W③ rods slide up into the V1② cylinders. The half-pink ball opening faces as shown in the bottom view.',
  });
  kit.join(wr, [0, -22, 18]);

  // 10 ── forearm shells with the metal arm part
  const fIn = right ? 'C1-10' : 'C1-12';
  const fOut = right ? 'C1-9' : 'C1-11';
  kit.step('Forearm shells & metal arm part', {
    pp, view: sv, focus, minDist: 100,
    desc: `Set the METAL ARM PART into the round seat of ${right ? 'C1⑨' : 'C1⑪'} first, then close the forearm frame with ${right ? 'C1⑩' : 'C1⑫'} and ${right ? 'C1⑨' : 'C1⑪'}. The metal disc stays visible through the round window (the shield is held here by a magnet).`,
  });
  part(kit, 'METAL-ARM-PART', elbow, [
    [cyl(4.4, 4.4, 1.2, 28, 'x'), [11.6, -13, 0]],
    [cyl(3.4, 4.2, 0.5, 28, 'x'), [12.4, -13, 0]],
  ], { from: [24, 0, 0], mat: MAT.metalPart });
  part(kit, fIn, elbow, [
    [cbox(7.2, 23, 17, 1.6), [-3.6, -19.5, 0]],
    [nub(0.8, 12, 9), [-7.3, -18, 0]],                      // recessed side panel (Sticker B-24 / B-25)
    [nub(4, 1, 0.8), [-3.6, -10, 8.6]],
    [nub(4, 1, 0.8), [-3.6, -28, 8.6]],
  ], { from: [-24, 0, 0] });
  part(kit, fOut, elbow, [
    [cbox(7.2, 23, 17, 1.6), [3.6, -19.5, 0]],
    [cyl(4.8, 4.8, 4, 24, 'x'), [9, -13, 0]],               // round seat for the metal part
    [cyl(5.4, 5.4, 0.8, 24, 'x'), [7.4, -13, 0]],
    [nub(0.8, 8, 10), [7.3, -25.5, 0]],
    [nub(4, 1, 0.8), [3.6, -28, -8.6]],
  ], { from: [24, 0, 0] });

  // 11 ── sticker B-81
  kit.step('Forearm marking', {
    pp, view: 'back', focus, minDist: 90,
    desc: 'Turn the arm and apply Sticker B-81 to the flat panel in the middle of the back of the forearm.',
  });
  sticker(kit, 'StickerB-81', elbow, {
    w: 5.4, h: 4, p: [3.6, -19, -8.62], r: [0, PI, 0], color: '#c9cdd2',
    extra: [[cbox(4.4, 0.8, 0.02, 0), [3.6, -18, -8.66], [0, PI, 0], '#c8423a']],
  });

  // 12 ── elbow caps + side marking
  kit.step(right ? `Elbow caps · ${V} arm frame complete` : 'Elbow caps', {
    pp: right ? 29 : 31, view: sv, focus, minDist: 100,
    caution: 'V1⑤ is an under-gate part; mind the orientation of the key slot.',
    desc: `Press a gold V1⑤ cap onto the pink peg on each side of the elbow joint, then apply Sticker B-${right ? 25 : 24} in the recessed panel on the inner side of the forearm.`,
  });
  const hex = (x, rot) => [[capDisc(2.7, 1.6, 'x', 6), [x, 0, 0], rot]];
  part(kit, 'V1-5', elbow, hex(6.3, [0, 0, 0]), { from: [22, 0, 0] });
  part(kit, 'V1-5', elbow, hex(-6.3, [0, PI, 0]), { from: [-22, 0, 0] });
  sticker(kit, right ? 'StickerB-25' : 'StickerB-24', elbow, {
    w: 6, h: 4, p: [-7.76, -24, 0], r: [0, -PI / 2, 0], color: '#b9bec5',
    extra: [[cbox(4.8, 0.7, 0.02, 0), [-7.8, -23, 0], [0, -PI / 2, 0], '#8b9096']],
  });
}

// ───── hands (hand space: wrist ball at the origin, palm towards -x / the body, thumb to the front) ─────

const wristBall = () => [
  [sphere(3.2, 16), [0, 0, 0]],
  [cyl(1.6, 1.6, 3, 12), [0, -2.5, 0]],
  [cbox(5, 3, 6, 0.6), [0, -4.5, 0]],
];

function gripHand(kit, R, side) {
  const A = R.arm[side];
  const F = A.fist;
  const right = side === 'R';
  const [wA, wB, rIn, rOut] = right ? ['W9', 'W10', 'R2', 'R1'] : ['W11', 'W12', 'R4', 'R3'];
  kit.step(`Gripping hand (${right ? 'right' : 'left'})`, {
    pp: right ? 29 : 31, view: right ? 'frontR' : 'frontL', focus: F, minDist: 60,
    caution: `${wA} is an under-gate part: trim the gate remains cleanly.`,
    desc: `Press the chrome knuckle block ${wB} into the curled-finger frame ${wA}, push the wrist ball F2⑩ into its socket, then close the fist with ${rIn} (thumb side) and ${rOut} (back of the hand and finger fronts, with a small window).`,
  });
  part(kit, wA, F, [
    [cbox(2.4, 12, 12, 0.6), [0.4, -10, 0]],
    [cbox(5, 3.6, 12, 0.6), [-1, -18.3, 0]],
  ], { from: [0, -10, 22] });
  part(kit, wB, F, [
    [cbox(2.4, 5, 6, 0.5), [4.6, -13.5, 1.5]],
    [cbox(1.2, 3.6, 3.6, 0.3), [6.8, -13, 2.5]],               // shows through the window of the outer shell
  ], { from: [18, 0, 10] });
  part(kit, 'F2-10', F, wristBall(), { from: [0, 16, 0] });
  part(kit, rIn, F, [
    [cbox(5.2, 14, 15, 1.8), [-2.4, -9.5, 0]],
    [cbox(4, 6, 3, 1), [-2.6, -6, 7.4]],
    [cbox(4, 9, 4.2, 1.2), [-4, -9, 8.6], [0.35, 0, -0.3]],     // thumb
  ], { from: [-22, 0, 8] });
  const fingers = [];
  for (const z of FINGER_Z) {
    fingers.push([cbox(8.5, 5.5, 3.3, 1.1), [-1, -19, z]]);
    fingers.push([cbox(4, 6, 3.2, 1), [-5.6, -15.5, z]]);
  }
  part(kit, rOut, F, [
    [cbox(5.2, 14, 15, 1.8), [2.4, -9.5, 0]],
    [tbox(3, 13, 2.5, 11, 12, { c: 0.8 }), [5.2, -9.5, 0]],
    ...fingers,
  ], { from: [24, -4, 0] });
}

function openHand(kit, R, side) {
  const right = side === 'R';
  const s = right ? -1 : 1;
  // display spare lying palm-down on the mat in front of the kit
  const oh = grp([s * 70, 6.8, 90], [0, 0, s * PI / 2]);
  if (right) oh.scale.x = -1;
  oh.name = `openHand${side}`;
  R.options.add(oh);
  const [w, rIn, rOut] = right ? ['W4', 'R6', 'R5'] : ['W19', 'R8', 'R7'];
  kit.step(`Open hand (${right ? 'right' : 'left'})`, {
    pp: right ? 29 : 31, view: 'top', focus: oh, minDist: 60,
    desc: `Build the spare open hand: push the wrist ball F2⑩ into the chrome frame ${w}, then close it with ${rIn} (palm with the long thumb) and ${rOut} (back of the hand). It is kept as an alternative to the gripping hand.`,
  });
  part(kit, w, oh, [
    [cbox(1.4, 14, 13, 0.4), [0, -9.5, 0]],
    ...FINGER_Z.map((z) => [cbox(1.2, 13, 2.2, 0.3), [0, -22.5, z * 1.08]]),
  ], { from: [0, 20, 0] });
  part(kit, 'F2-10', oh, wristBall(), { from: [0, 12, 0] });
  part(kit, rIn, oh, [
    [cbox(4.6, 14, 15, 1.6), [-2.9, -9.5, 0]],
    ...FINGER_Z.map((z) => [cbox(2.6, 13, 3.2, 0.8), [-1.9, -22.5, z * 1.08]]),
    [cbox(3.6, 11, 4, 1), [-3.5, -11, 9.8], [0.55, 0, -0.35]],   // long thumb
  ], { from: [-18, 0, 0] });
  part(kit, rOut, oh, [
    [cbox(4.6, 14, 15, 1.6), [2.9, -9.5, 0]],
    [tbox(3, 13, 2.5, 11, 12, { c: 0.8 }), [5.4, -9.5, 0]],
    ...FINGER_Z.map((z) => [cbox(2.6, 13, 3.2, 0.8), [1.9, -22.5, z * 1.08]]),
  ], { from: [18, 0, 0] });
}

// ───── shoulder block (F2) + attaching the arm to the chest ─────

function shoulderBlock(kit, R, side) {
  const A = R.arm[side];
  const right = side === 'R';
  const V = right ? 'right' : 'left';
  const shB = grp();
  shB.name = `shoulderBlock${side}`;
  A.sh.add(shB);
  A.shB = shB;

  kit.step('Shoulder block', {
    pp: right ? 30 : 31, view: 'frontR', focus: A.root, minDist: 100,
    caution: 'Do not forget F2⑭. Do not cut the tabs marked on F2⑬ and F2⑮: they are part of the pieces.',
    desc: 'Put the hinge block F2⑭ between F2⑬ and F2⑮, then sandwich the core with the side plates F2⑪ and F2⑫. The underside forms a U-shaped channel.',
  });
  const core = (z) => [
    [cbox(16, 7, 8, 1.2), [13, 13.5, z]],
    [nub(12, 0.8, 1.2), [13, 17.2, z * 0.6]],
    [cbox(3, 5, 2, 0.4), [5.5, 12.5, z * 1.3]],                 // do-not-cut runner tab
  ];
  part(kit, 'F2-13', shB, core(4.2), { from: [0, 12, 22] });
  part(kit, 'F2-14', shB, [
    [cbox(7, 6, 12, 1), [13, 9, 0]],
    [cyl(1.8, 1.8, 13, 12, 'z'), [13, 8, 0], null, MAT.frameInsert],
  ], { from: [0, 20, 0] });
  part(kit, 'F2-15', shB, core(-4.2), { from: [0, 12, -22] });
  const sideOutline = [[6, -3], [9.5, -3], [10.5, 0], [15.5, 0], [16.5, -3], [20, -3], [21, -1], [21, 15.5], [19.5, 17], [6.5, 17], [5, 15.5], [5, -1]];
  const sidePl = (z) => [
    [frontPlate(sideOutline, 4), [0, 0, z]],
    [nub(4, 3, 1), [9, 10, z + Math.sign(z) * 2.3]],
    [nub(4, 3, 1), [17, 10, z + Math.sign(z) * 2.3]],
    [cyl(1.4, 1.4, 1, 12, 'z'), [13, 5, z + Math.sign(z) * 2.2], null, MAT.frameInsert],
  ];
  part(kit, 'F2-11', shB, sidePl(8.5), { from: [0, 0, 24] });
  part(kit, 'F2-12', shB, sidePl(-8.5), { from: [0, 0, -24] });

  kit.step(`Attach the ${V} arm`, {
    pp: right ? 30 : 31, view: right ? 'frontR' : 'frontL', focus: 'upper', minDist: 150,
    caution: 'Choose one: the gripping hand or the open hand.',
    desc: `Set the shoulder block onto the top of the arm (its U-channel straddles the shoulder joint), push the pink ribbed shoulder pipe into the round shoulder socket on the ${V} side of the chest frame, and plug the gripping hand into the wrist block (or the open hand instead).`,
  });
  kit.join(shB, [0, 26, 0]);
  kit.join(A.root, right ? BENCH.armR : BENCH.armL);
  kit.join(A.fist, [0, -22, 22]);
}

// ───────────────────────── PHASE 03 · ARM TRUSS-FRAME ─────────────────────────

export function armTruss(kit, R) {
  kit.section('ARMS-TRUSS-FRAME', { pp: 38 });
  kit.block('RIGHT-ARM-TRUSS-FRAME ASSEMBLE', { pp: 38 });
  armTrussSide(kit, R, 'R');
  kit.block('LEFT-ARM-TRUSS-FRAME ASSEMBLE', {
    pp: 39, compact: true,
    desc: 'Same as the right arm, mirrored: clip T5⑲ into T5⑳ (outer end of the shoulder block) and T5⑲ into T5㉑ (front slot), apply Etching sticker 5 on the top of the shoulder block, fit the chrome bracket W②, then the silver-plated forearm truss plates S4⑮ (outer) and S4⑭ (inner).',
  });
  armTrussSide(kit, R, 'L');
}

function armTrussSide(kit, R, side) {
  const A = R.arm[side];
  const { sh, elbow } = A;
  const shB = A.shB || sh;
  const right = side === 'R';
  const sv = right ? 'right' : 'left';
  const iv = right ? 'left' : 'right';
  const [tOut, tFront] = right ? ['T5-21', 'T5-20'] : ['T5-20', 'T5-21'];
  const focus = A.root;

  kit.step('Shoulder truss', {
    pp: right ? 38 : 39, view: right ? 'frontR' : 'frontL', focus, minDist: 100,
    caution: 'Mind the orientation of Etching sticker 5 (see the "!" mark).',
    desc: `Clip a T5⑲ into ${tOut} and another T5⑲ into ${tFront}. Mount the ${tOut} unit on the outer top end of the shoulder block and push the ${tFront} unit into the slot on the front of the block near the arm joint. Apply Etching sticker 5 in the top-front recess of the shoulder block and fit the chrome bracket W② on the front of the upper arm, just below the block.`,
  });
  const clip = (p, axis) => {
    // C-shaped clip: back bar + two jaws
    const jaw = axis === 'x' ? [2.6, 1.1, 5] : [5, 1.1, 2.6];
    const back = axis === 'x' ? [1.1, 6, 5] : [5, 6, 1.1];
    const d = axis === 'x' ? [1.2, 0, 0] : [0, 0, 1.2];
    return [
      [cbox(...back, 0.3), [p[0] + d[0], p[1], p[2] + d[2]]],
      [cbox(...jaw, 0.3), [p[0], p[1] + 2.5, p[2]]],
      [cbox(...jaw, 0.3), [p[0], p[1] - 2.5, p[2]]],
    ];
  };
  const outFirst = () => {
    part(kit, 'T5-19', shB, clip([23.6, 11, 0], 'x'), { from: [16, 10, 0] });
    part(kit, tOut, shB, [[lattice(16, 9, 2.4, 2, 1, 1.2, 0.8), [22.3, 11, 0], RY]], { from: [26, 10, 0] });
  };
  const frontFirst = () => {
    part(kit, 'T5-19', shB, clip([13, 3.5, 13.4], 'z'), { from: [0, 6, 18] });
    part(kit, tFront, shB, [[lattice(16, 9, 2.4, 2, 1, 1.2, 0.8), [13, 3.5, 11.9]]], { from: [0, 6, 26] });
  };
  if (right) { outFirst(); frontFirst(); } else { outFirst(); frontFirst(); }
  sticker(kit, 'ETCH-5', shB, { w: 13, h: 3.4, p: [13, 17.08, 6.2], r: [-PI / 2, 0, 0], color: 'etching' });
  part(kit, 'W2', sh, [
    [merge([cbox(8, 1.4, 4.6, 0.3), { p: [0, 2, 0] }], [cbox(8, 5, 1.4, 0.3), { p: [0, -0.4, 2], r: [-0.35, 0, 0] }], [cbox(1.2, 4, 3.4, 0.3), { p: [0, 0, 0.6] }]), [13, -6.5, 9.6]],
  ], { from: [0, 0, 20] });

  kit.step('Forearm truss plates', {
    pp: right ? 38 : 39, view: sv, focus, minDist: 100,
    caution: 'Under-gate parts: trim the gate remains cleanly.',
    desc: `Press the silver-plated truss plates ${right ? 'S4⑰' : 'S4⑮'} (outer) and ${right ? 'S4⑯' : 'S4⑭'} (inner) onto both sides of the forearm frame.`,
  });
  part(kit, right ? 'S4-17' : 'S4-15', elbow, [[lattice(13, 13, 1, 1, 2, 1.2, 0.8), [8.1, -25, 0], RY]], { from: [22, 0, 0] });
  part(kit, right ? 'S4-16' : 'S4-14', elbow, [[lattice(13, 13, 1, 1, 2, 1.2, 0.8), [-8.1, -25, 0], RY]], { from: [-22, 0, 0] });
  void iv;
}

// ───────────────────────── PHASE 04 · ARMS-ARMOR ─────────────────────────

export function armArmor(kit, R) {
  kit.section('ARMS-ARMOR', { pp: 48 });
  kit.block('RIGHT-ARM-ARMOR ASSEMBLE', { pp: 48 });
  armArmorSide(kit, R, 'R');
  kit.block('LEFT-ARM-ARMOR ASSEMBLE', {
    pp: 50, compact: true,
    desc: 'Same as the right arm with the L4 parts: I1⑤ on top of the upper arm; the shoulder armor on the lifted shoulder block (L4⑱, I1②, I1① + L4⑰, I1③ + L4⑯); I1⑥ + L4⑬ and L4⑭ around the upper arm; lower the shoulder armor back on and fit the elbow caps L4⑮ ×2; L4⑲ and L4⑳ at the elbow crook, I1④; the wrist clamps L4⑪ + L4⑫; the forearm covers L3㉔ (outer) and I1⑧ + L3㉕ (inner / front); L4㉑, I1⑦ (slide down to lock) and I1⑨ at the back; finally the dark gray wrist cuff U1① on the hand (pp.50-51).',
  });
  armArmorSide(kit, R, 'L');
}

function armArmorSide(kit, R, side) {
  const A = R.arm[side];
  const { sh, elbow, hand } = A;
  const right = side === 'R';
  const L = right ? 'L3' : 'L4';
  const sv = right ? 'right' : 'left';
  const iv = right ? 'left' : 'right';
  const fv = right ? 'frontR' : 'frontL';
  const bv = right ? 'backR' : 'backL';
  const focus = A.root;
  const pA = right ? 48 : 50, pB = right ? 49 : 51;

  // p.48 panel 4 ── upper arm top cap
  kit.step('Upper arm top cap', {
    pp: pA, view: fv, focus, minDist: 110,
    desc: 'Lift the shoulder block off the top of the arm (1) and fit I1⑤ over the top of the upper arm (2).',
  });
  const capOut = [[4, -8.5], [5.5, -10.5], [20.5, -10.5], [22, -8.5], [22, 8.5], [20.5, 10.5], [5.5, 10.5], [4, 8.5]];
  const capIn = [[6, -8.6], [20, -8.6], [20, 8.6], [6, 8.6]];
  part(kit, 'I1-5', sh, [
    [holedXZ(capOut, [capIn], 11.5, 0.8), [0, -15.25, 0]],
    [nub(10, 0.8, 1), [13, -12, 10.7]],
  ], { from: [0, 0, 26] });

  // shoulder armor: assembled on the lifted shoulder block, lowered back on in p.49 panel 2
  const shA = grp();
  shA.name = `shoulderArmor${side}`;
  sh.add(shA);

  kit.step('Shoulder armor top', {
    pp: pA, view: fv, focus, minDist: 110,
    desc: `Inset ${L}⑱ into the side of the shoulder block (1), then fit the top cover I1② over it (2): the gray top of the block shows through its slot.`,
  });
  part(kit, `${L}-18`, shA, [
    [cbox(5, 6, 1.6, 0.4), [3.5, 11.5, 15.4], [0, -0.5, 0]],
    [cyl(1, 1, 3, 10, 'z'), [3.2, 11.5, 14]],
  ], { from: [-10, 0, 18] });
  const topOut = [[-2.5, -15], [2.5, -20], [24, -20], [29, -15], [29, 15], [24, 20], [2.5, 20], [-2.5, 15]];
  const topSlot = [[6, -10.6], [20, -10.6], [20, 10.6], [6, 10.6]];
  part(kit, 'I1-2', shA, [
    [holedXZ(topOut, [topSlot], 3, 1), [0, 16, 0]],
    [nub(24, 0.6, 1), [13.25, 17.3, 15.5]],
  ], { from: [0, 22, 0] });

  kit.step('Shoulder armor faces', {
    pp: pA, view: fv, focus, minDist: 110,
    caution: 'Tightly fit the parts as far as they will go.',
    desc: `Fit I1③ and ${L}⑯ on the outer face of the shoulder block, then I1① and ${L}⑰ on the inner face.`,
  });
  const uOut = [[13.5, 20], [24, 20], [29, 15], [29, -15], [24, -20], [13.5, -20], [13.5, -17.5], [23, -17.5], [26.5, -14], [26.5, 14], [23, 17.5], [13.5, 17.5]];
  const uIn = mirX(uOut.map(([x, z]) => [x - 26.5, z])).map(([x, z]) => [x, z]); // same U, face at x -2.5..0
  part(kit, 'I1-3', shA, [
    [flatPlate(uOut, 16.5), [0, 6.25, 0]],
    [cbox(1, 11, 22, 0.4), [29.3, 6.5, 0]],
  ], { from: [24, 0, 0] });
  part(kit, `${L}-16`, shA, [
    [flatPlate(uOut, 22), [0, -13, 0]],
    [cbox(1, 15, 22, 0.4), [29.3, -12.5, 0]],
    [nub(1, 1, 16), [28.9, -22, 0]],
  ], { from: [24, -8, 0], hatch: { axis: [0, 0, 1], angle: 0.85, pivot: [29, -2, 0] } });
  part(kit, 'I1-1', shA, [
    [flatPlate(uIn, 9.5), [0, 9.75, 0]],
    [cbox(0.8, 1.4, 18, 0.2), [-2.8, 11.5, 0], null, MAT.whiteGray],
    [cbox(0.8, 1.4, 18, 0.2), [-2.8, 8, 0], null, MAT.whiteGray],
  ], { from: [-22, 4, 0], hatch: { axis: [0, 0, 1], angle: -0.7, pivot: [-2.5, 14.5, 0] } });
  const innerCorner = [[-2.5, 15], [2.5, 20], [13.5, 20], [13.5, 17.5], [3.5, 17.5], [0, 14]];
  const faceZY = [[-15, -24], [15, -24], [15, 5], [-15, 5]];
  part(kit, `${L}-17`, shA, [
    [holedZY(faceZY, [circ(0, 0, 5.2, 18)], 2.5, 0.6), [-1.25, 0, 0]],
    [flatPlate(innerCorner, 29), [0, -9.5, 0]],
    [flatPlate(mirZ(innerCorner), 29), [0, -9.5, 0]],
    [cbox(1, 10, 18, 0.4), [-2.9, -14, 0]],
  ], { from: [-24, -6, 0] });

  // p.49 panel 1 ── upper arm armor
  kit.step('Upper arm armor', {
    pp: pB, view: fv, focus, minDist: 110,
    desc: `Push ${L}⑬ into the fork-shaped front plate I1⑥ and fit it on the front of the upper arm, below I1⑤. Close the upper arm with the U-shaped cover ${L}⑭ from the outer / rear side.`,
  });
  const hOut = [[3.5, -21], [22.5, -21], [22.5, -38], [18, -38], [16.5, -35], [9.5, -35], [8, -38], [3.5, -38]];
  const hWin = [[9, -24.5], [17, -24.5], [17, -33], [9, -33]];
  part(kit, 'I1-6', sh, [
    [holed(hOut, [hWin], 2.5, 0.6), [0, 0, 10.25]],
  ], { from: [0, 0, 24] });
  part(kit, `${L}-13`, sh, [
    [cbox(7.6, 8.2, 1.8, 0.4), [13, -28.8, 10]],
    [nub(5, 0.8, 0.6), [13, -27, 10.9]],
  ], { from: [0, 0, 18] });
  const uArm = [[3, 9], [3, -8.5], [6, -11.5], [20, -11.5], [23, -8.5], [23, 9], [21, 9], [21, -8], [19, -9.5], [7, -9.5], [5, -8], [5, 9]];
  part(kit, `${L}-14`, sh, [
    [flatPlate(uArm, 18.5), [0, -30.25, 0]],
    [frontPlate([[-4.5, -4.5], [4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]], 0.7), [23.3, -30.5, 0], RY],
  ], { from: [24, 0, -12] });

  // p.49 panel 2 ── shoulder armor back on, elbow caps
  kit.step('Shoulder armor on · elbow caps', {
    pp: pB, view: sv, focus, minDist: 120,
    caution: `Mind the orientation of the slash on ${L}⑮.`,
    desc: `Lower the finished shoulder armor block back onto the shoulder. Fit an elbow cap ${L}⑮ on each side of the elbow joint.`,
  });
  kit.join(shA, [0, 40, 0]);
  const elbowCap = (x, rot) => [
    [capDisc(5.6, 1.8, 'x'), [x, 0, 0], rot],
    [cbox(0.6, 7, 1.2, 0.2), [x + Math.sign(x) * 1.7, 0, 0], [0.6, 0, 0]],
  ];
  part(kit, `${L}-15`, elbow, elbowCap(8.6, [0, 0, 0]), { from: [20, 0, 0] });
  part(kit, `${L}-15`, elbow, elbowCap(-8.6, [0, PI, 0]), { from: [-20, 0, 0] });

  // p.49 panel 3 ── elbow crook
  kit.step('Elbow crook covers', {
    pp: pB, view: fv, focus, minDist: 110,
    desc: `Bend the forearm and fit the wedge ${L}⑲ at the front of the lower upper arm and the plate ${L}⑳ at the top front of the forearm.`,
  });
  part(kit, `${L}-19`, sh, [
    [hull([[4.5, -38, 6.5], [21.5, -38, 6.5], [4.5, -38, 11.5], [21.5, -38, 11.5], [5.5, -44, 6], [20.5, -44, 6], [5.5, -43, 9.5], [20.5, -43, 9.5]])],
  ], { from: [0, -6, 18] });
  part(kit, `${L}-20`, elbow, [
    [frontPlate([[-9, -3.5], [9, -3.5], [8, 3.5], [-8, 3.5]], 2), [0, -5.5, 10.9], [-0.25, 0, 0]],
    [nub(10, 0.8, 0.6), [0, -4.5, 12]],
  ], { from: [0, 4, 18] });

  // p.49 panel 4 ── inner elbow H plate
  kit.step('Inner elbow plate', {
    pp: pB, view: fv, focus, minDist: 100,
    caution: 'Mind the orientation of I1④.',
    desc: 'Fit the H-shaped plate I1④ into the crook of the elbow, then swing the forearm back.',
  });
  const H = [[-7, -5], [-3, -5], [-3, -1.5], [3, -1.5], [3, -5], [7, -5], [7, 5], [3, 5], [3, 1.5], [-3, 1.5], [-3, 5], [-7, 5]];
  part(kit, 'I1-4', elbow, [[frontPlate(H, 1.8), [0, 0, 7.4]]], { from: [0, 0, 18] });

  // p.49 panel 5 ── wrist clamps
  kit.step('Wrist clamps', {
    pp: pB, view: fv, focus, minDist: 100,
    desc: `Close the wrist end of the forearm with the C-shaped clamps ${L}⑪ (front) and ${L}⑫ (rear).`,
  });
  const clampC = [[-12, 0], [-12, 10], [-9.5, 13], [9.5, 13], [12, 10], [12, 0], [10, 0], [10, 9.5], [8.5, 11], [-8.5, 11], [-10, 9.5], [-10, 0]];
  part(kit, `${L}-11`, elbow, [
    [flatPlate(clampC, 7), [0, -39.5, 0]],
    [nub(12, 1, 0.8), [0, -38, 13.2]],
  ], { from: [0, 0, 20] });
  part(kit, `${L}-12`, elbow, [
    [flatPlate(mirZ(clampC), 7), [0, -39.5, 0]],
  ], { from: [0, 0, -20] });

  // p.49 panel 6 ── forearm side covers
  const [fOut, fIn] = right ? ['L3-22', 'L3-23'] : ['L3-24', 'L3-25'];
  kit.step('Forearm side covers', {
    pp: pB, view: fv, focus, minDist: 110,
    caution: `Do not cut the tabs marked on ${fOut} and ${fIn}.`,
    desc: `Fit the tall outer panel ${fOut} (its round opening goes around the metal arm part), push I1⑧ into ${fIn}, and fit ${fIn} over the inner side and the front of the forearm.`,
  });
  const outerZY = [[-10, -36], [9, -36], [9, -10.5], [7.5, -9], [-8.5, -9], [-10, -10.5]];
  const slideUp = { axis: [0, 0, 1], angle: -0.014, pivot: [500, -22, 0] };   // ≈7 mm slide up
  part(kit, fOut, elbow, [
    [holedZY(outerZY, [circ(-13, 0, 5.3, 20).map(([a, b]) => [b, a])], 2, 0.6), [10.8, 0, 0]],
    [torus(6.1, 0.8, 28, 'x'), [11.8, -13, 0]],
    [nub(0.8, 12, 5), [12, -28, -3]],
  ], { from: [22, 0, 0], hatch: { axis: [0, 1, 0], angle: -0.8, pivot: [11.8, -22, 9] } });
  part(kit, 'I1-8', elbow, [
    [cbox(8, 10, 1.2, 0.4), [-1, -23, 13.2]],
    [nub(5, 0.8, 0.6), [-1, -20, 13.9]],
  ], { from: [0, 0, 16], hatch: slideUp });
  const innerL = [[-11.8, -11], [-9.8, -11], [-9.8, 10.8], [9.8, 10.8], [9.8, 9], [11.8, 9], [11.8, 10.3], [9.3, 12.8], [-9.3, 12.8], [-11.8, 10.3]];
  part(kit, fIn, elbow, [
    [flatPlate(innerL, 27), [0, -22.5, 0]],
    [nub(0.8, 16, 12), [-12, -22, 0]],
  ], { from: [-22, 0, 14], hatch: slideUp });

  // p.49 panels 7-8 ── rear of the forearm
  kit.step('Forearm rear covers', {
    pp: pB, view: bv, focus, minDist: 110,
    desc: `Set ${L}㉑ in the rear recess, fit the long rear plate I1⑦ (slide it down until it locks) and the U-shaped cover I1⑨ at the rear of the forearm, just below the elbow.`,
  });
  part(kit, `${L}-21`, elbow, [[cbox(10, 5, 2.2, 0.5), [0, -30, -11.1]]], { from: [0, 0, -18] });
  const rearOut = [[-10.3, -36], [10.3, -36], [10.3, -11], [8, -8], [-8, -8], [-10.3, -11]];
  const jig = [[-6, -27], [6, -27], [6, -33], [2, -33], [2, -31.5], [-2, -31.5], [-2, -33], [-6, -33]];
  part(kit, 'I1-7', elbow, [
    [holed(rearOut, [jig], 2, 0.6), [0, 0, -11.8]],
    [nub(12, 0.8, 0.6), [0, -14, -12.9]],
  ], { from: [0, 14, -10] });
  const uRear = [[-11, -5.5], [-11, -10.5], [-8.5, -13], [8.5, -13], [11, -10.5], [11, -5.5], [9, -5.5], [9, -10], [8, -11], [-8, -11], [-9, -10], [-9, -5.5]];
  part(kit, 'I1-9', elbow, [
    [flatPlate(uRear, 11), [0, -2.5, 0]],
    [nub(12, 1, 0.8), [0, 0.5, -13.1]],
  ], { from: [0, 0, -20] });

  // p.49 panel 9 ── wrist cuff on the hand
  kit.step(right ? 'Wrist cuff · right arm armor complete' : 'Wrist cuff', {
    pp: pB, view: sv, focus, minDist: 110,
    desc: 'Fit the dark gray U-shaped cuff U1① onto the outer side of the wrist of the hand (gripping or open hand).',
  });
  const cuff = [[-3, 10.5], [6.5, 10.5], [9.5, 7.5], [9.5, -7.5], [6.5, -10.5], [-3, -10.5], [-3, -8.5], [6, -8.5], [7.5, -7], [7.5, 7], [6, 8.5], [-3, 8.5]];
  part(kit, 'U1-1', hand, [
    [flatPlate(cuff, 6.5), [0, 2.25, 0]],
    [nub(0.8, 3, 10), [9.7, 2.25, 0]],
  ], { from: [18, -6, 0] });
  void iv;
}
