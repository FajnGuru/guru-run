// Level 4 — tunnel time trial. Reuses buildMotorbike(false); does not alter L1–L3.
import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/jsm/loaders/GLTFLoader.js';

export const L4_LEN = 1500;
export const L4_HALF = 5;
const MIN_LANE = 3.6;
const SEAT = new THREE.Vector3(0, 1.1, -0.06);
const GRIP_L = new THREE.Vector3(-0.36, 1.184, 0.527);
const GRIP_R = new THREE.Vector3(0.36, 1.184, 0.527);
const PEG_L = new THREE.Vector3(-0.25, 0.42, 0.1);
const PEG_R = new THREE.Vector3(0.25, 0.42, 0.1);
const KEY_CHAR = 'guru-run-l4-char';
const KEY_NAME = 'guru-run-l4-name';
const KEY_B64 = 'guru-run-l4-glb';
const BUNDLED = '../assets/zajecice.glb';

export function classifyJoint(name) {
  const raw = String(name || '').toLowerCase();
  if (!raw) return null;
  const n = raw.replace(/[^a-z0-9]+/g, '');
  let side = null;
  if (raw.includes('left') || /(^|[._-])l($|[._-])/.test(raw)) side = 'L';
  else if (raw.includes('right') || /(^|[._-])r($|[._-])/.test(raw)) side = 'R';
  let core = n;
  if (side === 'L') core = core.replace(/left/g, '').replace(/l$/, '');
  else if (side === 'R') core = core.replace(/right/g, '').replace(/r$/, '');
  let kind = null;
  if (core.includes('forearm') || core.includes('lowerarm')) kind = 'forearm';
  else if (core.includes('calf') || core.includes('shin') || core.includes('lowerleg')) kind = 'calf';
  else if (core.includes('thigh') || core.includes('upperleg') || core.includes('upleg')) kind = 'thigh';
  else if (core === 'leg' || core.endsWith('leg')) kind = 'thigh';
  else if (core.includes('shoulder') || core.includes('upperarm')) kind = 'shoulder';
  else if (core.endsWith('arm')) kind = 'shoulder';
  else if (core.endsWith('hand') || core.includes('wrist')) kind = 'hand';
  else if (core.endsWith('foot') || core.includes('ankle')) kind = 'foot';
  else if (core.includes('pelvis') || core === 'hip' || core === 'hips' || core.endsWith('hips')) kind = 'pelvis';
  else if (core === 'head' || core.endsWith('head')) kind = 'head';
  else if (core.includes('spine')) kind = 'spine';
  return kind ? { kind, side, name: raw } : null;
}

export function findClip(anims, names) {
  const wants = names.map((n) => n.toLowerCase());
  return (anims || []).find((a) => wants.includes(a.name.toLowerCase())) || null;
}

export function layoutObstacles(len, half, rng) {
  const obs = [];
  const U = half - 0.15;
  let z = 52;
  const dims = {
    cone: { hw: 0.34, hd: 0.34, h: 0.72 },
    box: { hw: 0.42, hd: 0.42, h: 0.5 },
    barrier: { hw: 1.15, hd: 0.2, h: 0.46 },
    puddle: { hw: 0.9, hd: 0.7, h: 0.22 },
  };
  const types = ['cone', 'box', 'barrier', 'puddle'];
  while (z < len - 28) {
    const t = z / len;
    const step = THREE.MathUtils.lerp(28, 14, t) * (0.85 + rng() * 0.45);
    const type = types[(rng() * types.length) | 0];
    const dim = dims[type];
    const clearOnRight = rng() < 0.5;
    const clearInner = clearOnRight ? U - MIN_LANE : -U + MIN_LANE;
    const lo = clearOnRight ? -U + dim.hw : clearInner + dim.hw;
    const hi = clearOnRight ? clearInner - dim.hw : U - dim.hw;
    if (hi > lo + 0.02) obs.push({ type, x: lo + rng() * (hi - lo), z, ...dim, hit: false });
    z += step;
  }
  return obs;
}

/** Widest free interval on the roadway [-half, half] near z. */
export function clearLaneAt(obs, z, half) {
  const blocks = [];
  for (const o of obs) {
    if (Math.abs(o.z - z) > o.hd + 0.35) continue;
    const a = Math.max(-half, o.x - o.hw);
    const b = Math.min(half, o.x + o.hw);
    if (b > a) blocks.push([a, b]);
  }
  blocks.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [a, b] of blocks) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  let cursor = -half, best = 0, lo = -half;
  for (const [a, b] of merged) {
    if (a - cursor > best) { best = a - cursor; lo = cursor; }
    cursor = Math.max(cursor, b);
  }
  if (half - cursor > best) { best = half - cursor; lo = cursor; }
  return { gap: best, center: lo + best / 2 };
}

function dominantAxis(v, out) {
  const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
  if (ay >= ax && ay >= az) return out.set(0, Math.sign(v.y) || -1, 0);
  if (ax >= az) return out.set(Math.sign(v.x) || 1, 0, 0);
  return out.set(0, 0, Math.sign(v.z) || 1);
}

function solveLimb(upper, lower, end, targetW, poleW) {
  const a = lower.position.length() || 0.001;
  const b = end.position.length() || 0.001;
  const axisU = new THREE.Vector3();
  const axisL = new THREE.Vector3();
  dominantAxis(lower.position, axisU);
  dominantAxis(end.position, axisL);
  upper.parent.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(upper.parent.matrixWorld).invert();
  const hipW = new THREE.Vector3();
  upper.getWorldPosition(hipW);
  const hipL = hipW.clone().applyMatrix4(inv);
  const targetL = targetW.clone().applyMatrix4(inv);
  const toT = targetL.clone().sub(hipL);
  let d = toT.length();
  if (d < 1e-5) return;
  const max = a + b - 1e-4;
  const min = Math.abs(a - b) + 1e-4;
  if (d > max) toT.multiplyScalar(max / d);
  else if (d < min) toT.multiplyScalar(min / d);
  d = toT.length();
  const dirN = toT.clone().multiplyScalar(1 / d);
  const poleL = poleW.clone().applyMatrix4(inv).sub(hipL);
  const bend = poleL.sub(dirN.clone().multiplyScalar(poleL.dot(dirN)));
  if (bend.lengthSq() < 1e-8) bend.set(1, 0, 0).addScaledVector(dirN, -dirN.x);
  if (bend.lengthSq() < 1e-8) bend.set(0, 0, 1);
  bend.normalize();
  const cosHip = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
  const hipAng = Math.acos(cosHip);
  const kneeL = hipL.clone().addScaledVector(dirN, Math.cos(hipAng) * a).addScaledVector(bend, Math.sin(hipAng) * a);
  const upperDir = kneeL.clone().sub(hipL).normalize();
  const qAlign = new THREE.Quaternion().setFromUnitVectors(axisU, upperDir);
  const side = Math.abs(axisU.z) > 0.85 || Math.abs(axisU.y) < 0.2 && Math.abs(axisU.z) > Math.abs(axisU.x)
    ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  if (Math.abs(axisU.dot(side)) > 0.9) side.set(1, 0, 0);
  const sideW = side.clone().applyQuaternion(qAlign);
  const project = (v) => {
    const o = v.clone().addScaledVector(upperDir, -v.dot(upperDir));
    return o.lengthSq() < 1e-8 ? null : o.normalize();
  };
  const sw = project(sideW);
  const bw = project(bend);
  const qTwist = new THREE.Quaternion();
  if (sw && bw) qTwist.setFromUnitVectors(sw, bw);
  upper.quaternion.copy(qTwist.multiply(qAlign));
  upper.updateMatrixWorld(true);
  const invU = new THREE.Matrix4().copy(upper.matrixWorld).invert();
  const tgtW = hipL.clone().add(toT).applyMatrix4(upper.parent.matrixWorld);
  const tgtU = tgtW.applyMatrix4(invU);
  const aim = tgtU.sub(lower.position);
  if (aim.lengthSq() < 1e-8) return;
  aim.normalize();
  lower.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(axisL, aim));
}

function captureBind(root) {
  root.traverse((o) => {
    o.userData._bind = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
  });
}
function restoreBind(root) {
  root.traverse((o) => {
    const b = o.userData._bind;
    if (!b) return;
    o.position.copy(b.p);
    o.quaternion.copy(b.q);
    o.scale.copy(b.s);
  });
}

function indexRig(root) {
  const bag = { thigh: {}, calf: {}, shoulder: {}, forearm: {}, hand: {}, foot: {}, pelvis: [], head: [], spine: [] };
  root.traverse((o) => {
    const c = classifyJoint(o.name);
    if (!c) return;
    if (c.kind === 'pelvis' || c.kind === 'head' || c.kind === 'spine') bag[c.kind].push(o);
    else if (c.side) bag[c.kind][c.side] = bag[c.kind][c.side] || o;
  });
  return bag;
}

function childEnd(joint, kind) {
  let found = null;
  joint.traverse((o) => {
    if (found || o === joint) return;
    const c = classifyJoint(o.name);
    if (c && c.kind === kind) found = o;
  });
  if (found) return found;
  const tip = new THREE.Object3D();
  tip.name = kind === 'hand' ? 'Hand_tip' : 'Foot_tip';
  tip.position.set(0, -0.22, 0.02);
  joint.add(tip);
  return tip;
}

function pickSpine(list) {
  if (!list.length) return null;
  return list.find((s) => /upper/i.test(s.name)) || list[list.length - 1];
}

export function prepareRider(gltf) {
  const scene = gltf.scene;
  captureBind(scene);
  const bag = indexRig(scene);
  const pelvis = bag.pelvis[0] || scene;
  const head = bag.head[0] || null;
  const spine = pickSpine(bag.spine);
  const limbs = [];
  for (const side of ['L', 'R']) {
    if (bag.thigh[side] && bag.calf[side]) {
      limbs.push({ kind: 'leg', side, upper: bag.thigh[side], lower: bag.calf[side], end: childEnd(bag.calf[side], 'foot') });
    }
    if (bag.shoulder[side] && bag.forearm[side]) {
      limbs.push({ kind: 'arm', side, upper: bag.shoulder[side], lower: bag.forearm[side], end: childEnd(bag.forearm[side], 'hand') });
    }
  }
  const poseKind = limbs.length ? 'ik' : 'place';
  const mixer = new THREE.AnimationMixer(scene);
  const jumpClip = findClip(gltf.animations, ['dynamicky_drep_s_vyskokem', 'jump']);
  const crouchClip = findClip(gltf.animations, ['drep', 'crouch', 'squat']);
  const idleClip = findClip(gltf.animations, ['idle']);
  let jumpAction = null;
  if (jumpClip) {
    jumpAction = mixer.clipAction(jumpClip);
    jumpAction.setLoop(THREE.LoopOnce, 1);
    jumpAction.clampWhenFinished = true;
  }
  const rider = {
    scene, mixer, pelvis, head, spine, limbs,
    poseKind: poseKind === 'ik' ? 'ik' : (crouchClip ? 'crouch' : 'place'),
    jumpAction, jumpName: jumpClip ? jumpClip.name : null,
    crouchClip, idleClip, mode: 'ride', mount: null, base: new THREE.Vector3(),
  };
  mixer.addEventListener('finished', (e) => {
    if (e.action !== jumpAction) return;
    rider.mode = 'ride';
    jumpAction.stop();
  });
  return rider;
}

function facingYaw(scene, pelvis, head) {
  if (!head) return 0;
  scene.updateMatrixWorld(true);
  const h = new THREE.Vector3();
  const p = new THREE.Vector3();
  head.getWorldPosition(h);
  pelvis.getWorldPosition(p);
  return (h.z - p.z) < -0.02 ? Math.PI : 0;
}

export function seatOnBike(rider, bob, anchors) {
  const mount = new THREE.Group();
  mount.name = 'l4-rider';
  bob.add(mount);
  rider.mount = mount;
  const scene = rider.scene;
  scene.rotation.set(0, 0, 0);
  scene.position.set(0, 0, 0);
  scene.scale.set(1, 1, 1);
  restoreBind(scene);
  scene.updateMatrixWorld(true);
  const yaw = facingYaw(scene, rider.pelvis, rider.head);
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const scale = THREE.MathUtils.clamp(
    Math.min(1.65 / Math.max(size.y, 0.001), 0.95 / Math.max(size.x, size.z, 0.001)),
    0.15, 2.4,
  );
  mount.scale.setScalar(scale);
  mount.rotation.y = yaw;
  const pelvisL = new THREE.Vector3();
  rider.pelvis.getWorldPosition(pelvisL);
  pelvisL.multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  mount.position.set(SEAT.x - pelvisL.x, SEAT.y - pelvisL.y, SEAT.z - pelvisL.z);
  rider.base.copy(mount.position);
  mount.add(scene);
  rider.anchors = anchors;
  rider.scale = scale;
  if (rider.poseKind === 'crouch' && rider.crouchClip) {
    const act = rider.mixer.clipAction(rider.crouchClip);
    act.play();
    rider.mixer.setTime(rider.crouchClip.duration * 0.5);
    rider.mixer.update(0);
    act.paused = true;
    rider.crouchAction = act;
    rider.crouchMid = rider.crouchClip.duration * 0.5;
  }
  applyRidePose(rider, 0);
  scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = true; } });
  return mount;
}

function anchorWorld(obj, out) {
  obj.getWorldPosition(out);
  return out;
}

export function applyRidePose(rider, lean) {
  if (!rider || rider.mode === 'jump') return;
  const scene = rider.scene;
  if (rider.mount) rider.mount.updateWorldMatrix(true, false);
  if (rider.poseKind === 'place') { restoreBind(scene); return; }
  if (rider.poseKind === 'crouch') {
    restoreBind(scene);
    if (rider.crouchAction) {
      rider.crouchAction.play();
      rider.crouchAction.paused = true;
      rider.mixer.setTime(rider.crouchMid || 0);
      rider.mixer.update(0);
    }
    return;
  }
  restoreBind(scene);
  if (rider.spine) {
    const extra = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.62, 0, -lean * 0.55, 'XYZ'));
    rider.spine.quaternion.copy(rider.spine.userData._bind.q).multiply(extra);
  }
  if (rider.head) {
    const extra = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.22, -lean * 0.35, 0, 'XYZ'));
    rider.head.quaternion.copy(rider.head.userData._bind.q).multiply(extra);
  }
  scene.updateMatrixWorld(true);
  const anchors = rider.anchors;
  if (!anchors) return;
  const fwd = new THREE.Vector3(0, 0, 1).transformDirection(anchors.bob.matrixWorld);
  const up = new THREE.Vector3(0, 1, 0).transformDirection(anchors.bob.matrixWorld);
  const side = new THREE.Vector3(1, 0, 0).transformDirection(anchors.bob.matrixWorld);
  for (const limb of rider.limbs) {
    const sign = limb.side === 'R' ? 1 : -1;
    const hip = new THREE.Vector3();
    limb.upper.getWorldPosition(hip);
    const target = new THREE.Vector3();
    anchorWorld(limb.kind === 'leg' ? (sign < 0 ? anchors.pegL : anchors.pegR) : (sign < 0 ? anchors.gripL : anchors.gripR), target);
    const pole = hip.clone();
    if (limb.kind === 'leg') pole.addScaledVector(fwd, 0.85).addScaledVector(up, 0.05).addScaledVector(side, sign * 0.12);
    else pole.addScaledVector(up, -0.75).addScaledVector(side, sign * 0.35).addScaledVector(fwd, 0.25);
    solveLimb(limb.upper, limb.lower, limb.end, target, pole);
    scene.updateMatrixWorld(true);
  }
}

export function triggerRiderHop(rider) {
  if (!rider?.jumpAction || rider.mode === 'jump') return false;
  rider.mode = 'jump';
  rider.jumpAction.reset();
  rider.jumpAction.setLoop(THREE.LoopOnce, 1);
  rider.jumpAction.clampWhenFinished = true;
  rider.jumpAction.enabled = true;
  rider.jumpAction.play();
  return true;
}

export function updateRider(rider, dt, now, lean) {
  if (!rider) return;
  if (rider.mount) {
    const bobY = Math.sin(now / 190) * 0.014 + Math.sin(now / 70) * 0.004;
    rider.mount.position.y = rider.base.y + bobY;
    rider.mount.rotation.z += ((-lean * 0.12) - rider.mount.rotation.z) * Math.min(1, dt * 6);
  }
  if (rider.mode === 'jump') {
    rider.mixer.update(dt);
    return;
  }
  applyRidePose(rider, lean);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#2a2e36';
  x.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 500; i++) {
    const v = 30 + ((Math.random() * 28) | 0);
    x.fillStyle = `rgba(${v},${v},${v + 4},${0.18 + Math.random() * 0.25})`;
    x.fillRect((Math.random() * 128) | 0, (Math.random() * 256) | 0, 2, 2);
  }
  x.fillStyle = '#e6e0d4';
  x.fillRect(4, 0, 5, 256);
  x.fillRect(119, 0, 5, 256);
  x.fillStyle = '#e2c14a';
  for (let y = 6; y < 256; y += 36) x.fillRect(60, y, 8, 18);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.repeat.set(1, L4_LEN / 12);
  return t;
}

function buildTunnel(scene) {
  const profile = [];
  profile.push([-5.35, 0]);
  profile.push([-5.35, 2.15]);
  const arc = 7;
  for (let i = 1; i < arc; i++) {
    const ang = Math.PI * (1 - i / arc);
    profile.push([Math.cos(ang) * 5.35, 2.15 + Math.sin(ang) * 1.85]);
  }
  profile.push([5.35, 2.15]);
  profile.push([5.35, 0]);
  const rings = 150;
  const z0 = -6;
  const z1 = L4_LEN + 16;
  const n = profile.length;
  const pos = [];
  const uvs = [];
  const idx = [];
  for (let r = 0; r <= rings; r++) {
    const z = z0 + (z1 - z0) * (r / rings);
    for (let i = 0; i < n; i++) {
      pos.push(profile[i][0], profile[i][1], z);
      uvs.push(i / (n - 1), r / rings);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let i = 0; i < n - 1; i++) {
      const a = r * n + i;
      const b = a + n;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const shell = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x5a6578, roughness: 0.84, metalness: 0.05, emissive: 0x1c2838, emissiveIntensity: 0.55, side: THREE.DoubleSide,
  }));
  shell.frustumCulled = false;
  scene.add(shell);

  // emissive strips face the roadway (vertical ribbons on the walls, a band on the crown)
  const strips = [];
  const pushYZ = (x, y0s, y1s, zA, zB) => {
    strips.push(x, y0s, zA, x, y1s, zA, x, y1s, zB, x, y0s, zA, x, y1s, zB, x, y0s, zB);
  };
  const pushXZ = (y, x0s, x1s, zA, zB) => {
    strips.push(x0s, y, zA, x1s, y, zA, x1s, y, zB, x0s, y, zA, x1s, y, zB, x0s, y, zB);
  };
  const bands = 48;
  for (let i = 0; i < bands; i++) {
    const a = z0 + (z1 - z0) * (i / bands);
    const b = a + (z1 - z0) / bands * 0.7;
    pushYZ(-5.22, 1.15, 1.32, a, b);
    pushYZ(5.22, 1.15, 1.32, a, b);
    pushYZ(-5.22, 2.55, 2.7, a, b);
    pushYZ(5.22, 2.55, 2.7, a, b);
    pushXZ(3.92, -0.16, 0.16, a, b);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(strips, 3));
  const glow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({
    color: 0x9af6ff, side: THREE.DoubleSide, toneMapped: false,
  }));
  glow.frustumCulled = false;
  scene.add(glow);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(L4_HALF * 2, L4_LEN + 30),
    new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.96, metalness: 0 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, L4_LEN / 2);
  road.frustumCulled = false;
  road.receiveShadow = true;
  scene.add(road);

  const gateMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.45, emissive: 0x332200, emissiveIntensity: 0.25 });
  const gate = new THREE.Group();
  gate.position.z = L4_LEN;
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.5, 0.38), gateMat);
    p.position.set(s * 4.15, 1.75, 0);
    gate.add(p);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.55, 0.4), new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, emissive: 0xffd24a, emissiveIntensity: 0.85, roughness: 0.4,
  }));
  beam.position.y = 3.45;
  gate.add(beam);
  const banner = document.createElement('canvas');
  banner.width = 512; banner.height = 128;
  const bx = banner.getContext('2d');
  bx.fillStyle = '#141414';
  bx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 8; i++) {
    bx.fillStyle = i % 2 ? '#f2f2f2' : '#111';
    bx.fillRect(i * 64, 0, 64, 22);
  }
  bx.fillStyle = '#ffd24a';
  bx.font = 'bold 78px sans-serif';
  bx.textAlign = 'center';
  bx.textBaseline = 'middle';
  bx.fillText('CÍL', 256, 78);
  const btex = new THREE.CanvasTexture(banner);
  btex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshBasicMaterial({ map: btex }));
  sign.position.set(0, 3.45, 0.22);
  gate.add(sign);
  scene.add(gate);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.18, 8, 28), new THREE.MeshStandardMaterial({
    color: 0x9ad7ff, emissive: 0x3ec6ff, emissiveIntensity: 0.8, roughness: 0.35,
  }));
  mouth.position.set(0, 2.35, 0.2);
  scene.add(mouth);
  return { shell, road, gate };
}

function buildObstacleMeshes(scene, obs) {
  const groups = { cone: [], box: [], barrier: [], puddle: [] };
  obs.forEach((o, i) => { o.i = i; groups[o.type].push(o); });
  const o3 = new THREE.Object3D();
  const add = (geo, mat, list, y) => {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => {
      o3.position.set(o.x, y, o.z);
      o3.rotation.set(0, 0, 0);
      o3.scale.set(1, 1, 1);
      o3.updateMatrix();
      m.setMatrixAt(i, o3.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    scene.add(m);
    return m;
  };
  add(new THREE.ConeGeometry(0.32, 0.72, 8), new THREE.MeshStandardMaterial({ color: 0xff6a13, roughness: 0.7 }), groups.cone, 0.36);
  add(new THREE.BoxGeometry(0.84, 0.5, 0.84), new THREE.MeshStandardMaterial({ color: 0xc4552a, roughness: 0.8 }), groups.box, 0.25);
  add(new THREE.BoxGeometry(2.3, 0.28, 0.16), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.55 }), groups.barrier, 0.42);
  add(new THREE.BoxGeometry(0.08, 0.42, 0.12), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }), groups.barrier, 0.21);
  const puddleMat = new THREE.MeshBasicMaterial({ color: 0x1d4e6e, transparent: true, opacity: 0.82, depthWrite: false });
  add(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), puddleMat, groups.puddle, 0.03);
}

function stripeBarriers(scene, obs) {
  // dark band on barriers so they read as low rails (second thin box, instanced)
  const list = obs.filter((o) => o.type === 'barrier');
  if (!list.length) return;
  const m = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.3, 0.08, 0.17),
    new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.5, emissive: 0x3a0000, emissiveIntensity: 0.2 }),
    list.length,
  );
  const o3 = new THREE.Object3D();
  list.forEach((o, i) => {
    o3.position.set(o.x, 0.5, o.z);
    o3.rotation.set(0, 0, 0);
    o3.scale.set(1, 1, 1);
    o3.updateMatrix();
    m.setMatrixAt(i, o3.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
  m.frustumCulled = false;
  scene.add(m);
}

const loader = new GLTFLoader();
export function loadGLB(urlOrBuffer) {
  return new Promise((resolve, reject) => {
    if (urlOrBuffer instanceof ArrayBuffer) loader.parse(urlOrBuffer, '', resolve, reject);
    else loader.load(urlOrBuffer, resolve, undefined, reject);
  });
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s);
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function readChoice() {
  try {
    const mode = localStorage.getItem(KEY_CHAR) === 'custom' ? 'custom' : 'zajecice';
    const name = localStorage.getItem(KEY_NAME) || '';
    const b64 = localStorage.getItem(KEY_B64) || '';
    return { mode, name, b64 };
  } catch {
    return { mode: 'zajecice', name: '', b64: '' };
  }
}
function storeChoice(mode, name, buffer) {
  try {
    localStorage.setItem(KEY_CHAR, mode);
    if (mode === 'custom' && buffer) {
      const b64 = bufToB64(buffer);
      if (b64.length > 3_500_000) {
        localStorage.setItem(KEY_CHAR, 'zajecice');
        localStorage.removeItem(KEY_B64);
        return false;
      }
      localStorage.setItem(KEY_NAME, name || 'vlastni.glb');
      localStorage.setItem(KEY_B64, b64);
    } else {
      localStorage.setItem(KEY_NAME, '');
      localStorage.removeItem(KEY_B64);
    }
    return true;
  } catch {
    return false;
  }
}

function pickerCss() {
  if (document.getElementById('l4pick-css')) return;
  const s = document.createElement('style');
  s.id = 'l4pick-css';
  s.textContent = `
#l4pick{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(6,8,12,.72);color:#fff;font-family:sans-serif;padding:16px;box-sizing:border-box;overflow:auto;-webkit-overflow-scrolling:touch}
#l4pick .panel{width:min(560px,100%);background:#141820;border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:18px 16px 16px;box-shadow:0 12px 40px rgba(0,0,0,.45)}
#l4pick h2{margin:0 0 4px;color:#ffd24a;font-size:26px}
#l4pick .sub{margin:0 0 14px;opacity:.8;font-size:15px}
#l4pick .cards{display:flex;gap:12px;flex-wrap:wrap}
#l4pick .card{flex:1 1 200px;min-height:168px;border-radius:14px;border:2px solid rgba(255,255,255,.25);background:#0e1218;color:#fff;padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#l4pick .card.on{border-color:#ffd24a;box-shadow:0 0 0 2px rgba(255,210,74,.35)}
#l4pick .card b{font-size:18px}
#l4pick .card small{opacity:.7;font-size:12px;text-align:center}
#l4pick canvas{width:100%;height:180px;display:block;border-radius:10px;background:radial-gradient(#243044,#0c1016)}
#l4pick .go{margin-top:14px;width:100%;min-height:52px;border:0;border-radius:12px;background:#4f7a3a;color:#fff;font:bold 20px sans-serif;touch-action:manipulation}
#l4pick .go:disabled{opacity:.45}
#l4pick .hint{margin:8px 0 0;font-size:12px;opacity:.6;text-align:center}
#l4pick .err{color:#ff8d7a;font-size:14px;min-height:1.2em;text-align:center}
#l4pick label.card{position:relative}
#l4pick label.card input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
`;
  document.head.appendChild(s);
}

function startPreview(canvas, gltf) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const fit = () => {
    const w = canvas.clientWidth || 280;
    const h = canvas.clientHeight || 180;
    renderer.setSize(w, h, false);
    cam.aspect = w / Math.max(1, h);
    cam.updateProjectionMatrix();
  };
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 30);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.35));
  const dir = new THREE.DirectionalLight(0xfff1d2, 1.8);
  dir.position.set(1.5, 2.4, 3);
  scene.add(dir);
  const model = gltf.scene;
  captureBind(model);
  restoreBind(model);
  model.rotation.set(0, 0, 0);
  model.position.set(0, 0, 0);
  scene.add(model);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dist = Math.max(size.y, size.x, size.z) * 1.55;
  cam.position.set(center.x + dist * 0.15, center.y, center.z + dist);
  cam.lookAt(center);
  fit();
  const mixer = new THREE.AnimationMixer(model);
  const idle = findClip(gltf.animations, ['idle']);
  if (idle) mixer.clipAction(idle).play();
  let alive = true;
  let last = performance.now();
  const loop = (now) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mixer.update(dt);
    model.rotation.y += dt * 0.4;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return {
    stop() {
      alive = false;
      mixer.stopAllAction();
      scene.remove(model);
      model.rotation.set(0, 0, 0);
      restoreBind(model);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export async function bootLevel4(api) {
  const { scene, camera, renderer, sun, hemi, buildMotorbike, attachCharLights, syncCharLights,
    makeGroundBlob, syncBikeWheelBlob, keys, input, showToast, getGfx, setBike, GRAV, camPos, tmp } = api;

  const keep = new Set([hemi, sun, sun.target]);
  for (const ch of scene.children.slice()) if (!keep.has(ch)) scene.remove(ch);
  scene.background = new THREE.Color(0x121820);
  scene.fog = new THREE.Fog(0x121820, 22, 78);
  hemi.color.set(0xb7cbe4);
  hemi.groundColor.set(0x1a1612);
  hemi.intensity = 0.72;
  sun.intensity = 0.22;
  sun.castShadow = false;
  camera.far = 150;
  camera.fov = 60;
  camera.updateProjectionMatrix();

  buildTunnel(scene);
  const obs = layoutObstacles(L4_LEN, L4_HALF, mulberry32(0x4C34521));
  buildObstacleMeshes(scene, obs);
  stripeBarriers(scene, obs);

  const B = buildMotorbike(false);
  scene.add(B.root);
  setBike(B);
  B.root.position.set(0, 0, 2);
  B.wheelBlobF = makeGroundBlob(0.4, 0.26);
  B.wheelBlobR = makeGroundBlob(0.44, 0.28);
  B.root.add(B.wheelBlobF, B.wheelBlobR);
  B.charLights = attachCharLights(B.root, {
    fillI: 0.5, rimI: 0.55, dist: 8,
    fillPos: [0.7, 1.55, 1.4], rimPos: [-1.1, 1.85, -1.3],
  });
  syncCharLights();
  const spot = new THREE.SpotLight(0xfff3cc, 7, 34, 0.55, 0.45, 1.1);
  spot.position.set(0, 0.02, 0.16);
  const spotT = new THREE.Object3D();
  spotT.position.set(0, -0.2, 8);
  B.steer.add(spot, spotT);
  spot.target = spotT;
  const fill = new THREE.PointLight(0xc5d7ff, 0.55, 7, 2);
  fill.position.set(0, 1.7, -1.1);
  B.root.add(fill);

  const anchors = {
    bob: B.bob,
    gripL: new THREE.Object3D(), gripR: new THREE.Object3D(),
    pegL: new THREE.Object3D(), pegR: new THREE.Object3D(),
  };
  B.root.updateMatrixWorld(true);
  anchors.gripL.position.copy(B.steer.worldToLocal(GRIP_L.clone()));
  anchors.gripR.position.copy(B.steer.worldToLocal(GRIP_R.clone()));
  B.steer.add(anchors.gripL, anchors.gripR);
  anchors.pegL.position.copy(PEG_L);
  anchors.pegR.position.copy(PEG_R);
  B.bob.add(anchors.pegL, anchors.pegR);

  let heading = Math.PI;
  let speed = 0;
  let vy = 0;
  let grounded = true;
  let hopHeld = false;
  let wobble = 0;
  let hits = 0;
  let invul = 0;
  let raceT = 0;
  let finishT = -1;
  let done = false;
  let racing = false;
  let rider = null;
  let eng = null;
  let last = performance.now();
  camPos.set(0, 3.2, -4);

  const elB = document.getElementById('bones');
  const elL = document.getElementById('lives');
  const timer = document.getElementById('timer');
  if (elB) elB.textContent = 'Nárazy 0';
  if (elL) elL.textContent = '';

  function engineSound() {
    try {
      const actx = engineSound.actx || (engineSound.actx = new (window.AudioContext || window.webkitAudioContext)());
      if (actx.state === 'suspended') actx.resume();
      if (eng) return;
      const o = actx.createOscillator(), o2 = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0.03;
      o.connect(f); o2.connect(f); f.connect(g).connect(actx.destination); o.start(); o2.start();
      eng = { o, o2, g };
    } catch { /* autoplay */ }
  }

  const state = () => ({
    started: racing, picker: !racing && !done, x: B.root.position.x, z: B.root.position.z,
    y: B.root.position.y, speed, hits, done, raceT, len: L4_LEN, finishT,
    pose: rider?.poseKind || null, jump: rider?.jumpName || null, obs: obs.length,
  });
  window.__l4 = state;
  window.__l4obs = obs;

  function showResults() {
    done = true;
    racing = false;
    const over = document.getElementById('over');
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor(t * 10 % 10)}`;
    document.getElementById('ovT').textContent = 'Cíl!';
    document.getElementById('ovS').textContent = `Čas: ${fmt(raceT)}   ·   Nárazy: ${hits}`;
    const btns = document.getElementById('overBtns');
    if (btns) btns.style.display = 'none';
    const end = document.getElementById('l4end');
    if (end) end.style.display = 'block';
    over.classList.add('on');
    if (eng) eng.g.gain.value = 0;
  }
  document.getElementById('l4again')?.addEventListener('click', () => { location.href = '?level=4&again=1'; });
  document.getElementById('l4swap')?.addEventListener('click', () => { location.href = '?level=4'; });

  function hitObs() {
    hits++;
    invul = 1.05;
    wobble = 1;
    speed *= 0.32;
    if (elB) elB.textContent = 'Nárazy ' + hits;
    triggerRiderHop(rider);
    if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([60, 30, 90]);
    showToast('Náraz!');
  }

  function mountRider(gltf) {
    if (rider?.mount) {
      rider.mount.removeFromParent();
      rider = null;
    }
    rider = prepareRider(gltf);
    seatOnBike(rider, B.bob, anchors);
    window.__l4rider = { pose: rider.poseKind, jump: rider.jumpName, limbs: rider.limbs.length };
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const gp = B.root.position;
    if (!racing) {
      B.lean.rotation.z = Math.sin(now / 900) * 0.03;
      B.bob.position.y = Math.sin(now / 280) * 0.01;
      const back = tmp.set(Math.sin(heading) * 6.4, 2.7, Math.cos(heading) * 6.4).add(gp);
      camPos.lerp(back, 0.04);
      camera.position.copy(camPos);
      camera.lookAt(gp.x, gp.y + 1.35, gp.z + 2);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
      return;
    }
    if (!done && finishT < 0) raceT += dt;
    if (timer) timer.textContent = '⏱ ' + `${Math.floor(raceT / 60)}:${String(Math.floor(raceT % 60)).padStart(2, '0')}.${Math.floor(raceT * 10 % 10)}`;
    const inp = input();
    const thr = finishT < 0 && (keys.KeyW || keys.ArrowUp || inp.runTouch || inp.jy < -0.4);
    const brk = keys.KeyS || keys.ArrowDown || inp.jy > 0.5 || finishT >= 0;
    let turn = THREE.MathUtils.clamp((keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - inp.jx, -1, 1);
    if (Math.abs(turn) < 0.12) turn = 0;
    speed += (thr ? 10 : brk ? -16 : -3) * dt;
    speed = THREE.MathUtils.clamp(speed, 0, 22);
    heading += turn * 1.7 * dt * Math.min(1, speed / 5 + 0.2);
    if (!turn) heading += (Math.PI - heading) * Math.min(1, dt * 1.2);
    heading = THREE.MathUtils.clamp(heading, Math.PI - 0.7, Math.PI + 0.7);
    gp.x += -Math.sin(heading) * speed * dt;
    gp.z += -Math.cos(heading) * speed * dt;
    gp.x = THREE.MathUtils.clamp(gp.x, -L4_HALF + 0.45, L4_HALF - 0.45);
    gp.z = Math.max(gp.z, -1);
    const jp = keys.Space || inp.jumpTouch;
    if (jp && !hopHeld && grounded && finishT < 0) {
      vy = 6.5;
      grounded = false;
      triggerRiderHop(rider);
    }
    hopHeld = jp;
    vy -= GRAV * dt;
    gp.y += vy * dt;
    if (gp.y <= 0) {
      if (!grounded) B.bob.position.y = -0.08;
      gp.y = 0; vy = 0; grounded = true;
    }
    B.root.rotation.y = heading + Math.PI;
    wobble = Math.max(0, wobble - dt * 1.2);
    invul = Math.max(0, invul - dt);
    const feel = getGfx() === 'perf' ? 0.4 : 1;
    const spdF = Math.min(1, speed / 10);
    const idle = grounded && speed < 1.6;
    const leanT = turn * (0.34 + 0.4 * spdF) * feel;
    const hitWob = Math.sin(now / 48) * 0.3 * wobble;
    B.lean.rotation.z += (leanT + hitWob - B.lean.rotation.z) * Math.min(1, dt * 7);
    const pitchT = (thr ? -0.045 * Math.max(spdF, 0.25) : brk ? 0.055 : 0) * feel;
    B.lean.rotation.x += (pitchT - B.lean.rotation.x) * Math.min(1, dt * 5.5);
    const vibY = grounded
      ? (idle
        ? Math.sin(now / 26) * 0.016 * feel + Math.sin(now / 13) * 0.006 * feel
        : Math.sin(now / 42) * 0.01 * spdF * feel + Math.sin(now / 19) * 0.005 * spdF * feel)
      : 0;
    const landSquash = B.bob.position.y < -0.04 ? B.bob.position.y : 0;
    const bobTargetY = landSquash !== 0 && Math.abs(landSquash) > Math.abs(vibY) ? landSquash * 0.7 : vibY;
    B.bob.position.y += (bobTargetY - B.bob.position.y) * Math.min(1, dt * 10);
    B.bob.rotation.z += ((idle ? Math.sin(now / 31) * 0.014 : Math.sin(now / 36) * 0.006 * spdF) * feel - B.bob.rotation.z) * Math.min(1, dt * 8);
    B.steer.rotation.y += ((-turn * 0.2 * spdF * feel) - B.steer.rotation.y) * Math.min(1, dt * 8);
    B.front.spin.rotation.x += speed * dt / B.R;
    B.rear.spin.rotation.x += speed * dt / B.R;
    updateRider(rider, dt, now, leanT);
    syncBikeWheelBlob(B.wheelBlobF, B.front, B.root, !grounded);
    syncBikeWheelBlob(B.wheelBlobR, B.rear, B.root, !grounded);

    if (invul <= 0 && gp.y < 0.9 && finishT < 0) {
      for (const o of obs) {
        if (o.hit) continue;
        if (o.z < gp.z - 4 || o.z > gp.z + 6) continue;
        if (Math.abs(gp.x - o.x) < o.hw + 0.32 && Math.abs(gp.z - o.z) < o.hd + 0.55 && gp.y < o.h) {
          o.hit = true;
          hitObs();
          break;
        }
      }
    }
    if (gp.z > L4_LEN && finishT < 0) { finishT = 0; showToast('Cíl!'); }
    if (finishT >= 0 && !done) {
      finishT += dt;
      if (finishT > 1.5) showResults();
    }
    const back = tmp.set(Math.sin(heading) * 6.2, 2.9, Math.cos(heading) * 6.2).add(gp);
    camPos.lerp(back, 1 - Math.pow(0.01, dt));
    camera.position.copy(camPos);
    camera.lookAt(gp.x, gp.y + 1.5, gp.z + 3);
    camera.fov += (58 + speed * 1.1 - camera.fov) * Math.min(1, dt * 3);
    camera.updateProjectionMatrix();
    sun.position.set(gp.x + 8, 18, gp.z + 6);
    sun.target.position.copy(gp);
    if (eng) {
      const f = 42 + speed * 7.2 + (speed < 1.5 ? Math.sin(now / 40) * 3 : 0);
      eng.o.frequency.value = f;
      eng.o2.frequency.value = f * 0.5;
      eng.g.gain.value = done ? 0 : 0.028 + Math.min(0.025, speed * 0.0018);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  pickerCss();
  const root = document.createElement('div');
  root.id = 'l4pick';
  root.innerHTML = `
    <div class="panel" role="dialog" aria-label="Výběr postavy">
      <h2>Level 4 · Tunel</h2>
      <p class="sub">Vyber jezdce na motorku</p>
      <div class="cards">
        <button type="button" class="card on" id="l4cardZ">
          <canvas id="l4prev" width="320" height="200"></canvas>
          <b>Zaječice</b>
          <small>výchozí postava · idle</small>
        </button>
        <label class="card" id="l4cardC">
          <input id="l4file" type="file" accept=".glb,model/gltf-binary" />
          <b>Nahrát vlastní GLB</b>
          <small id="l4fileName">klipy Idle, Walk, Run, Jump</small>
        </label>
      </div>
      <button type="button" class="go" id="l4go">Jedu!</button>
      <p class="hint">Volba se uloží v tomto prohlížeči. Plyn, šipky a Skok jako na levelu 2.</p>
      <p class="err" id="l4err"></p>
    </div>`;
  document.body.appendChild(root);
  const cardZ = root.querySelector('#l4cardZ');
  const cardC = root.querySelector('#l4cardC');
  const file = root.querySelector('#l4file');
  const fileName = root.querySelector('#l4fileName');
  const err = root.querySelector('#l4err');
  const go = root.querySelector('#l4go');
  const canvas = root.querySelector('#l4prev');
  let choice = 'zajecice';
  let customBuf = null;
  let customName = '';
  let bundled = null;
  let preview = null;
  let customGltf = null;

  const select = (mode) => {
    choice = mode;
    cardZ.classList.toggle('on', mode === 'zajecice');
    cardC.classList.toggle('on', mode === 'custom');
    go.disabled = mode === 'custom' && !customBuf;
  };
  cardZ.addEventListener('pointerdown', (e) => { e.preventDefault(); select('zajecice'); });
  cardZ.addEventListener('click', () => select('zajecice'));

  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    err.textContent = '';
    try {
      if (f.size > 40 * 1024 * 1024) throw new Error('velký');
      const buf = await f.arrayBuffer();
      customGltf = await loadGLB(buf);
      customBuf = buf;
      customName = f.name;
      fileName.textContent = f.name;
      select('custom');
      const saved = storeChoice('custom', f.name, buf);
      if (!saved) err.textContent = 'Soubor je moc velký na uložení — platí jen pro tuhle jízdu.';
    } catch (e) {
      console.error(e);
      err.textContent = 'GLB se nepodařilo načíst.';
      customBuf = null;
      select('zajecice');
    }
  });

  const saved = readChoice();
  if (saved.mode === 'custom' && saved.b64) {
    try {
      customBuf = b64ToBuf(saved.b64);
      customName = saved.name;
      customGltf = await loadGLB(customBuf);
      fileName.textContent = saved.name || 'uložený GLB';
      select('custom');
    } catch (e) {
      console.error(e);
      err.textContent = 'Uložený GLB je poškozený. Vyber Zaječice nebo nahraj soubor znovu.';
      select('zajecice');
    }
  }

  try {
    bundled = await loadGLB(BUNDLED);
    preview = startPreview(canvas, bundled);
  } catch (e) {
    console.error(e);
    err.textContent = 'Zaječice se nepodařilo načíst.';
    go.disabled = choice === 'zajecice';
  }

  const begin = async (gltf, mode, name, buffer) => {
    if (preview) { preview.stop(); preview = null; }
    root.remove();
    mountRider(gltf);
    storeChoice(mode, name, buffer);
    racing = true;
    engineSound();
    showToast('Level 4: drž plyn a vyhni se překážkám');
    addEventListener('pointerdown', () => { if (racing) engineSound(); }, { once: false });
  };

  go.addEventListener('click', async () => {
    err.textContent = '';
    try {
      if (choice === 'custom') {
        if (!customGltf) throw new Error('no custom');
        await begin(customGltf, 'custom', customName, customBuf);
      } else {
        if (!bundled) bundled = await loadGLB(BUNDLED);
        await begin(bundled, 'zajecice', '', null);
      }
    } catch (e) {
      console.error(e);
      err.textContent = 'Postavu se nepodařilo posadit.';
    }
  });

  const again = new URLSearchParams(location.search).get('again') === '1';
  if (again && ((choice === 'zajecice' && bundled) || (choice === 'custom' && customGltf))) {
    const gltf = choice === 'custom' ? customGltf : bundled;
    await begin(gltf, choice, customName, choice === 'custom' ? customBuf : null);
  }

  window.__l4pick = () => ({ open: !!document.getElementById('l4pick'), choice });
}
