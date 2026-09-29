// LEGS. Manual pp.14-19 (PHASE 01▶02 LEGS-FRAME), pp.33-35 (PHASE 03 truss), pp.40-43 (PHASE 04 armor).
// Every leg is modelled as the LEFT leg in its own space (+x = outward, +z = front); the right leg
// root is mirrored (scale.x = -1), so the same code builds both.
//   hip group   : origin = hip joint ring, thigh hangs to y ≈ -50
//   knee group  : origin = knee axis (hip y -52); shin down to the ankle at y -88
//   ankle group : origin = ankle axle; sole bottom at y -22, toe tip z ≈ +44, heel z ≈ -22
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp } from '../kit.js';
import { cbox, tbox, cyl, sphere, hull, loft, sub, lathe, lattice, rimPlate } from '../geom.js';
import { part, segment, sticker, sidePlate, flatPlate, frontPlate, capDisc, tube, ribbed, slats, merge, nub } from './util.js';

const PI = Math.PI;

// ───────────────────────── PHASE 01 ▶ 02 · LEGS-FRAME ─────────────────────────

export function legFrame(kit, R) {
  kit.section('LEGS-FRAME', { pp: 14 });
  legFrameSide(kit, R, 'R');
  kit.block('LEG-FRAME-LEFT ASSEMBLE', {
    pp: 17, compact: true,
    desc: 'Build the left leg frame exactly like the right one, mirrored: cut MSF-2② from the runner, straighten it (swing the hip and ankle blocks, rotate them 90° / 180°) and add the second set of D, C3 and F1 parts in the same order (pp.17-19).',
  });
  legFrameSide(kit, R, 'L');
}

function legFrameSide(kit, R, side) {
  const L = R.leg[side];
  const { hip, knee, ankle } = L;
  const right = side === 'R';
  const msf = right ? 'MSF-2-1' : 'MSF-2-2';
  const V = right ? 'right' : 'left';
  if (right) kit.block('LEG-FRAME-RIGHT ASSEMBLE', { pp: 15 });
  const sv = right ? 'right' : 'left';   // outer side of this leg
  const iv = right ? 'left' : 'right';   // inner side

  // 1 ── MSF-2 insert frame (one articulated part: hip / knee / shin segments)
  kit.step(`Cut out the ${V} leg frame MSF-2${right ? '①' : '②'}`, {
    pp: right ? 15 : 17, view: sv, focus: L.root,
    desc: 'The insert-molded frame comes off the runner already articulated. Cut it at the gates, swing the hip block up and the ankle block down until the frame is straight, then rotate the hip block 90° and the ankle block 180° (rotate-as-indicated icons).',
  });
  const F = MAT.frameInsert, FD = MAT.frameDark;
  const msfFrom = [0, 10, 60];
  part(kit, msf, hip, [
    // hip ring (axis x) on a ribbed stub
    [tube(7, 4.4, 8, 'x'), [0, 0, 0], null, FD],
    [ribbed(3, 7, 3), [0, -8.5, 0]],
    // thigh bone with two round sockets for the D5 pegs
    [sub(cbox(8, 36, 10, 1.4),
      [cyl(2.2, 2.2, 12, 16, 'x'), { p: [0, -12, 1] }],
      [cyl(2.2, 2.2, 12, 16, 'x'), { p: [0, -30, -1] }]), [0, -29, 0]],
    [cbox(10, 5, 11, 1), [0, -12, 0]],
    // lower thigh fork to the knee
    [cbox(12, 8, 10, 1.5), [0, -48, 0]],
  ], { from: msfFrom });
  segment(kit, msf, knee, [
    // double knee joint
    [cyl(5, 5, 13, 20, 'x'), [0, 4, 0], null, FD],
    [cyl(5, 5, 13, 20, 'x'), [0, -7, 0], null, FD],
    [cbox(11, 18, 8, 1.2), [0, -1.5, -0.5]],
    // shin bone with oval window
    [sub(cbox(9, 64, 10, 1.4), [cyl(2.6, 2.6, 14, 16, 'x'), { p: [0, 2, 0], s: [1, 5, 1] }]), [0, -46, 0]],
    // calf vent block behind the knee (etching stickers 8/9 go on it)
    [tbox(8, 6, 8, 8, 14, { c: 0.8 }), [0, -19, -7.5]],
    // hooked link arm clipped to the frame peg
    [cbox(2, 12, 3, 0.4), [3.5, -12, 3.5], [0.2, 0, 0]],
    // ankle ring on a ribbed stub
    [ribbed(3, 6, 3), [0, -80, 0]],
    [tube(6.5, 4.2, 8, 'x'), [0, -88, 0], null, FD],
  ], { from: msfFrom });

  // 2 ── hip ring caps
  kit.step('Hip joint caps', { pp: right ? 15 : 17, view: 'front', desc: 'Insert D① and D④ into the hip ring from both sides.' });
  part(kit, 'D1', hip, [
    [cyl(4.2, 4.2, 7, 18, 'x'), [-5.5, 0, 0]],
    [cbox(3, 9, 6, 0.6), [-8.5, -3, 0]],
    [cbox(3, 4, 9, 0.6), [-8.5, -7.5, 0]],
  ], { from: [-30, 4, 0] });
  part(kit, 'D4', hip, [
    [capDisc(7, 2, 'x'), [4, 0, 0]],
    [cyl(3, 3, 4, 14, 'x'), [3, 0, 0]],
    [cbox(3, 5, 10, 0.6), [5.5, -6.5, 0]],
  ], { from: [30, 4, 0] });

  // 3 ── knee piston (front of the shin)
  kit.step('Shin piston', {
    pp: right ? 15 : 17, view: 'front', caution: 'Mind the orientation of P3⑬ (tab towards the frame).',
    desc: 'Slide the chrome W⑳ rods up into the red P3⑬ cylinders, snap the top of P3⑬ under the knee, then clip the bottom of W⑳ above the ankle.',
  });
  part(kit, 'P3-13', knee, [
    [cyl(2.4, 2.4, 22, 16), [-3.2, -23, 7.5]],
    [cyl(2.4, 2.4, 22, 16), [3.2, -23, 7.5]],
    [cbox(11, 4, 5, 0.8), [0, -11, 7]],
    [cyl(1.2, 1.2, 5, 10, 'z'), [0, -11, 4]],
    [nub(2, 3, 1.5), [5.5, -14, 7.5]],
  ], { from: [0, 20, 30] });
  part(kit, 'W20', knee, [
    [cyl(1.15, 1.15, 34, 12), [-3.2, -48, 7.5]],
    [cyl(1.15, 1.15, 34, 12), [3.2, -48, 7.5]],
    [cbox(10, 3.5, 4, 0.6), [0, -66, 6.8]],
    [cyl(1, 1, 4, 10, 'z'), [0, -66, 4.5]],
  ], { from: [0, -40, 12] });

  // 4 ── thigh side plates
  kit.step('Thigh side plates', { pp: right ? 15 : 17, view: iv, desc: 'Press D⑧ and D⑤ onto the two sides of the thigh frame; the long pegs of D⑤ go through the frame into D⑧.' });
  const thighOutline = [[-12, -8], [-4, -3], [9, -3], [13, -9], [13, -34], [8, -44], [-8, -44], [-13, -36]];
  part(kit, 'D8', hip, [
    [sidePlate(thighOutline, 3), [-6.5, 0, 0]],
    [capDisc(5, 1.2, 'x'), [-8, -23, 1], [0, PI, 0]],
    [cyl(1.6, 1.6, 2, 12, 'x'), [-8.6, -38, -4]],
    [nub(1, 8, 2), [-8.2, -14, 8]],
  ], { from: [-35, 0, 0] });
  part(kit, 'D5', hip, [
    [sidePlate(thighOutline.map(([z, y]) => [z * 0.95, y]), 3), [6.5, 0, 0]],
    [cyl(1.9, 1.9, 12, 14, 'x'), [2, -12, 1]],
    [cyl(1.9, 1.9, 12, 14, 'x'), [2, -30, -1]],
    [nub(1, 12, 6), [8.4, -24, -3]],
    [nub(1, 4, 10), [8.4, -37, 0]],
  ], { from: [35, 0, 0] });

  // 5 ── thigh vent: V1-4 → W21 → D10, D10/D11 on the lower thigh
  kit.step('Thigh vent & lower brackets', {
    pp: right ? 15 : 17, view: 'frontL', caution: 'Push V1④ into W㉑ as far as it will go.',
    desc: 'Fit the gold V1④ fins into the chrome W㉑ housing, seat W㉑ in the top of D⑩, then close the lower thigh with D⑩ and D⑪ from opposite sides.',
  });
  part(kit, 'V1-4', hip, [
    [merge([cbox(0.8, 6, 3.4, 0.2), { p: [-1.6, 0, 0] }], [cbox(0.8, 6, 3.4, 0.2), { p: [0, 0, 0] }], [cbox(0.8, 6, 3.4, 0.2), { p: [1.6, 0, 0] }], [cbox(4.6, 1, 3.4, 0.2), { p: [0, -3, 0] }]), [0, -26.5, 12.2]],
  ], { from: [0, 18, 16] });
  part(kit, 'W21', hip, [
    [sub(tbox(7, 5, 6, 4, 8, { c: 0.6 }), [cbox(5.2, 7, 4, 0.2), { p: [0, 1.5, 1] }]), [0, -27, 11.5]],
  ], { from: [0, 14, 20] });
  part(kit, 'D10', hip, [
    [cbox(4.5, 16, 7, 0.8), [-3.2, -39, 9]],
    [cbox(4.5, 5, 9, 0.8), [-3.2, -31.5, 9.5], [0.25, 0, 0]],
    [cyl(1.6, 1.6, 4, 12, 'x'), [-5, -45, 6]],
  ], { from: [-25, 0, 20] });
  part(kit, 'D11', hip, [
    [cbox(4.5, 16, 7, 0.8), [3.2, -39, 9]],
    [cbox(4.5, 5, 9, 0.8), [3.2, -31.5, 9.5], [0.25, 0, 0]],
    [merge([cbox(0.6, 10, 5, 0.1), { p: [5.6, -40, 9] }], [cbox(0.6, 1, 6, 0.1), { p: [5.6, -34, 9] }]), [0, 0, 0]],
    [cyl(1.8, 1.8, 3, 12, 'x'), [5, -45, 6]],
  ], { from: [25, 0, 20] });

  // 6 ── front strips & knee blocks
  kit.step('Thigh front strips & knee blocks', { pp: right ? 15 : 17, view: 'frontL', desc: 'Close the post on the front of the upper thigh with D⑥ + D⑦, and the knee end with D⑬ + D⑭.' });
  part(kit, 'D6', hip, [
    [cbox(2.6, 15, 3.5, 0.5), [1.6, -18, 11.2]],
    [cyl(0.8, 0.8, 2, 8, 'x'), [3.2, -13, 11]], [cyl(0.8, 0.8, 2, 8, 'x'), [3.2, -18, 11]], [cyl(0.8, 0.8, 2, 8, 'x'), [3.2, -23, 11]],
  ], { from: [18, 4, 18] });
  part(kit, 'D7', hip, [
    [cbox(2.6, 15, 3.5, 0.5), [-1.6, -18, 11.2]],
    [cyl(1.6, 1.6, 3.5, 12, 'z'), [-1.6, -25.5, 11.2]],
  ], { from: [-18, 4, 18] });
  part(kit, 'D13', hip, [
    [tbox(6, 8, 5.5, 6.5, 8, { c: 0.8 }), [4, -49, 6.5]],
    [cyl(1.5, 1.5, 2, 12, 'x'), [7.2, -49, 5]],
  ], { from: [24, -6, 12] });
  part(kit, 'D14', hip, [
    [tbox(6, 8, 5.5, 6.5, 8, { c: 0.8 }), [-4, -49, 6.5]],
    [slats(4.5, 5, 1, 4, 0.4), [-4, -49, 10.8]],
  ], { from: [-24, -6, 12] });

  // 7 ── hip block covers
  kit.step('Hip block covers', { pp: right ? 15 : 17, view: 'backL', caution: 'Do not cut the tab marked on D②.', desc: 'Fit D② to the rear of the upper thigh, then D③ over the front of the hip block.' });
  part(kit, 'D2', hip, [
    [frontPlate([[-10, -2], [9, -2], [11, -8], [11, -28], [6, -33], [-8, -33], [-11, -26], [-11, -6]], 3), [0, 0, -10.5]],
    [sidePlate([[-11, -4], [-5, -4], [-5, -24], [-11, -28]], 2.4), [9.3, 0, 0]],
    [nub(4, 3, 2), [8, -3.5, -11]],
  ], { from: [0, 6, -30] });
  part(kit, 'D3', hip, [
    [hull([[-8, -3, 6], [8, -3, 6], [-9, -13, 7], [9, -13, 7], [-7, -4, 10], [7, -4, 10], [-7, -12, 11], [7, -12, 11], [-3, -2.5, 10.5], [3, -2.5, 10.5]]), [0, 0, 0]],
    [sub(cbox(5, 3, 2, 0.4), [cbox(3, 4, 3, 0.1), { p: [0, 1, 0] }]), [0, -3, 10.5]],
  ], { from: [0, 8, 28] });

  // 8 ── ankle joint block
  kit.step('Ankle joint block', { pp: right ? 15 : 17, view: sv, desc: 'Close the ankle ring with C3⑱ and C3⑬ from both sides; the long axle of C3⑬ passes through the ring.' });
  part(kit, 'C3-18', knee, [
    [cbox(6, 13, 13, 1.2), [-7, -88, 0]],
    [capDisc(5.5, 1, 'x'), [-10, -88, 0], [0, PI, 0]],
    [nub(4, 2, 8), [-7, -81, 0]],
  ], { from: [-26, -4, 0] });
  part(kit, 'C3-13', knee, [
    [cbox(6, 13, 13, 1.2), [7, -88, 0]],
    [cyl(2.8, 2.8, 12, 16, 'x'), [3, -88, 0]],
    [cyl(1, 1, 3, 10, 'z'), [7, -84, 6.5]],
  ], { from: [26, -4, 0] });

  // ── p.16 ──
  // 9 ── shin shells
  kit.step('Shin shells', { pp: right ? 16 : 18, view: sv, desc: 'Sandwich the shin frame between D⑨ (outer) and D⑫ (inner).' });
  const shin = [[-10, -12], [8, -12], [11, -20], [10, -34], [7, -60], [8, -74], [5, -77], [-6, -77], [-9, -72], [-8, -50], [-11, -30]];
  part(kit, 'D9', knee, [
    [sidePlate(shin, 3.2), [7, 0, 0]],
    [nub(1.2, 18, 7), [8.9, -32, 0.5]],
    [nub(1.2, 8, 4), [8.9, -56, -1]],
    [cyl(1.6, 1.6, 3, 12, 'x'), [9.2, -68, 0]],
  ], { from: [34, 0, 0] });
  part(kit, 'D12', knee, [
    [sidePlate(shin, 3.2), [-7, 0, 0]],
    [nub(1.2, 14, 8), [-8.9, -30, 0]],
    [merge([cbox(1, 1, 8, 0.1), { p: [0, -44, 0] }], [cbox(1, 1, 8, 0.1), { p: [0, -47, 0] }], [cbox(1, 1, 8, 0.1), { p: [0, -50, 0] }]), [-8.9, 0, -0.5]],
  ], { from: [-34, 0, 0] });

  // Foot frame: built on the bench under the leg, then plugged onto the ankle peg.
  const foot = grp();
  ankle.add(foot);

  // 10 ── ankle hinge block
  kit.step('Ankle hinge block', { pp: right ? 16 : 18, view: sv, caution: 'Push C3⑰ fully into the LARGER hole of C3⑯.', desc: 'Push the ribbed peg of C3⑰ into C3⑯, then sandwich the block between C3⑲ and C3⑭.' });
  part(kit, 'C3-17', foot, [
    [cbox(7, 7, 8, 1), [0, -10, 0]],
    [ribbed(1.8, 7, 3, 'x'), [4, -10, 0]],
  ], { from: [18, -8, 0] });
  part(kit, 'C3-16', foot, [
    [sub(cbox(12, 8, 12, 1.2), [cbox(8, 9, 9, 0.2), { p: [0, 0, 0] }], [cyl(2.2, 2.2, 14, 14, 'x'), { p: [0, 0, 0] }]), [0, -10, 0]],
    [cyl(1.6, 1.6, 13, 14, 'x'), [0, -12, 5]],
  ], { from: [0, -10, 20] });
  part(kit, 'C3-19', foot, [
    [hull([[-8, -17, -2], [8, -17, -2], [-8, -17, 10], [8, -17, 10], [-7, -14, -2], [7, -14, -2], [-7, -15, 9], [7, -15, 9]]), [0, 0, 0]],
  ], { from: [0, -18, 12] });
  part(kit, 'C3-14', foot, [
    [tbox(16, 9, 14, 7, 4, { c: 0.8 }), [0, -4.5, 9]],
    [merge([cbox(12, 0.8, 0.8, 0.1), { p: [0, 0, 0] }], [cbox(12, 0.8, 0.8, 0.1), { p: [0, 0, -2.4] }]), [0, -2.3, 10]],
  ], { from: [0, 16, 14] });

  // 11 ── heel frame
  kit.step('Heel frame', { pp: right ? 16 : 18, view: sv, caution: 'Pay attention to the orientation of C3⑮.', desc: 'Insert the C3⑮ link into C3㉔, then sandwich the hinge block between C3㉓ and C3㉔.' });
  part(kit, 'C3-15', foot, [
    [cyl(1.8, 1.8, 3, 14, 'x'), [0, -14, -16]],
    [cbox(3, 5, 2.4, 0.4), [0, -11, -16]],
  ], { from: [0, 10, -18] });
  part(kit, 'C3-24', foot, [
    [sidePlate([[4, -8], [-6, -8], [-17, -11], [-21, -15], [-20, -19], [-12, -20], [4, -20]], 4.5), [5.2, 0, 0]],
    [sphere(3.5, 14), [5.4, -15, -18], null, null, [0.9, 1, 1]],
  ], { from: [24, 0, -8] });
  part(kit, 'C3-23', foot, [
    [sidePlate([[4, -8], [-6, -8], [-16, -11], [-20, -16], [-19, -19], [-12, -20], [4, -20]], 4.5), [-5.2, 0, 0]],
    [cyl(1.8, 1.8, 3, 12, 'x'), [-8, -14, -8]],
  ], { from: [-24, 0, -8] });

  // 12 ── toe block, then plug the foot frame onto the ankle
  const toeJoin = kit.step('Toe block & foot attach', {
    pp: right ? 16 : 18, view: sv, caution: 'Do not forget C3㉑ inside the toe block (it cannot be added later).',
    desc: 'Fit C3㉑ between C3㉒ and C3⑳ to make the toe block and join it to the heel frame. Turn the parts and plug the finished foot frame onto the ankle peg at the bottom of the leg.',
  });
  part(kit, 'C3-21', foot, [
    [cbox(8, 6, 8, 1), [0, -14, 22]],
    [cyl(2.2, 2.2, 12, 14, 'x'), [0, -14, 17]],
  ], { from: [0, 14, 22] });
  const toeSide = [[5, -9], [16, -10], [28, -13], [36, -16], [37, -20], [5, -20]];
  part(kit, 'C3-22', foot, [
    [sidePlate(toeSide, 6), [4.2, 0, 0]],
    [cyl(3, 3, 3, 16, 'x'), [7.2, -14, 12]],
    [nub(2, 2, 10), [7.3, -13, 26]],
  ], { from: [24, 0, 18] });
  part(kit, 'C3-20', foot, [
    [sidePlate(toeSide, 6), [-4.2, 0, 0]],
    [tube(3.2, 1.8, 2, 'x'), [-7.4, -14, 12]],
  ], { from: [-24, 0, 18] });
  kit.join(foot, [0, -30, 28]);

  // 13 ── knee insert
  kit.step('Knee insert', { pp: right ? 16 : 18, view: 'back', desc: 'Bend the knee fully, push F1⑧ into the slot at the back of the knee, then straighten the leg again.' });
  part(kit, 'F1-8', knee, [
    [cbox(9, 4.5, 4, 0.6), [0, -2, -6.5]],
    [cyl(0.9, 0.9, 2, 8, 'z'), [0, -2, -4]],
  ], { from: [0, 0, -24] });

  // 14 ── gold knee caps
  kit.step('Knee caps', { pp: right ? 16 : 18, view: sv, caution: 'V1⑦ is an under-gate part: trim the gate remains cleanly.', desc: 'Press a gold V1⑦ cap into the knee axle on each side.' });
  part(kit, 'V1-7', knee, [[capDisc(4.6, 1.3, 'x'), [6.5, -1.5, 0]]], { from: [24, 0, 0] });
  part(kit, 'V1-7', knee, [[capDisc(4.6, 1.3, 'x'), [-6.5, -1.5, 0], [0, PI, 0]]], { from: [-24, 0, 0] });

  // 15 ── calf vent: etching stickers first, then the louvres
  kit.step('Calf vent', {
    pp: right ? 16 : 18, view: 'back', caution: 'Peel the etching stickers off slowly; apply them before fitting F1⑥ / F1⑦.',
    desc: 'Apply etching stickers 8 and 9 to the vent block behind the knee, then cover it with the F1⑥ and F1⑦ louvres.',
  });
  sticker(kit, 'ETCH-9', knee, { w: 5, h: 5, p: [0, -15.5, -11.6], r: [0, PI, 0], color: 'etching' });
  sticker(kit, 'ETCH-8', knee, { w: 5, h: 5, p: [0, -22.5, -11.6], r: [0, PI, 0], color: 'etching' });
  part(kit, 'F1-6', knee, [
    [sidePlate([[-5, -12], [-12, -12], [-12, -26], [-5, -26]], 1.2), [3.6, 0, 0]],
    [slats(1.8, 11, 7, 5, 0.6), [3.6, -19, -8.5], [0, PI / 2, 0]],
  ], { from: [22, 0, -12] });
  part(kit, 'F1-7', knee, [
    [sidePlate([[-5, -12], [-12, -13], [-12, -25], [-5, -26]], 1.2), [-3.6, 0, 0]],
    [slats(1.8, 11, 7, 5, 0.6), [-3.6, -19, -8.5], [0, PI / 2, 0]],
  ], { from: [-22, 0, -12] });

  // 16 ── knee side plates
  kit.step('Knee side plates', { pp: right ? 16 : 18, view: sv, desc: 'Sandwich the knee / upper shin with F1⑨ (inner) and F1⑤ (outer).' });
  const shield = [[-10, -6], [9, -6], [10, -14], [7, -26], [0, -31], [-7, -26], [-10, -14]];
  part(kit, 'F1-5', knee, [
    [sidePlate(shield, 2.4), [11, 0, 0]],
    [nub(1, 10, 10), [12.6, -15, 0]],
    [cyl(1.4, 1.4, 1.5, 12, 'x'), [12.6, -24, 0]],
  ], { from: [30, 0, 4] });
  part(kit, 'F1-9', knee, [
    [sidePlate(shield, 2.4), [-11, 0, 0]],
    [sub(cbox(1.4, 12, 12, 0.3), [cbox(3, 9, 9, 0.2), { p: [-1, 0, 0] }]), [-12.6, -15, 0]],
  ], { from: [-30, 0, 4] });

  // ── p.17 ──
  // 17 ── sole plates
  kit.step('Sole plates', { pp: right ? 17 : 19, view: 'under', desc: 'Press F1② (heel) and F1① (toe) onto the pegs under the foot frame.' });
  const sole = (l, w) => [[-w / 2 + 2, 0], [w / 2 - 2, 0], [w / 2, 2], [w / 2, l - 2], [w / 2 - 2, l], [-w / 2 + 2, l], [-w / 2, l - 2], [-w / 2, 2]];
  part(kit, 'F1-2', foot, [
    [flatPlate(sole(23, 20).map(([x, z]) => [x, z - 21]), 2.6), [0, -20.7, 0]],
    [cyl(3.5, 3.5, 0.8, 18), [0, -22.1, -9]],
  ], { from: [0, -22, -6] });
  part(kit, 'F1-1', foot, [
    [flatPlate(sole(33, 22).map(([x, z]) => [x, z + 4]), 2.6), [0, -20.7, 0]],
    [cyl(3.5, 3.5, 0.8, 18), [0, -22.1, 18]],
    [nub(14, 0.8, 1.2), [0, -22.1, 30]],
  ], { from: [0, -24, 10] });

  // 18 ── ankle guards
  kit.step('Ankle guards', { pp: right ? 17 : 19, view: sv, desc: 'Sandwich the ankle joint between F1④ (outer) and F1③ (inner): the round hubs go over the ankle axle, the other ends pin into the heel frame.' });
  const guard = [[5, 5], [-5, 5], [-8, 1], [-18, -6], [-18, -12], [-12, -13], [5, -5]];
  part(kit, 'F1-4', ankle, [
    [sidePlate(guard, 2.4), [11, 0, 0]],
    [cyl(5, 5, 2.4, 20, 'x'), [11.6, 0, 0]],
    [merge([cbox(1, 0.8, 6, 0.1), { p: [0, -3, -10] }], [cbox(1, 0.8, 6, 0.1), { p: [0, -5.5, -11] }]), [12.6, 0, 0]],
  ], { from: [28, 0, 0] });
  part(kit, 'F1-3', ankle, [
    [sidePlate(guard, 2.4), [-11, 0, 0]],
    [cyl(5, 5, 2.4, 20, 'x'), [-11.6, 0, 0]],
  ], { from: [-28, 0, 0] });

  // 19 ── gold ankle caps
  kit.step(right ? 'Ankle caps · right leg frame complete' : 'Ankle caps', {
    pp: right ? 17 : 19, view: sv, focus: L.root, minDist: 200,
    desc: 'Press a gold V1⑥ cap into each ankle hub. The leg frame is complete: check that hip, knee and ankle articulate freely.',
  });
  part(kit, 'V1-6', ankle, [[capDisc(3.8, 1.2, 'x'), [12.8, 0, 0]]], { from: [20, 0, 0] });
  part(kit, 'V1-6', ankle, [[capDisc(3.8, 1.2, 'x'), [-12.8, 0, 0], [0, PI, 0]]], { from: [-20, 0, 0] });
}

// ───────────────────────── PHASE 03 · LEGS-TRUSS-FRAME ─────────────────────────
// Silver truss panels (S3 / T4 / W) pinned onto the MSF frame: they sit just outside the D / F1 frame shells
// and inside the armor of phase 04.

export function legTruss(kit, R) {
  kit.section('LEGS-TRUSS-FRAME', { pp: 33 });
  legTrussSide(kit, R, 'R');
  kit.block('LEFT-LEG-TRUSS-FRAME ASSEMBLE', {
    pp: 34, compact: true,
    desc: 'Build the left leg truss frame like the right one, mirrored, with the parts of the second T4 runner: S3⑬ on the rear of the upper thigh, T4⑫ / T4⑬ on the front of the thigh and behind the knee, T4⑮ + T4⑯ into the knee side and T4⑭ + T4⑯ behind the knee (swapped with the right leg), swing the knee side flaps out and up, then W㉒, S3⑫, T4⑰ and T4⑱ (pp.34-35).',
  });
  legTrussSide(kit, R, 'L');
}

function legTrussSide(kit, R, side) {
  const L = R.leg[side];
  const { hip, knee, ankle } = L;
  const right = side === 'R';
  if (right) kit.block('RIGHT-LEG-TRUSS-FRAME ASSEMBLE', { pp: 33 });
  const sv = right ? 'right' : 'left';
  // the knee clip pair is mirrored between the legs: right = T4-14 front / T4-15 rear, left = the other way round
  const [kF, kR] = right ? ['T4-14', 'T4-15'] : ['T4-15', 'T4-14'];

  // p.33 ① ── S3-13 on the rear of the upper thigh
  kit.step('Rear thigh truss', {
    pp: right ? 33 : 34, view: right ? 'backR' : 'backL',
    desc: 'Swing the leg forward and up at the hip, lift the hip block out of the way, press S3⑬ onto the three pins on the rear of the upper thigh, then swing the leg back down.',
  });
  part(kit, 'S3-13', hip, [
    [lattice(12, 25, 2.4, 2, 3, 1.4, 0.9), [0, -17.5, -13.3]],
    [cbox(9, 2, 3.4, 0.4), [0, -4.8, -13]],
    [tbox(12, 2.4, 9, 2.4, 3, { c: 0.4 }), [0, -31.5, -13.3]],
  ], { from: [0, 4, -30] });

  // p.33 ② ── T4-12 front of the upper thigh, T4-13 behind the knee
  kit.step('Thigh front & rear truss', {
    pp: right ? 33 : 34, view: right ? 'frontR' : 'frontL',
    desc: 'Lower the hip block again. Press T4⑫ onto the front of the upper thigh and the curved T4⑬ onto the back of the lower thigh, behind the knee.',
  });
  part(kit, 'T4-12', hip, [
    [lattice(10, 19, 2.4, 2, 3, 1.3, 0.8), [0, -14, 14.5]],
    [cbox(6, 1.6, 3, 0.3), [0, -4, 14]],
  ], { from: [0, 2, 30] });
  part(kit, 'T4-13', hip, [
    [lattice(12, 11, 2.2, 2, 1, 1.3, 0.9), [0, -35.5, -13]],
    [lattice(11, 10, 2.2, 2, 1, 1.3, 0.9), [0, -45.2, -11.3], [-0.38, 0, 0]],
    [cbox(10, 1.6, 3, 0.4), [0, -40.8, -13.2]],
  ], { from: [0, -4, -30] });

  // p.34 ① ── knee clips with the T4-16 pins
  kit.step('Knee truss clips', {
    pp: right ? 34 : 35, view: sv, caution: 'Do not forget the T4⑯ pins. Tightly fit the parts as far as they will go.',
    desc: `Push a T4⑯ pin through ${kF.replace('T4-', 'T4 ')} and press the pair into the hole on the side of the knee shield; push the second T4⑯ through ${kR.replace('T4-', 'T4 ')} and press it into the hole behind the knee.`,
  });
  part(kit, kF, knee, [
    [sidePlate([[-1, -10.5], [6, -10], [9, -12], [9, -15], [6, -16.5], [-1, -16]], 1.2), [13.1, 0, 0]],
    [merge([cbox(0.6, 1, 4, 0.1), { p: [13.8, -12, 3] }], [cbox(0.6, 1, 4, 0.1), { p: [13.8, -14.6, 3] }]), [0, 0, 0]],
  ], { from: [26, 0, 6] });
  part(kit, 'T4-16', knee, [
    [cyl(1, 1, 2, 12, 'x'), [13.3, -13.3, 5]],
    [cyl(1.5, 1.5, 0.5, 6, 'x'), [14.4, -13.3, 5]],
  ], { from: [22, 0, 0] });
  part(kit, kR, knee, [
    [cbox(10, 4, 1.4, 0.4), [0, -6.5, -11.4]],
    [cbox(1.4, 4, 4.5, 0.3), [-4.5, -6.5, -9.2]],
    [cbox(1.4, 4, 4.5, 0.3), [4.5, -6.5, -9.2]],
  ], { from: [0, 0, -26] });
  part(kit, 'T4-16', knee, [
    [cyl(1, 1, 2, 12, 'z'), [0, -6.5, -12.4]],
    [cyl(1.5, 1.5, 0.5, 6, 'z'), [0, -6.5, -13.5]],
  ], { from: [0, 0, -22] });

  // p.34 ②③ ── knee side flaps (no parts), then W22, S3-12 / T4-17 around the lower shin, T4-18 on the heel
  kit.step('Shin & heel truss', {
    pp: right ? 34 : 35, view: right ? 'frontR' : 'frontL', focus: L.root, minDist: 170,
    caution: 'W㉒: pay attention to the orientation (notch at the top).',
    desc: 'Swing the dark knee side flaps out and rotate them up (both sides). Then press the chrome W㉒ onto the front of the lower thigh above the knee, sandwich the lower shin between S3⑫ (front, its long peg passes through) and T4⑰ (rear), and press T4⑱ onto the top of the heel.',
  });
  part(kit, 'W22', hip, [
    [cbox(2, 8, 3.6, 0.3), [-2.5, -50.5, 11.8]],
    [cbox(2, 8, 3.6, 0.3), [2.5, -50.5, 11.8]],
    [cbox(3.2, 2.2, 3.2, 0.3), [0, -50.8, 11.8]],
  ], { from: [0, 0, 24] });
  part(kit, 'S3-12', knee, [
    [lattice(9, 18, 2.4, 1, 3, 1.3, 0.9), [0, -75, 11.6]],
    [cbox(9, 2.4, 4, 0.4), [0, -65, 11]],
    [cyl(1.2, 1.2, 4, 10, 'z'), [0, -79, 9]],
  ], { from: [0, 0, 26] });
  part(kit, 'T4-17', knee, [
    [hull([[-5, -62, -10], [5, -62, -10], [-5, -62, -12.4], [5, -62, -12.4], [-4, -82, -8.8], [4, -82, -8.8], [-4, -80, -13.4], [4, -80, -13.4]]), [0, 0, 0]],
    [slats(7, 12, 0.8, 4, 0.4), [0, -71, -13]],
  ], { from: [0, 0, -26] });
  part(kit, 'T4-18', ankle, [
    [hull([[-5, -9.4, -8.5], [5, -9.4, -8.5], [-5, -9.9, -14], [5, -9.9, -14], [-4.5, -6, -9], [4.5, -6, -9], [-4.5, -7.2, -13.5], [4.5, -7.2, -13.5]]), [0, 0, 0]],
    [slats(8, 3.5, 0.6, 3, 0.3), [0, -7.2, -13.8], [0, 0, 0]],
  ], { from: [0, 16, -18] });
}

// ───────────────────────── PHASE 04 · LEGS-ARMOR ─────────────────────────
// Exterior envelope (leg space): thigh |x| ≤ 14, z −16.5…18.5; shin |x| ≤ 15.6, knee armor to z 20,
// calf to z −20; foot |x| ≤ 14.3, toe tip z 44.4, heel z −24, sole at y −22.

/** Half shell of a convex loft: sections {y, w, zf, zr, c}. open '-z' = front shell (open at the back), '+z' = rear shell. Open top and bottom. */
function halfShell(secs, t, open) {
  const ring = (s, zf, zr, w, c) => ({ y: s.y, w, d: zf - zr, z: (zf + zr) / 2, x: s.x || 0, c });
  const outer = loft(secs.map((s) => ring(s, s.zf, s.zr, s.w, s.c || 0)));
  const inner = secs.map((s) => ring(s, open === '-z' ? s.zf - t : s.zf + 12, open === '-z' ? s.zr - 12 : s.zr + t, s.w - 2 * t, Math.max(0, (s.c || 0) - t * 0.5)));
  const top = inner.reduce((a, b) => (b.y > a.y ? b : a)), bot = inner.reduce((a, b) => (b.y < a.y ? b : a));
  inner.push({ ...top, y: top.y + 12 }, { ...bot, y: bot.y - 12 });
  return sub(outer, loft(inner));
}

/** Side plate (outline in z,y, thickness along x) with window holes. */
function holedSide(outlineZY, holes, t) {
  const s = new THREE.Shape(outlineZY.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([a, b]) => new THREE.Vector2(a, b))));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -t / 2);
  g.rotateY(-PI / 2);
  return g;
}

const circle = (r, n = 16) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * 2 * PI), r * Math.sin((i / n) * 2 * PI)]);
const STK = { red: '#c8323a', gray: '#80868d', green: '#3dba5a', white: '#e9e9e4' };

// Per-leg part numbers (right pp.40-42, left pp.42-43).
const ARMOR_IDS = {
  R: {
    thighRear: 'J1-3', thighRearKey: 'L1-8', thighFront: 'L1-5', thighFrontKey: 'J1-1', kneeCap: 'J1-8', knee: 'J1-17',
    kneeIn: 'L1-2', kneeTab: 'L1-1', calfBox: 'L1-7', calfBoxPlate: 'J1-13', calfFlap: 'J1-12', hoopOut: 'J1-16',
    hoopIn: 'J1-15', calfUp: 'L1-3', calfMid: 'L1-4', calfTab: 'J1-14', shin: 'J1-5', toeLever: 'O2-16', toe: 'N4-12',
    sole: 'O2-15', toeSole: 'O2-17', sideOut: 'O2-12', sideIn: 'O2-13', hood: 'J1-6', heel: 'N4-13', heelTrim: 'L1-9',
    heelSole: 'O2-14', ankleCap: 'J1-9', fork: 'J1-7', band: 'L1-10', bandEnd: 'J1-10', bandUnder: 'J1-11', disc: 'G2-11',
  },
  L: {
    thighRear: 'J1-4', thighRearKey: 'L2-8', thighFront: 'L1-6', thighFrontKey: 'J1-2', kneeCap: 'J2-8', knee: 'J2-17',
    kneeIn: 'L2-2', kneeTab: 'L2-1', calfBox: 'L2-7', calfBoxPlate: 'J2-13', calfFlap: 'J2-12', hoopOut: 'J2-16',
    hoopIn: 'J2-15', calfUp: 'L2-4', calfMid: 'L2-3', calfTab: 'J2-14', shin: 'J2-5', toeLever: 'O2-16', toe: 'N4-12',
    sole: 'O2-15', toeSole: 'O2-17', sideOut: 'O2-13', sideIn: 'O2-12', hood: 'J2-6', heel: 'N4-13', heelTrim: 'L2-9',
    heelSole: 'O2-14', ankleCap: 'J2-9', fork: 'J2-7', band: 'L2-10', bandEnd: 'J2-11', bandUnder: 'J2-10', disc: 'G2-11',
  },
};

export function legArmor(kit, R) {
  kit.section('LEGS-ARMOR', { pp: 40 });
  legArmorSide(kit, R, 'R');
  kit.block('LEFT-LEG-ARMOR ASSEMBLE', {
    pp: 42, compact: true,
    desc: 'Build the left leg armor like the right one, mirrored, with the J2 / L2 parts: J1④ + L2⑧ and L1⑥ + J1② on the thigh, J2⑧ ×2 and J2⑰ + L2② + L2① on the knee, L2⑦ + J2⑬, J2⑫, J2⑯ / J2⑮, L2④ / L2③, J2⑭ and J2⑤ on the shin, the same O2 / N4 foot parts with J2⑥ and L2⑨, then J2⑨ ×2, J2⑦, L2⑩ + J2⑪ / J2⑩ and G2⑪ ×2 (pp.42-43).',
  });
  legArmorSide(kit, R, 'L');
}

function legArmorSide(kit, R, side) {
  const L = R.leg[side];
  const { hip, knee, ankle } = L;
  const right = side === 'R';
  const I = ARMOR_IDS[side];
  if (right) kit.block('RIGHT-LEG-ARMOR ASSEMBLE', { pp: 40 });
  const sv = right ? 'right' : 'left';
  const iv = right ? 'left' : 'right';
  const bv = right ? 'backR' : 'backL';
  const fv = right ? 'frontR' : 'frontL';
  const pg = (r, l) => (right ? r : l);

  // Gimmick hatches (manual p.62 LEGS HATCH OPEN), pivots in the parent group's space
  const H = {
    thigh: { axis: [0, 1, 0], angle: -0.75, pivot: [14, -26, 3] },         // rear thigh armor swings out
    knee: { axis: [1, 0, 0], angle: -0.55, pivot: [0, 7, 11] },            // knee armor tips forward / up
    flap: { axis: [0, 1, 0], angle: -0.9, pivot: [15, -30, 1] },           // outer calf flap opens sideways
    calf: { axis: [1, 0, 0], angle: 0.9, pivot: [0, -31, -18] },           // rear calf armor rises
    shin: { axis: [1, 0, 0], angle: 0.45, pivot: [0, -82, 15] },           // front shin armor swings forward
  };

  // ── thigh (hip space) ──
  const TH = [
    { y: -4, w: 26, zf: 17.5, zr: -15.5, c: 4 },
    { y: -20, w: 28, zf: 18.5, zr: -16.5, c: 5 },
    { y: -34, w: 27.5, zf: 18, zr: -16.5, c: 5 },
    { y: -47, w: 25, zf: 15, zr: -15, c: 4 },
  ];
  const cut = 3;

  // p.40 ① ── lower / rear thigh armor
  kit.step('Rear thigh armor', {
    pp: pg(40, 42), view: bv,
    desc: `Bend the knee, press ${I.thighRear} onto the back of the thigh (over S3⑬ / T4⑬), push the ${I.thighRearKey} key into its window, then straighten the leg.`,
  });
  const rearSecs = [{ y: -8, w: 26.5, zf: cut, zr: -15.8, c: 4.2 }, ...TH.slice(1).map((s) => ({ ...s, zf: cut }))];
  part(kit, I.thighRear, hip, [
    [halfShell(rearSecs, 1.6, '+z'), [0, 0, 0]],
    [frontPlate([[-8, -12], [8, -12], [7, -40], [-7, -40]], 0.8), [0, 0, -16.6]],
    [cbox(4, 3, 3, 0.4), [0, -6.5, -15]],
  ], { from: [0, -6, -32], hatch: H.thigh });
  part(kit, I.thighRearKey, hip, [
    [cbox(8, 3, 2.4, 0.5), [0, -30, -17.2]],
    [cbox(6, 1, 1, 0.2), [0, -30, -18.5]],
  ], { from: [0, 0, -22], hatch: H.thigh });

  // p.40 ② ── upper / front thigh armor
  kit.step('Front thigh armor', {
    pp: pg(40, 42), view: fv,
    desc: `Turn the leg. Press ${I.thighFront} onto the front of the upper thigh (over T4⑫) and push the ${I.thighFrontKey} key into its slot.`,
  });
  part(kit, I.thighFront, hip, [
    [halfShell([...TH.slice(0, 3), { y: -42, w: 26, zf: 16.2, c: 4.5 }].map((s) => ({ ...s, zr: cut })), 1.6, '-z'), [0, 0, 0]],
    [frontPlate([[-7, -7], [7, -7], [6, -30], [-6, -30]], 1.2), [0, 0, 18.4]],
  ], { from: [0, 4, 32] });
  part(kit, I.thighFrontKey, hip, [
    [cbox(7, 4, 2.2, 0.5), [0, -33, 17.3]],
    [cbox(3, 1, 1, 0.2), [0, -33, 18.6]],
  ], { from: [0, -4, 22] });

  // p.41 ① ── knee hub caps
  kit.step('Knee hub caps', {
    pp: pg(41, 42), view: sv, caution: `Mind the orientation of ${I.kneeCap} (bar diagonal, as shown).`,
    desc: `Press a ${I.kneeCap} ring over the knee joint on each side.`,
  });
  for (const s of [1, -1]) {
    part(kit, I.kneeCap, knee, [
      [tube(7, 4.3, 3.2, 'x'), [s * 14.4, -1.5, 0]],
      [cbox(1.4, 10, 1.8, 0.3), [s * 15.8, -1.5, 0], [0.6, 0, 0]],
    ], { from: [s * 26, 0, 0] });
  }

  // p.41 ② ── knee armor
  kit.step('Knee armor', {
    pp: pg(41, 42), view: fv,
    desc: `Fit ${I.kneeIn} and ${I.kneeTab} into the back of ${I.knee}, then press the knee armor onto the front of the knee.`,
  });
  const kneeOut = [];
  const kneeIn = [];
  for (const s of [1, -1]) {
    kneeOut.push([s * 9, 7, 9], [s * 9, 7, 14], [s * 12.5, -1, 8], [s * 12.5, -1, 18], [s * 12.5, -14, 8], [s * 12, -14, 20],
      [s * 8.5, -24, 8], [s * 8, -24, 17.5]);
    kneeIn.push([s * 7.4, 5.4, 0], [s * 7.4, 5.4, 12.4], [s * 10.9, -1, 0], [s * 10.9, -1, 16.4], [s * 10.9, -14, 0], [s * 10.4, -14, 18.4],
      [s * 6.9, -24, 0], [s * 6.4, -24, 15.9]);
  }
  kneeOut.push([0, -29.5, 9], [0, -29, 15]);
  kneeIn.push([0, -27.5, 0], [0, -27.3, 13.4]);
  part(kit, I.knee, knee, [
    [sub(hull(kneeOut), hull(kneeIn)), [0, 0, 0]],
    [sidePlate([[9, -3], [16, -3], [18, -12], [9, -12]], 1), [12.8, 0, 0]],
    [sidePlate([[9, -3], [16, -3], [18, -12], [9, -12]], 1), [-12.8, 0, 0]],
  ], { from: [0, 6, 32], hatch: H.knee });
  part(kit, I.kneeIn, knee, [[cbox(9, 14, 1.6, 0.4), [0, -9, 16.4]]], { from: [0, 0, 24], hatch: H.knee });
  part(kit, I.kneeTab, knee, [[cbox(8, 6, 2, 0.5), [0, -21, 15.2]]], { from: [0, -6, 24], hatch: H.knee });

  // p.41 ③ ── lower calf box
  kit.step('Lower calf box', {
    pp: pg(41, 42), view: bv,
    desc: `Turn the leg. Press the ${I.calfBox} box onto the back of the lower shin (over T4⑰) and fit ${I.calfBoxPlate} into its window.`,
  });
  part(kit, I.calfBox, knee, [
    [rimPlate(17, 20, 3.4, 1.8, 1), [0, -70.5, -15.2]],
    [sidePlate([[-15.8, -61], [-10, -61], [-9.5, -80], [-15.8, -80]], 1.5), [7.8, 0, 0]],
    [sidePlate([[-15.8, -61], [-10, -61], [-9.5, -80], [-15.8, -80]], 1.5), [-7.8, 0, 0]],
    [cbox(17, 1.6, 6, 0.4), [0, -61, -13]],
  ], { from: [0, 0, -28] });
  part(kit, I.calfBoxPlate, knee, [[cbox(8, 11, 2, 0.8), [0, -70.5, -15.3]]], { from: [0, 0, -20] });

  // p.41 ④ ── calf side shells
  kit.step('Calf side shells', {
    pp: pg(41, 42), view: sv,
    desc: `Fit the ${I.calfFlap} flap into the window of ${I.hoopOut}, then close the calf between ${I.hoopOut} (outer) and ${I.hoopIn} (inner).`,
  });
  const hoop = [[10, -10], [2, -8.5], [-8, -10], [-15, -15], [-18.5, -24], [-18.5, -38], [-16, -52], [-13, -66], [-11.5, -80], [3, -81], [11, -80], [12, -62], [13, -40], [12.5, -22]];
  const win = [[1, -17], [-8, -17], [-13, -25], [-13, -39], [-9, -47], [1, -42]];
  part(kit, I.calfFlap, knee, [
    [holedSide(win.map(([z, y]) => [z * 0.97 - 0.2, y]), [], 1.6), [16.3, 0, 0], [0, 0, -0.04]],
    [sidePlate([[-2, -22], [-9, -24], [-10, -36], [-6, -40]], 0.6), [17.3, 0, 0], [0, 0, -0.04]],
  ], { from: [26, 0, 0], hatch: H.flap });
  part(kit, I.hoopOut, knee, [
    [holedSide(hoop, [win], 1.6), [16, 0, 0], [0, 0, -0.04]],
    [sidePlate([[4, -52], [10, -50], [11, -70], [5, -72]], 0.6), [16.6, 0, 0], [0, 0, -0.04]],
  ], { from: [30, 0, 0] });
  part(kit, I.hoopIn, knee, [
    [holedSide(hoop, [win], 1.6), [-16, 0, 0], [0, 0, 0.04]],
    [sidePlate([[4, -52], [10, -50], [11, -70], [5, -72]], 0.6), [-16.6, 0, 0], [0, 0, 0.04]],
  ], { from: [-30, 0, 0] });

  // p.41 ⑤ ── calf covers and the front shin armor
  kit.step('Calf covers & shin armor', {
    pp: pg(41, 43), view: fv, focus: knee, minDist: 150,
    desc: `Press ${I.calfUp} (upper) and ${I.calfMid} (middle) over the back of the calf and ${I.calfTab} above the ankle. Then swing the front shin armor ${I.shin} in along the curved path until it clicks onto the front of the shin.`,
  });
  part(kit, I.calfUp, knee, [
    [loft([{ y: -10, w: 18, d: 3, z: -14, c: 1 }, { y: -16, w: 26, d: 4, z: -17.3, c: 1.5 }, { y: -31, w: 27, d: 4, z: -18.3, c: 1.5 }]), [0, 0, 0]],
  ], { from: [0, 4, -28] });
  part(kit, I.calfMid, knee, [
    [loft([{ y: -31, w: 27, d: 4, z: -18.3, c: 1.5 }, { y: -44, w: 25, d: 4, z: -17, c: 1.5 }, { y: -52, w: 21, d: 3.5, z: -15.2, c: 1.2 }]), [0, 0, 0]],
    [merge([cbox(14, 0.8, 1, 0.1), { p: [0, -35, -20.2] }], [cbox(14, 0.8, 1, 0.1), { p: [0, -37.5, -20] }]), [0, 0, 0]],
  ], { from: [0, -4, -28], hatch: H.calf });
  part(kit, I.calfTab, knee, [
    [cbox(4, 8, 2.4, 0.4), [0, -55.5, -14.3]],
    [cbox(4, 2, 5, 0.4), [0, -58.5, -11.5]],
  ], { from: [0, 0, -20] });
  const shinSecs = [
    { y: -30, w: 24, zf: 15.2, zr: 5, c: 3 },
    { y: -45, w: 25, zf: 16.2, zr: 5, c: 3.5 },
    { y: -70, w: 25, zf: 16, zr: 5, c: 3.5 },
    { y: -82, w: 24.5, zf: 17, zr: 5, c: 3 },
  ];
  const point = (s) => hull([[s * 10.9, -30.5, 5], [s * 12.4, -30.5, 5], [s * 10.9, -30.5, 14.6], [s * 12, -30.5, 14], [s * 11, -19, 9.5], [s * 12.2, -19, 9.5], [s * 11, -21, 5], [s * 12.4, -21, 5]]);
  part(kit, I.shin, knee, [
    [halfShell(shinSecs, 1.6, '-z'), [0, 0, 0]],
    [point(1), [0, 0, 0]],
    [point(-1), [0, 0, 0]],
    [frontPlate([[-8, -58], [8, -58], [9, -80], [-9, -80]], 0.8), [0, 0, 16.2]],
  ], { from: [0, -14, 30], hatch: H.shin });

  // p.41 ⑥⑦ ── toe armor & soles (foot parts live in ankle space)
  kit.step('Toe armor & soles', {
    pp: pg(41, 43), view: fv, focus: ankle, minDist: 110,
    desc: `Fit the ${I.toeLever} lever into the red ${I.toe} and press it over the toe; clip the ${I.sole} sole frame and the ${I.toeSole} toe sole on from below. Then rotate the ankle block up and tilt the toe down to make room for the side plates.`,
  });
  const toeO = [], toeI = [];
  for (const s of [1, -1]) {
    toeO.push([s * 12.2, -4.4, 19.5], [s * 12.2, -17.5, 19.5], [s * 12, -7.6, 30], [s * 11.5, -10.6, 37], [s * 10.5, -13.8, 42.5], [s * 10, -17.5, 44]);
    toeI.push([s * 10.6, -6.1, 17], [s * 10.6, -25, 17], [s * 10.4, -9.3, 30], [s * 9.9, -12.3, 37], [s * 8.9, -15.5, 41.4], [s * 8.4, -25, 42.4]);
  }
  toeO.push([0, -4.2, 19.5]);
  part(kit, I.toeLever, ankle, [[cbox(3, 1.4, 4, 0.3), [0, -6.2, 25.5], [0.3, 0, 0]]], { from: [0, 14, 10] });
  part(kit, I.toe, ankle, [
    [sub(hull(toeO), hull(toeI)), [0, 0, 0]],
    [merge([cbox(16, 0.6, 0.8, 0.1), { p: [0, -8.6, 33], r: [0.4, 0, 0] }], [cbox(14, 0.6, 0.8, 0.1), { p: [0, -10.2, 36.5], r: [0.4, 0, 0] }]), [0, 0, 0]],
  ], { from: [0, 18, 16] });
  part(kit, I.sole, ankle, [
    [cbox(2.8, 4.5, 35, 0.5), [12.9, -19.75, 14.5]],
    [cbox(2.8, 4.5, 35, 0.5), [-12.9, -19.75, 14.5]],
    [cbox(28.6, 1.4, 2, 0.3), [0, -17.8, 31]],
  ], { from: [0, -20, 0] });
  part(kit, I.toeSole, ankle, [
    [flatPlate([[-10, 37], [10, 37], [10.5, 40], [9, 43.2], [5, 44.4], [-5, 44.4], [-9, 43.2], [-10.5, 40]], 4.4), [0, -19.8, 0]],
    [merge([cbox(16, 0.6, 1, 0.1), { p: [0, -22.1, 40] }], [cbox(12, 0.6, 1, 0.1), { p: [0, -22.1, 42.5] }]), [0, 0, 0]],
  ], { from: [0, -18, 12] });

  // p.41 ⑧ ── foot side plates & instep hood
  kit.step('Foot side plates & instep hood', {
    pp: pg(41, 43), view: sv, focus: ankle, minDist: 110, caution: `Fit ${I.hood} tightly, as far as it will go.`,
    desc: `Press ${I.sideOut} and ${I.sideIn} onto the two sides of the foot, then slide the white ${I.hood} hood over the top of the foot, its notch around the ankle.`,
  });
  const footSide = [[-3, -9], [10, -9], [19.5, -11], [19.5, -17.5], [-3, -17.5]];
  part(kit, I.sideOut, ankle, [
    [sidePlate(footSide, 1.8), [13.4, 0, 0]],
    [merge([cbox(0.6, 5, 0.8, 0.1), { p: [14.4, -13.5, 4] }], [cbox(0.6, 5, 0.8, 0.1), { p: [14.4, -13.5, 8] }], [cbox(0.6, 5, 0.8, 0.1), { p: [14.4, -13.5, 12] }]), [0, 0, 0]],
  ], { from: [24, 0, 0] });
  part(kit, I.sideIn, ankle, [
    [sidePlate(footSide, 1.8), [-13.4, 0, 0]],
    [cyl(1.4, 1.4, 0.8, 12, 'x'), [-14.5, -13.5, 8]],
  ], { from: [-24, 0, 0] });
  const hoodTop = [[-12, 7.5], [-5.5, 7.5], [-5.5, 13.5], [5.5, 13.5], [5.5, 7.5], [12, 7.5], [12, 20.5], [-12, 20.5]];
  part(kit, I.hood, ankle, [
    [flatPlate(hoodTop, 1.6), [0, 1.2, 0], [0.28, 0, 0]],
    [sidePlate([[7.2, -0.9], [20, -4.4], [20, -9], [7.2, -9]], 1.6), [11.2, 0, 0]],
    [sidePlate([[7.2, -0.9], [20, -4.4], [20, -9], [7.2, -9]], 1.6), [-11.2, 0, 0]],
  ], { from: [0, 12, 22] });

  // p.41 ⑨ ── heel armor
  kit.step('Heel armor', {
    pp: pg(41, 43), view: bv, focus: ankle, minDist: 110,
    desc: `Turn the leg. Press the red ${I.heel} heel onto the back of the foot, fit the ${I.heelTrim} trim into it and clip the ${I.heelSole} rear sole under the heel. Rotate the foot back to its normal position.`,
  });
  part(kit, I.heel, ankle, [
    [frontPlate([[-14.3, -20], [14.3, -20], [14.3, -10], [11, -7.2], [-11, -7.2], [-14.3, -10]], 2), [0, 0, -23]],
    [sidePlate([[-24, -8], [-3, -9.5], [-3, -20], [-24, -20]], 1.8), [13.4, 0, 0]],
    [sidePlate([[-24, -8], [-3, -9.5], [-3, -20], [-24, -20]], 1.8), [-13.4, 0, 0]],
  ], { from: [0, 0, -28] });
  part(kit, I.heelTrim, ankle, [
    [cbox(22, 1.4, 3, 0.4), [0, -6.5, -23]],
    [cbox(1.4, 3.5, 3, 0.3), [11.2, -8.4, -23]],
    [cbox(1.4, 3.5, 3, 0.3), [-11.2, -8.4, -23]],
  ], { from: [0, 10, -20] });
  part(kit, I.heelSole, ankle, [
    [cbox(2.8, 2, 21, 0.4), [12.9, -21, -13.5]],
    [cbox(2.8, 2, 21, 0.4), [-12.9, -21, -13.5]],
    [cbox(28.6, 2, 2, 0.4), [0, -21, -23]],
  ], { from: [0, -18, -10] });

  // p.42 ① ── ankle hub caps & front fork
  kit.step('Ankle caps & fork', {
    pp: pg(42, 43), view: fv, focus: ankle, minDist: 110,
    desc: `Press a ${I.ankleCap} ring over the ankle hub on each side and push the ${I.fork} fork into the centre of the ankle base.`,
  });
  for (const s of [1, -1]) {
    part(kit, I.ankleCap, ankle, [
      [tube(6.2, 4, 2.4, 'x'), [s * 14.9, 0, 0]],
      [cbox(1.2, 9, 1.4, 0.3), [s * 16, 0, 0], [0.6, 0, 0]],
    ], { from: [s * 24, 0, 0] });
  }
  part(kit, I.fork, ankle, [
    [cbox(10, 2, 6, 0.5), [0, -1.5, 10]],
    [cbox(2, 5, 3, 0.4), [-4, 1.5, 10]],
    [cbox(2, 5, 3, 0.4), [4, 1.5, 10]],
  ], { from: [0, 10, 22] });

  // p.42 ② ── ankle band cover
  kit.step('Ankle band cover', {
    pp: pg(42, 43), view: bv, focus: ankle, minDist: 110, caution: `Mind the orientation of ${I.band}.`,
    desc: `Fit ${I.bandEnd} into the end slot and ${I.bandUnder} under ${I.band}, then clip the cover onto the band at the back of the ankle.`,
  });
  part(kit, I.band, ankle, [
    [cbox(18, 4.2, 3, 0.5), [0, -2.6, -9.6]],
    [cbox(1.2, 4.4, 0.7, 0.2), [-4, -2.6, -11.2]],
    [cbox(1.2, 4.4, 0.7, 0.2), [4, -2.6, -11.2]],
  ], { from: [0, 0, -24] });
  part(kit, I.bandEnd, ankle, [[cbox(3, 3, 3, 0.4), [7.3, -2.6, -12.2]]], { from: [10, 0, -18] });
  part(kit, I.bandUnder, ankle, [[tbox(8, 3, 7, 2, 1.4, { c: 0.3 }), [0, -5.4, -10]]], { from: [0, -10, -18] });

  // p.42 ③ ── sole discs
  kit.step('Sole discs', {
    pp: pg(42, 43), view: 'under', focus: ankle, minDist: 110,
    desc: `Press a ${I.disc} disc into each of the two round recesses in the sole.`,
  });
  for (const z of [-9, 18]) {
    part(kit, I.disc, ankle, [[cyl(3.7, 3.7, 0.9, 18), [0, -22.15, z]]], { from: [0, -16, 0], mat: MAT.frameGray });
  }

  // ── markings: Sticker B + Metallic 3D stickers (marking guide)
  kit.step(right ? 'Leg markings · right leg complete' : 'Leg markings', {
    pp: pg(42, 43), view: fv, focus: L.root, minDist: 200,
    desc: 'Apply the leg markings: the knee light and knee emblem, the caution marks on the thigh front, the calf lights and red marks, the rear thigh hatch stripes, the toe and heel markings.',
  });
  const S = (id, o, hatch) => sticker(kit, id, o.parent || knee, o, hatch ? { hatch } : {});
  // thigh
  S(right ? 'StickerB-68' : 'StickerB-67', { parent: hip, w: 5, h: 2.5, p: [0, -10, 19.1], color: STK.red });
  S('StickerB-84', { parent: hip, w: 7, h: 2, p: [0, -24, -16.7], r: [0, PI, 0], color: STK.red }, H.thigh);
  // knee armor
  S(right ? 'Metallic3D-18' : 'Metallic3D-7', { shape: circle(1.6), p: [0, -5, 18.75], r: [-0.153, 0, 0], color: 'metallicRed' }, H.knee);
  S(right ? 'StickerB-73' : 'StickerB-74', { w: 6, h: 3, p: [0, -18, 19.15], r: [0.245, 0, 0], color: right ? STK.green : STK.gray }, H.knee);
  S('StickerB-80', { w: 4, h: 2, p: [13.35, -8, 13], r: [0, PI / 2, 0], color: STK.gray }, H.knee);
  // calf
  S('Metallic3D-20', { shape: circle(1.5), p: [17.25, -31, -5], r: [0, PI / 2, 0], color: 'metallicRed' }, H.flap);
  S('Metallic3D-6', { shape: circle(1.3), p: [-15.65, -32, -15.8], r: [0, -PI / 2, 0], color: 'metallicRed' });
  S('Metallic3D-19', { shape: circle(1.5), p: [0, -22, -20.45], r: [0, PI, 0], color: 'metallicRed' });
  S('StickerB-57', { w: 6, h: 2, p: [0, -40, -19.35], r: [-0.1, PI, 0], color: STK.gray }, H.calf);
  S('StickerB-63', { w: 4, h: 2, p: [0, -46.5, -18.55], r: [-0.25, PI, 0], color: STK.red }, H.calf);
  S('StickerB-78', { w: 2.5, h: 4, p: [14.6, -60, 2], r: [0, PI / 2, 0], color: STK.red });
  S('StickerB-79', { w: 2.5, h: 4, p: [-14.6, -60, 2], r: [0, -PI / 2, 0], color: STK.red });
  S('StickerB-81', { w: 3, h: 3, p: [14.75, -56, -9], r: [0, PI / 2, 0], color: STK.red });
  S('StickerB-81', { w: 3, h: 3, p: [-14.75, -56, -9], r: [0, -PI / 2, 0], color: STK.red });
  // foot
  S('StickerB-69', { parent: ankle, w: 6, h: 2.5, p: [0, -9.25, 34.1], r: [-1.17, 0, 0], color: STK.gray });
  S('StickerB-70', { parent: ankle, w: 8, h: 2.2, p: [0, -15.7, 43.45], r: [-0.39, 0, 0], color: STK.gray });
  S('Metallic3D-8', { parent: ankle, w: 7, h: 4, p: [0, -14, -24.1], r: [0, PI, 0], color: 'metallicRed' });
  S('StickerB-83', { parent: ankle, w: 6, h: 2.2, p: [0, -2.6, -11.2], r: [0, PI, 0], color: STK.gray });
  if (!right) {
    // left-leg-only marks
    S('StickerB-36', { parent: hip, w: 1.5, h: 8, p: [-4.2, -22, 19.1], color: STK.red });
    S('StickerB-37', { parent: hip, w: 5, h: 1.5, p: [4, -12, -16.5], r: [0, PI, 0], color: STK.red }, H.thigh);
    S('StickerB-38', { parent: hip, w: 8, h: 1.5, p: [-14.1, -18, 8], r: [0, -PI / 2, 0], color: STK.red });
    S('StickerB-39', { parent: hip, w: 8, h: 1.5, p: [14.1, -18, 8], r: [0, PI / 2, 0], color: STK.red });
    S('StickerB-40', { parent: hip, w: 6, h: 1.5, p: [-13.35, -40, -6], r: [0, -PI / 2, 0], color: STK.red }, H.thigh);
    S('StickerB-41', { parent: hip, w: 6, h: 1.5, p: [13.35, -40, -6], r: [0, PI / 2, 0], color: STK.red }, H.thigh);
    S('StickerB-72', { w: 7, h: 2.2, p: [0, -70, 16.75], color: STK.gray }, H.shin);
  }
}
