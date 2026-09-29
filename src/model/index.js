// Builds the complete kit in manual order. Each region module declares its manual sections / blocks / steps
// while it builds the parts (one kit.part() per manual part number), mounted in the shared rig (rig.js).
import * as THREE from 'three';
import { Kit } from '../kit.js';
import { buildRig } from './rig.js';
import { legFrame, legTruss, legArmor } from './legs.js';
import { waistFrame, waistTruss, waistArmor } from './waist.js';
import { chestFrame, backpackFrame, chestTruss, chestArmor } from './torso.js';
import { armsFrame, armTruss, armArmor } from './arms.js';
import { headFrame, headTruss, headArmor } from './head.js';
import { options } from './options.js';

export const edgeMaterial = new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3 });

// ?only=legs,arms builds just those regions (debugging aid while modelling).
const ONLY = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('only') : null;
const want = (region) => !ONLY || ONLY.split(',').includes(region);

export function buildModel(only = null) {
  const on = only ? (r) => only.includes(r) : want;
  const run = (region, fn) => { if (on(region)) fn(); };
  const kit = new Kit();
  const root = new THREE.Group();
  root.name = 'RX-78-2';
  const R = buildRig(root);

  kit.phase(0);
  kit.section('OVERVIEW', { pp: 3 });
  kit.step('PG UNLEASHED 1/60 RX-78-2 Gundam', {
    pp: 3, focus: 'all',
    desc: 'The finished kit, built exactly as the instruction manual: every numbered part is its own piece. The build runs in five phases (Gunpla Evolution Link System): PHASE 01▶02 the insert-molded inner frame and mechanical parts, PHASE 03 the silver truss frame, PHASE 04 the external armor, PHASE 05 weapons, Core Fighter and LED. Press Next (→) to start building.',
  });

  // PHASE 01 ▶ 02 · inner frame (pp.14-32)
  kit.phase(1);
  run('legs', () => legFrame(kit, R));        // pp.14-19
  run('waist', () => waistFrame(kit, R));      // pp.20-22 (legs join on p.21)
  run('torso', () => chestFrame(kit, R));      // pp.23-26 (core block, chest joins the waist on p.26)
  run('torso', () => backpackFrame(kit, R));   // p.27
  run('arms', () => armsFrame(kit, R));       // pp.28-31
  run('head', () => headFrame(kit, R));       // p.32

  // PHASE 03 · truss frame (pp.33-39)
  kit.phase(3);
  run('legs', () => legTruss(kit, R));
  run('waist', () => waistTruss(kit, R));
  run('torso', () => chestTruss(kit, R));
  run('arms', () => armTruss(kit, R));
  run('head', () => headTruss(kit, R));

  // PHASE 04 · external armor (pp.40-51)
  kit.phase(4);
  run('legs', () => legArmor(kit, R));
  run('waist', () => waistArmor(kit, R));
  run('torso', () => chestArmor(kit, R));
  run('arms', () => armArmor(kit, R));
  run('head', () => headArmor(kit, R));

  // PHASE 05 · options (pp.52-63)
  kit.phase(5);
  run('options', () => options(kit, R));

  kit.section('COMPLETE', { pp: 3 });
  kit.step('RX-78-2 Gundam · complete', {
    id: 'final', focus: 'all', view: 'front',
    desc: 'The PG UNLEASHED RX-78-2 is complete. Toggle "Open hatches" to open the armor gimmicks and "LED" to light the eyes and the core block.',
  });

  kit.finalize(root, edgeMaterial);
  return { kit, root };
}
