// Guru Run 3D – prototyp (Three.js, offline)
import * as THREE from 'three';
import { buildGuru, animateGuru } from './guru-model.js';
const wrap = document.getElementById('wrap'), stage = document.getElementById('stage');
const mobile = matchMedia('(pointer:coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc9e8); scene.fog = new THREE.Fog(0x9cc9e8, 40, 190);
const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 220);
scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b5a48, 1.2));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.position.set(12, 25, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
scene.add(sun, sun.target);

const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
// --- ulice ---
const LEN = 160, HALF_W = 5;
const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d');
cx.fillStyle = '#4c4f55'; cx.fillRect(0, 0, 256, 256);
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { cx.fillStyle = `hsl(220,4%,${38 + Math.random() * 14}%)`; cx.beginPath(); cx.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 6); cx.fill(); }
const cob = new THREE.CanvasTexture(cv); cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(5, 80); cob.colorSpace = THREE.SRGBColorSpace;
const street = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, LEN + 20), new THREE.MeshStandardMaterial({ map: cob, roughness: .95 }));
street.rotation.x = -Math.PI / 2; street.position.z = -LEN / 2 + 10; street.receiveShadow = true; scene.add(street);
const walk = new THREE.Mesh(new THREE.PlaneGeometry(4, LEN + 20), M(0x9a948a));
[-1, 1].forEach(s => { const w = walk.clone(); w.rotation.x = -Math.PI / 2; w.position.set(s * (HALF_W + 2), .02, -LEN / 2 + 10); w.receiveShadow = true; scene.add(w); });
// domy – instancované pro výkon
const cols = [0xe8c9a0, 0xd9a07a, 0xf0e2c0, 0xb9c9a8, 0xe6b8b0, 0xc8d4e0, 0xf2d27a];
const boxG = new THREE.BoxGeometry(1, 1, 1), roofG = new THREE.ConeGeometry(.75, 1, 4); roofG.rotateY(Math.PI / 4);
const houses = [], roofs = [];
for (const s of [-1, 1]) for (let z = 8; z > -LEN - 4; ) { const d = 6 + Math.random() * 4, h = 9 + Math.random() * 7, w = 7; houses.push({ x: s * (HALF_W + 4 + w / 2), z: z - d / 2, w, h, d, c: cols[(Math.random() * cols.length) | 0] }); z -= d + .1; }
const hm = new THREE.InstancedMesh(boxG, new THREE.MeshStandardMaterial({ roughness: .9 }), houses.length);
const rm = new THREE.InstancedMesh(roofG, M(0x8a3b2a), houses.length);
const winM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1.5), new THREE.MeshStandardMaterial({ color: 0x2a3440, emissive: 0x332a10 }), houses.length * 12);
const o = new THREE.Object3D(); let wi = 0;
houses.forEach((b, i) => {
  o.position.set(b.x, b.h / 2, b.z); o.rotation.set(0, 0, 0); o.scale.set(b.w, b.h, b.d); o.updateMatrix(); hm.setMatrixAt(i, o.matrix); hm.setColorAt(i, new THREE.Color(b.c));
  o.position.set(b.x, b.h + 1.5, b.z); o.scale.set(b.w * 1.05, 3, b.d * 1.05); o.updateMatrix(); rm.setMatrixAt(i, o.matrix);
  const fx = b.x - Math.sign(b.x) * (b.w / 2 + .01);
  for (let f = 0; f < 3; f++) for (let k = 0; k < 4 && wi < winM.count; k++) {
    const zz = b.z - b.d / 2 + (k + .5) * b.d / 4; if (k >= Math.floor(b.d / 1.8)) continue;
    o.position.set(fx, 3 + f * 3, zz); o.rotation.set(0, -Math.sign(b.x) * Math.PI / 2, 0); o.scale.set(1, 1, 1); o.updateMatrix(); winM.setMatrixAt(wi++, o.matrix);
  }
});
winM.count = wi; hm.castShadow = hm.receiveShadow = true; scene.add(hm, rm, winM);
// Prašná brána
const gate = new THREE.Group(), gm = M(0x3d3a36);
const tower = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 8), gm); tower.position.y = 11; tower.castShadow = true;
const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 12, 4), M(0x2b2b2b)); roof.rotation.y = Math.PI / 4; roof.position.y = 28;
const arch = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 8.2), M(0x111111)); arch.position.y = 4.5;
[[-7, 1], [7, 1]].forEach(([x]) => { const sp = new THREE.Mesh(new THREE.ConeGeometry(1, 6, 4), M(0x2b2b2b)); sp.position.set(x, 25, 3); gate.add(sp); });
gate.add(tower, roof, arch); gate.position.z = -LEN - 4; scene.add(gate);

// --- Guru (model v guru-model.js) ---
const G = buildGuru(); const guru = G.root; guru.scale.setScalar(1); scene.add(guru);

// --- ovládání ---
const keys = {}; addEventListener('keydown', e => keys[e.code] = true); addEventListener('keyup', e => keys[e.code] = false);
const joy = document.getElementById('joy'), knob = document.getElementById('knob'), runB = document.getElementById('run');
let jx = 0, jy = 0, jid = null, runTouch = false;
const jmove = e => { const r = joy.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const m = Math.hypot(dx, dy), max = r.width / 2; if (m > max) { dx *= max / m; dy *= max / m; } jx = dx / max; jy = dy / max; knob.style.transform = `translate(${dx}px,${dy}px)`; };
joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); jmove(e); });
joy.addEventListener('pointermove', e => e.pointerId === jid && jmove(e));
const jend = e => { if (e.pointerId !== jid) return; jid = null; jx = jy = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
runB.addEventListener('pointerdown', () => { runTouch = !runTouch; runB.classList.toggle('on', runTouch); });

// --- smyčka ---
let heading = 0, speed = 0, phase = 0, last = performance.now();
const camPos = new THREE.Vector3(0, 4, 8), tmp = new THREE.Vector3();
function resize() { const v = window.visualViewport; if (v) { wrap.style.width = v.width + 'px'; wrap.style.height = v.height + 'px'; } const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); visualViewport && visualViewport.addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 300)); resize();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  let fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - jy;
  let turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - jx;
  fwd = THREE.MathUtils.clamp(fwd, -1, 1); turn = THREE.MathUtils.clamp(turn, -1, 1);
  if (Math.abs(fwd) < .15) fwd = 0; if (Math.abs(turn) < .15) turn = 0;
  const running = keys.ShiftLeft || keys.ShiftRight || runTouch;
  heading += turn * 2.4 * dt;
  const target = fwd * (fwd > 0 ? (running ? 9 : 4) : 2.5);
  speed += (target - speed) * Math.min(1, dt * 8);
  guru.rotation.y = heading + Math.PI;
  guru.position.x += -Math.sin(heading) * speed * dt; guru.position.z += -Math.cos(heading) * speed * dt;
  guru.position.x = THREE.MathUtils.clamp(guru.position.x, -HALF_W - 3.2, HALF_W + 3.2);
  guru.position.z = THREE.MathUtils.clamp(guru.position.z, -LEN + 2, 8);
  animateGuru(G, { dt, now }, speed, running);
  // kamera za Guruem
  const back = new THREE.Vector3(Math.sin(heading) * 6.5, 3.6, Math.cos(heading) * 6.5);
  camPos.lerp(tmp.copy(guru.position).add(back), 1 - Math.pow(.02, dt));
  camera.position.copy(camPos); camera.lookAt(guru.position.x, guru.position.y + 1.8, guru.position.z);
  sun.position.set(guru.position.x + 12, 25, guru.position.z + 8); sun.target.position.copy(guru.position);
  renderer.render(scene, camera); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.__guru = guru;
