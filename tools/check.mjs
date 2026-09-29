// usage: node tools/check.mjs [region,region...]   Builds the model in node (no browser) and prints steps / parts / bounds.
import * as THREE from 'three';
const regions = process.argv[2] ? process.argv[2].split(',') : null;
const origWarn = console.warn; console.warn = (...a) => { if (!String(a[0]).includes('maxLeafSize')) origWarn(...a); };
const { buildModel } = await import('../src/model/index.js');
const t0 = Date.now();
const { kit, root } = buildModel(regions);
console.log(`built in ${Date.now() - t0} ms: ${kit.steps.length} steps, ${kit.parts.filter((p) => !p.segment).length} parts`);
root.updateMatrixWorld(true);
let cur = '';
for (const st of kit.steps) {
  const head = `${st.section} / ${st.block}`;
  if (head !== cur) { console.log(`\n[${head}]`); cur = head; }
  const b = new THREE.Box3();
  for (const p of st.parts) b.expandByObject(p.obj);
  const f = (v) => v.toArray().map((x) => Math.round(x)).join(',');
  console.log(`  ${st.index} p${st.pp} ${st.title} :: ${st.parts.map((p) => p.id).join(' ')}${st.assemblies.length ? ' +JOIN' : ''}${b.isEmpty() ? '' : `  box[${f(b.min)} → ${f(b.max)}]`}`);
}
