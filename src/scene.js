// Renderer, studio lighting, cutting mat, post-processing.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

function matTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#2f6a55';
  g.fillRect(0, 0, 1024, 1024);
  // 10 mm grid over 400 mm; bolder every 50 mm
  const px = 1024 / 40;
  for (let i = 0; i <= 40; i++) {
    const major = i % 5 === 0;
    g.strokeStyle = major ? 'rgba(235,245,235,0.55)' : 'rgba(235,245,235,0.22)';
    g.lineWidth = major ? 2.2 : 1;
    g.beginPath(); g.moveTo(i * px, 0); g.lineTo(i * px, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i * px); g.lineTo(1024, i * px); g.stroke();
  }
  g.strokeStyle = 'rgba(235,245,235,0.35)';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(1024, 1024); g.stroke();
  g.beginPath(); g.moveTo(1024, 0); g.lineTo(0, 1024); g.stroke();
  g.beginPath(); g.arc(512, 512, px * 10, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(235,245,235,0.6)';
  g.font = '20px Arial';
  for (let i = 0; i <= 40; i += 5) g.fillText(String(i * 10), i * px + 4, 22);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function backdrop() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#0d0f13');
  gr.addColorStop(0.55, '#1b1f27');
  gr.addColorStop(1, '#262b34');
  g.fillStyle = gr;
  g.fillRect(0, 0, 16, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = backdrop();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
  camera.position.set(260, 260, 520);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 150, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 30;
  controls.maxDistance = 1600;
  controls.maxPolarAngle = Math.PI * 0.53;
  controls.screenSpacePanning = true;

  // lights
  scene.add(new THREE.HemisphereLight('#dfe8ff', '#30382f', 0.55));
  const key = new THREE.DirectionalLight('#fff6ea', 2.3);
  key.position.set(220, 480, 320);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 50; sc.far = 1400;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.4;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#a9c4ff', 1.3);
  rim.position.set(-300, 260, -380);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffffff', 0.45);
  fill.position.set(-260, 120, 300);
  scene.add(fill);

  // cutting mat
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(420, 3, 420),
    [
      new THREE.MeshStandardMaterial({ color: '#23503f', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#23503f', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: '#23503f', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#23503f', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#23503f', roughness: 0.9 }),
    ],
  );
  mat.position.y = -1.5;
  mat.receiveShadow = true;
  scene.add(mat);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2400, 64),
    new THREE.MeshStandardMaterial({ color: '#15181d', roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.1;
  floor.receiveShadow = true;
  scene.add(floor);

  // post-processing
  const size = new THREE.Vector2();
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
  outline.edgeStrength = 4;
  outline.edgeGlow = 0.35;
  outline.edgeThickness = 1.4;
  outline.pulsePeriod = 2.2;
  outline.visibleEdgeColor.set('#ff3fb4');
  outline.hiddenEdgeColor.set('#7a1f5a');
  composer.addPass(outline);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.2, 4.0);
  bloom.enabled = false;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.getSize(size);
    if (size.x === w && size.y === h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, controls, composer, outline, bloom, resize, key };
}
