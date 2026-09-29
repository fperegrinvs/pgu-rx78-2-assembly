// Palette derived from the PG Unleashed RX-78-2 manual colour guide (p.66) and runner list (p.8-11).
import * as THREE from 'three';

function plastic(color, { rough = 0.46, clear = 0.25, sheen = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, clearcoat: clear, clearcoatRoughness: 0.55,
    sheen, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff'),
  });
}
function metal(color, rough = 0.25, { aniso = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0.92, envMapIntensity: 1.8, anisotropy: aniso, clearcoat: 0.1 });
}
function clear(color, opacity = 0.55, emissive = '#000000') {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.08, metalness: 0, transparent: true, opacity,
    transmission: 0, clearcoat: 1, emissive, emissiveIntensity: 0,
  });
}

export const MAT = {
  // Exterior plastics (Phase 04)
  white: plastic('#efefec'),            // I, J, K, L, M runners
  whiteGray: plastic('#cfd2d6'),        // "white gray" parts
  blue: plastic('#1f4ea9', { clear: 0.35 }),   // chest (H runner)
  lightBlue: plastic('#2f68c9', { clear: 0.35 }),
  blueBlack: plastic('#1e2534', { rough: 0.5 }), // backpack
  red: plastic('#c6303b', { clear: 0.3 }),      // N runners
  darkRed: plastic('#8f2430', { clear: 0.3 }),  // O runners
  yellow: plastic('#f3c11c', { clear: 0.35 }),
  darkYellow: plastic('#c99a1f'),
  handGray: plastic('#3b3f47', { rough: 0.5 }), // R runner hands
  rifle: plastic('#4c515e', { rough: 0.45 }),   // gray-violet rifle
  rifleDark: plastic('#2c3038', { rough: 0.5 }),
  black: plastic('#15171a', { rough: 0.6 }),

  // Inner frame (Phase 01-02)
  frameDark: plastic('#41464d', { rough: 0.58, clear: 0.05 }),   // A-D, Q, U dark gray ABS
  frameGray: plastic('#5d636b', { rough: 0.55, clear: 0.05 }),   // E, F gray
  frameInsert: plastic('#6f757d', { rough: 0.5, clear: 0.05 }),  // MSF insert-molded frames
  headFrame: plastic('#35393f', { rough: 0.55, clear: 0.05 }),
  poly: plastic('#2a2c30', { rough: 0.7, clear: 0 }),

  // Plating & metal (Phase 02-03)
  silver: metal('#b3b8bf', 0.32),          // T runners
  silverPlated: metal('#dfe3e8', 0.24),     // S runners
  gold: metal('#dcaa47', 0.2),             // V1 gold plating
  chrome: metal('#f2f2f4', 0.16),          // W chrome plating
  metalPart: metal('#8e949c', 0.32),       // machined metal verniers / vulcans
  gunmetal: metal('#4a4f57', 0.35),
  etching: metal('#9ea3a8', 0.38),          // etched metal stickers
  metallicRed: metal('#c0303a', 0.2),       // metallic 3D stickers
  metallicGreen: metal('#3fbf6a', 0.2),
  metallicBlue: metal('#3a78d0', 0.2),
  thrusterInner: plastic('#b3262f', { rough: 0.4 }),

  // Clear parts / LEDs
  eye: clear('#c9f06a', 0.9, '#d8ff5a'),
  sensorGreen: clear('#46d17d', 0.9, '#46ff8a'),
  sensorRed: clear('#ff4a5a', 0.9, '#ff2a3a'),
  clearPart: clear('#cfe6ff', 0.35),
  canopy: clear('#8fc4ff', 0.55),
  finGlow: clear('#ffd84a', 0.0, '#ffcc33'),
  saberBlade: new THREE.MeshBasicMaterial({ color: '#ff7ad9', transparent: true, opacity: 0.9 }),
};

for (const [k, m] of Object.entries(MAT)) m.name = k;

export const EMISSIVE_MATS = [MAT.eye, MAT.sensorGreen, MAT.sensorRed, MAT.finGlow];

export const SWATCH = {
  white: '#efefec', whiteGray: '#cfd2d6', blue: '#1f4ea9', blueBlack: '#1e2534', red: '#c6303b',
  darkRed: '#8f2430', yellow: '#f3c11c', handGray: '#3b3f47', frameDark: '#41464d',
  frameGray: '#5d636b', frameInsert: '#6f757d', silver: '#b3b8bf', silverPlated: '#dfe3e8',
  gold: '#dcaa47', chrome: '#f2f2f4', metalPart: '#8e949c', clear: '#cfe6ff', clearPink: '#ff9ad9',
  multi: 'linear-gradient(90deg,#1f4ea9 0 33%,#f3c11c 33% 66%,#c6303b 66%)', rifle: '#4c515e',
};

/** Sub-runner -> material key (manual parts list p.8-11). Multi-colour runners (G1, G2, H) default to their main colour. */
const RUNNER_MAT = {
  A1: 'frameDark', A2: 'frameDark', B1: 'frameDark', B2: 'frameDark', B3: 'frameDark',
  C1: 'frameDark', C2: 'frameDark', C3: 'frameDark', D: 'frameDark',
  E1: 'frameGray', E2: 'frameGray', F1: 'frameGray', F2: 'frameGray',
  G1: 'headFrame', G2: 'yellow', H: 'blue',
  I1: 'white', J1: 'white', J2: 'white', K1: 'white', K2: 'white', K3: 'white', K4: 'white', K5: 'white',
  L1: 'white', L2: 'white', L3: 'white', L4: 'white', M1: 'white', M2: 'white', M3: 'white', M4: 'white',
  N1: 'red', N2: 'red', N3: 'red', N4: 'red', N5: 'red', O1: 'darkRed', O2: 'darkRed', O3: 'darkRed',
  P1: 'clearPart', P2: 'clearPart', P3: 'red', Q1: 'frameDark', Q2: 'frameDark', R: 'handGray',
  S1: 'silverPlated', S2: 'silverPlated', S3: 'silverPlated', S4: 'silverPlated',
  T1: 'silver', T2: 'silver', T3: 'silver', T4: 'silver', T5: 'silver',
  U1: 'frameDark', U2: 'blueBlack', U3: 'rifle', V1: 'gold', V2: 'rifle', W: 'chrome',
  X1: 'frameGray', X2: 'frameGray', Y: 'white', Z: 'saberBlade', MSF: 'frameInsert', METAL: 'metalPart',
};
/** Default material for a manual part id ('D5' -> dark gray, 'L3-18' -> white, 'W20' -> chrome). */
export function partMat(id) {
  // 'A2-16' / 'MSF-2-1' → sub-runner before the dash; 'H19' / 'D13' → single-letter runner with the whole number
  const s = String(id);
  const m = s.match(/^(MSF|METAL|[A-Z]\d?)-/) || s.match(/^([A-Z])\d+$/) || s.match(/^([A-Z])$/);
  const key = m && (RUNNER_MAT[m[1]] || RUNNER_MAT[m[1][0]]);
  return MAT[key || 'frameDark'];
}
export const runnerMatKey = (r) => RUNNER_MAT[r] || RUNNER_MAT[r?.[0]];

/** Runner id -> [colour label, swatch key] (manual p.8-11). */
export const RUNNERS = {
  A: ['Dark gray', 'frameDark'], B: ['Dark gray', 'frameDark'], C: ['Dark gray', 'frameDark'],
  D: ['Dark gray', 'frameDark'], E: ['Gray', 'frameGray'], F: ['Gray', 'frameGray'],
  G: ['Multi-colored', 'multi'], H: ['Multi-colored', 'multi'], I: ['White', 'white'],
  J: ['White', 'white'], K: ['White', 'white'], L: ['White', 'white'], M: ['White', 'white'],
  N: ['Red', 'red'], O: ['Dark red', 'darkRed'], P: ['Clear', 'clear'], Q: ['Dark gray', 'frameDark'],
  R: ['Dark gray', 'handGray'], S: ['Silver-plated', 'silverPlated'], T: ['Silver', 'silver'],
  U: ['Dark gray', 'frameDark'], V1: ['Gold-plated', 'gold'], V2: ['Gray', 'rifle'],
  W: ['Chrome-plated', 'chrome'], X: ['Gray', 'frameGray'], Z: ['Clear pink', 'clearPink'],
  MSF: ['Gray insert frame', 'frameInsert'], METAL: ['Metal parts', 'metalPart'],
};
