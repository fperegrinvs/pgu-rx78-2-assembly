// PHASE 05 · OPTIONS (manual pp.52-63): beam rifle, beam sabers, shield, Core Fighter, weapon-holding hands,
// how to attach the weapons, gimmicks and the LED unit.
//
// Weapons are built in their own groups under R.options at their FINAL pose (rifle in the right trigger hand,
// shield on the left forearm) and wait on the cutting mat (kit.join bench pose) until the "How to attach" steps.
// Everything that stays a display piece (Core Fighter, spare weapon hands, second saber) is final on the mat.
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp, parseId } from '../kit.js';
import { cbox, tbox, cyl, sphere, hull, lathe, torus, rimPlate } from '../geom.js';
import { part, sidePlate, flatPlate, frontPlate, capDisc, tube, ribbed, slats, merge } from './util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const L = (id) => parseId(id).label;
const PI = Math.PI;

const lensGreen = new THREE.MeshPhysicalMaterial({ color: '#2fcf86', roughness: 0.08, metalness: 0.2, clearcoat: 1 });
const lensLed = new THREE.MeshPhysicalMaterial({ color: '#f4f8ff', roughness: 0.1, metalness: 0, clearcoat: 1, emissive: '#223040' });
const bore = new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.8 });

// ───────────────────────── pose helpers ─────────────────────────

/** Put `group` (child of any parent) at a world position with the given world axis directions. */
function placeWorld(group, pos, ax, ay, az) {
  const parent = group.parent;
  parent.updateMatrixWorld(true);
  const inv = parent.matrixWorld.clone().invert();
  const lp = pos.clone().applyMatrix4(inv);
  const [x, y, z] = [ax, ay, az].map((v) => v.clone().transformDirection(inv));
  group.position.copy(lp);
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

/** Bench offset / rotation for kit.join so that `group` waits at a world pose (origin at pos, axes ax/ay/az). */
function benchFor(group, pos, ax, ay, az) {
  const parent = group.parent;
  parent.updateMatrixWorld(true);
  const inv = parent.matrixWorld.clone().invert();
  const lp = pos.clone().applyMatrix4(inv);
  const [x, y, z] = [ax, ay, az].map((v) => v.clone().transformDirection(inv));
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  const rel = group.quaternion.clone().invert().multiply(q);
  const e = new THREE.Euler().setFromQuaternion(rel);
  return [lp.sub(group.position).toArray(), [e.x, e.y, e.z]];
}

/** Half of a lathe (phi 0..PI = +x side, or the -x side), with the flat cut face closed. */
function halfLathe(profile, side = 1, seg = 16) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg, side > 0 ? 0 : PI, PI);
  const ys = profile.map((p) => p[1]);
  const rmax = Math.max(...profile.map((p) => p[0]));
  const h = Math.max(...ys) - Math.min(...ys);
  const cap = new THREE.BoxGeometry(0.2, h, rmax * 2 * 0.98);
  cap.translate(side * 0.1, (Math.max(...ys) + Math.min(...ys)) / 2, 0);
  return merge(g, cap);
}

/** Extruded outline (x,y) with rectangular holes, thickness t along z, centred. */
function holedPlate(outline, holes, t) {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -t / 2);
  return g;
}

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ───────────────────────── hands (left-hand space: wrist ball at origin, fingers -y, palm -x, thumb +z) ─────────

/** Palm unit A / C: wrist joint, chrome frame, palm plate, back shell, back armor (+ key for the trigger hand). */
function palmUnit(kit, g, ids, { trigger }) {
  const [frame, palm, shell, key] = ids;
  // wrist joint F2-10 (ball + stub) goes into the chrome frame first
  part(kit, frame, g, [
    [cbox(4, 11, 12.5, 0.5), [1.5, -11, -0.5]],
    [cbox(3, 4, 7, 0.4), [1.5, -4.5, -0.5]],
  ], { from: [22, -6, 0] });
  part(kit, 'F2-10', g, [
    [sphere(3.4, 16), [0, 0, 0]],
    [cyl(2.1, 2.3, 4.5, 14, 'y'), [0, -3.2, 0]],
  ], { from: [0, 24, 0] });
  part(kit, palm, g, [
    [cbox(1.8, 11, 13.5, 0.5), [-1.2, -11, -0.5]],
    [cbox(3, 3.2, 3.2, 0.8), [-3.2, -6.6, 5]],                       // thumb root
    [cbox(2.6, 7, 2.8, 0.8), [-5.8, -9.5, trigger ? 5 : 5.6], [0, 0, -0.9]], // thumb
  ], { from: [-24, 0, 0] });
  part(kit, shell, g, [
    [cbox(3.4, 13, 14, 1), [4.6, -10.5, -0.5]],
    [cbox(2.4, 3, 14, 0.6), [3.6, -17.6, -0.5]],
  ], { from: [26, 0, 0] });
  return key;
}
function backArmor(kit, g, key, { onArm = false } = {}) {
  // U1① wrist cuff (same part as on the standard hands); on the arm it sits over the arm's own cuff
  const cuff = [[-3, 10.5], [6.5, 10.5], [9.5, 7.5], [9.5, -7.5], [6.5, -10.5], [-3, -10.5], [-3, -8.5], [6, -8.5], [7.5, -7], [7.5, 7], [6, 8.5], [-3, 8.5]];
  // on the arm the cuff moves from the standard hand to the weapon hand: retire the arm's own U1-1
  if (onArm) for (const p of kit.parts) if (p.id === 'U1-1' && p.until == null && p.obj.parent === g.parent) p.until = kit.cur.index;
  const s = 1;
  part(kit, 'U1-1', g, [
    [flatPlate(cuff, 6.5), [0, 2.25, 0], null, null, [s, s, s]],
    [cbox(0.8, 3, 10, 0.3), [9.7 * s, 2.25, 0]],
  ], { from: [18, -6, 0] });
  if (key) part(kit, key, g, [[cbox(2, 2.4, 4, 0.4), [2.2, -4.4, -6.8]]], { from: [0, 0, -22] });
}
/** Finger unit B / D: chrome joint frame + dark gray finger cover wrapped round a grip (rifle) or hilt (saber). */
function fingerUnit(kit, g, frame, cover, { trigger }) {
  if (trigger) {
    part(kit, frame, g, [
      [cbox(10, 2.6, 8, 0.4), [-6, -19.6, -1.5]],
      [cbox(2.4, 6, 2.4, 0.4), [-0.6, -17, 2]],
    ], { from: [-10, -24, 0] });
    part(kit, cover, g, [
      [cbox(13, 3.8, 11, 1.1), [-6.5, -20.4, -2]],                // three fingers across the front of the grip
      [cbox(3, 8, 11, 1.1), [-12.6, -16.4, -1.8]],                  // finger tips round the far side
      [cbox(9, 2.6, 2.6, 0.8), [-5.8, -22, 4.8]],                     // index finger on the trigger
      [cbox(2.6, 2.4, 2.6, 0.7), [-10.2, -21.6, 4.8], [0, 0, 0.6]],
      [cbox(2, 3.6, 11, 0.6), [0.2, -18.6, -1.8]],                  // knuckle line
    ], { from: [-12, -26, 0] });
  } else {
    part(kit, frame, g, [
      [cbox(9, 2.6, 9, 0.4), [-5, -17.3, 0]],
      [cbox(2.4, 5, 2.4, 0.4), [-0.6, -15, 3]],
    ], { from: [-10, -24, 0] });
    part(kit, cover, g, [
      [cbox(11.5, 4, 13.5, 1.1), [-5, -18.4, 0]],
      [cbox(3, 7.5, 13.5, 1.1), [-10.2, -14, 0]],
      [cbox(2, 3.6, 13.5, 0.6), [0.4, -17, 0]],
    ], { from: [-12, -26, 0] });
  }
}

// ───────────────────────── the phase ─────────────────────────

export function options(kit, R) {
  const O = R.options;

  // ══════════════════════ BEAM RIFLE (pp.52-53) ══════════════════════
  // rifle space: +z barrel, +y up, +x the rifle's left (scope side); origin at the rear of the grip frame
  const rifle = grp(); rifle.name = 'beamRifle'; O.add(rifle);
  const G = V(0, -0.5, -4.5);           // point of the grip held by the hand

  kit.section('BEAM RIFLE', { pp: 52 });
  kit.step('Beam rifle · runners', {
    pp: 52, focus: 'all', view: 'frontR',
    desc: 'PHASE 05 builds the options. The beam rifle uses the U3 (dark gray) and V2 (gray) runners with gold V1, chrome W and the G2 scope lens.',
    caution: 'Do not forget to insert the outlined parts: the chrome ring W㉓ goes between the scope body U3⑳ and the lens G2⑭.',
  });
  kit.block('BEAM RIFLE ASSEMBLE', { pp: 53 });

  const recvHalf = (s) => [
    [cbox(4.5, 16, 52, 1.2), [s * 2.25, 13, -2]],
    [cbox(4.5, 24, 10, 1.6), [s * 2.25, -5, -6], [0.3, 0, 0]],        // pistol grip
    [cbox(1.6, 1.6, 12, 0.4), [s * 0.8, -1.6, 5.5]],                   // trigger guard
    [cbox(1.6, 6.5, 1.6, 0.4), [s * 0.8, 1.6, 11]],
    [cbox(4.6, 1.2, 40, 0.3), [s * 2.3, 16, -4]],                      // panel line rib
  ];
  kit.step('Receiver and grip, one side', {
    pp: 53, view: 'side', minDist: 100,
    desc: `Lay ${L('V2-13')} (receiver and pistol grip, one side) down and set the gold lever ${L('V1-9')} above the trigger opening.`,
  });
  part(kit, 'V2-13', rifle, recvHalf(1), { from: [26, 0, 0] });
  part(kit, 'V1-9', rifle, [
    [cbox(1.4, 2.6, 7, 0.4), [0.6, 7, 3]],
    [cyl(1, 1, 2.2, 12, 'x'), [0.6, 7, 6.6]],
  ], { from: [-20, 10, 0] });

  kit.step('Trigger and other half', {
    pp: 53, view: 'side', minDist: 100,
    desc: `Put the trigger ${L('U3-14')} in and close the receiver with ${L('V2-14')}.`,
  });
  part(kit, 'U3-14', rifle, [[cbox(1.8, 6, 2.2, 0.5), [0, 1.4, 6.2], [0.35, 0, 0]]], { from: [0, -20, 10] });
  part(kit, 'V2-14', rifle, [
    ...recvHalf(-1),
    [cyl(3.4, 3.4, 5, 16, 'z'), [-1, 13, 25.5]],                         // front barrel stub
  ], { from: [-26, 0, 0] });

  kit.step('Rear cap, top cover and sight', {
    pp: 53, view: 'backR', minDist: 100,
    desc: `Fit the rear cap ${L('U3-19')}, the chrome half-cylinder cover ${L('W24')} on top and the sight block ${L('U3-18')} in front of it.`,
  });
  part(kit, 'U3-19', rifle, [
    [cyl(3.4, 3.4, 7, 20, 'z'), [0, 14, -31.5]],
    [torus(2.3, 0.45, 18, 'z'), [0, 14, -35]],
  ], { from: [0, 0, -26] });
  part(kit, 'W24', rifle, [
    [cyl(3.5, 3.5, 14, 20, 'z'), [0, 21, -17], [0, 0, 0], null, [1, 0.8, 1]],
  ], { from: [0, 22, 0] });
  part(kit, 'U3-18', rifle, [
    [tbox(7, 6, 5, 4, 6, { c: 0.6, dz: 0.8 }), [0, 24, -6.5]],
    [cyl(1.3, 1.3, 7.2, 12, 'z'), [0, 25, -6.5], null, bore],
  ], { from: [0, 24, 0] });

  kit.step('Upper housing', {
    pp: 53, view: 'frontL', minDist: 100,
    desc: `Close the hinged upper housing: the louvered side plate ${L('U3-12')} on the right and the open window frame ${L('U3-17')} on the left.`,
  });
  part(kit, 'U3-12', rifle, [
    [cbox(3.2, 10, 30, 0.8), [-2.4, 26, 13]],
    [cbox(8, 1.6, 30, 0.5), [0, 31.1, 13]],
    [slats(22, 6, 1, 4, 0.5), [-4.2, 26, 14], [0, PI / 2, 0]],
  ], { from: [-24, 6, 0] });
  part(kit, 'U3-17', rifle, [
    [rimPlate(30, 10, 2, 3, 0.8), [2.4, 26, 13], [0, PI / 2, 0]],
  ], { from: [24, 6, 0], hatch: { axis: [0, 0, 1], angle: 1.3, pivot: [3.9, 31, 13] } });

  kit.step('Barrel core and fore-end half', {
    pp: 53, view: 'frontL', minDist: 100,
    desc: `Put ${L('U3-11')}, the gold ribbed barrel core ${L('V1-8')} and ${L('V1-10')} into the fore-end half ${L('U3-15')} (the rod runs underneath).`,
  });
  const fore = grp(); fore.name = 'riflebarrel'; rifle.add(fore);
  part(kit, 'U3-11', fore, [[cbox(5, 4, 4, 0.5), [0, 13, 27]], [cyl(1, 1, 3, 10, 'z'), [0, 13, 24]]], { from: [0, 20, 0] });
  part(kit, 'V1-8', fore, [
    [ribbed(2.6, 34, 7, 'z'), [0, 13, 47]],
    [cbox(2, 1.6, 34, 0.3), [0, 16, 47]],
  ], { from: [0, 24, 0] });
  part(kit, 'V1-10', fore, [[cyl(2.6, 2.6, 5, 6, 'z'), [0, 13, 31.5]]], { from: [0, 22, 0] });
  part(kit, 'U3-15', fore, [
    [cbox(4.5, 14, 70, 1.2), [2.25, 13, 58]],
    [cbox(4.7, 1.2, 60, 0.3), [2.3, 17.5, 58]],
    [cyl(1.6, 1.6, 64, 14, 'z'), [1.2, 4.4, 58]],                           // rod underneath
    [cbox(3, 3, 6, 0.4), [1.2, 5, 88]],
  ], { from: [26, 0, 0] });

  kit.step('Magazine', {
    pp: 53, view: 'side', minDist: 100,
    desc: `Close the magazine halves ${L('U3-10')} and ${L('V2-12')} over the ball stud ${L('U3-13')}.`,
  });
  const mag = grp([0, 5, 17], [-0.16, 0, 0]); mag.name = 'magazine'; rifle.add(mag);
  part(kit, 'U3-10', mag, [
    [cbox(3.2, 28, 8, 0.8), [1.6, -14, 0]],
    [slats(7, 18, 0.8, 5, 0), [3.3, -14, 0], [0, PI / 2, 0]],
  ], { from: [22, 0, 0] });
  part(kit, 'V2-12', mag, [
    [cbox(3.2, 28, 8, 0.8), [-1.6, -14, 0]],
    [cbox(9, 2, 9, 0.6), [0, -28.5, 0.3]],
  ], { from: [-22, 0, 0] });
  part(kit, 'U3-13', mag, [[sphere(2.1, 14), [0, 0.2, 0]], [cyl(1.2, 1.2, 3, 10, 'y'), [0, -1.5, 0]]], { from: [0, 18, 0] });

  kit.step('Close the barrel and join', {
    pp: 53, view: 'frontR', minDist: 100,
    desc: `Close the fore-end with ${L('U3-16')}, then (1) flip the upper housing up, (2) plug the barrel into the receiver and (3) the magazine ball into the socket under it.`,
  });
  const slotted = [
    [cbox(4.5, 4, 74, 0.8), [-2.25, 18, 59]],
    [cbox(4.5, 4, 74, 0.8), [-2.25, 8, 59]],
    [cbox(1.8, 6.5, 74, 0.3), [-0.9, 13, 59]],
  ];
  for (const z of [23, 41, 59, 77, 95]) slotted.push([cbox(4.5, 7, 3.2, 0.5), [-2.25, 13, z]]);
  part(kit, 'U3-16', fore, slotted, { from: [-26, 0, 0] });

  kit.step('Muzzle', {
    pp: 53, view: 'frontR', minDist: 100,
    desc: `Slide the sleeve ${L('U3-22')} on and push the tapered muzzle ${L('U3-21')} into the front.`,
  });
  part(kit, 'U3-22', rifle, [[tube(3.6, 2, 9, 'z', 20), [0, 13, 100.5]]], { from: [0, 0, 22] });
  part(kit, 'U3-21', rifle, [
    [lathe([[1.4, 0], [3, 0], [3, 3], [2.6, 3.6], [2.6, 17], [3.3, 18], [3.3, 22], [1.6, 22], [1.4, 0]], 20, 'z'), [0, 13, 104]],
    [cyl(1.5, 1.5, 0.4, 14, 'z'), [0, 13, 125.8], null, bore],
  ], { from: [0, 0, 26] });

  kit.step('Scope', {
    pp: 53, view: 'frontL', minDist: 90,
    desc: `Set the gold scope post ${L('V1-11')} on top, then build the scope: body ${L('U3-20')}, chrome ring ${L('W23')} and lens ${L('G2-14')}.`,
    caution: `Do not forget to insert ${L('W23')} between ${L('U3-20')} and ${L('G2-14')}.`,
  });
  part(kit, 'V1-11', rifle, [
    [cbox(2.4, 6, 4, 0.4), [2.2, 34.5, 15]],
    [cbox(2.4, 2, 7, 0.4), [2.2, 32, 14]],
  ], { from: [0, 20, 0] });
  const scope = grp([4.6, 38.5, 15]); scope.name = 'scope'; rifle.add(scope);
  part(kit, 'U3-20', scope, [
    [lathe([[0.01, -9], [4.2, -9], [5.5, -7.5], [5.5, 1], [4.6, 1], [4.6, -0.5], [0.01, -0.5]], 22, 'z'), [0, 0, 0]],
    [cbox(3, 3, 6, 0.5), [-2.4, -3.2, -4]],
  ], { from: [0, 18, -10] });
  part(kit, 'W23', scope, [[tube(4.6, 2.6, 2.2, 'z', 22), [0, 0, 2]]], { from: [0, 16, 18] });
  part(kit, 'G2-14', scope, [
    [tube(5.4, 3.6, 3.4, 'z', 22), [0, 0, 4.4], null, MAT.rifleDark],
    [capDisc(3.6, 1.6, 'z', 22), [0, 0, 3], null, lensGreen],
  ], { from: [0, 14, 24], mat: lensGreen });

  // ══════════════════════ BEAM SABERS (p.54) ══════════════════════
  // saber space: hilt along +y (emitter up), centre of the hilt at the origin
  const saber1 = grp(); saber1.name = 'saber1'; O.add(saber1);
  const saber2 = grp(); saber2.name = 'saber2'; O.add(saber2);
  // saber 2 lies on the mat for good (blade axis along world +x)
  placeWorld(saber2, V(126, 3.6, 182), V(0, 0, 1), V(1, 0, 0), V(0, 1, 0));

  kit.section('BEAM SABERS', { pp: 54 });
  kit.block('BEAM SABERS ASSEMBLE', { pp: 54 });
  const hiltProf = [[2.6, -15], [2.9, -14], [2.9, -9], [3.2, -8.5], [3.2, -6], [2.9, -5.5], [2.9, -2], [3.2, -1.5], [3.2, 1.5], [2.9, 2], [2.9, 13], [3.1, 14], [3.1, 15]];
  kit.step('Hilts', {
    pp: 54, view: 'top', minDist: 110,
    desc: `Close each hilt from the two halves ${L('K3-7')} and ${L('K3-6')} (make two).`,
  });
  // saber 1 is built in the saber-hand display (its final pose is set further down), so its parts go in an inner group
  const s1 = grp(); saber1.add(s1);
  for (const g of [s1, saber2]) {
    part(kit, 'K3-7', g, [[halfLathe(hiltProf, 1), [0, 0, 0]]], { from: [24, 0, 0] });
    part(kit, 'K3-6', g, [[halfLathe(hiltProf, -1), [0, 0, 0]]], { from: [-24, 0, 0] });
  }
  kit.step('Emitter and pommel caps', {
    pp: 54, view: 'top', minDist: 110,
    desc: `Push the emitter cap ${L('M3-6')} onto the top and the pommel ${L('M3-5')} onto the bottom of each hilt.`,
  });
  for (const g of [s1, saber2]) {
    part(kit, 'M3-6', g, [[lathe([[0.01, 15], [3.5, 15], [3.5, 16.6], [2.9, 17.2], [2.9, 19.4], [2.2, 20], [1.2, 20], [1.2, 19], [0.01, 19]], 20), [0, 0, 0]]], { from: [0, 22, 0] });
    part(kit, 'M3-5', g, [[lathe([[0.01, -21], [2.4, -21], [3, -20.4], [3, -15], [0.01, -15]], 20), [0, 0, 0]]], { from: [0, -22, 0] });
  }

  // ══════════════════════ SHIELD (pp.54-55) ══════════════════════
  // shield space: face +z, top +y, 144 x 62 mm; the forearm mount (back of the Q1⑫ bracket) is the group origin
  const shield = grp(); shield.name = 'shield'; O.add(shield);
  const MOUNT = V(0, -12, -21.5);
  const sh = grp(MOUNT.clone().negate().toArray()); shield.add(sh);
  {
    const anc = new THREE.Object3D();
    anc.position.set(8.5, -26, 0.5);
    anc.rotation.set(0, 1.12, 0);
    R.arm.L.elbow.add(anc);
    R.root.updateMatrixWorld(true);
    const m = anc.matrixWorld;
    placeWorld(shield, V().setFromMatrixPosition(m), V(1, 0, 0).transformDirection(m), V(0, 1, 0).transformDirection(m), V(0, 0, 1).transformDirection(m));
    R.arm.L.elbow.remove(anc);
  }
  // bench: the shield stands on its long side edge on the -x side of the mat, face towards the centre (+x), top to the back
  const SHB = { c: V(-178, 30.5, -40), ax: V(0, -1, 0), ay: V(0, 0, -1), az: V(1, 0, 0) };
  const shieldBench = benchFor(shield,
    SHB.c.clone().addScaledVector(SHB.ax, MOUNT.x).addScaledVector(SHB.ay, MOUNT.y).addScaledVector(SHB.az, MOUNT.z),
    SHB.ax, SHB.ay, SHB.az);
  /** Bench offset for a sub-assembly of the shield, given its world pose while the shield waits on the bench. */
  const subBench = (g, pos, ax, ay, az) => {
    const p0 = shield.position.clone(), q0 = shield.quaternion.clone();
    shield.position.add(V(...shieldBench[0]));
    shield.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...shieldBench[1])));
    shield.updateMatrixWorld(true);
    const r = benchFor(g, pos, ax, ay, az);
    shield.position.copy(p0); shield.quaternion.copy(q0); shield.updateMatrixWorld(true);
    return r;
  };
  // camera directions for the shield while it stands on the bench
  const SFACE = [1, 0.45, 0.35], SBACK = [-1, 0.55, 0.45];
  const OUT = [[-21.6, 72], [21.6, 72], [27.6, 68.4], [31.2, 38.4], [30.6, -9.6], [21.6, -45.6], [9.6, -63.6], [0, -72], [-9.6, -63.6], [-21.6, -45.6], [-30.6, -9.6], [-31.2, 38.4], [-27.6, 68.4]];
  const FACE = [[-22, 64.5], [22, 64.5], [26.2, 61.5], [27.6, 38], [27, -9], [19, -42.5], [7.8, -58.5], [0, -63], [-7.8, -58.5], [-19, -42.5], [-27, -9], [-27.6, 38], [-26.2, 61.5]];

  const slide = grp(); slide.name = 'shieldSlideArm'; sh.add(slide);
  kit.section('SHIELD', { pp: 54 });
  kit.block('SHIELD ASSEMBLE', { pp: 54 });
  kit.step('Slide arm', {
    pp: 54, view: SBACK, minDist: 110,
    desc: `Put the bearing ${L('X2-8')} into the socket at the top of the slide arm and close it with ${L('Q1-2')} and ${L('Q1-3')}.`,
  });
  part(kit, 'X2-8', slide, [
    [cbox(9, 9, 1.6, 0.5), [0, 24, -11.5], [0, PI / 2, 0]],
    [torus(2.6, 0.7, 16, 'x'), [0, 24, -11.5]],
  ], { from: [0, 22, 0], mat: MAT.poly });
  const armHalf = (s) => [
    [cbox(6, 45, 8, 1.2), [s * 3, 5.5, -11.5]],
    [cyl(6, 6, 6, 20, 'x'), [s * 3, 24, -11.5]],
    [cbox(6.2, 30, 1.2, 0.3), [s * 3, 4, -15.8]],
  ];
  part(kit, 'Q1-2', slide, armHalf(1), { from: [24, 0, 0] });
  part(kit, 'Q1-3', slide, armHalf(-1), { from: [-24, 0, 0] });

  kit.step('Forearm bracket', {
    pp: 54, view: SBACK, minDist: 110,
    desc: `Clip the loop bracket ${L('Q1-12')} (it plugs into the forearm) onto the bottom of the slide arm.`,
  });
  part(kit, 'Q1-12', slide, [
    [rimPlate(22, 14, 3.2, 5, 0.8), [0, -12, -18.8], [PI / 2, 0, 0]],
    [ribbed(2.4, 20, 5, 'x'), [0, -12, -13]],
    [cbox(6, 4, 4, 0.6), [0, -12, -21]],
  ], { from: [0, -24, -10] });

  kit.step('Inner lattice frame', {
    pp: 54, view: SBACK, minDist: 150,
    desc: `Set the slide-arm assembly into the central channel of the large lattice frame ${L('Q1-1')}.`,
  });
  {
    const inner = OUT.map(([x, y]) => [x * 0.95, y * 0.95]);
    const holes = [];
    for (const [x0, x1] of [[-25, -8], [8, 25]]) {
      for (let y = -50; y < 58; y += 15) {
        const hr = rect(x0 + 1.2, y + 1.2, x1 - 1.2, y + 13.8);
        if (hr.every(([x, yy]) => inside(inner, x * 1.08, yy * 1.04))) holes.push(hr);
      }
    }
    holes.push(rect(-9, 50, 9, 60));                                         // top window
    part(kit, 'Q1-1', sh, [
      [holedPlate(inner, holes, 4.4), [0, 0, -4.7]],
      [cbox(14, 110, 3, 0.8), [0, -2, -8.2]],                                // slide channel rails
      [cbox(2, 110, 5, 0.4), [8, -2, -8.4]],
      [cbox(2, 110, 5, 0.4), [-8, -2, -8.4]],
    ], { from: [0, 0, -30] });
  }
  kit.join(slide, ...subBench(slide, V(-116, 6.5, 50), V(0, 1, 0), V(0, 0, -1), V(-1, 0, 0)));

  kit.step('Top slider and window', {
    pp: 55, view: SFACE, minDist: 120,
    desc: `Put the T-slider ${L('M4-11')} in from the top, the clear pane ${L('P1-2')} into the window and the white window frame ${L('K4-24')} over it.`,
  });
  part(kit, 'M4-11', sh, [
    [cbox(16, 6, 3, 0.8), [0, 60, -8]],
    [cbox(6, 16, 3, 0.8), [0, 50, -8]],
  ], { from: [0, 26, 0] });
  part(kit, 'P1-2', sh, [[cbox(14, 5, 1.6, 0.3), [0, 55, -1.2]]], { from: [0, 0, 22] });
  part(kit, 'K4-24', sh, [[rimPlate(20, 9, 3, 3, 0.8), [0, 55, 1.4]], [cbox(20, 1.5, 6, 0.4), [0, 50.2, -0.5]]], { from: [0, 0, 24] });

  kit.step('Edge rails', {
    pp: 55, view: SFACE, minDist: 160,
    desc: `Fit the long bent edge rails ${L('K4-22')} and ${L('K4-23')} along both sides of the frame.`,
  });
  const rail = (s) => {
    const pts = [[27.6, 68.4], [31.2, 38.4], [30.6, -9.6], [21.6, -45.6], [9.6, -63.6], [4, -68]];
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      const nx = dy / len, ny = -dx / len;                                   // outward normal on the +x side
      const cx = (x0 + x1) / 2 - nx * 1.9, cy = (y0 + y1) / 2 - ny * 1.9;
      out.push([cbox(3.8, len + 3.6, 5.6, 0.7), [s * cx, cy, -1.2], [0, 0, s * Math.atan2(-dx, dy)]]);
    }
    return out;
  };
  part(kit, 'K4-22', sh, rail(1), { from: [26, 0, 0] });
  part(kit, 'K4-23', sh, rail(-1), { from: [-26, 0, 0] });

  kit.step('Top and bottom caps', {
    pp: 55, view: SFACE, minDist: 160,
    desc: `Cap the top edge with ${L('M4-10')} and the pointed bottom with the tip block ${L('M4-9')}.`,
  });
  part(kit, 'M4-10', sh, [
    [cbox(47, 6.4, 6, 1), [0, 68.6, -1.2]],
    [cbox(40, 1.2, 1.4, 0.3), [0, 66.2, 1.8]],
  ], { from: [0, 24, 0] });
  part(kit, 'M4-9', sh, [
    [hull([[-13, -52, -4], [13, -52, -4], [-13, -52, 2], [13, -52, 2], [0, -72, -4], [0, -72, 1.6], [-4, -69, 1.6], [4, -69, 1.6], [-4, -69, -4], [4, -69, -4]]), [0, 0, 0]],
  ], { from: [0, -24, 0] });

  kit.step('Face and cross', {
    pp: 55, view: SFACE, minDist: 160,
    desc: `Snap the red face panel ${L('P3-14')} on and put the yellow four-pointed cross ${L('G2-19')} on the upper middle.`,
  });
  {
    const face = holedPlate(FACE.filter(([, y]) => y > -60), [rect(-8, 50.5, 8, 59.5)], 3.6);
    const ridge = hull([[-2, 46, 0], [2, 46, 0], [-2, -50, 0], [2, -50, 0], [0, 46, 0.9], [0, -50, 0.9]]);
    part(kit, 'P3-14', sh, [[face, [0, 0, 0.1]], [ridge, [0, 0, 1.9]]], { from: [0, 0, 30] });
    const c = 22, star = [[0, c + 18], [3.4, c + 3.4], [17, c], [3.4, c - 3.4], [0, c - 57], [-3.4, c - 3.4], [-17, c], [-3.4, c + 3.4]];
    part(kit, 'G2-19', sh, [[frontPlate(star, 1.8, 0.4), [0, 0, 2.95]]], { from: [0, 0, 26] });
  }

  kit.step('Back pegs', {
    pp: 55, view: SBACK, minDist: 130,
    desc: `Push the two pegs ${L('Q1-4')} and ${L('Q1-5')} into the upper back of the frame.`,
  });
  for (const [id, s] of [['Q1-4', 1], ['Q1-5', -1]]) {
    part(kit, id, sh, [
      [cyl(2.4, 2.4, 10, 16, 'z'), [s * 15, 34, -11]],
      [cbox(5, 5, 3.4, 0.5), [s * 15, 34, -17]],
    ], { from: [0, 0, -22] });
  }

  const handle = grp(); handle.name = 'shieldHandle'; sh.add(handle);
  kit.step('Handle', {
    pp: 55, view: SBACK, minDist: 110,
    desc: `Build the handle: the Y-shaped bracket ${L('X1-1')} (with its built-in magnet), the pin ${L('Q1-11')} and the L-brackets ${L('Q1-9')} and ${L('Q1-8')}.`,
  });
  part(kit, 'X1-1', handle, [
    [cbox(6, 14, 5, 1), [0, -38, -12]],
    [cbox(4.4, 12, 5, 1), [-6, -26, -12], [0, 0, 0.55]],
    [cbox(4.4, 12, 5, 1), [6, -26, -12], [0, 0, -0.55]],
    [tube(4, 2, 5, 'z', 18), [0, -46, -12]],
  ], { from: [0, 0, -24] });
  part(kit, 'Q1-11', handle, [[cyl(1.8, 1.8, 8, 6, 'z'), [0, -46, -12]]], { from: [0, -20, -6] });
  part(kit, 'Q1-9', handle, [[cbox(8, 3, 5, 0.6), [-9.5, -20.5, -9.5]], [cbox(3, 5, 3, 0.5), [-12, -18, -8.4]]], { from: [-20, 10, 0] });
  part(kit, 'Q1-8', handle, [[cbox(8, 3, 5, 0.6), [9.5, -20.5, -9.5]], [cbox(3, 5, 3, 0.5), [12, -18, -8.4]]], { from: [20, 10, 0] });

  kit.step('Handle joint', {
    pp: 55, view: SBACK, minDist: 130,
    desc: `Add the ball knuckle ${L('Q1-10')} and the brackets ${L('Q1-7')} and ${L('Q1-6')}, then fold the handle into the lower back of the shield.`,
  });
  part(kit, 'Q1-10', handle, [[sphere(3, 14), [0, -52, -11]]], { from: [0, -20, 0] });
  part(kit, 'Q1-7', handle, [[cbox(8, 5, 5, 0.6), [0, -56.5, -10]]], { from: [0, -20, -10] });
  part(kit, 'Q1-6', handle, [[cbox(8, 4, 5, 0.6), [0, -61, -8.5]], [cyl(1.2, 1.2, 3, 10, 'z'), [0, -61, -5.6]]], { from: [0, -22, -10] });
  kit.join(handle, ...subBench(handle, V(-140, 17.5, 20), V(1, 0, 0), V(0, 0, -1), V(0, 1, 0)));

  // ══════════════════════ CORE FIGHTER (pp.56-58) ══════════════════════
  // CF space: +z nose, +y up, ground y = 0 (landing form, on its wheels); final display pose on the mat
  const cf = grp([138, 0, -58], [0, -0.45, 0]); cf.name = 'coreFighter'; O.add(cf);
  const cock = grp(); cock.name = 'cfCockpit'; cf.add(cock);
  const engR = grp(); engR.name = 'cfEngineR'; cf.add(engR);
  const engL = grp(); engL.name = 'cfEngineL'; cf.add(engL);

  kit.section('CORE FIGHTER', { pp: 56 });
  kit.step('Core Fighter · runners', {
    pp: 56, focus: 'all', view: 'frontL',
    desc: 'The Core Fighter is a separate display piece: main runners K5 (white), N5 (red), O3 (dark red) and Q2 (dark gray), with H (blue), M3, P1 (clear) as sub runners.',
  });
  kit.block('CORE FIGHTER ASSEMBLE', { pp: 56 });
  kit.step('Pilot and seat', {
    pp: 56, view: 'frontL', minDist: 80,
    desc: `Sit the pilot ${L('K5-13')} in the seat ${L('Q2-17')} and put the seat base ${L('K5-14')} under it.`,
  });
  part(kit, 'K5-13', cock, [
    [cbox(7.5, 9, 5.5, 1.5), [0, 29.5, 15.5]],
    [sphere(3.2, 16), [0, 36, 15.8]],
    [cbox(1.8, 1.8, 7, 0.5), [3.8, 29.5, 19]],
    [cbox(1.8, 1.8, 7, 0.5), [-3.8, 29.5, 19]],
    [cbox(6.5, 3, 8, 1), [0, 25.4, 20]],
    [cbox(4.4, 1.6, 2, 0.5), [0, 36.2, 18.8], null, MAT.blueBlack],
  ], { from: [0, 24, 0] });
  part(kit, 'Q2-17', cock, [
    [cbox(10, 2, 9, 0.5), [0, 23, 17]],
    [cbox(10, 11, 2, 0.6), [0, 28, 12.2], [-0.15, 0, 0]],
    [cbox(1.4, 6, 9, 0.4), [5, 26, 16]],
    [cbox(1.4, 6, 9, 0.4), [-5, 26, 16]],
  ], { from: [0, 22, -10] });
  part(kit, 'K5-14', cock, [
    [cbox(10, 8, 7, 1), [0, 23, 7.5]],
    [slats(8, 6, 0.8, 4, 0), [0, 23, 3.8]],
  ], { from: [0, 0, -22] });

  kit.step('Console and cockpit tub', {
    pp: 56, view: 'frontR', minDist: 90,
    desc: `Fit the console ${L('Q2-16')} in front of the pilot and lower the seat into the tub ${L('K5-10')}.`,
  });
  part(kit, 'Q2-16', cock, [
    [tbox(9, 16, 9, 8, 7, { c: 0.6, dz: 3.5 }), [0, 25, 29]],
    [cbox(7, 1, 3, 0.2), [0, 28.6, 25.4], null, MAT.sensorGreen],
  ], { from: [0, 20, 20] });
  part(kit, 'K5-10', cock, [
    [cbox(14, 2, 30, 0.6), [0, 19, 22]],
    [cbox(2, 9, 30, 0.6), [6, 23, 22]],
    [cbox(2, 9, 30, 0.6), [-6, 23, 22]],
    [cbox(14, 9, 2, 0.6), [0, 23, 36]],
  ], { from: [0, -24, 0] });

  kit.step('Nose and nose gear', {
    pp: 56, view: 'frontR', minDist: 90,
    desc: `Put the nose landing gear ${L('Q2-18')} into the blue nose cone ${L('H13')}.`,
  });
  part(kit, 'H13', cock, [
    [hull([[-7, 17, 36], [7, 17, 36], [-7, 28, 36], [7, 28, 36], [-5.5, 17, 50], [5.5, 17, 50], [-4, 25, 50], [4, 25, 50], [-1.6, 19, 60], [1.6, 19, 60], [0, 21.4, 61]]), [0, 0, 0]],
  ], { from: [0, 0, 26] });
  part(kit, 'Q2-18', cock, [
    [cyl(1.1, 1.1, 12, 10, 'y'), [0, 11, 47]],
    [cbox(4, 3, 3, 0.4), [0, 16.4, 47]],
    [cyl(3.3, 3.3, 2.2, 16, 'x'), [1.6, 3.3, 47.5], null, MAT.black],
    [cyl(3.3, 3.3, 2.2, 16, 'x'), [-1.6, 3.3, 47.5], null, MAT.black],
  ], { from: [0, -22, 0] });

  kit.step('Gear door', {
    pp: 56, view: 'under', minDist: 90,
    desc: `Close the nose gear bay behind the gear with the door ${L('H14')}.`,
  });
  part(kit, 'H14', cock, [[cbox(12, 1.6, 7, 0.5), [0, 16.4, 41]], [cbox(12, 2.4, 1.4, 0.4), [0, 15.6, 37.8]]], { from: [0, -20, 0] });

  kit.step('Canopy', {
    pp: 56, view: 'frontL', minDist: 80,
    desc: `Put the small lens ${L('P1-5')} into the nose side, clip the clear canopy ${L('P1-4')} to the hinge bracket ${L('Q2-23')} and close it over the pilot.`,
  });
  part(kit, 'P1-5', cock, [[cbox(1.2, 2.4, 3, 0.3), [5.3, 21, 44]]], { from: [18, 0, 0] });
  part(kit, 'P1-4', cock, [
    [hull([[-6, 27.5, 8], [6, 27.5, 8], [-5.5, 35, 9.5], [5.5, 35, 9.5], [-3.5, 37, 16], [3.5, 37, 16], [-6.5, 27.5, 26], [6.5, 27.5, 26], [-3, 33.5, 28], [3, 33.5, 28], [-4, 28, 36], [4, 28, 36]]), [0, 0, 0]],
  ], { from: [0, 22, 0], mat: MAT.canopy, hatch: { axis: [1, 0, 0], angle: -0.85, pivot: [0, 31, 8] } });
  part(kit, 'Q2-23', cock, [[cbox(4, 10, 3.4, 0.5), [0, 30, 6.5]], [cyl(1, 1, 5, 10, 'x'), [0, 33.5, 6.5]]], { from: [0, 20, -10] });

  kit.step('Upper cowl', {
    pp: 56, view: 'backL', minDist: 90,
    desc: `Fit the blue upper cowl ${L('H18')} behind the canopy; its rear leg goes down behind the seat.`,
  });
  part(kit, 'H18', cock, [
    [hull([[-8, 26, -18], [8, 26, -18], [-8, 26, 8], [8, 26, 8], [-7, 33, -16], [7, 33, -16], [-5.5, 35.4, 6], [5.5, 35.4, 6]]), [0, 0, 0]],
    [cbox(3, 1, 10, 0.3), [0, 35.4, -4], null, MAT.blueBlack],
  ], { from: [0, 24, 0] });

  kit.step('Rear cockpit block', {
    pp: 56, view: 'backR', minDist: 90,
    desc: `Put the link plate ${L('Q2-22')} on the rear spine block ${L('K5-11')} and fit it under the cowl.`,
  });
  part(kit, 'Q2-22', cock, [[cbox(9, 2.4, 5, 0.6), [0, 26.6, -20.5]]], { from: [0, 20, 0] });
  part(kit, 'K5-11', cock, [
    [tbox(14, 22, 14, 18, 9, { c: 0.8, dz: 2 }), [0, 21, -9]],
  ], { from: [0, -20, -10] });

  kit.block('CORE FIGHTER ASSEMBLE · hull', { pp: 57 });
  kit.step('Hull and left main gear', {
    pp: 57, view: 'frontL', minDist: 110,
    desc: `Mount the left main landing gear ${L('Q2-21')} under the red lower hull ${L('N5-14')}.`,
  });
  part(kit, 'N5-14', cf, [
    [cbox(28, 3, 72, 1), [0, 9.5, -4]],
    [cbox(3, 16, 72, 0.8), [12.5, 17, -4]],
    [cbox(3, 16, 72, 0.8), [-12.5, 17, -4]],
    [cbox(28, 16, 3, 0.8), [0, 17, -39]],
    [hull([[-14, 8, 32], [14, 8, 32], [-14, 25, 32], [14, 25, 32], [-8, 15, 40], [8, 15, 40], [-8, 22, 40], [8, 22, 40]]), [0, 0, 0]],
    [cbox(22, 1.6, 50, 0.4), [0, 8, -4]],
  ], { from: [0, -26, 0] });
  const mainGear = (s) => [
    [tube(2.6, 1.2, 2.4, 'x', 16), [s * 9, 9, -8]],
    [cyl(1.1, 1.1, 6, 10, 'y'), [s * 9, 6, -8]],
    [cyl(3.4, 3.4, 2.2, 16, 'x'), [s * 7.6, 3.4, -8.5], null, MAT.black],
    [cyl(3.4, 3.4, 2.2, 16, 'x'), [s * 10.8, 3.4, -8.5], null, MAT.black],
  ];
  part(kit, 'Q2-21', cf, mainGear(1), { from: [0, -22, 0] });

  const wing = (s) => [
    [flatPlate([[15, 16], [49, -12], [50, -22], [15, -14]].map(([x, z]) => [s * x, z]), 2.4, 0.5), [0, 12, 0]],
    [cbox(8, 4, 12, 0.8), [s * 14, 12, 0]],
    [cbox(1, 2.6, 30, 0.3), [s * 30, 12, -2], [0, s * 0.68, 0], MAT.blueBlack],
  ];
  kit.step('Left wing', {
    pp: 57, view: 'top', minDist: 120,
    desc: `Fit the left wing ${L('O3-11')} with its root cover ${L('O3-9')} and swing it out to the extended position.`,
  });
  part(kit, 'O3-9', cf, [[cbox(9, 2, 6, 0.5), [14.5, 15, 0]], [cbox(3, 2, 10, 0.5), [14.5, 15, 0]]], { from: [0, 20, 0] });
  part(kit, 'O3-11', cf, wing(1), { from: [28, 0, 0] });

  kit.step('Right main gear', {
    pp: 57, view: 'frontR', minDist: 110,
    desc: `Mount the right main landing gear ${L('Q2-15')}.`,
  });
  part(kit, 'Q2-15', cf, mainGear(-1), { from: [0, -22, 0] });

  kit.step('Right wing', {
    pp: 57, view: 'top', minDist: 120,
    desc: `Fit the right wing ${L('O3-10')} with its root cover ${L('O3-6')} and swing it out.`,
  });
  part(kit, 'O3-6', cf, [[cbox(9, 2, 6, 0.5), [-14.5, 15, 0]], [cbox(3, 2, 10, 0.5), [-14.5, 15, 0]]], { from: [0, 20, 0] });
  part(kit, 'O3-10', cf, wing(-1), { from: [-28, 0, 0] });

  kit.block('CORE FIGHTER ASSEMBLE · cockpit unit', { pp: 57 });
  kit.step('Intake blocks', {
    pp: 57, view: 'backR', minDist: 110,
    desc: `Put the ribbed intake blocks ${L('Q2-13')} (right) and ${L('Q2-19')} (left) on the rear top of the hull.`,
  });
  for (const [id, s] of [['Q2-13', -1], ['Q2-19', 1]]) {
    part(kit, id, cf, [
      [tbox(8, 9, 8, 7, 8, { c: 0.8, dz: -1 }), [s * 8.6, 29, -21.5]],
      [slats(6, 6, 0.8, 4, 0.3), [s * 8.6, 29, -16.6]],
    ], { from: [s * 12, 20, 0] });
  }
  kit.step('Tail arm and cockpit unit', {
    pp: 57, view: 'side', minDist: 130,
    desc: `Fit the saddle ${L('H11')} and the tail arm with fin ${L('O3-7')}, then drop the cockpit unit into the hull.`,
  });
  part(kit, 'H11', cf, [[cbox(9, 5, 6, 0.8), [0, 28.5, -26]], [cyl(1, 1, 12, 10, 'x'), [0, 28.5, -26]]], { from: [0, 20, 0] });
  part(kit, 'O3-7', cf, [
    [sidePlate([[-22, 26], [-30, 26], [-46, 56], [-52, 56], [-50, 50], [-40, 26]], 2.4, 0.5), [1.2, 0, 0]],
    [cyl(3, 3, 3, 16, 'x'), [0, 28, -26]],
    [cbox(1, 16, 3, 0.3), [0, 45, -44], [-0.55, 0, 0], MAT.white],
  ], { from: [0, 26, -10] });
  kit.join(cock, [0, 0, 80], [0, 0, 0]);

  kit.block('CORE FIGHTER ASSEMBLE · engine blocks', { pp: 57 });
  const engine = (g, block, launcher, missile, s) => {
    part(kit, missile, g, [
      [cyl(1.4, 1.4, 7, 12, 'z'), [s * 17.8, 30.5, -31.5]],
      [cyl(1.4, 1.4, 7, 12, 'z'), [s * 17.8, 27.5, -31.5]],
      [cyl(1.4, 0.2, 2.4, 12, 'z'), [s * 17.8, 30.5, -26.8]],
      [cyl(1.4, 0.2, 2.4, 12, 'z'), [s * 17.8, 27.5, -26.8]],
    ], { from: [0, 0, 20] });
    part(kit, launcher, g, [
      [cbox(5, 9, 8, 0.8), [s * 17.4, 29, -33.5]],
      [slats(4, 6, 0.6, 3, 0), [s * 20, 29, -33.5], [0, PI / 2, 0]],
    ], { from: [s * 20, 0, 0] });
    part(kit, block, g, [
      [cbox(13, 16, 17, 1.5), [s * 8.6, 25, -35.5]],
      ...[-4, 0, 4].map((z) => [cbox(13.4, 12, 0.8, 0.2), [s * 8.6, 24, -35.5 + z]]),
    ], { from: [0, 24, -10] });
  };
  kit.step('Right engine block', {
    pp: 57, view: 'backR', minDist: 90,
    desc: `Load the missile pack ${L('O3-5')} into the launcher ${L('M3-8')} and fit it to the right engine block ${L('K5-9')}.`,
  });
  engine(engR, 'K5-9', 'M3-8', 'O3-5', -1);
  kit.step('Left engine block', {
    pp: 57, view: 'backL', minDist: 90,
    desc: `Build the left engine block the same way: ${L('O3-8')} into ${L('M3-7')}, then onto ${L('K5-8')}.`,
  });
  engine(engL, 'K5-8', 'M3-7', 'O3-8', 1);
  kit.step('Mount the engine blocks', {
    pp: 57, view: 'backL', focus: cf, minDist: 140,
    desc: 'Turn the right engine block round and drop both blocks onto the two pegs at the rear top of the hull, behind the cockpit.',
  });
  kit.join(engR, [-40, 0, -10], [0, 0, 0]);
  kit.join(engL, [40, 0, -10], [0, 0, 0]);

  kit.block('CORE FIGHTER ASSEMBLE · rear', { pp: 58 });
  kit.step('Nozzles and rear covers', {
    pp: 58, view: 'backR', minDist: 120,
    desc: `Put the fan-grille nozzle plates ${L('Q2-20')} (left) and ${L('Q2-14')} (right) on the rear, then the red rear covers ${L('N5-15')} and ${L('N5-16')}.`,
  });
  for (const [id, s] of [['Q2-20', 1], ['Q2-14', -1]]) {
    part(kit, id, engL.parent, [
      [cbox(11, 13, 3, 1.2), [s * 8.6, 24.5, -45.2]],
      [cyl(4.6, 4.6, 1, 20, 'z'), [s * 8.6, 24.5, -46.9], null, MAT.thrusterInner],
      [torus(3.2, 0.5, 16, 'z'), [s * 8.6, 24.5, -47.2]],
    ], { from: [0, 0, -24] });
  }
  for (const [id, s] of [['N5-15', 1], ['N5-16', -1]]) {
    part(kit, id, cf, [
      [cbox(15, 2.6, 19, 0.8), [s * 9.4, 34.3, -36]],
      [cbox(2.2, 8, 19, 0.6), [s * 16, 30, -36]],
      [slats(13, 12, 1, 5, 0), [s * 9.4, 35.8, -36], [PI / 2, 0, 0]],
    ], { from: [0, 22, -10] });
  }

  kit.step('Flight form', {
    pp: 58, view: 'frontL', focus: cf, minDist: 150,
    desc: `Flight form: the clear adapter ${L('P1-10')} plugs into the underside for a display stand. For landing form it comes off again (it waits beside the fighter here).`,
  });
  part(kit, 'P1-10', cf, [
    [cbox(6, 6, 8, 0.8), [32, 3, -40]],
    [cyl(1.8, 1.8, 3, 12, 'y'), [32, 7.5, -40]],
  ], { from: [0, 24, 0] });

  kit.step('Landing form', {
    pp: 58, view: 'frontR', focus: cf, minDist: 150,
    desc: `Landing form: raise the rear section and swing the nose and main gear down. Set the small display accessories ${L('K5-15')} and ${L('K5-16')} by the main wheels.`,
  });
  part(kit, 'K5-15', cf, [[tbox(5, 5, 5, 2.4, 3.6, { c: 0.5 }), [13, 1.8, -15]]], { from: [0, 20, 0] });
  part(kit, 'K5-16', cf, [[tbox(5, 5, 5, 2.4, 3.6, { c: 0.5 }), [-13, 1.8, -15]]], { from: [0, 20, 0] });

  kit.block('TRANSFORMATION', { pp: 58 });
  kit.step('Core Fighter to core block', {
    pp: 58, view: 'frontL', focus: cf, minDist: 150,
    desc: 'From flight form: open the belly hatch and fold the cockpit section up and back, push it into the fuselage, swing the front down under it, then fold the wings and tail in to make the compact core block.',
  });

  kit.section('CORE FIGHTER INSTALLATION', { pp: 59 });
  kit.step('Swap the core block for the Core Fighter', {
    pp: 59, view: 'frontR', focus: 'all',
    desc: 'Optional: lift the upper body off the waist, take out the dummy core block and drop the transformed Core Fighter onto its pegs, then lower the upper body back on.',
    caution: 'Bend the upper body backward and move it while avoiding the parts on the waist.',
  });

  // ══════════════════════ WEAPON-HOLDING HANDS - 1 (p.59) ══════════════════════
  // right trigger hand: built straight into the right wrist (right arm is mirrored: built as a left hand)
  const trig = grp(); trig.name = 'triggerHandR'; R.arm.R.hand.add(trig);
  // left trigger hand: display piece on the mat, back of the hand up
  const trigL = grp(); trigL.name = 'triggerHandL'; O.add(trigL);
  placeWorld(trigL, V(96, 14.5, 138), V(0, 1, 0), V(0, 0, -1), V(-1, 0, 0));

  kit.section('WEAPON-HOLDING HANDS - 1', { pp: 59 });
  kit.step('Right hand parts A', {
    pp: 59, view: 'top', minDist: 70,
    desc: `(1) Wrist joint ${L('F2-10')} into the chrome palm frame ${L('W13')}, (2) palm plate ${L('R12')}, (3) close with the back shell ${L('R9')}.`,
  });
  let key = palmUnit(kit, trig, ['W13', 'R12', 'R9', 'R11'], { trigger: true });
  kit.step('Right hand parts A · wrist cuff', {
    pp: 59, view: 'top', minDist: 70,
    desc: `Fit the wrist cuff ${L('U1-1')} and put the small key ${L('R11')} into the heel of the hand.`,
  });
  backArmor(kit, trig, key, { onArm: true });
  kit.step('Right hand parts B', {
    pp: 59, view: 'top', minDist: 70,
    desc: `Snap the chrome finger frame ${L('W14')} into the finger cover ${L('R10')}.`,
  });
  fingerUnit(kit, trig, 'W14', 'R10', { trigger: true });
  kit.step('Left hand parts A', {
    pp: 59, view: 'top', minDist: 70,
    desc: `Mirror of the right hand: ${L('F2-10')} into ${L('W15')}, then ${L('R16')} and ${L('R13')}.`,
  });
  key = palmUnit(kit, trigL, ['W15', 'R16', 'R13', 'R15'], { trigger: true });
  kit.step('Left hand parts A · wrist cuff', {
    pp: 59, view: 'top', minDist: 70,
    desc: `Fit the wrist cuff ${L('U1-1')} and put ${L('R15')} into the heel.`,
  });
  backArmor(kit, trigL, key);
  kit.step('Left hand parts B', {
    pp: 59, view: 'top', minDist: 70,
    desc: `Snap ${L('W16')} into ${L('R14')}.`,
  });
  fingerUnit(kit, trigL, 'W16', 'R14', { trigger: true });

  // ══════════════════════ How to attach the beam rifle (p.60) ══════════════════════
  {
    // rifle pose from the right hand: grip along the hand's thumb axis, raked 0.3 rad; barrel along the fingers
    const a = 0.3;
    const anc = new THREE.Object3D();
    anc.position.set(-6.6, -14, -0.5);
    R.arm.R.hand.add(anc);
    R.root.updateMatrixWorld(true);
    const m = anc.matrixWorld;
    const P = V().setFromMatrixPosition(m);
    const yh = V(0, 1, 0).transformDirection(m), zh = V(0, 0, 1).transformDirection(m);
    const yr = yh.clone().multiplyScalar(Math.sin(a)).addScaledVector(zh, Math.cos(a)).normalize();
    const zr = yh.clone().multiplyScalar(-Math.cos(a)).addScaledVector(zh, Math.sin(a)).normalize();
    const xr = V().crossVectors(yr, zr).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xr, yr, zr));
    placeWorld(rifle, P.clone().sub(G.clone().applyQuaternion(q)), xr, yr, zr);
    R.arm.R.hand.remove(anc);
  }
  kit.section('How to attach the Beam Rifle', { pp: 60 });
  kit.step('Beam rifle in the right hand', {
    pp: 60, view: 'frontR', minDist: 160,
    desc: 'Take the normal fist off the right forearm. Put the rifle grip into Right hand parts A, close it with parts B (index finger on the trigger) and plug the wrist ball into the forearm.',
    caution: 'The rifle can be held in the left hand as well, with Left hand parts A and B. Alternatively it stores on the rear-skirt hardpoint: turn the latch 180° and fold out the side peg.',
  });
  kit.swapOut(R.arm.R.fist);
  {
    const [o1, r1] = benchFor(trig, V(-115, 15.5, 150), V(0, 1, 0), V(0, 0, -1), V(1, 0, 0));
    kit.join(trig, o1, r1);
    // rifle lies on its right side along the back of the mat, barrel to +x
    const [o2, r2] = benchFor(rifle, V(-150, 7.5, -168), V(0, 1, 0), V(0, 0, 1), V(1, 0, 0));
    kit.join(rifle, o2, r2);
  }

  // ══════════════════════ WEAPON-HOLDING HANDS - 2 (p.60) ══════════════════════
  // saber hands: display pieces on the mat (right hand = mirrored inner group), back of the hand up
  const sabR = grp(); sabR.name = 'saberHandR'; O.add(sabR);
  placeWorld(sabR, V(-172, 13, 126), V(0, -1, 0), V(0, 0, -1), V(1, 0, 0));
  const sabRin = grp(); sabRin.scale.x = -1; sabR.add(sabRin);
  const sabL = grp(); sabL.name = 'saberHandL'; O.add(sabL);
  placeWorld(sabL, V(150, 13, 138), V(0, 1, 0), V(0, 0, -1), V(-1, 0, 0));

  kit.section('WEAPON-HOLDING HANDS - 2', { pp: 60 });
  kit.step('Right hand parts C', {
    pp: 60, view: 'top', minDist: 70,
    desc: `(1) ${L('F2-10')} into the chrome frame ${L('W6')}, (2) palm plate ${L('R19')}, (3) close with ${L('R17')}.`,
  });
  palmUnit(kit, sabRin, ['W6', 'R19', 'R17', null], { trigger: false });
  kit.step('Right hand parts C · wrist cuff', {
    pp: 60, view: 'top', minDist: 70,
    desc: `Fit the wrist cuff ${L('U1-1')} on the outer side of the wrist.`,
  });
  backArmor(kit, sabRin, null);
  kit.step('Right hand parts D', {
    pp: 60, view: 'top', minDist: 70,
    desc: `Snap the chrome finger frame ${L('W5')} into the finger cover ${L('R18')}.`,
  });
  fingerUnit(kit, sabRin, 'W5', 'R18', { trigger: false });
  kit.step('Left hand parts C', {
    pp: 60, view: 'top', minDist: 70,
    desc: `(1) ${L('F2-10')} into ${L('W8')}, (2) ${L('R22')}, (3) close with ${L('R20')}.`,
  });
  palmUnit(kit, sabL, ['W8', 'R22', 'R20', null], { trigger: false });
  kit.step('Left hand parts C · wrist cuff', {
    pp: 60, view: 'top', minDist: 70,
    desc: `Fit the wrist cuff ${L('U1-1')} on the outer side of the wrist.`,
  });
  backArmor(kit, sabL, null);
  kit.step('Left hand parts D', {
    pp: 60, view: 'top', minDist: 70,
    desc: `Snap ${L('W7')} into ${L('R21')}.`,
  });
  fingerUnit(kit, sabL, 'W7', 'R21', { trigger: false });

  // ══════════════════════ How to attach the beam sabers (p.60) ══════════════════════
  {
    // saber 1 goes through the right saber hand (hilt along the hand's thumb axis, blade out of the thumb side)
    const anc = new THREE.Object3D();
    anc.position.set(-5, -13, 0);
    sabRin.add(anc);
    R.root.updateMatrixWorld(true);
    const m = anc.matrixWorld;
    const ax = V(0, 0, 1).transformDirection(m);                  // blade direction
    const up = V(0, 1, 0);
    const xs = V().crossVectors(ax, up).normalize();
    const zs = V().crossVectors(xs, ax).normalize();
    placeWorld(saber1, V().setFromMatrixPosition(m), xs, ax, zs);
    sabRin.remove(anc);
  }
  kit.section('How to attach the Beam Sabers', { pp: 60 });
  kit.step('Beam saber in the hand', {
    pp: 60, view: 'top', minDist: 150,
    desc: `Push the clear pink blade ${L('Z-part')} into the emitter and close Right hand parts C and D round the hilt.`,
    caution: 'Normally the sabers are stored in the racks on the backpack. Do not swing the blade parts around.',
  });
  part(kit, 'Z-part', s1, [
    [cyl(2, 1.7, 100, 16, 'y'), [0, 70, 0]],
    [sphere(1.7, 12), [0, 120, 0]],
    [cyl(1.1, 1.1, 3, 10, 'y'), [0, 19, 0]],
  ], { from: [0, 30, 0], name: 'Z part', mat: MAT.saberBlade });
  kit.join(saber1, [10, -4.6, 56], [0, 0, 0]);

  // ══════════════════════ How to attach the shield (p.61) ══════════════════════
  kit.section('How to attach the Shield', { pp: 61 });
  kit.step('Shield on the left forearm', {
    pp: 61, view: 'frontL', minDist: 200,
    desc: 'Slide the mount cover on the outer side of the left forearm up to expose the round socket and plug the shield\'s forearm bracket into it.',
  });
  {
    const [o, r] = shieldBench;
    kit.join(shield, o, r);
  }
  kit.step('Hand grip and storage options', {
    pp: 61, view: 'backL', focus: shield, minDist: 170,
    desc: 'The shield can also be held: swing the inner grip bar out and slide it down into Left hand parts C and D. The rifle side peg plugs into the upper grip bar, and the folding arm stores the shield on the backpack mount (rotate it 180°).',
  });

  // ══════════════════════ GIMMICKS (p.62) ══════════════════════
  kit.section('GIMMICKS', { pp: 62 });
  kit.step('Hatch open', {
    pp: 62, view: 'frontL', focus: 'all',
    desc: 'Switch on "Open hatches" to see them: head, chest, waist, arm and leg armor hatches open to show the inner frame. (The legs panel labelled "Left arm" in the manual means the left leg.)',
  });
  kit.step('Articulation and rifle gimmicks', {
    pp: 62, view: 'frontR', focus: 'all',
    desc: 'The arm and leg armor slides to widen the range of the joints. On the beam rifle the upper housing hinges open and the scope folds; the Core Fighter canopy opens with the "Open hatches" toggle as well.',
  });

  // ══════════════════════ LED (p.63) ══════════════════════
  // unit fitted to the underside of the head, LED facing forward (hidden inside the neck when installed)
  const led = grp([0, 262, -3]); led.name = 'ledUnit'; R.chest.add(led);
  kit.section('LED', { pp: 63 });
  kit.block('How to install the batteries', { pp: 63 });
  kit.step('Open the battery cover', {
    pp: 63, view: 'frontR', minDist: 60,
    desc: `Unscrew the small screw of the ${L('LED-unit')} and take the battery cover off.`,
    caution: 'Use a screwdriver that fits the screw. Remove the batteries when the model is not in use.',
  });
  part(kit, 'LED-unit', led, [
    [cbox(14, 9, 12, 1), [0, 3.5, 0]],
    [cyl(2, 2, 1.6, 16, 'y'), [0, 8.6, 0], null, MAT.frameDark],
    [cyl(2.2, 2.2, 1.2, 16, 'z'), [0, 4, 6.2], null, lensLed],
    [cbox(14, 7, 12, 1), [0, -4.5, 0]],
    [cbox(1.2, 6, 10, 0.4), [-7.4, -4.5, 0], null, MAT.frameGray],
    [cyl(1, 1, 1, 10, 'x'), [-8.2, -4.5, 3], null, MAT.silver],
  ], { from: [0, 20, 20], mat: MAT.whiteGray, name: 'LED unit' });
  kit.step('Insert the batteries', {
    pp: 63, view: 'frontR', minDist: 60,
    desc: 'Insert two LR41 button cells with the polarity shown, refit the cover (hook side first) and tighten the screw.',
    caution: 'LR41 batteries are sold separately. Do not overtighten the screw.',
  });
  part(kit, 'LR41', led, [[cyl(3.95, 3.95, 3.6, 22, 'x'), [-4.2, -4.5, 0]]], { from: [-24, 0, 0], mat: MAT.silver, name: 'LR41 battery' });
  part(kit, 'LR41', led, [[cyl(3.95, 3.95, 3.6, 22, 'x'), [-0.4, -4.5, 0]]], { from: [-30, 0, 0], mat: MAT.silver, name: 'LR41 battery' });

  kit.block('Lighting check', { pp: 63 });
  kit.step('Lighting check', {
    pp: 63, view: 'frontR', minDist: 90, id: 'led',
    desc: `Press the switch on top of the unit with the ${L('Y-part')} tool to light it; hold it down to switch off. The pointed end pushes the batteries out when replacing them.`,
    caution: 'Never look directly into the LED. If it does not light, check the battery polarity and age, and that the cover and screw are closed.',
  });
  part(kit, 'Y-part', O, [
    [cbox(3, 2, 24, 0.5), [58, 1, -168]],
    [cbox(6, 1.6, 8, 0.5), [58, 0.8, -183]],
    [cyl(1.4, 0.2, 5, 10, 'z'), [58, 1, -153.5]],
  ], { from: [0, 24, 0], name: 'Y part', mat: MAT.white });

  kit.block('How to install the LED unit', { pp: 63 });
  kit.step('Install the LED unit', {
    pp: 63, view: 'frontL', focus: 'all',
    desc: 'Take off the backpack, swing the shoulder blocks out, remove the rear chest plate and pull the head off. Fit the unit to the underside of the head with the LED facing forward, then put everything back.',
  });
  kit.join(led, [34, -254, -168], [0, 0, 0]);
}
