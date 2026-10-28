// Guru Run 3D – prototyp (Three.js, offline)
import * as THREE from 'three';
import { buildGuru, animateGuru } from './guru-model.js';
import { buildFiskule } from './fiskule-model.js';
import { buildBird, flap } from './bird-model.js';
import { buildSiki } from './siki-model.js';
import { buildMotorbike } from './motorbike-model.js';
const LEVEL = new URLSearchParams(location.search).get('level') === '2' ? 2 : 1;
const wrap = document.getElementById('wrap'), stage = document.getElementById('stage');
const mobile = matchMedia('(pointer:coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc9e8); scene.fog = new THREE.Fog(0x9cc9e8, 35, 150);
const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 160);
scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b5a48, 1.2));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.position.set(12, 25, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
scene.add(sun, sun.target);

const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
// --- ulice ---
const LEN = 800, HALF_W = 5, WALK_X = HALF_W + 3.2;
// díry: z začátek (blíž startu), délka – rostoucí obtížnost
const HOLES = LEVEL === 2 ? [] : [[-60, 2.4], [-130, 2.8], [-200, 3.2], [-270, 3.6], [-340, 3.6], [-410, 4.0], [-480, 4.2], [-550, 4.4], [-620, 4.6], [-690, 4.8]].map(([z, l]) => ({ z0: z, z1: z - l }));
const CHECKS = LEVEL === 2 ? [0] : [0, -120, -260, -400, -540, -680];
const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d');
cx.fillStyle = '#4c4f55'; cx.fillRect(0, 0, 256, 256);
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { cx.fillStyle = `hsl(220,4%,${38 + Math.random() * 14}%)`; cx.beginPath(); cx.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 6); cx.fill(); }
const cob = new THREE.CanvasTexture(cv); cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(5, 80); cob.colorSpace = THREE.SRGBColorSpace;
const streetMat = new THREE.MeshStandardMaterial({ map: cob, roughness: .95 }), walkMat = M(0x9a948a);
cob.repeat.set(5, 1);
const segs = []; { let z = 12; for (const h of HOLES) { segs.push([z, h.z0]); z = h.z1; } segs.push([z, -LEN - 12]); }
for (const [a, b] of segs) {
  const L = a - b, g = new THREE.PlaneGeometry(HALF_W * 2, L); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * L / 2);
  const st = new THREE.Mesh(g, streetMat); st.rotation.x = -Math.PI / 2; st.position.z = (a + b) / 2; st.receiveShadow = true; scene.add(st);
  [-1, 1].forEach(sg => { const w = new THREE.Mesh(new THREE.PlaneGeometry(4, L), walkMat); w.rotation.x = -Math.PI / 2; w.position.set(sg * (HALF_W + 2), .02, (a + b) / 2); w.receiveShadow = true; scene.add(w); });
}
// jámy: vnitřek (BackSide) + krajové kameny
const pitMat = new THREE.MeshStandardMaterial({ color: 0x15120f, side: THREE.BackSide, roughness: 1 }), edgeMat = M(0x8c8378);
for (const h of HOLES) {
  const L = h.z0 - h.z1, pit = new THREE.Mesh(new THREE.BoxGeometry(WALK_X * 2 + .8, 8, L), pitMat); pit.position.set(0, -4.001, (h.z0 + h.z1) / 2); scene.add(pit);
  for (const z of [h.z0, h.z1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(WALK_X * 2 + .8, .18, .35), edgeMat); e.position.set(0, .06, z + (z === h.z0 ? -.15 : .15)); e.receiveShadow = true; scene.add(e); }
}
// checkpointy – vlaječky
const flags = CHECKS.slice(1).map(z => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 6), M(0xdddddd)).translateY(1.2)); const f = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshStandardMaterial({ color: 0xc0392b, side: THREE.DoubleSide })); f.position.set(.47, 2.1, 0); g.add(f); g.position.set(-HALF_W - .6, 0, z); scene.add(g); return f; });
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
const G = buildGuru(); let guru = G.root; guru.scale.setScalar(1); scene.add(guru);

// --- Fiškule (parťačka) ---
const F = buildFiskule(); const fis = F.root; fis.scale.setScalar(.9); fis.visible = false; scene.add(fis);
let fState = LEVEL === 2 ? 'npc' : 'idle', fVy = 0, fT = 0, fSpeed = 0;
const bubble = document.getElementById('bubble'), compassEl = document.getElementById('compass');
let cut = false, cutSkip = false;
addEventListener('keydown', () => { if (cut) { cutSkip = true; sikiTap(); } });
addEventListener('pointerdown', () => { if (cut) { cutSkip = true; sikiTap(); } });
// --- SIKI u Prašné brány ---
const K = buildSiki(); const siki = K.root; siki.scale.setScalar(1.15); siki.position.set(0, 0, -LEN + 4); scene.add(siki);
let sState = LEVEL === 2 ? 'npc' : 'idle', sT = 0, sLine = -1, sLineT = 0, sFromZ = 0, sToZ = 0;
const sikiLines = () => ['Ahoj Guru! Já jsem SIKI. 🦘', 'Doběhl jsi až k Prašné bráně – klobouk dolů!', `Sesbíral jsi ${bones} ${bones === 1 ? 'kostičku' : bones >= 2 && bones <= 4 ? 'kostičky' : 'kostiček'}. Příště tě čeká další level!`];
function say(t) { try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[🦘]/g, '')); u.lang = 'cs-CZ'; u.rate = 1.0; speechSynthesis.speak(u); } catch (e) {} }
function showLine(i, speak) { sLine = i; sLineT = 0; const t = sikiLines()[i]; bubble.innerHTML = '<b>SIKI:</b> ' + t + '<small>ťukni pro pokračování</small>'; bubble.classList.add('on'); if (speak) say(t); }
function sikiTap() { if (sState !== 'cut' || sLine < 0 || sLineT < .4) return; if (sLine < 2) showLine(sLine + 1, true); else finishSiki(); }
function finishSiki() { sState = 'done'; cut = false; bubble.classList.remove('on'); endScreen('Cíl! Guru doběhl k Prašné bráně 🏁', true); }
function updateSiki(dt, now) {
  const gp = guru.position;
  if (sState === 'idle') {
    if (Math.abs(gp.z - siki.position.z) > 60) return;
    siki.position.y = Math.max(0, Math.sin(now / 260)) * .18 * (Math.sin(now / 2300) > .3 ? 1 : 0);
    K.head.rotation.y = Math.sin(now / 1400) * .5; K.tail.rotation.y = Math.sin(now / 700) * .25;
    if (gp.z < siki.position.z + 15 && !done) { sState = 'cut'; cut = true; cutSkip = false; sT = 0; sFromZ = siki.position.z; sToZ = gp.z - 4.5; birds.forEach(b => { if (b.state !== 'off') { b.state = 'circle'; b.mark.visible = false; } }); }
    return;
  }
  if (sState !== 'cut') return;
  sT += dt; sLineT += dt;
  // velké skoky ke Guruovi
  const hopDur = 1.4;
  if (sT < hopDur) { const k = sT / hopDur; siki.position.z = THREE.MathUtils.lerp(sFromZ, sToZ, k); siki.position.x = THREE.MathUtils.lerp(0, gp.x * .6, k); siki.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 1.4; }
  else if (sT < hopDur + .8) { siki.position.y = Math.abs(Math.sin((sT - hopDur) / .8 * Math.PI)) * 2.2; if (sLine < 0 && sT > hopDur + .4) showLine(0, false); } // velký skok radosti
  else siki.position.y = 0;
  siki.rotation.y = Math.atan2(gp.x - siki.position.x, gp.z - siki.position.z);
  K.tail.rotation.y = Math.sin(now / 300) * .3; K.head.rotation.y = Math.sin(now / 500) * .12;
  K.arms[1].rotation.set(0, 0, sLine >= 0 ? 2.5 + Math.sin(now / 120) * .3 : .14);
  guru.rotation.y = Math.atan2(siki.position.x - gp.x, siki.position.z - gp.z); animateGuru(G, { dt, now }, 0, false);
  const camT = tmp.set(gp.x + 4.2, 2.4, gp.z + 5.5); camPos.lerp(camT, 1 - Math.pow(.05, dt)); camera.position.copy(camPos);
  camera.lookAt(siki.position.x * .7 + gp.x * .3, 2.9, siki.position.z * .7 + gp.z * .3);
  if (fState === 'follow') { fis.position.y = 0; fis.rotation.y = Math.atan2(siki.position.x - fis.position.x, siki.position.z - fis.position.z); }
  if (sLine >= 0 && sLineT > 3.5) { if (sLine < 2) showLine(sLine + 1, false); else finishSiki(); }
}
window.__siki = () => ({ state: sState, line: sLine, done });

// --- kostičky (InstancedMesh) ---
function mergeGeo(list) { const pos = [], nor = []; for (const g0 of list) { const g = g0.toNonIndexed(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; }
const boneParts = [new THREE.CapsuleGeometry(.07, .42, 3, 8).rotateZ(Math.PI / 2)];
for (const x of [-.27, .27]) for (const y of [-.07, .07]) boneParts.push(new THREE.SphereGeometry(.09, 10, 8).translate(x, y, 0));
const boneMat = new THREE.MeshStandardMaterial({ color: 0xfffbea, emissive: 0xffe9a0, emissiveIntensity: .45, roughness: .5 });
const bonePts = [];
const addB = (x, z, y = .9) => bonePts.push({ x, y, z, alive: true, t: 0 });
const overHole = z => HOLES.find(h => z <= h.z0 + 1 && z >= h.z1 - 1);
for (let z = -4, k = 0; z > -LEN + 6; z -= 1.6, k++) {
  const h = overHole(z);
  if (h) { const t = (h.z0 + 1 - z) / (h.z0 - h.z1 + 2); addB(0, z, .9 + Math.sin(t * Math.PI) * 1.4); continue; }
  const seg = Math.floor(k / 10) % 4, i = k % 10;
  if (seg === 0) addB(0, z);
  else if (seg === 1) addB(Math.sin(i / 9 * Math.PI * 2) * 3, z);
  else if (seg === 2) addB(i % 2 ? 2.5 : -2.5, z);
  else addB(-3, z, .9 + Math.sin(i / 9 * Math.PI) * 2.0), addB(3, z, .9 + Math.sin(i / 9 * Math.PI) * 2.0); // vysoké oblouky – na skok
}
const bonesM = new THREE.InstancedMesh(mergeGeo(boneParts), boneMat, bonePts.length); bonesM.castShadow = true; scene.add(bonesM);
const sparkG = new THREE.BufferGeometry(), SP = 60, spPos = new Float32Array(SP * 3), spVel = []; let spLife = new Float32Array(SP);
sparkG.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
const sparks = new THREE.Points(sparkG, new THREE.PointsMaterial({ color: 0xffe066, size: .12, transparent: true, opacity: .9 })); sparks.frustumCulled = false; scene.add(sparks);
for (let i = 0; i < SP; i++) { spVel.push(new THREE.Vector3()); spPos[i * 3 + 1] = -99; }
let spNext = 0;
function burst(p) { for (let n = 0; n < 12; n++) { const i = spNext++ % SP; spPos.set([p.x, p.y, p.z], i * 3); spVel[i].set(Math.random() - .5, Math.random() * .8 + .3, Math.random() - .5).multiplyScalar(5); spLife[i] = .5; } }
let bones = 0, lives = 3, actx = null;
const elB = document.getElementById('bones'), elL = document.getElementById('lives'), toast = document.getElementById('toast');
function beep() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(880, actx.currentTime); o.frequency.exponentialRampToValueAtTime(1760, actx.currentTime + .08); g.gain.setValueAtTime(.06, actx.currentTime); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .15); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + .16); } catch (e) {} }
function showToast(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(showToast.h); showToast.h = setTimeout(() => toast.classList.remove('on'), 1300); }
function collect(b) { b.alive = false; b.t = .25; bones++; burst(b); beep(); if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(15); if (bones % 100 === 0) { lives++; showToast('+1 život!'); if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([40, 40, 80]); } elB.textContent = '🦴 ' + bones; elL.textContent = '❤ ' + lives; }
const bo = new THREE.Object3D();
function updateBones(dt, now) {
  const gp = guru.position;
  bonePts.forEach((b, i) => {
    let s = 1;
    if (b.alive) { const dx = b.x - gp.x, dz = b.z - gp.z, dy = b.y - (gp.y + 1); if (dx * dx + dz * dz < 1.1 && Math.abs(dy) < 1.6) collect(b); }
    else if (b.t > 0) { b.t -= dt; s = 1 + (.25 - b.t) * 6; s *= Math.max(0, b.t / .25); } else s = 0;
    bo.position.set(b.x, b.y + Math.sin(now / 400 + i) * .12 + (b.alive ? 0 : (.25 - b.t) * 3), b.z); bo.rotation.set(0, now / 600 + i, .3); bo.scale.setScalar(s); bo.updateMatrix(); bonesM.setMatrixAt(i, bo.matrix);
  });
  bonesM.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < SP; i++) if (spLife[i] > 0) { spLife[i] -= dt; spVel[i].y -= 9 * dt; spPos[i * 3] += spVel[i].x * dt; spPos[i * 3 + 1] += spVel[i].y * dt; spPos[i * 3 + 2] += spVel[i].z * dt; if (spLife[i] <= 0) spPos[i * 3 + 1] = -99; }
  sparkG.attributes.position.needsUpdate = true;
}
window.__bones = () => ({ bones, lives, total: bonePts.length });

// --- ovládání ---
const keys = {}; addEventListener('keydown', e => keys[e.code] = true); addEventListener('keyup', e => keys[e.code] = false);
const joy = document.getElementById('joy'), knob = document.getElementById('knob'), runB = document.getElementById('run');
let jx = 0, jy = 0, jid = null, runTouch = false;
const jmove = e => { const r = joy.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const m = Math.hypot(dx, dy), max = r.width / 2; if (m > max) { dx *= max / m; dy *= max / m; } jx = dx / max; jy = dy / max; knob.style.transform = `translate(${dx}px,${dy}px)`; };
joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); jmove(e); });
joy.addEventListener('pointermove', e => e.pointerId === jid && jmove(e));
const jend = e => { if (e.pointerId !== jid) return; jid = null; jx = jy = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
runB.addEventListener('pointerdown', e => { if (LEVEL === 2) { runTouch = true; runB.classList.add('on'); runB.setPointerCapture(e.pointerId); return; } runTouch = !runTouch; runB.classList.toggle('on', runTouch); });
['pointerup', 'pointercancel'].forEach(t => runB.addEventListener(t, () => { if (LEVEL === 2) { runTouch = false; runB.classList.remove('on'); } }));
if (LEVEL === 2) runB.textContent = 'Plyn';
const jumpB = document.getElementById('jump'); let jumpTouch = false;
jumpB.addEventListener('pointerdown', e => { jumpTouch = true; jumpB.classList.add('on'); jumpB.setPointerCapture(e.pointerId); });
['pointerup', 'pointercancel'].forEach(t => jumpB.addEventListener(t, () => { jumpTouch = false; jumpB.classList.remove('on'); }));
const over = document.getElementById('over');
function endScreen(title, win) { done = true; document.getElementById('ovT').textContent = title; document.getElementById('ovS').textContent = (LEVEL === 2 ? `Čas: ${fmtT(raceT)}   ·   ` : '') + `Kostičky: ${bones} / ${bonesTotal ?? bonePts.length}   ·   Životy: ${Math.max(0, lives)}`; if (win && LEVEL === 1) document.getElementById('l2btn').style.display = 'inline-block'; over.classList.add('on'); }
let raceT = 0; const fmtT = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor(t * 10 % 10)}`;

// --- smyčka ---
let heading = 0, speed = 0, phase = 0, last = performance.now(), vy = 0, grounded = true, coyote = 0, buffer = 0, jumpHeld = false, falling = false, done = false, checkpoint = 0, squash = 0, idleTurn = 0;
const GRAV = 26, JUMP_V = 9.5;
const holeAt = z => HOLES.some(h => z < h.z0 && z > h.z1);
const camPos = new THREE.Vector3(0, 4, 8), tmp = new THREE.Vector3();
function resize() { const v = window.visualViewport; if (v) { wrap.style.width = v.width + 'px'; wrap.style.height = v.height + 'px'; } const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); visualViewport && visualViewport.addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 300)); resize();
function updateFiskule(dt, now) {
  const gp = guru.position;
  if (fState === 'npc') return;
  if (fState === 'idle') { if (gp.z < -350) { fState = 'approach'; fis.visible = true; fis.position.set(1.2, 0, gp.z - 38); fis.rotation.y = 0; } return; }
  if (fState === 'approach') {
    const dz = gp.z - fis.position.z, dx = gp.x - fis.position.x, d = Math.hypot(dx, dz);
    fis.rotation.y = Math.atan2(dx, dz); fis.position.x += dx / d * 6 * dt; fis.position.z += dz / d * 6 * dt;
    fJump(dt, dx / d, dz / d); animateGuru(F, { dt, now }, fis.position.y > 0 ? 0 : 6, true); holdCompass();
    if (d < 4.5) { fState = 'cut'; cut = true; cutSkip = false; fT = 0; fis.position.y = 0; bubble.innerHTML = 'Ahoj Guru! 🐰 Jsem Fiškule.<br>Kompas ukazuje k Prašné bráně – pojď!<small>ťukni nebo stiskni klávesu</small>'; bubble.classList.add('on'); if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(30); }
    return;
  }
  if (fState === 'cut') {
    fT += dt; const dir = new THREE.Vector3(gp.x - fis.position.x, 0, gp.z - fis.position.z).normalize();
    fis.rotation.y = Math.atan2(dir.x, dir.z);
    // kamera přeletí před Fiškuli
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const camT = tmp.copy(fis.position).addScaledVector(dir, 2.4).addScaledVector(side, 5.2); camT.y = 2.3;
    camPos.lerp(camT, 1 - Math.pow(.05, dt)); camera.position.copy(camPos); camera.lookAt(fis.position.x * .65 + gp.x * .35, 1.4, fis.position.z * .65 + gp.z * .35);
    fis.position.y = Math.abs(Math.sin(fT * 6)) * .35;
    animateGuru(F, { dt, now }, 0, false); F.arms[1].rotation.set(0, 0, 2.6 + Math.sin(fT * 10) * .35); holdCompass();
    guru.rotation.y = Math.atan2(fis.position.x - gp.x, fis.position.z - gp.z); animateGuru(G, { dt, now }, 0, false);
    if ((cutSkip && fT > .6) || fT > 3.5) { cut = false; fState = 'follow'; bubble.classList.remove('on'); fis.position.y = 0; compassEl.classList.add('on'); showToast('Fiškule jde s tebou!'); }
    return;
  }
  // follow: vedle Gurua, kousek za ním
  const sx = Math.cos(heading), sz = -Math.sin(heading);
  const tx = gp.x + sx * 1.7 + Math.sin(heading) * .8, tz = gp.z + sz * 1.7 + Math.cos(heading) * .8;
  let dx = THREE.MathUtils.clamp(tx, -WALK_X, WALK_X) - fis.position.x, dz = tz - fis.position.z; const d = Math.hypot(dx, dz);
  if (d > 18 || fis.position.y < -3) { fis.position.set(gp.x - Math.sin(heading) * -2 + sx, 0, gp.z + Math.cos(heading) * 2); fVy = 0; return; }
  fSpeed = d > .3 ? Math.min(11, d * 3) : 0;
  if (d > .3) { fis.position.x += dx / d * fSpeed * dt; fis.position.z += dz / d * fSpeed * dt; fis.rotation.y += (Math.atan2(dx, dz) - fis.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI > 0 ? Math.min(dt * 8, ((Math.atan2(dx, dz) - fis.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI)) : Math.max(-dt * 8, ((Math.atan2(dx, dz) - fis.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI)); }
  fJump(dt, d > .3 ? dx / d : 0, d > .3 ? dz / d : 0);
  animateGuru(F, { dt, now }, fis.position.y > 0 ? 0 : fSpeed, fSpeed > 5); holdCompass();
  if (fis.position.y > 0) { F.legs[0].rotation.x = -.8; F.legs[1].rotation.x = .4; }
}
function holdCompass() { F.arms[0].rotation.set(-1.1, 0, -.35); if (F.compass) F.compass.needle.rotation.z = Math.atan2(0 - fis.position.x, -LEN - fis.position.z) - fis.rotation.y; }
function fJump(dt, mx, mz) {
  const p = fis.position, grounded = p.y <= 0 && !holeAt(p.z);
  if (grounded) { p.y = 0; fVy = 0; if (holeAt(p.z + mz * 1.4) && Math.abs(mz) > .2) fVy = 10; }
  if (!grounded || fVy > 0) { fVy -= GRAV * dt; p.y += fVy * dt; if (p.y < 0 && !holeAt(p.z)) { p.y = 0; fVy = 0; } }
}
window.__tp = z => { guru.position.set(0, 0, z); checkpoint = Math.min(checkpoint, z + 1); camPos.set(0, 4, z + 8); };
window.__fis = () => ({ state: fState, x: fis.position.x, y: fis.position.y, z: fis.position.z, cut });

// --- holubi útočníci ---
const birds = [];
for (let i = 0; i < 4; i++) { const b = buildBird(); b.state = 'off'; b.root.visible = false; b.a = i * 1.6; scene.add(b.root); birds.push(b); }
const markGeo = new THREE.RingGeometry(.55, .8, 24).rotateX(-Math.PI / 2);
birds.forEach(b => { b.mark = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial({ color: 0xd62828, transparent: true, opacity: .8, depthWrite: false })); b.mark.visible = false; scene.add(b.mark);
  b.shadow = new THREE.Mesh(new THREE.CircleGeometry(.5, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .45, depthWrite: false })); b.shadow.visible = false; scene.add(b.shadow); });
let birdTimer = 4, invul = 0;
const S0 = new THREE.Vector3(), T0 = new THREE.Vector3(), E0 = new THREE.Vector3(), V0 = new THREE.Vector3();
function squawk() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(380, t + .25); g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g).connect(actx.destination); o.start(); o.stop(t + .32); } catch (e) {} }
function startDive(b) {
  const gp = guru.position; b.state = 'tele'; b.t = 0; b.T = new THREE.Vector3(gp.x, .9, gp.z); if (LEVEL === 2) { b.T.x += -Math.sin(heading) * speed * 1.75; b.T.z += -Math.cos(heading) * speed * 1.75; b.T.x = THREE.MathUtils.clamp(b.T.x, -WALK_X, WALK_X); }
  b.mark.position.set(gp.x, .04, gp.z); b.mark.visible = true; squawk();
}
window.__forceDive = () => { const b = birds.find(b => b.state === 'circle' || b.state === 'off'); if (!b) return false; if (b.state === 'off') { b.state = 'circle'; b.root.visible = true; } placeCircle(b, 0); startDive(b); return true; };
function placeCircle(b, now) { const gp = guru.position; b.a += .016; b.root.position.set(Math.sin(b.a) * 5, 6.5 + Math.sin(b.a * 2) * .6, gp.z + (LEVEL === 2 ? 22 : -12) + Math.cos(b.a) * 5); b.root.rotation.y = b.a + Math.PI / 2; }
function updateBirds(dt, now) {
  const gp = guru.position, prog = Math.min(1, Math.max(0, (-gp.z - 120) / (LEN - 120)));
  const active = (LEVEL === 2 ? gp.z > -LEN + 164 && gp.z < -40 : gp.z < -120 && gp.z > -LEN + 30) && !cut && fState !== 'cut' && !done;
  birds.forEach((b, i) => { if (i < 2 + Math.round(prog * 2) && active && b.state === 'off') { b.state = 'circle'; b.root.visible = true; } });
  const attacking = birds.filter(b => b.state === 'tele' || b.state === 'dive').length;
  birdTimer -= dt; if (window.__noAuto) birdTimer = 99;
  if (active && birdTimer <= 0 && attacking < 2) { const c = birds.filter(b => b.state === 'circle'); if (c.length) startDive(c[(Math.random() * c.length) | 0]); birdTimer = THREE.MathUtils.lerp(6.5, 2.2, prog) + Math.random() * 1.5; }
  invul -= dt; if (invul > 0) guru.visible = Math.floor(invul * 12) % 2 === 0; else guru.visible = true;
  for (const b of birds) {
    if (b.state === 'off') continue;
    b.shadow.visible = false;
    if (b.state === 'circle') { placeCircle(b, now); flap(b, now / 1000 + b.a, 'fly'); continue; }
    b.t += dt;
    if (b.state === 'tele') {
      b.root.position.y += Math.sin(b.t * 40) * .01; b.root.lookAt(b.T); flap(b, b.t, 'tele');
      b.mark.scale.setScalar(1 + Math.sin(b.t * 18) * .15); b.mark.material.opacity = .5 + b.t * .4;
      if (b.t >= 1) { b.state = 'dive'; b.t = 0; b.S = b.root.position.clone(); const h = V0.copy(b.T).sub(b.S); h.y = 0; h.normalize(); b.E = b.T.clone().addScaledVector(h, 12); b.E.y = 12; }
      continue;
    }
    if (b.state === 'dive') {
      flap(b, b.t, 'dive'); const prev = b.root.position.clone();
      if (b.t < .75) b.root.position.lerpVectors(b.S, b.T, b.t / .75); else b.root.position.lerpVectors(b.T, b.E, Math.min(1, (b.t - .75) / 1.1));
      b.root.lookAt(V0.copy(b.root.position).add(b.root.position.clone().sub(prev)));
      b.shadow.visible = true; b.shadow.position.set(b.root.position.x, .03, b.root.position.z);
      if (b.t > .75) b.mark.visible = false;
      const dx = b.root.position.x - gp.x, dy = b.root.position.y - (gp.y + 1.1), dz = b.root.position.z - gp.z;
      if (invul <= 0 && dx * dx + dy * dy + dz * dz < 1.0 && !done) birdHit(b, prev);
      if (b.t > 1.85) { b.state = 'circle'; b.mark.visible = false; }
    }
  }
}
function birdHit(b, prev) {
  lives--; elL.textContent = '❤ ' + Math.max(0, lives); invul = 1.6; if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([60, 30, 120]); squawk();
  const k = V0.copy(b.root.position).sub(prev); k.y = 0; k.normalize(); knock.copy(k).multiplyScalar(7); vy = 5; grounded = false; showToast('Au! -1 život');
  if (lives <= 0) endScreen('Konec hry – holubi vyhráli');
}
const knock = new THREE.Vector3();
window.__birds = () => birds.map(b => b.state);

function tick(now) {
  if (done) { renderer.render(scene, camera); return requestAnimationFrame(tick); }
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (cut) { if (sState === 'cut') updateSiki(dt, now); else updateFiskule(dt, now); updateBones(dt, now); renderer.render(scene, camera); return requestAnimationFrame(tick); }
  let fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - jy;
  let turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - jx;
  fwd = THREE.MathUtils.clamp(fwd, -1, 1); turn = THREE.MathUtils.clamp(turn, -1, 1);
  if (Math.abs(fwd) < .15) fwd = 0; if (Math.abs(turn) < .15) turn = 0;
  const running = keys.ShiftLeft || keys.ShiftRight || runTouch;
  heading += turn * 2.4 * dt;
  const target = fwd * (fwd > 0 ? (running ? 9 : 4) : 2.5);
  speed += (target - speed) * Math.min(1, dt * 8);
  const lookCam = grounded && !falling && Math.abs(speed) < .35 && Math.abs(fwd) < .15;
  idleTurn += ((lookCam ? 1 : 0) - idleTurn) * Math.min(1, dt * (lookCam ? 2.4 : 4.5));
  const travelYaw = heading + Math.PI;
  const camYaw = heading; // kamera je za zády ve směru heading
  let dYaw = (camYaw - travelYaw) % (Math.PI * 2);
  if (dYaw > Math.PI) dYaw -= Math.PI * 2;
  if (dYaw < -Math.PI) dYaw += Math.PI * 2;
  guru.rotation.y = travelYaw + dYaw * idleTurn;
  guru.position.x += -Math.sin(heading) * speed * dt; guru.position.z += -Math.cos(heading) * speed * dt;
  guru.position.x = THREE.MathUtils.clamp(guru.position.x, -HALF_W - 3.2, HALF_W + 3.2);
  guru.position.z = THREE.MathUtils.clamp(guru.position.z, -LEN + 2, 8);
  if (falling) guru.position.x = THREE.MathUtils.clamp(guru.position.x, -WALK_X, WALK_X);
  // skok: coyote time + buffer
  const jp = keys.Space || jumpTouch;
  if (jp && !jumpHeld) buffer = .15; jumpHeld = jp; buffer -= dt; coyote -= dt;
  if (buffer > 0 && (grounded || coyote > 0) && !falling) { vy = JUMP_V; grounded = false; coyote = 0; buffer = 0; squash = -1; }
  if (!jp && vy > 3) vy -= GRAV * 1.2 * dt; // krátký skok při puštění
  vy -= GRAV * dt; guru.position.y += vy * dt;
  const overPit = holeAt(guru.position.z);
  if (guru.position.y <= 0 && !overPit && !falling) { if (!grounded) squash = 1; guru.position.y = 0; vy = 0; grounded = true; coyote = .12; }
  else { if (grounded) coyote = .12; grounded = false; if (overPit && guru.position.y < -.3) falling = true; }
  if (falling) { guru.position.z = THREE.MathUtils.clamp(guru.position.z, HOLES.find(h => guru.position.z < h.z0 + .5 && guru.position.z > h.z1 - .5)?.z1 + .4 ?? -1e9, HOLES.find(h => guru.position.z < h.z0 + .5 && guru.position.z > h.z1 - .5)?.z0 - .4 ?? 1e9); }
  if (guru.position.y < -6 && !done) {
    lives--; elL.textContent = '❤ ' + Math.max(0, lives); if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([80, 40, 120]);
    if (lives <= 0) endScreen('Konec hry'); else { showToast('-1 život'); guru.position.set(0, 0, checkpoint); vy = 0; falling = false; grounded = true; speed = 0; heading = 0; idleTurn = 0; camPos.set(0, 4, checkpoint + 8); }
  }
  for (const c of CHECKS) if (guru.position.z < c - 1 && c < checkpoint && grounded) { checkpoint = c; showToast('Checkpoint ✔'); }
  flags.forEach((f, i) => f.rotation.y = Math.sin(now / 300 + i) * .3);
  updateBones(dt, now);
  updateFiskule(dt, now);
  updateBirds(dt, now);
  updateSiki(dt, now);
  if (knock.lengthSq() > .01) { guru.position.x = THREE.MathUtils.clamp(guru.position.x + knock.x * dt, -WALK_X, WALK_X); guru.position.z += knock.z * dt; knock.multiplyScalar(Math.pow(.02, dt)); }
  if (fState === 'follow') compassEl.style.transform = `rotate(${(-(Math.atan2(0 - guru.position.x, -LEN - guru.position.z) - Math.atan2(-Math.sin(heading), -Math.cos(heading))) * 180 / Math.PI) - 90}deg)`;
  animateGuru(G, { dt, now, lookCam }, grounded ? speed : 0, running);
  if (!grounded) { const up = vy > 0; G.arms.forEach((a, i) => a.rotation.x = up ? -2.6 : -1.6); G.legs[0].rotation.x = up ? -.9 : -.3; G.legs[1].rotation.x = up ? .5 : .2; G.body.rotation.x = up ? -.1 : .15; }
  squash *= Math.pow(.0005, dt); const q = squash > 0 ? squash * .25 : squash * .18;
  guru.scale.set(1 + q, 1 - q * 1.4, 1 + q);
  // kamera za Guruem
  const back = new THREE.Vector3(Math.sin(heading) * 6.5, 3.6, Math.cos(heading) * 6.5);
  camPos.lerp(tmp.copy(guru.position).add(back), 1 - Math.pow(.02, dt));
  camera.position.copy(camPos); camera.lookAt(guru.position.x, guru.position.y + 1.8, guru.position.z);
  sun.position.set(guru.position.x + 12, 25, guru.position.z + 8); sun.target.position.copy(guru.position);
  renderer.render(scene, camera); requestAnimationFrame(tick);
  window.__st = { x: guru.position.x, y: guru.position.y, z: guru.position.z, lives, grounded, falling, checkpoint, done };
}
if (LEVEL === 1) requestAnimationFrame(tick);
window.__guru = guru;

// ================= LEVEL 2: SIKI na motorce =================
let bonesTotal = null; let B = null, obs = [], wobble = 0, finishT = -1, eng = null;
function startLevel2() {
  flags.forEach(f => f.parent.visible = false); siki.visible = false;
  B = buildMotorbike(); scene.add(B.root); guru = B.root;
  guru.position.set(0, 0, -LEN + 14); heading = Math.PI; camPos.set(0, 4, -LEN + 5);
  G.root.position.set(-1.8, 0, 3); G.root.rotation.y = Math.PI; fis.visible = true; fis.position.set(1.8, 0, 3); fis.rotation.y = Math.PI;
  document.querySelector('#hud').firstChild.textContent = '';
  buildObstacles();
  bonePts.forEach(b => { if (obs.some(o => Math.abs(b.x - o.x) < o.hw + .3 && Math.abs(b.z - o.z) < o.hd + .3)) { b.alive = false; b.t = 0; } });
  bonesTotal = bonePts.filter(b => b.alive).length;
  showToast('Level 2: SIKI jede zpátky na start! 🏍️');
  requestAnimationFrame(tick2);
}
function stripeTex(a, b) { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 128, 32); x.fillStyle = b; for (let i = -2; i < 9; i++) { x.beginPath(); x.moveTo(i * 16, 32); x.lineTo(i * 16 + 8, 32); x.lineTo(i * 16 + 24, 0); x.lineTo(i * 16 + 16, 0); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildObstacles() {
  const W = WALK_X - .4, list = { cone: [], barrel: [], barrier: [], stall: [], sign: [] };
  const add = (type, x, z) => { const d = { cone: [.3, .3, .75], barrel: [.38, .38, 1], barrier: [1.2, .2, 1], stall: [1.4, .9, 2.3], sign: [.35, .2, 2.4] }[type]; obs.push({ type, x, z, hw: d[0], hd: d[1], h: d[2] }); list[type].push([x, z]); };
  // vzdálenost od startu s: 0–180 m volno (~10 s plného plynu), pak postupně těžší vzory
  const S0 = -LEN + 14, SEND = LEN - 30, order = ['single', 'single', 'single', 'wall', 'wall', 'stall', 'stall', 'slalom', 'slalom', 'zigzag', 'zigzag', 'double'];
  const mix = ['wall', 'stall', 'slalom', 'zigzag', 'double'];
  const spacing = d => d < SEND * 2 / 3 ? 55 : THREE.MathUtils.lerp(55, 15, (d - SEND * 2 / 3) / (SEND / 3));
  let d = 180, k = 0;
  while (d < SEND) {
    const z = S0 + d, side = k % 2 ? 1 : -1, pat = k < order.length ? order[k] : mix[k % mix.length];
    const gap = THREE.MathUtils.lerp(5.2, 3.2, d / SEND); let len = 0;
    if (pat === 'single') add(k % 2 ? 'barrel' : 'cone', side * 2.5, z);
    else if (pat === 'wall') { const gx = side * (W - gap / 2 - .3); for (let x = -W; x <= W; x += 1.15) if (Math.abs(x - gx) > gap / 2 + .3) add(Math.round(x) % 2 ? 'barrel' : 'cone', x, z); }
    else if (pat === 'stall') { add('stall', side * (W - 1.4), z); add('barrier', side * (W - 4.2), z); if (gap < 4.6) add('barrier', side * (W - 6.6), z); add('sign', -side * (W - .5), z + 3); }
    else if (pat === 'slalom') { const n = d < SEND * 2 / 3 ? 2 : 4; for (let i = 0; i < n; i++) { const sd = (i % 2 ? 1 : -1) * side; for (let x = 0; x <= W; x += .9) if (x >= gap - 2.4) add('cone', sd * (x - .6), z + i * 9); } len = (n - 1) * 9; }
    else if (pat === 'zigzag') { const g = gap + 1; [[-1, 0], [1, 10]].forEach(([sd, dz]) => { for (let x = W - 1.2; x > -W + g; x -= 2.4) add('barrier', sd * x * -1 * -1 * (sd < 0 ? 1 : 1) * 1, z + dz); }); len = 10; }
    else { for (let x = gap / 2 + .4; x <= W; x += 1.2) { add('barrel', x, z); add('barrel', -x, z + 6); } add('sign', 0, z + 12); len = 12; }
    d += len + spacing(d); k++;
  }
  const o3 = new THREE.Object3D();
  const inst = (geo, mat, arr, y, sx = 1) => { if (!arr.length) return; const m = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach(([x, z], i) => { o3.position.set(x, y, z); o3.rotation.set(0, 0, 0); o3.scale.setScalar(sx); o3.updateMatrix(); m.setMatrixAt(i, o3.matrix); }); m.castShadow = true; scene.add(m); };
  inst(new THREE.ConeGeometry(.28, .75, 12), M(0xff6a13), list.cone, .375);
  inst(new THREE.CylinderGeometry(.29, .29, .12, 12), M(0xffffff), list.cone, .4, 1);
  inst(new THREE.CylinderGeometry(.36, .36, .95, 14), M(0x2f5fa8), list.barrel, .475);
  inst(new THREE.TorusGeometry(.36, .03, 6, 16).rotateX(Math.PI / 2), M(0xdddddd), list.barrel, .7);
  inst(new THREE.BoxGeometry(2.4, .35, .15), new THREE.MeshStandardMaterial({ map: stripeTex('#d62828', '#ffffff') }), list.barrier, .75);
  inst(new THREE.BoxGeometry(.1, .75, .3), M(0x444444), list.barrier, .38);
  inst(new THREE.BoxGeometry(2.6, 1.1, 1.6), M(0x9a6b3e), list.stall, .55);
  inst(new THREE.BoxGeometry(2.9, .12, 1.9), new THREE.MeshStandardMaterial({ map: stripeTex('#2e7d32', '#f5f0e0') }), list.stall, 2.2);
  inst(new THREE.CylinderGeometry(.05, .05, 2.2, 6), M(0x777777), list.stall.map(([x, z]) => [x - 1.3, z + .8]), 1.1); inst(new THREE.CylinderGeometry(.05, .05, 2.2, 6), M(0x777777), list.stall.map(([x, z]) => [x + 1.3, z + .8]), 1.1);
  inst(new THREE.CylinderGeometry(.05, .05, 2.4, 6), M(0x555555), list.sign, 1.2);
  inst(new THREE.BoxGeometry(.6, .45, .05), M(0xf2c200), list.sign, 2.2);
  inst(new THREE.BoxGeometry(.4, .14, .06), M(0xc0282d), list.sign, 2.25);
}
function engineSound() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); if (eng) return; const o = actx.createOscillator(), o2 = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = .035; o.connect(f); o2.connect(f); f.connect(g).connect(actx.destination); o.start(); o2.start(); eng = { o, o2, g }; } catch (e) {} }
addEventListener('pointerdown', () => { if (LEVEL === 2) engineSound(); }); addEventListener('keydown', () => { if (LEVEL === 2) engineSound(); });
function hitObs(o) {
  lives--; elL.textContent = '❤ ' + Math.max(0, lives); invul = 1.6; wobble = 1; speed *= .3; if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([70, 30, 120]); showToast('Bum! -1 život');
  guru.position.x += Math.sign(guru.position.x - o.x || 1) * .5; if (lives <= 0) endScreen('Konec hry – SIKI to nedal');
}
let hopHeld = false;
function tick2(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (done) { if (eng) eng.g.gain.value = 0; renderer.render(scene, camera); return requestAnimationFrame(tick2); }
  const gp = guru.position;
  if (finishT < 0) raceT += dt; document.getElementById('timer').textContent = '⏱ ' + fmtT(raceT);
  const thr = finishT < 0 && (keys.KeyW || keys.ArrowUp || runTouch || jy < -.4), brk = keys.KeyS || keys.ArrowDown || jy > .5 || finishT >= 0;
  let turn = THREE.MathUtils.clamp((keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - jx, -1, 1); if (Math.abs(turn) < .12) turn = 0;
  speed += (thr ? 10 : brk ? -16 : -3) * dt; speed = THREE.MathUtils.clamp(speed, 0, 22);
  heading += turn * 1.7 * dt * Math.min(1, speed / 5 + .2);
  if (!turn) heading += (Math.PI - heading) * Math.min(1, dt * 1.2); // samostředění
  heading = THREE.MathUtils.clamp(heading, Math.PI - .7, Math.PI + .7);
  gp.x += -Math.sin(heading) * speed * dt; gp.z += -Math.cos(heading) * speed * dt;
  gp.x = THREE.MathUtils.clamp(gp.x, -WALK_X + .3, WALK_X - .3); gp.z = Math.min(gp.z, 6);
  const jp = keys.Space || jumpTouch; if (jp && !hopHeld && grounded) { vy = 6.5; grounded = false; } hopHeld = jp;
  vy -= GRAV * dt; gp.y += vy * dt; if (gp.y <= 0) { if (!grounded) B.bob.position.y = -.08; gp.y = 0; vy = 0; grounded = true; }
  if (knock.lengthSq() > .01) { gp.x = THREE.MathUtils.clamp(gp.x + knock.x * dt, -WALK_X, WALK_X); gp.z += knock.z * dt; knock.multiplyScalar(Math.pow(.02, dt)); }
  // vzhled motorky
  guru.rotation.y = heading + Math.PI; wobble = Math.max(0, wobble - dt * 1.2);
  B.lean.rotation.z += ((turn * .38 * Math.min(1, speed / 8)) + Math.sin(now / 50) * .25 * wobble - B.lean.rotation.z) * Math.min(1, dt * 6);
  B.bob.position.y += (Math.sin(now / 45) * .012 * Math.min(1, speed / 10) - B.bob.position.y) * Math.min(1, dt * 8);
  B.front.spin.rotation.x += speed * dt / B.R; B.rear.spin.rotation.x += speed * dt / B.R;
  B.rider.head.rotation.y = -turn * .25; B.rider.tail.rotation.y = Math.sin(now / 200) * .15;
  // překážky
  if (invul <= 0 && gp.y < 1) for (const o of obs) { if (Math.abs(gp.x - o.x) < o.hw + .3 && Math.abs(gp.z - o.z) < o.hd + .8 && gp.y < o.h) { hitObs(o); break; } }
  updateBones(dt, now); updateBirds(dt, now);
  // cíl – Guru a Fiškule fandí
  if (gp.z > -70) [[G, G.root], [F, fis]].forEach(([m, r], i) => { r.position.y = Math.abs(Math.sin(now / 180 + i)) * .45; m.arms.forEach((a, j) => a.rotation.set(0, 0, (j ? 1 : -1) * (2.6 + Math.sin(now / 120 + j) * .3))); r.rotation.y = Math.atan2(gp.x - r.position.x, gp.z - r.position.z); });
  if (gp.z > -4 && finishT < 0) { finishT = 0; showToast('Cíl! 🏁'); }
  if (finishT >= 0) { finishT += dt; if (finishT > 1.8) endScreen('Cíl! SIKI dojel na start 🏍️', true); }
  // kamera
  const back = tmp.set(Math.sin(heading) * 6.2, 2.9, Math.cos(heading) * 6.2).add(gp);
  camPos.lerp(back, 1 - Math.pow(.01, dt)); camera.position.copy(camPos); camera.lookAt(gp.x, gp.y + 1.5, gp.z + 3);
  camera.fov += (58 + speed * 1.1 - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
  sun.position.set(gp.x + 12, 25, gp.z + 8); sun.target.position.copy(gp);
  if (eng) { const f = 45 + speed * 7; eng.o.frequency.value = f; eng.o2.frequency.value = f * .5; }
  renderer.render(scene, camera);
  window.__obs = obs; window.__l2 = { x: gp.x, z: gp.z, speed, lives, done, obs: obs.length, raceT };
  requestAnimationFrame(tick2);
}
if (LEVEL === 2) startLevel2();
