// TORSO. Manual pp.23-27 (PHASE 01▶02 CHEST-FRAME-1 / CORE BLOCK / CHEST-FRAME-2), pp.37-38 (PHASE 03 chest + backpack
// truss), pp.45-48 (PHASE 04 CHEST-ARMOR). Everything is modelled in WORLD coordinates (+x = the suit's LEFT, +z = front):
//   R.chest    chest box y 237-272, abdomen frame y 199-237 (A2-19 U-frame around the core block)
//   R.core     CORE BLOCK (sits on the waist top, x ±8, y 202-237), hatch H17 + armor H5/H4 swing up (opts.hatch)
//   R.backpack CHEST-FRAME-2 + U2 backpack armor, behind the chest (z -24 … -46), verniers hang below (y ≈ 196-211)
// Shoulder sockets (X2-4) end at x ±38, y 252 (arms.js); neck ball P1-3 at (0, 272, 0) under the head mount (0, 268, 0).
import * as THREE from 'three';
import { MAT } from '../materials.js';
import { grp } from '../kit.js';
import { cbox, tbox, cyl, sphere, hull, loft, sub, lathe, lattice, rimPlate, xf } from '../geom.js';
import { part, sticker, sidePlate, frontPlate, capDisc, tube, ribbed, slats, merge, nub } from './util.js';
import { BENCH } from './rig.js';

const PI = Math.PI;
const SIDES = [[-1, 'R'], [1, 'L']];          // s = -1 → the suit's RIGHT (-x)
// cockpit hatch (H17 on the core + H5/H4 armor): hinged at the top of H4, swings up and forward
const HATCH = { axis: [1, 0, 0], angle: -1.15, pivot: [0, 248, 24] };
const at = (g, p, r) => xf(g, { p, r });       // move a geometry (world-space build)

const ctx = (R) => R.chest.userData.torso || (R.chest.userData.torso = {});

// ───────────────────────── PHASE 01 ▶ 02 · CHEST-FRAME-1 (pp.23-26) ─────────────────────────

export function chestFrame(kit, R) {
  const C = R.chest;
  const T = ctx(R);
  const box = grp(); box.name = 'chestBox'; C.add(box);            // A1 chest block (drops onto A2-19 on p.25)
  const neck = grp(); neck.name = 'neckUnit'; box.add(neck);
  const sh = { R: grp(), L: grp() }; box.add(sh.R, sh.L);
  const abd = grp(); abd.name = 'abdomenFrame'; C.add(abd);
  const brk = grp(); brk.name = 'abdomenBracket'; abd.add(brk);
  const coreIn = grp(); coreIn.name = 'coreInner'; R.core.add(coreIn);
  Object.assign(T, { box, neck, sh, abd, coreIn });
  const FD = MAT.frameDark;

  kit.section('CHEST-FRAME', { pp: 23 });
  kit.block('CHEST-FRAME-1 ASSEMBLE', { pp: 23 });

  // p.23 ── base plate
  kit.step('Chest base plate A1-10 with the clear slider', {
    pp: 23, view: 'frontR', focus: box,
    desc: 'Push A1-4 into the underside of the large base plate A1-10, slide the clear LED light guide P1-6 into the channel on top and clip the hook lever A1-7 onto the rear edge (mind its orientation).',
    caution: 'Do not forget to fit P1-3 later (neck light guide). A1-7 has a front and a back: the hook points down.',
  });
  part(kit, 'A1-4', box, [
    [merge([cbox(28, 3, 8, 0.8)], [cbox(6, 2, 4, 0.5), { p: [-8, 2, 0] }], [cbox(6, 2, 4, 0.5), { p: [8, 2, 0] }]), [0, 235.8, -11.5]],
  ], { from: [0, -22, 0] });
  part(kit, 'A1-10', box, [
    [cbox(46, 5, 32, 1.2), [0, 239.5, 0]],
    [merge([cbox(4, 1, 26, 0.3), { p: [-4.2, 0, 0] }], [cbox(4, 1, 26, 0.3), { p: [4.2, 0, 0] }]), [0, 242.3, 2]],   // slider channel rails
    [cyl(2.2, 2.2, 3, 16, 'y'), [-23.6, 241, 0]],      // corner bosses for A2-16 / A2-17
    [cyl(2.2, 2.2, 3, 16, 'y'), [23.6, 241, 0]],
    [cbox(10, 3, 3, 0.6), [0, 240, 16.5]],             // front lip
  ], { from: [0, -25, 0] });
  part(kit, 'P1-6', box, [
    [merge([cbox(4, 1.4, 20, 0.3)], [cbox(6, 2.2, 3, 0.4), { p: [0, 0.6, 9] }]), [0, 242.6, 2]],
  ], { from: [0, 0, 25] });
  part(kit, 'A1-7', box, [
    [merge([cbox(9, 5, 2, 0.5)], [cbox(3, 2, 3, 0.4), { p: [0, -2.5, -1.8] }]), [0, 239.5, -17]],
  ], { from: [0, 0, -22] });

  // p.24 ── shoulder swing plates
  kit.step('Shoulder swing plates A2-16 / A2-17', {
    pp: 24, view: 'frontL', focus: box,
    desc: 'Snap the two-lobe hinge plates A2-16 (right) and A2-17 (left) onto the round bosses at the outer corners of the base plate. They carry the swinging shoulder blocks.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'A2-16' : 'A2-17', box, [
      [merge([cyl(3, 3, 2, 18, 'y'), { p: [0, 0, -3.5] }], [cyl(3, 3, 2, 18, 'y'), { p: [0, 0, 3.5] }], [cbox(4, 2, 7, 0.4)],
        [cyl(1.1, 1.1, 4, 10, 'y'), { p: [0, 1.5, -3.5] }], [cyl(1.1, 1.1, 4, 10, 'y'), { p: [0, 1.5, 3.5] }]), [s * 25.5, 243.5, 0]],
    ], { from: [s * 25, 0, 0] });
  }

  kit.step('Light guide P1-7 (Sticker A-5) and upper chest block A1-5', {
    pp: 24, view: 'frontR', focus: box,
    desc: 'Apply Sticker A-5 on top of the clear plate P1-7, lay P1-7 on the base plate (its two light-pipe windows face forward) and close it with the upper chest block A1-5. The LED light reaches the chest heat-dissipation fins through these windows.',
  });
  part(kit, 'P1-7', box, [
    [cbox(30, 2.5, 12, 0.5), [0, 243.3, 5]],
    [cbox(6, 7, 11, 0.6), [-14, 253, 16.5]],
    [cbox(6, 7, 11, 0.6), [14, 253, 16.5]],
    [cbox(4, 8, 3, 0.4), [-14, 247, 11]],
    [cbox(4, 8, 3, 0.4), [14, 247, 11]],
    [cbox(5.4, 6.4, 0.4, 0.1), [-14, 253, 22.1], null, MAT.finGlow],   // lit window faces
    [cbox(5.4, 6.4, 0.4, 0.1), [14, 253, 22.1], null, MAT.finGlow],
  ], { from: [0, 22, 0] });
  sticker(kit, 'StickerA-5', box, { w: 22, h: 8, p: [0, 244.62, 5], r: [-PI / 2, 0, 0], color: '#e3e6ea' });
  part(kit, 'A1-5', box, [
    [sub(loft([{ y: 242, w: 44, d: 31, c: 3 }, { y: 256, w: 48, d: 33, c: 3.5 }, { y: 264, w: 42, d: 29, c: 3 }]),
      [cbox(8, 7, 10), { p: [-14, 253, 16] }], [cbox(8, 7, 10), { p: [14, 253, 16] }]), [0, 0, 0]],
    [cbox(34, 1.2, 1.2, 0.3), [0, 262, 14.8]],           // moulded ribs
    [cbox(1.2, 14, 1.2, 0.3), [-22.9, 252, 10]],
    [cbox(1.2, 14, 1.2, 0.3), [22.9, 252, 10]],
    [cyl(3, 3, 1.5, 16, 'y'), [0, 264.4, 0]],             // neck seat
  ], { from: [0, 30, 0] });

  // right / left shoulder blocks (built on the bench, then plugged into the swing plates)
  for (const [s, k] of SIDES) {
    const g = sh[k];
    const right = k === 'R';
    kit.step(`${right ? 'Right' : 'Left'} shoulder block`, {
      pp: 24, view: right ? 'right' : 'left', focus: g,
      desc: right
        ? 'Push the poly cap X2-4 into the cube A2-15 (shoulder socket), then close it between the side plates A2-11 and A2-12.'
        : 'Build the left shoulder block the same way: X2-4 into A2-15, closed by A2-14 and A2-13.',
    });
    part(kit, 'X2-4', g, [[merge([tube(3.6, 1.7, 2.6, 'x', 20)], [tube(2.4, 1.7, 3, 'x', 16), { p: [-s * 2, 0, 0] }]), [s * 37.2, 252, 0]]],
      { from: [s * 20, 0, 0] });
    part(kit, 'A2-15', g, [
      [cbox(9, 9, 9, 1.2), [s * 33.5, 252, 0]],
      [tube(4.4, 3.6, 1, 'x', 20), [s * 38.1, 252, 0]],
    ], { from: [0, 0, 22] });
    const plate = (z) => frontPlate([[24, 245], [30, 245], [34, 247.5], [37.5, 248.5], [37.5, 256.5], [33.5, 258], [26, 258], [24, 255]]
      .map(([x, y]) => [s * x, y]), 2, 0.5);
    part(kit, right ? 'A2-11' : 'A2-14', g, [[plate(), [0, 0, 5.5]], [cyl(1.5, 1.5, 1.2, 12, 'z'), [s * 26.5, 247.5, 6.8]]], { from: [0, 0, 22] });
    part(kit, right ? 'A2-12' : 'A2-13', g, [[plate(), [0, 0, -5.5]], [cyl(1.5, 1.5, 1.2, 12, 'z'), [s * 26.5, 247.5, -6.8]]], { from: [0, 0, -22] });
  }
  kit.step('Plug the shoulder blocks into the swing plates; T-peg A1-6', {
    pp: 24, view: 'front', focus: box,
    desc: 'Plug both shoulder blocks into the sockets of A2-16 / A2-17 and check they swing forward and back. Push the T-peg A1-6 into the lower side of the chest block.',
  });
  kit.join(sh.R, [-24, 0, 0]);
  kit.join(sh.L, [24, 0, 0]);
  part(kit, 'A1-6', box, [
    [merge([cbox(6, 1.6, 4, 0.4)], [cbox(2, 3, 2, 0.4), { p: [0, 2, 0] }]), [-18, 234.2, 8]],
  ], { from: [0, -18, 0] });

  // neck unit (bench, then onto the chest top)
  kit.step('Neck pistons W1 + V1-1 into the neck base A1-3', {
    pp: 24, view: 'backR', focus: neck,
    desc: 'Slide the chrome rods W1 (×2) into the gold sleeves V1-1 (×2) and set both pistons into the horseshoe neck base A1-3.',
  });
  for (const [s] of SIDES) {
    part(kit, 'W1', neck, [[cyl(0.6, 0.6, 6, 12, 'y'), [s * 5.6, 270.8, -5.5]], [sphere(0.9, 10), [s * 5.6, 273.8, -5.5]]], { from: [0, 14, 0] });
  }
  for (const [s] of SIDES) {
    part(kit, 'V1-1', neck, [[merge([cyl(1.3, 1.3, 4.5, 14, 'y')], [cyl(1.6, 1.6, 0.8, 14, 'y'), { p: [0, -2.2, 0] }]), [s * 5.6, 267.2, -5.5]]],
      { from: [s * 12, 6, 0] });
  }
  part(kit, 'A1-3', neck, [
    [merge([cbox(18, 5, 4, 0.8), { p: [0, 0, -5] }], [cbox(4, 5, 12, 0.8), { p: [-7, 0, 0] }], [cbox(4, 5, 12, 0.8), { p: [7, 0, 0] }],
      [cyl(1.4, 1.4, 20, 12, 'x'), { p: [0, 1, 3] }]), [0, 266.5, 0]],
  ], { from: [0, -15, 0] });

  kit.step('Neck halves A1-1 / A1-2 with the clear lever P1-3', {
    pp: 24, view: 'frontR', focus: neck,
    desc: 'Apply Sticker A-7 to A1-1 and Sticker A-6 to A1-2, sandwich the clear ball lever P1-3 between them and push the neck into A1-3.',
    caution: 'P1-3 guides the LED light up into the head: do not forget it.',
  });
  const neckHalf = (s) => merge([cbox(3.6, 6.5, 7, 0.8)], [cyl(3.5, 3.5, 3.6, 16, 'x'), { p: [0, 2.8, 0] }]);
  part(kit, 'A1-1', neck, [[neckHalf(-1), [-1.9, 267.8, 0]]], { from: [-16, 0, 0] });
  sticker(kit, 'StickerA-7', neck, { w: 3.6, h: 4, p: [-3.75, 267.5, 0], r: [0, -PI / 2, 0], color: '#e3e6ea' });
  part(kit, 'A1-2', neck, [[neckHalf(1), [1.9, 267.8, 0]]], { from: [16, 0, 0] });
  sticker(kit, 'StickerA-6', neck, { w: 3.6, h: 4, p: [3.75, 267.5, 0], r: [0, PI / 2, 0], color: '#e3e6ea' });
  part(kit, 'P1-3', neck, [
    [sphere(2.6, 18), [0, 272.3, 0]],
    [cbox(1.6, 6, 1.6, 0.3), [0, 268.4, 3.8]],
    [cyl(1, 1, 2, 10, 'y'), [0, 270.4, 0]],
  ], { from: [0, 16, 0] });

  kit.step('Snap the pistons into the neck', {
    pp: 24, view: 'back', focus: neck,
    desc: 'Tilt the neck back and forth until both W1 piston rods snap into the neck halves: the pistons now slide with the neck.',
  });
  kit.step('Neck unit onto the chest block', {
    pp: 24, view: 'frontR', focus: box,
    desc: 'Push the neck unit into the round seat on top of A1-5.',
  });
  kit.join(neck, [0, 22, 0]);

  // abdomen frame
  kit.step('Hinge bracket A2-22 with A2-24 ×2', {
    pp: 24, view: 'backR', focus: brk,
    desc: 'Push the hinge pieces A2-24 (×2) into the ends of the U-bracket A2-22.',
  });
  part(kit, 'A2-22', brk, [
    [merge([cbox(40, 5, 4, 0.8), { p: [0, 0, -6] }], [cbox(3, 5, 9, 0.8), { p: [-18.5, 0, -1] }], [cbox(3, 5, 9, 0.8), { p: [18.5, 0, -1] }]), [0, 231.5, -4]],
  ], { from: [0, 18, 0] });
  for (const [s] of SIDES) {
    part(kit, 'A2-24', brk, [
      [merge([cyl(2, 2, 3.4, 16, 'x')], [cbox(3, 2, 4, 0.4), { p: [0, -1.5, -2] }]), [s * 18.5, 233.6, 1]],
    ], { from: [s * 14, 0, 0] });
  }
  kit.step('Swing up the hinge pieces', {
    pp: 24, view: 'side', focus: brk,
    desc: 'Swing both A2-24 hinges up until they click.',
  });
  kit.step('Abdomen frame A2-19', {
    pp: 24, view: 'frontR', focus: abd,
    desc: 'Set the A2-22 bracket onto the rear top of the abdomen frame block A2-19 (the U opens to the front for the core block).',
    caution: 'Do not cut the two tabs under A2-19: they plug into the waist.',
  });
  part(kit, 'A2-19', abd, [
    [merge([cbox(40, 26, 5, 1.5), { p: [0, 0, -9.5] }], [cbox(10, 26, 19, 1.5), { p: [-15, 0, 0.5] }], [cbox(10, 26, 19, 1.5), { p: [15, 0, 0.5] }],
      [cbox(6, 5, 8, 1), { p: [-15, -14.5, 0.5] }], [cbox(6, 5, 8, 1), { p: [15, -14.5, 0.5] }]), [0, 216, 0]],
    [tube(3.1, 1.9, 1.6, 'y', 16), [-15, 229.6, -2]],
    [tube(3.1, 1.9, 1.6, 'y', 16), [15, 229.6, -2]],
    [slats(30, 16, 1.2, 5, 0), [0, 214, -12.4]],              // rear ribbing
  ], { from: [0, -20, 0] });
  kit.join(brk, [0, 16, -12]);

  // p.25 ── ball arms, chest onto the abdomen frame
  kit.step('Ball arms A1-8 + A1-9 (×2)', {
    pp: 25, view: 'under', focus: box,
    desc: 'Pin each ball arm A1-8 with A1-9 into the holes on the lower sides of the chest block and swing them down. Repeat on the other side (A1 runner finished).',
  });
  for (const [s] of SIDES) {
    part(kit, 'A1-9', box, [[merge([cyl(1.2, 1.2, 6, 12, 'x')], [cyl(1.8, 1.8, 0.8, 12, 'x'), { p: [s * 3, 0, 0] }]), [s * 15, 236.2, -2]]], { from: [s * 16, 0, 0] });
    part(kit, 'A1-8', box, [[merge([sphere(2.6, 16), { p: [0, -3.4, 0] }], [cbox(4, 5.5, 4.4, 0.8), { p: [0, 1.2, 0] }]), [s * 15, 234.2, -2]]], { from: [0, -15, 0] });
  }
  kit.step('Chest block onto the abdomen frame', {
    pp: 25, view: 'frontR', focus: C,
    desc: 'Press the chest block down onto A2-19: the two A1-8 balls snap into the sockets on top of the frame.',
  });
  kit.join(box, [0, 26, 0]);
  kit.step('Lattice side panels A2-18 / A2-20', {
    pp: 25, view: 'right', focus: abd,
    desc: 'Pull the chest up (the ball arms extend) and snap the tall lattice panels A2-18 (right) and A2-20 (left) onto the sides of A2-19.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'A2-18' : 'A2-20', abd, [
      [lattice(14, 20, 1.8, 1, 3, 1.4, 1), [s * 21, 215, 0], [0, PI / 2, 0]],
      [cbox(2.4, 3, 6, 0.4), [s * 20.6, 226.5, 0]],
    ], { from: [s * 20, 0, 0] });
  }
  kit.step('Side covers A2-21 / A2-23', {
    pp: 25, view: 'left', focus: abd,
    desc: 'Add the small side covers A2-21 (right) and A2-23 (left) above the lattice panels, then push the chest back down.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'A2-21' : 'A2-23', abd, [[cbox(2.6, 4.5, 10, 0.6), [s * 21.3, 227.2, 0]]], { from: [s * 16, 0, 0] });
  }

  // p.25 ── CORE BLOCK
  kit.block('CORE BLOCK ASSEMBLE', { pp: 25 });
  kit.step('Pilot seat B1-4 with lever B1-3', {
    pp: 25, view: 'frontR', focus: R.core,
    desc: 'Push the lever B1-3 into the side of the pilot seat B1-4.',
  });
  part(kit, 'B1-4', coreIn, [
    [merge([cbox(9, 2, 8, 0.5), { p: [0, -6, 4] }], [cbox(9, 11, 2, 0.5), { p: [0, 0, -0.5] }],
      [cbox(1.4, 5, 6, 0.4), { p: [-4.3, -3.5, 3] }], [cbox(1.4, 5, 6, 0.4), { p: [4.3, -3.5, 3] }]), [0, 220.5, 2]],
  ], { from: [0, 0, 20] });
  part(kit, 'B1-3', coreIn, [
    [merge([cbox(1.2, 6, 1.2, 0.3), { r: [0.35, 0, 0] }], [sphere(0.9, 10), { p: [0, 2.9, 1] }]), [3.4, 217.5, 9.5]],
  ], { from: [10, 0, 0] });
  kit.step('Core body halves B1-6 / B1-5', {
    pp: 25, view: 'frontL', focus: R.core,
    desc: 'Set the seat into the core body half B1-6 and close it with B1-5 (pointed tail fins on top, ribbed thrusters at the lower rear).',
  });
  const coreHalf = (s) => merge(
    [cbox(2, 24, 17, 0.6), { p: [s * 7, 219, 4.5] }],
    [cbox(7, 24, 3, 0.6), { p: [s * 4, 219, -2.5] }],
    [cbox(6, 2, 17, 0.4), { p: [s * 4.5, 208, 4.5] }],
    [hull([[s * 8, 230, -4], [s * 6, 230, -4], [s * 8, 230, 4], [s * 6, 230, 4], [s * 7.6, 236.3, -3.4], [s * 6.4, 236.3, -3.4]])],
    [ribbed(1.8, 3, 3, 'z', 14), { p: [s * 4, 211, -5] }],
    [cbox(1, 10, 10, 0.3), { p: [s * 8.3, 221, 5] }],
  );
  part(kit, 'B1-6', coreIn, [[coreHalf(-1)]], { from: [-20, 0, 0] });
  part(kit, 'B1-5', coreIn, [[coreHalf(1)]], { from: [20, 0, 0] });
  kit.step('Nozzle tray N1-2 with B1-1 / B1-2', {
    pp: 25, view: 'under', focus: R.core,
    desc: 'Push the nozzle discs B1-1 and B1-2 into the red U-tray N1-2 and fit it under the core body.',
  });
  part(kit, 'B1-1', coreIn, [[capDisc(2.4, 1.2, 'y', 18), [-4, 203.2, 1], [PI, 0, 0]]], { from: [0, -14, 0] });
  part(kit, 'B1-2', coreIn, [[capDisc(2.4, 1.2, 'y', 18), [4, 203.2, 1], [PI, 0, 0]]], { from: [0, -14, 0] });
  part(kit, 'N1-2', coreIn, [
    [merge([cbox(16, 2, 17, 0.5), { p: [0, 0, 4.5] }], [cbox(1.8, 4, 17, 0.4), { p: [-7.1, 2, 4.5] }], [cbox(1.8, 4, 17, 0.4), { p: [7.1, 2, 4.5] }],
      [cbox(16, 4, 1.8, 0.4), { p: [0, 2, -3.1] }]), [0, 204.2, 0]],
  ], { from: [0, -18, 0] });
  kit.step('Cockpit top N1-1 with hatch H17', {
    pp: 25, view: 'frontR', focus: R.core,
    desc: 'Clip the dark gray cockpit hatch H17 (the window on top) into the red cockpit top N1-1, swing the hatch open and put the top on the core body.',
  });
  part(kit, 'H17', coreIn, [
    [rimPlate(9, 7, 1.5, 2.4, 0.6), [0, 226.8, 14.2]],
    [merge([cbox(9, 9.5, 2.4, 0.6)], [cbox(4, 1.5, 2.4, 0.3), { p: [0, -5.2, 0] }]), [0, 218.4, 14.2]],
    [cyl(1, 1, 8, 10, 'x'), [0, 230.4, 13.6]],
  ], { from: [0, 0, 18], mat: MAT.frameDark, hatch: HATCH });
  part(kit, 'N1-1', coreIn, [
    [hull([[-8, 231, -4], [8, 231, -4], [-8, 231, 13.5], [8, 231, 13.5], [-7, 235, -3], [7, 235, -3], [-6, 234.2, 8], [6, 234.2, 8], [-6, 232.6, 13], [6, 232.6, 13]]), [0, 0, 0]],
    [cbox(1, 2.5, 5, 0.3), [-4, 236, 0]],
    [cbox(1, 2.5, 5, 0.3), [4, 236, 0]],
  ], { from: [0, 18, 0] });
  kit.step('Pilot K5-12', {
    pp: 25, view: 'frontR', focus: R.core, minDist: 50,
    desc: 'Seat the pilot figure K5-12 in B1-4 and close the cockpit hatch.',
  });
  part(kit, 'K5-12', coreIn, [
    [merge([cbox(4, 6, 3.5, 0.8), { p: [0, 221, 4.5] }], [sphere(1.7, 12), { p: [0, 225.6, 5] }], [cbox(4, 2, 5, 0.5), { p: [0, 216.8, 7.5] }],
      [cbox(4, 4, 1.8, 0.5), { p: [0, 214.5, 10] }], [cbox(1.2, 5, 1.4, 0.3), { p: [-2.6, 220.5, 6.5] }], [cbox(1.2, 5, 1.4, 0.3), { p: [2.6, 220.5, 6.5] }])],
  ], { from: [0, 16, 0] });

  // p.26 ── gray E1 details, then core → waist, chest → waist
  kit.block('CHEST-FRAME-1 ASSEMBLE', { pp: 26 });
  kit.step('Lower front pegs E1-9 / E1-11', {
    pp: 26, view: 'frontR', focus: box,
    desc: 'Push E1-9 (right) and E1-11 (left) onto the pegs at the lower front of the chest block.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'E1-9' : 'E1-11', box, [
      [sub(cbox(8, 5, 3.5, 0.6), [cbox(6.4, 3.4, 2, 0.2), { p: [0, 0, 1.4] }]), [s * 15, 238.5, 17.5]],
    ], { from: [0, 0, 18] });
  }
  kit.step('Rear bar E1-10', {
    pp: 26, view: 'back', focus: box,
    desc: 'Snap the bar E1-10 along the lower rear edge of the chest block.',
  });
  part(kit, 'E1-10', box, [[merge([cbox(42, 6, 4, 1)], [cbox(3, 2, 3, 0.5), { p: [-12, -3.2, 0] }], [cbox(3, 2, 3, 0.5), { p: [12, -3.2, 0] }]), [0, 238.5, -17.5]]],
    { from: [0, 0, -20] });
  kit.step('Hinged lever E1-2', {
    pp: 26, view: 'frontR', focus: box,
    desc: 'Push the lever E1-2 into the pivot at the upper front, right of the centre line, and swing it up.',
  });
  part(kit, 'E1-2', box, [
    [cbox(5, 15, 3, 0.6), [-2.5, 254.5, 17.8]],
    [cyl(1.8, 1.8, 6, 14, 'x'), [-2.5, 261.5, 17.3]],
  ], { from: [0, 0, 18] });
  kit.step('Fork clip E1-1', {
    pp: 26, view: 'frontR', focus: box,
    desc: 'Clip the fork E1-1 onto the lower end of E1-2.',
  });
  part(kit, 'E1-1', box, [
    [merge([cbox(1.4, 6, 3, 0.3), { p: [-1.8, 0, 0] }], [cbox(1.4, 6, 3, 0.3), { p: [1.8, 0, 0] }], [cbox(5, 1.8, 3, 0.4), { p: [0, 2.7, 0] }]), [-2.5, 245.5, 19.6]],
  ], { from: [0, -10, 16] });
  kit.step('Fold the lever down', {
    pp: 26, view: 'side', focus: box,
    desc: 'Fold E1-2 / E1-1 down flat against the chest front (it becomes the mount of the truss ladder in PHASE 03).',
  });
  kit.step('Collar ring E1-4, window brackets E1-3 / E1-5', {
    pp: 26, view: 'frontR', focus: box,
    desc: 'Drop the collar ring E1-4 over the neck onto the chest top, then push the window brackets E1-3 and E1-5 over the two light-pipe windows at the upper front.',
  });
  part(kit, 'E1-4', box, [
    [rimPlate(30, 26, 5, 4.5, 1.5), [0, 266.3, 0], [-PI / 2, 0, 0]],
    [cbox(4, 2, 3, 0.4), [-11, 263.5, 11]],
    [cbox(4, 2, 3, 0.4), [11, 263.5, 11]],
  ], { from: [0, 18, 0] });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'E1-3' : 'E1-5', box, [
      [rimPlate(11, 11, 2.5, 3, 0.8), [s * 14, 253, 17.3]],
      [cbox(11, 5, 2, 0.5), [s * 14, 260.8, 17]],
      [cbox(11, 2, 7, 0.5), [s * 14, 264.2, 13.3]],
    ], { from: [0, 6, 18] });
  }
  kit.step('Shoulder rear panels E1-6 / E1-8', {
    pp: 26, view: 'backR', focus: box,
    desc: 'Swing the shoulder blocks forward and push E1-6 (right) and E1-8 (left) onto their rear faces.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'E1-6' : 'E1-8', sh[k], [
      [merge([cbox(8.5, 15, 4, 0.8)], [slats(6, 10, 1, 4, 0.4), { p: [0, 0, -2.2] }]), [s * 31.5, 251.5, -8.5]],
    ], { from: [0, 0, -18] });
  }
  kit.step('Back plate E1-7', {
    pp: 26, view: 'back', focus: box,
    desc: 'Snap the back plate E1-7 onto the upper back of the chest block; its two slots take the backpack later.',
  });
  part(kit, 'E1-7', box, [
    [sub(xf(frontPlate([[-14, 242], [14, 242], [14, 259], [11, 262], [-11, 262], [-14, 259]], 4, 0.6), { p: [0, 0, -18.5] }),
      [cbox(4.2, 8.4, 3), { p: [-7, 249, -20.5] }], [cbox(4.2, 8.4, 3), { p: [7, 249, -20.5] }]), [0, 0, 0]],
    [cbox(20, 1.2, 1, 0.3), [0, 257.5, -20.8]],
  ], { from: [0, 0, -20] });

  kit.step('Core block onto the waist', {
    pp: 26, view: 'frontR', focus: 'all',
    desc: 'Set the CORE BLOCK onto the top of the waist: the four tabs of N1-2 go into the waist, cockpit facing forward.',
  });
  kit.join(R.core, BENCH.core);
  kit.step('Chest frame onto the waist', {
    pp: 26, view: 'frontR', focus: 'all',
    desc: 'Lower the chest frame over the core block: the core slides into the U of A2-19 and the two tabs under the frame legs plug into the waist.',
  });
  kit.join(R.chest, BENCH.chest);
  kit.join(coreIn, BENCH.chest.map((v) => -v));     // the core already sits on the waist: cancel the chest's bench offset
}

// ───────────────────────── PHASE 01 ▶ 02 · CHEST-FRAME-2 = backpack frame (p.27) ─────────────────────────

export function backpackFrame(kit, R) {
  const B = R.backpack;
  kit.block('CHEST-FRAME-2 ASSEMBLE', { pp: 27 });
  kit.step('Backpack front half B2-8 with clear P1-12', {
    pp: 27, view: 'backR', focus: B,
    desc: 'Clip the clear plate P1-12 onto the inner face of the backpack front half B2-8 (two legs with lattice feet).',
  });
  part(kit, 'B2-8', B, [
    [xf(frontPlate([[-19, 258], [19, 258], [19, 224], [15, 220], [15, 214], [7, 214], [7, 222], [-7, 222], [-7, 214], [-15, 214], [-15, 220], [-19, 224]], 5, 0.8), { p: [0, 0, -27] }), [0, 0, 0]],
    [cbox(3.6, 8, 4, 0.4), [-7, 249, -22.5]],        // plugs into the E1-7 slots
    [cbox(3.6, 8, 4, 0.4), [7, 249, -22.5]],
    [lattice(7, 7, 1.2, 1, 1, 1, 0.8), [-11, 217.5, -24.3]],
    [lattice(7, 7, 1.2, 1, 1, 1, 0.8), [11, 217.5, -24.3]],
    [cbox(30, 1.2, 1, 0.3), [0, 238, -24.3]],
  ], { from: [0, 0, 22] });
  part(kit, 'P1-12', B, [[cbox(20, 14, 1.5, 0.4), [0, 244, -30.2]]], { from: [0, 0, -18] });
  kit.step('Light guide P1-11', {
    pp: 27, view: 'backR', focus: B,
    desc: 'Add the small clear light guide P1-11 below P1-12.',
  });
  part(kit, 'P1-11', B, [[merge([cbox(4, 9, 2.4, 0.4)], [cbox(8, 2, 2.4, 0.4), { p: [0, -4.5, 0] }]), [0, 232, -30.5]]], { from: [0, 0, -16] });
  kit.step('Ball housings B2-10 + B2-9 (×2)', {
    pp: 27, view: 'under', focus: B,
    desc: 'Push each ball socket B2-9 into a housing B2-10, fit both under the legs of B2-8 and swing them down.',
  });
  for (const [s] of SIDES) {
    part(kit, 'B2-10', B, [[sub(cbox(8, 6, 9, 1), [cyl(3.2, 3.2, 4, 16, 'y'), { p: [0, -2, 0] }]), [s * 11, 213.5, -32]]], { from: [0, -16, 0] });
    part(kit, 'B2-9', B, [[tube(3.1, 2.3, 3, 'y', 18), [s * 11, 211.8, -32]]], { from: [0, -20, 0] });
  }
  kit.step('Clear pegs P1-9 (×2) and rear half B2-7', {
    pp: 27, view: 'backL', focus: B,
    desc: 'Set the clear pegs P1-9 (×2) in the upper outer corners and close the backpack with the rear half B2-7 (two round dial bosses).',
  });
  for (const [s] of SIDES) {
    part(kit, 'P1-9', B, [[cyl(1.3, 1.3, 6, 12, 'z'), [s * 16.5, 255, -30]]], { from: [0, 0, -14] });
  }
  part(kit, 'B2-7', B, [
    [xf(frontPlate([[-19, 258], [19, 258], [19, 226], [16, 223], [-16, 223], [-19, 226]], 6, 0.8), { p: [0, 0, -33] }), [0, 0, 0]],
    [cyl(7, 7, 3, 24, 'z'), [-11.5, 240, -37.5]],
    [cyl(7, 7, 3, 24, 'z'), [11.5, 240, -37.5]],
    [cyl(2.2, 2.2, 1.6, 12, 'z'), [-11.5, 240, -39.6]],
    [cyl(2.2, 2.2, 1.6, 12, 'z'), [11.5, 240, -39.6]],
    [cbox(1.2, 30, 1, 0.3), [0, 240, -36.4]],
  ], { from: [0, 0, -22] });
  kit.step('Clip B2-11', {
    pp: 27, view: 'back', focus: B,
    desc: 'Snap the clip B2-11 onto the upper centre of the rear face.',
  });
  part(kit, 'B2-11', B, [[merge([cbox(12, 6, 3, 0.8)], [cbox(8, 1.4, 1, 0.3), { p: [0, 0, -1.8] }]), [0, 255, -37.5]]], { from: [0, 0, -16] });
  kit.step('Metal verniers (×2)', {
    pp: 27, view: 'backR', focus: B,
    desc: 'Push a clear ball pin P1-8 into the top of each METAL VERNIER and the inner cone G2-10 into its bottom, then plug both into the ball housings. CHEST-FRAME-2 then hooks into the E1-7 slots on the chest back (it is taken off again for the truss work and mounted for good on p.38).',
  });
  const bell = lathe([[2.4, 0.4], [3.6, 0], [4.8, -3], [6.6, -8], [8.2, -13], [8.6, -14], [7.8, -14], [6.0, -8.6], [4.2, -3.8], [2.4, -1.4], [2.4, 0.4]], 24, 'y');
  for (const [s] of SIDES) {
    part(kit, 'P1-8', B, [[merge([sphere(2.4, 14), { p: [0, 1.4, 0] }], [cyl(1.1, 1.1, 3, 10, 'y'), { p: [0, -1.2, 0] }]), [s * 11, 210.2, -32]]], { from: [0, 12, 0] });
    part(kit, 'METAL-VERNIER', B, [
      [bell, [s * 11, 209.6, -32], null, MAT.gunmetal],               // anodized blue-black metal
      [tube(8.7, 7.9, 0.6, 'y', 24), [s * 11, 195.9, -32], null, MAT.gunmetal],
    ], { from: [0, -24, 0] });
    part(kit, 'G2-10', B, [[lathe([[2.2, 0], [5.8, -9.5], [6.6, -12], [0.01, -12]], 20, 'y'), [s * 11, 208.4, -32], null, MAT.thrusterInner]], { from: [0, -26, 0] });
  }
}

// ───────────────────────── PHASE 03 · CHEST-TRUSS-FRAME (pp.37-38) ─────────────────────────

export function chestTruss(kit, R) {
  const C = R.chest, B = R.backpack;
  kit.section('CHEST-TRUSS-FRAME', { pp: 37 });
  kit.block('CHEST-TRUSS-FRAME ASSEMBLE', { pp: 37 });
  kit.step('Abdomen grille trusses S1-3 / S1-4 (Etching 3 / 4)', {
    pp: 37, view: 'frontR', focus: C,
    desc: 'Slide the chest up, apply Etching 3 and 4 to the silver-plated grille panels S1-3 (right) and S1-4 (left) and snap them onto the abdomen frame either side of the core block.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'S1-3' : 'S1-4', C, [
      [merge([lattice(10, 20, 1.5, 1, 3, 1.3, 0.9), { p: [0, -3, 0] }], [cbox(10, 5, 1.5, 0.4), { p: [0, 9.5, 0] }]), [s * 14.5, 219.5, 10.6]],
    ], { from: [0, 0, 20] });
    sticker(kit, k === 'R' ? 'ETCH-3' : 'ETCH-4', C, { w: 8, h: 3.4, p: [s * 14.5, 229, 11.45], color: 'etching' });
  }
  kit.step('Rear arch truss T1-6', {
    pp: 37, view: 'back', focus: C,
    desc: 'Tilt the head, take the backpack off and snap the arch truss T1-6 across the lower back of the abdomen frame, then push the chest centre back down.',
  });
  part(kit, 'T1-6', C, [
    [lattice(34, 14, 1.6, 4, 2, 1.4, 1), [0, 211, -13]],
    [xf(frontPlate([[-17, 218], [17, 218], [13, 222], [-13, 222]], 1.6, 0.4), { p: [0, 0, -13] }), [0, 0, 0]],
  ], { from: [0, 0, -22] });
  kit.step('Swing up the hinged frame; ladder T1-1 / T1-2', {
    pp: 37, view: 'frontR', focus: C,
    desc: 'Swing the E1-1 / E1-2 hinged frame up and plug the two rails T1-1 and T1-2 (a truss ladder) onto it.',
  });
  const rail = (dir) => merge([cbox(30, 3, 2.5, 0.5)], ...[-15, -2.5, 2.5, 15].map((x) => [cbox(1.6, 9.75, 2.5, 0.4), { p: [x, dir * 4.9, 0] }]),
    [cbox(28, 0.8, 0.8, 0.2), { p: [0, dir * 5, 1] }]);
  part(kit, 'T1-1', C, [[rail(-1), [0, 262.5, 20.05]]], { from: [0, 10, 18] });
  part(kit, 'T1-2', C, [[rail(1), [0, 243, 20.05]]], { from: [0, -10, 18] });
  kit.step('Swing the ladder down onto the chest', {
    pp: 37, view: 'side', focus: C,
    desc: 'Bend the upper body backward a little and swing the ladder down flat onto the chest front.',
  });
  kit.step('Side truss S1-6 with T1-4', {
    pp: 37, view: 'right', focus: C,
    desc: 'Push T1-4 into the lattice plate S1-6 and fit it on the right side of the chest, below the shoulder.',
  });
  part(kit, 'S1-6', C, [[lattice(13, 8, 1.6, 2, 1, 1.2, 0.9), [-24, 239.5, 0], [0, PI / 2, 0]]], { from: [-18, 0, 0] });
  part(kit, 'T1-4', C, [[merge([cbox(1.4, 1.4, 13, 0.3)], [cbox(1.4, 3, 1.4, 0.3), { p: [0, 1.5, -5.8] }], [cbox(1.4, 3, 1.4, 0.3), { p: [0, 1.5, 5.8] }]), [-25.2, 235, 0]]],
    { from: [-16, -4, 0] });

  kit.step('Collar truss S1-5 with T2-4', {
    pp: 38, view: 'frontR', focus: C,
    desc: 'Push T2-4 into the lattice plate S1-5, plug it into the upper chest just below the collar and swing it back over the chest top.',
  });
  part(kit, 'S1-5', C, [[lattice(22, 16, 1.5, 3, 2, 1.3, 0.9), [0, 265.8, 17.8], [-1.107, 0, 0]]], { from: [0, 16, 12] });
  part(kit, 'T2-4', C, [[merge([cbox(20, 1.6, 1.6, 0.3)], [cyl(1, 1, 22, 10, 'x'), { p: [0, 0, 0.5] }]), [0, 262.6, 24.6]]], { from: [0, 0, 16] });
  kit.step('Top truss T1-5 / T2-5, Etching 1 / 2', {
    pp: 38, view: 'top', focus: C,
    desc: 'Snap the small truss plates T1-5 (right of the neck) and T2-5 (left) onto the chest top. Apply Etching 1 and 2 in the recessed vents on E1-9 / E1-11 at the lower edge of the chest block.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'T1-5' : 'T2-5', C, [[lattice(8, 7, 1.2, 2, 1, 1.1, 0.8), [s * 10, 269.2, -7], [-PI / 2, 0, 0]]], { from: [0, 14, 0] });
  }
  for (const [s, k] of SIDES) {
    sticker(kit, k === 'R' ? 'ETCH-1' : 'ETCH-2', C, { w: 6.2, h: 3.2, p: [s * 15, 238.5, 18.65], color: 'etching' });
  }

  kit.block('BACKPACK TRUSS ASSEMBLE', { pp: 38 });
  kit.step('Backpack bridge caps T1-3 / T2-3, dial trusses S1-1 / S1-2', {
    pp: 38, view: 'backR', focus: B,
    desc: 'Snap the bridge caps T1-3 (right) and T2-3 (left) onto the backpack top, and the round truss discs S1-1 (right) and S1-2 (left) over the two dial bosses on the outer face.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'T1-3' : 'T2-3', B, [
      [lattice(10, 11, 1.2, 2, 2, 1.1, 0.8), [s * 10, 258.6, -30.5], [-PI / 2, 0, 0]],
      [cbox(10, 3, 1.2, 0.3), [s * 10, 257.4, -24.6]],
    ], { from: [0, 14, 0] });
  }
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'S1-1' : 'S1-2', B, [
      [merge([tube(8, 6.2, 1.2, 'z', 24)], [cbox(12.6, 1.2, 1.2, 0.2), { r: [0, 0, PI / 4] }], [cbox(12.6, 1.2, 1.2, 0.2), { r: [0, 0, -PI / 4] }],
        [tube(3.2, 2.3, 1.2, 'z', 16)]), [s * 11.5, 240, -39.6]],
    ], { from: [0, 0, -16] });
  }
  kit.step('Etching 10; mount the backpack', {
    pp: 38, view: 'backR', focus: 'all',
    desc: 'Apply Etching 10 at the lower centre of the backpack outer face, between the verniers, and plug the backpack (CHEST-FRAME-2) into the two slots of E1-7 on the chest back.',
  });
  sticker(kit, 'ETCH-10', B, { w: 10, h: 3.8, p: [0, 225.2, -36.1], r: [0, PI, 0], color: 'etching' });
  kit.join(B, BENCH.backpack);
}

// ───────────────────────── PHASE 04 · CHEST-ARMOR (pp.45-48) ─────────────────────────

export function chestArmor(kit, R) {
  const C = R.chest, B = R.backpack;
  const T = ctx(R);
  const coreIn = T.coreIn || R.core;
  kit.section('CHEST-ARMOR', { pp: 45 });
  kit.block('CHEST-ARMOR ASSEMBLE', { pp: 46 });

  // p.46 ── red / dark-red abdomen
  kit.step('Abdomen side plates O1-2 / O1-4, lower front N2-8 / N2-10', {
    pp: 46, view: 'frontR', focus: C,
    desc: 'Take the backpack off and swing the dark gray cockpit hatch H17 up. Fit the dark red side plates O1-2 (right) and O1-4 (left) on the upper sides of the abdomen and the red trapezoid plates N2-8 (right) and N2-10 (left) on its lower front.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'O1-2' : 'O1-4', C, [
      [merge([cbox(4, 16, 20, 1)], [cbox(1, 10, 2, 0.3), { p: [s * 2.2, 0, 5] }], [cbox(1, 10, 2, 0.3), { p: [s * 2.2, 0, -5] }]), [s * 24.3, 219, 0], [0, 0, -s * 0.12]],
    ], { from: [s * 22, 0, 0] });
  }
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'N2-8' : 'N2-10', C, [
      [hull([[s * 7.5, 199, 14], [s * 7.5, 199, 18.5], [s * 22, 199, 14], [s * 21, 199, 17.5], [s * 7.5, 217, 14], [s * 7.5, 217, 20],
        [s * 25, 217, 14], [s * 24, 217, 19.2], [s * 8.5, 200, 19], [s * 8.5, 216.5, 20.4]]), [0, 0, 0]],
      [cbox(12, 0.8, 1, 0.2), [s * 15.5, 208, 19.4], [0.05, 0, 0], MAT.darkRed],
    ], { from: [0, -6, 20] });
  }
  kit.step('Lower chest sides O1-1 / O1-3, upper abdomen N2-5 / N2-7', {
    pp: 46, view: 'frontL', focus: C,
    desc: 'Add the dark red O1-1 (right) and O1-3 (left) at the lower sides of the chest and the red plates N2-5 (right) and N2-7 (left) on the upper front of the abdomen, above N2-8 / N2-10. Swing the hatch back down.',
  });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'O1-1' : 'O1-3', C, [[tbox(6, 16, 6.5, 17, 8, { c: 1 }), [s * 26.5, 231, 1]]], { from: [s * 20, 0, 0] });
  }
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'N2-5' : 'N2-7', C, [
      [hull([[s * 7.5, 217, 14], [s * 7.5, 217, 20], [s * 25, 217, 14], [s * 24, 217, 19.2], [s * 7.5, 236, 14], [s * 7.5, 236, 21.5],
        [s * 28, 236, 14], [s * 27, 236, 21], [s * 8.5, 235, 22], [s * 8.5, 218, 20.4]]), [0, 0, 0]],
      [cbox(14, 0.8, 1, 0.2), [s * 17, 226.5, 21.1], null, MAT.darkRed],
    ], { from: [0, 6, 20] });
  }
  kit.step('Lower back plates N2-6 / N2-9', {
    pp: 46, view: 'back', focus: C,
    desc: 'Fit N2-9 and above it N2-6 on the lower back of the abdomen, over the arch truss.',
  });
  part(kit, 'N2-6', C, [[hull([[-15, 212, -14], [15, 212, -14], [-15, 212, -18.8], [15, 212, -18.8], [-13, 220, -14], [13, 220, -14], [-13, 220, -18], [13, 220, -18]]), [0, 0, 0]]],
    { from: [0, 0, -20] });
  part(kit, 'N2-9', C, [
    [hull([[-14, 199, -14], [14, 199, -14], [-14, 199, -18.5], [14, 199, -18.5], [-16, 212, -14], [16, 212, -14], [-16, 212, -19.5], [16, 212, -19.5]]), [0, 0, 0]],
    [slats(16, 8, 1, 3, 0), [0, 205.5, -19.3], null, MAT.red],
  ], { from: [0, 0, -20] });
  kit.step('Swing the shoulders out, take off E1-7 and the neck', {
    pp: 46, view: 'backR', focus: C,
    desc: 'Swing both shoulder blocks out, pull the back plate E1-7 off and lift the neck unit out of the chest.',
  });
  kit.step('Neck collar H21, G2-15 / G2-16', {
    pp: 46, view: 'frontR', focus: C,
    desc: 'Fit the ribbed front collar H21 and the yellow collar pieces G2-15 (right) and G2-16 (left) around the neck base, then put the neck and E1-7 back.',
  });
  part(kit, 'H21', C, [
    [merge([cbox(16, 6, 5, 1)], [slats(14, 5, 1, 4, 0.3), { p: [0, 0, 2.6] }]), [0, 265.5, 9.5]],
  ], { from: [0, 8, 18] });
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'G2-15' : 'G2-16', C, [
      [hull([[s * 1, 257.5, 18], [s * 1, 262, 27], [s * 11, 262.5, 26.6], [s * 11, 259.5, 16.5], [s * 19, 271.5, 14.5], [s * 19, 269, 8], [s * 19, 271.5, 8.5], [s * 13, 270.5, 10]]), [0, 0, 0]],
    ], { from: [s * 10, 10, 16] });
  }

  // vents: G2-17/18 frames, H7/H8 L-bars, H22-H24 slats (in their own tilted frames)
  const vents = {};
  for (const [s, k] of SIDES) {
    const v = grp([s * 17.5, 255, 26.5], [-0.12, s * 0.12, 0]); v.name = `vent${k}`; C.add(v);
    vents[k] = v;
  }
  const ventSlats = (k, ids, pp, title) => {
    kit.step(title, {
      pp, view: k === 'R' ? 'frontR' : 'frontL', focus: C,
      desc: `Lay the ${k === 'R' ? 'right' : 'left'} vent fins ${ids.join(', ')} (dark yellow) into the vent opening.`,
    });
    ids.forEach((id, i) => {
      part(kit, id, vents[k], [
        [merge([cbox(13.4, 1, 1.8, 0.3), { r: [0.35, 0, 0] }], [cbox(0.8, 1.6, 1.6, 0.2), { p: [-6.9, 0, -0.6] }], [cbox(0.8, 1.6, 1.6, 0.2), { p: [6.9, 0, -0.6] }]), [0, -2.6 + i * 2.6, -0.2]],
      ], { from: [0, 0, 18], mat: MAT.darkYellow });
    });
  };
  const ventFrame = (s, k, lId, fId, pp) => {
    kit.step(`${k === 'R' ? 'Right' : 'Left'} vent frame ${fId} with ${lId}`, {
      pp, view: k === 'R' ? 'frontR' : 'frontL', focus: C,
      desc: `Push the L-bar ${lId} behind the fins and close the vent with the yellow trapezoid frame ${fId}.`,
    });
    part(kit, lId, vents[k], [
      [merge([cbox(15, 1.2, 2.4, 0.3), { p: [0, 3.9, 0] }], [cbox(1.2, 8, 2.4, 0.3), { p: [-s * 7, 0.4, 0] }]), [0, 0, -1.4]],
    ], { from: [0, 0, 16], mat: MAT.frameDark });
    part(kit, fId, vents[k], [
      [rimPlate(17, 10.5, 1.8, 2.6, 0.8), [0, 0, 0]],
      [cbox(4, 1.2, 1, 0.3), [0, 5.6, 0.6]],
    ], { from: [0, 0, 20] });
  };
  ventSlats('R', ['H24', 'H22', 'H22'], 46, 'Right vent fins H24, H22 ×2');
  ventFrame(-1, 'R', 'H7', 'G2-17', 46);

  // p.47 ── left vent, blue chest plates
  ventSlats('L', ['H24', 'H23', 'H23'], 47, 'Left vent fins H24, H23 ×2');
  ventFrame(1, 'L', 'H8', 'G2-18', 47);

  kit.step('Upper chest plates H2 / H16, side plates H9 / H10', {
    pp: 47, view: 'frontR', focus: C,
    desc: 'Fit the big blue upper chest plates H2 (right) and H16 (left) around the vents, and the side plates H9 (right) and H10 (left) under the shoulders.',
  });
  for (const [s, k] of SIDES) {
    const pts = [[5.5, 237, 23.5], [32, 237, 23.5], [5.5, 250, 27], [34.5, 250, 27], [5.5, 258, 27], [35, 264, 26], [20, 270.5, 20], [32.5, 270.5, 20], [11, 262.5, 26.3],
      [5.5, 237, 21.5], [32, 237, 21.5], [5.5, 250, 21.5], [34.5, 250, 21.5], [5.5, 258, 21.5], [35, 264, 21.5], [20, 270.5, 10], [32.5, 270.5, 10], [11, 262.5, 21.5]]
      .map(([x, y, z]) => [s * x, y, z]);
    part(kit, k === 'R' ? 'H2' : 'H16', C, [
      [sub(hull(pts), [cbox(13, 8, 14), { p: [s * 17.5, 255, 26.5], r: [-0.12, s * 0.12, 0] }]), [0, 0, 0]],
      [cbox(22, 0.8, 1, 0.2), [s * 19, 240.5, 24.1], [0.2, 0, 0], MAT.lightBlue],
    ], { from: [s * 6, 4, 24] });
  }
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'H9' : 'H10', C, [
      [sidePlate([[-20, 238], [21.5, 238], [24.5, 249], [24, 262], [7, 262], [7, 247], [-7, 247], [-7, 262], [-22, 262], [-22, 244]], 3, 0.8), [s * 33.5, 0, 0]],
      [slats(10, 7, 1.4, 4, 0.4), [s * 35.1, 243, -12], [0, s * PI / 2, 0], MAT.black],   // side duct fins
      [cbox(1, 5, 7, 0.3), [s * 35.1, 243, 8], null, MAT.lightBlue],
    ], { from: [s * 22, 0, 0] });
  }
  kit.step('Top plates H6 ×2, back plates H1 / H15', {
    pp: 47, view: 'backR', focus: C,
    desc: 'Snap the top plates H6 (×2) onto the chest top, then the tall back plates H1 (right) and H15 (left) with the back collar.',
  });
  for (const [s] of SIDES) {
    part(kit, 'H6', C, [[merge([cbox(18, 2.6, 22, 0.8)], [cbox(12, 0.8, 1, 0.2), { p: [0, 1.4, 4] }]), [s * 23, 269.7, -1]]], { from: [0, 16, 0] });
  }
  for (const [s, k] of SIDES) {
    part(kit, k === 'R' ? 'H1' : 'H15', C, [
      [xf(frontPlate([[15, 238], [32, 238], [34, 250], [33.5, 262], [15, 262]].map(([x, y]) => [s * x, y]), 4.5, 0.8), { p: [0, 0, -21.75] }), [0, 0, 0]],
      [hull([[s * 1, 261, -13.5], [s * 19, 261, -13.5], [s * 1, 261, -24], [s * 19, 261, -24], [s * 1, 271, -14.5], [s * 19, 271, -13.5], [s * 1, 271, -22.5], [s * 19, 271, -22.5]]), [0, 0, 0]],
      [cbox(1, 18, 1, 0.2), [s * 24, 250, -24.2]],
    ], { from: [0, 0, -22] });
  }

  // cockpit hatch armor (rides on H17)
  kit.step('Hatch plate H5', {
    pp: 47, view: 'frontR', focus: C,
    desc: 'Swing the cockpit hatch up and slide the blue hatch plate H5 into the rail of H17.',
  });
  part(kit, 'H5', coreIn, [
    [loft([{ y: 215, w: 12.5, d: 5.5, z: 24.2, c: 1.2 }, { y: 240, w: 15, d: 6, z: 25.2, c: 1.2 }]), [0, 0, 0]],
    [cbox(6, 14, 7, 0.6), [0, 225, 18.5]],
    [cbox(8, 0.8, 1, 0.2), [0, 228, 28.3]],
  ], { from: [0, -20, 12], hatch: HATCH });
  kit.step('Hatch top H4; close the hatch', {
    pp: 47, view: 'frontR', focus: C,
    desc: 'Put H4 on the top of the hatch, slide the hatch down and close it. (Pulling the hatch out and back switches the LED modes.)',
  });
  part(kit, 'H4', coreIn, [
    [loft([{ y: 240, w: 15, d: 6, z: 25.5, c: 1.2 }, { y: 248, w: 16.5, d: 6, z: 25.8, c: 1.4 }]), [0, 0, 0]],
    [cbox(8, 3.4, 1, 0.3), [0, 244.2, 28.9], null, MAT.lightBlue],
  ], { from: [0, 14, 12], hatch: HATCH });
  kit.step('Lower frame H12, pentagon plate H3', {
    pp: 47, view: 'front', focus: C,
    desc: 'Fit the open tapering frame H12 at the lower front centre below the hatch and the pentagonal plate H3 at the upper front centre below the neck.',
  });
  part(kit, 'H12', C, [
    [xf(frontPlate([[-6, 199], [6, 199], [7.5, 215], [4.8, 215], [3.8, 202.5], [-3.8, 202.5], [-4.8, 215], [-7.5, 215]], 5, 0.8), { p: [0, 0, 22] }), [0, 0, 0]],
    [cbox(9, 3, 3, 0.5), [0, 214, 20]],
  ], { from: [0, -10, 18] });
  part(kit, 'H3', C, [
    [xf(frontPlate([[-7.5, 248], [7.5, 248], [9.5, 256.5], [0, 261.5], [-9.5, 256.5]], 5, 1), { p: [0, 0, 26.8] }), [0, 0, 0]],
    [cbox(5, 3, 1, 0.3), [0, 253.5, 29.5], null, MAT.lightBlue],
  ], { from: [0, 8, 18] });

  // backpack armor
  kit.block('BACKPACK ARMOR ASSEMBLE', { pp: 47 });
  kit.step('Nozzle blocks U2-5 ×2, saber rack U2-6', {
    pp: 47, view: 'backR', focus: B,
    desc: 'Fit the blocks U2-5 (×2) above the verniers and the Y-shaped connector U2-6 (central grille, round side ports, two upright saber racks) on the outer face.',
  });
  for (const [s] of SIDES) {
    part(kit, 'U2-5', B, [[merge([tbox(10, 12, 11, 13, 6, { c: 1 })], [slats(7, 3.5, 1, 3, 0.3), { p: [0, 0, -6.6] }]), [s * 11, 219, -36]]], { from: [0, -16, -6] });
  }
  const rackHead = (s) => [tbox(9, 9, 8, 8, 10, { c: 1.2 }), { p: [s * 14, 264, -39], r: [0, 0, -s * 0.27] }];
  part(kit, 'U2-6', B, [
    [sub(xf(frontPlate([[-20, 229], [20, 229], [20, 253], [17, 256], [-17, 256], [-20, 253]], 2.5, 0.6), { p: [0, 0, -41.75] }),
      [cyl(8.3, 8.3, 6, 24, 'z'), { p: [-11.5, 240, -41.75] }], [cyl(8.3, 8.3, 6, 24, 'z'), { p: [11.5, 240, -41.75] }]), [0, 0, 0]],
    [tube(9.4, 8.3, 1.4, 'z', 24), [-11.5, 240, -43.4]],
    [tube(9.4, 8.3, 1.4, 'z', 24), [11.5, 240, -43.4]],
    [slats(5, 16, 1.4, 6, 0.5), [0, 242, -43.3]],
    [merge([cbox(4, 9, 3, 0.6), { p: [-14, 257.5, -41.5] }], [cbox(4, 9, 3, 0.6), { p: [14, 257.5, -41.5] }], rackHead(-1), rackHead(1))],
  ], { from: [0, 0, -24] });
  kit.step('Dial caps U2-4 ×2', {
    pp: 47, view: 'back', focus: B,
    desc: 'Push the round dial caps U2-4 (×2, diagonal slot) onto the dial bosses through the side ports of U2-6.',
  });
  for (const [s] of SIDES) {
    part(kit, 'U2-4', B, [
      [merge([cyl(6.8, 6.8, 4.6, 28, 'z')], [cyl(5.6, 6.4, 0.8, 28, 'z'), { p: [0, 0, -2.7] }],
        [cbox(9, 1, 0.8, 0.2), { p: [0, 1.1, -3.2], r: [0, 0, s * PI / 4] }], [cbox(9, 1, 0.8, 0.2), { p: [0, -1.1, -3.2], r: [0, 0, s * PI / 4] }]),
        [s * 11.5, 240, -42.6]],
    ], { from: [0, 0, -16] });
  }
  kit.step('Side panels U2-8 + U2-9 (left), U2-2 + U2-3 (right)', {
    pp: 48, view: 'backL', focus: B,
    desc: 'Push U2-9 into the left side panel U2-8 and U2-3 into the right side panel U2-2, then snap both panels onto the sides of the backpack.',
  });
  const sidePanel = [[-25.5, 218], [-40, 216], [-44.5, 220], [-44.5, 256], [-41, 259.5], [-26, 259.5]];
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    part(kit, k === 'L' ? 'U2-9' : 'U2-3', B, [[merge([cbox(2, 10, 11, 0.6)], [slats(9, 8, 1, 4, 0.4), { p: [0, 0, 0], r: [0, PI / 2, 0], s: [1, 1, 1] }]), [s * 24.6, 237, -35]]],
      { from: [s * 14, 0, 0] });
    part(kit, k === 'L' ? 'U2-8' : 'U2-2', B, [
      [sidePlate(sidePanel, 3, 0.8), [s * 22.5, 0, 0]],
      [cbox(2, 1, 16, 0.3), [s * 24.2, 250, -35]],
      [cbox(2, 1, 16, 0.3), [s * 24.2, 224, -35]],
    ], { from: [s * 22, 0, 0] });
  }
  kit.step('Top cover U2-7; mount the backpack', {
    pp: 48, view: 'backR', focus: 'all',
    desc: 'Snap the top cover bar U2-7 onto the backpack and plug the finished backpack back into the E1-7 slots on the chest.',
  });
  part(kit, 'U2-7', B, [[merge([cbox(34, 4, 11, 1)], [cbox(26, 1, 1, 0.3), { p: [0, 2.2, -3] }]), [0, 261.2, -31]]], { from: [0, 16, 0] });
}
