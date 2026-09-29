// Shared skeleton: every region builder mounts its parts in these groups, so separately built regions line up.
// World units: mm at 1/60 scale. Ground y = 0, +z = front (face), +x = the MOBILE SUIT's LEFT.
//
//  root
//  ├─ waist            world coords (identity). Crotch block / waist frame / skirts. Hip joints at (±21, 163, 0).
//  ├─ leg.R / leg.L    root at (∓/±21, 163, 0). Right leg has scale.x = -1: build every leg as the LEFT leg
//  │   └─ hip          (+x = outward). hip joint at origin; thigh hangs down -y.
//  │       └─ knee     (0, -52, 0): knee axis
//  │           └─ ankle(0, -88, 0): ankle ball; sole bottom at about y = -22 in ankle space (ground)
//  ├─ chest            world coords (identity). abdomen ~y 199–237, chest ~237–272, neck top ~272
//  │   ├─ core         Core Block (slides in from the front)
//  │   ├─ backpack     world coords, behind the chest (z < -20)
//  │   ├─ arm.R/arm.L  root at (∓/±38, 252, 0) = shoulder ball. Right arm scale.x = -1: build as LEFT arm.
//  │   │   └─ sh       shoulder (pose rotation); upper arm centre line at x = +13
//  │   │       └─ elbow (13, -48, 0)
//  │   │           └─ hand (0, -46, 0) wrist ball
//  │   │               └─ fist  gripping hand (kit.swapOut(fist) when PHASE 05 puts a weapon hand on)
//  │   └─ head         (0, 268, 0), scale 0.88; neck joint at origin, face towards +z, top of V-fin ≈ +35
//  ├─ rifle, shield    placed at the hands by the options module
//  └─ coreFighter      display piece next to the model
import * as THREE from 'three';
import { grp } from '../kit.js';

export const POSE = {
  armR: { shoulder: -0.3, elbow: -0.95, wristX: 0.25 },
  armL: { shoulder: -0.06, elbow: -0.4 },
};

export function buildRig(root) {
  const R = { root };
  R.waist = grp(); R.waist.name = 'waist'; root.add(R.waist);

  R.leg = {};
  for (const side of ['R', 'L']) {
    const s = side === 'L' ? 1 : -1;
    const r = grp([s * 21, 163, 0]);
    if (s < 0) r.scale.x = -1;
    r.name = `leg${side}`;
    root.add(r);
    const hip = grp([0, 0, 0], [0, 0, 0.07]);
    const knee = grp([0, -52, 0]);
    const ankle = grp([0, -88, 0], [0, 0, -0.07]);
    r.add(hip); hip.add(knee); knee.add(ankle);
    R.leg[side] = { root: r, hip, knee, ankle, s };
  }

  R.chest = grp(); R.chest.name = 'chest'; root.add(R.chest);
  R.core = grp(); R.core.name = 'coreBlock'; R.chest.add(R.core);
  R.backpack = grp(); R.backpack.name = 'backpack'; R.chest.add(R.backpack);

  R.arm = {};
  for (const side of ['R', 'L']) {
    const s = side === 'L' ? 1 : -1;
    const pose = POSE[`arm${side}`];
    const r = grp([s * 38, 252, 0]);
    if (s < 0) r.scale.x = -1;
    r.name = `arm${side}`;
    R.chest.add(r);
    const sh = grp([0, 0, 0], [pose.shoulder, 0, 0.05]);
    const elbow = grp([13, -48, 0], [pose.elbow, 0, 0]);
    const hand = grp([0, -46, 0], [pose.wristX || 0, pose.wristY || 0, 0]);
    // fist: the gripping hand built in ARMS-FRAME (swapped out in PHASE 05 when a weapon hand goes on the wrist)
    const fist = grp();
    r.add(sh); sh.add(elbow); elbow.add(hand); hand.add(fist);
    R.arm[side] = { root: r, sh, elbow, hand, fist, s, pose };
  }

  R.head = grp([0, 268, 0]);
  R.head.scale.setScalar(0.88);
  R.head.name = 'head';
  R.chest.add(R.head);

  R.options = grp(); R.options.name = 'options'; root.add(R.options);
  return R;
}

/** Bench offsets used when a sub-assembly is joined (kit.join(group, BENCH.x)). */
export const BENCH = {
  legR: [-55, 0, 20], legL: [55, 0, 20],
  chest: [0, 80, 10], core: [0, 0, 45], backpack: [0, 0, -55],
  armR: [-50, -10, 20], armL: [50, -10, 20],
  head: [0, 45, 30],
};
