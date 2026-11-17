// Level 4 — tunnel time trial. Reuses buildMotorbike(false); does not alter L1–L3.
import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/jsm/loaders/GLTFLoader.js';

export const L4_LEN = 1500;
export const L4_HALF = 5;
/** Inner shell of buildTunnel: vertical walls, then an elliptical arch. */
export const L4_WALL_X = 5.35;
export const L4_SPRING_Y = 2.15;
export const L4_ARCH_RY = 1.85;
/** Bike center stays this far inside the shell. */
export const L4_WALL_INSET = 0.6;
/** Chase camera stays this far inside the shell. */
export const L4_CAM_MARGIN = 0.3;
/** Rider sample height above the road before lean (pivot is the bike root). */
export const L4_RIDER_H = 1.85;
const L4_WALL_HIT_CD = 0.75;
const MIN_LANE = 3.6;
const SEAT = new THREE.Vector3(0, 1.1, -0.06);
const SEAT_GAP = 0.02;
const GRIP_L = new THREE.Vector3(-0.36, 1.184, 0.527);
const GRIP_R = new THREE.Vector3(0.36, 1.184, 0.527);
const PEG_L = new THREE.Vector3(-0.25, 0.42, 0.1);
const PEG_R = new THREE.Vector3(0.25, 0.42, 0.1);
// Handlebar volume in steer-local space (bar + grips). The steer group also holds the forks.
const HANDLE_BOX = new THREE.Box3(new THREE.Vector3(-0.44, 0.17, -0.13), new THREE.Vector3(0.44, 0.27, -0.03));
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
  const spines = bag.spine.slice().sort((a, b) => {
    const rank = (n) => (/lower/i.test(n) ? 0 : /upper/i.test(n) ? 2 : 1);
    return rank(a.name) - rank(b.name);
  });
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
    scene, mixer, pelvis, head, spine, spines, limbs,
    poseKind: poseKind === 'ik' ? 'ik' : (crouchClip ? 'crouch' : 'place'),
    jumpAction, jumpName: jumpClip ? jumpClip.name : null,
    crouchClip, idleClip, mode: 'ride', mount: null, base: new THREE.Vector3(), abduct: 0,
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

function debugCollidersEnabled() {
  try {
    return new URLSearchParams(globalThis.location?.search || '').get('debugColliders') === '1';
  } catch {
    return false;
  }
}

/** Meshes that belong to this joint, not to a child joint (calf under a thigh, spine under the pelvis). */
function collectOwnedMeshes(joint) {
  if (!joint) return [];
  const out = [];
  const walk = (o) => {
    if (o !== joint && classifyJoint(o.name)) return;
    if (o.isMesh && !o.userData.l4Debug && o.geometry?.attributes?.position) out.push(o);
    for (const ch of o.children) walk(ch);
  };
  walk(joint);
  return out;
}

function pelvisThighMeshes(rider) {
  const list = collectOwnedMeshes(rider.pelvis);
  for (const limb of rider.limbs || []) {
    if (limb.kind === 'leg') list.push(...collectOwnedMeshes(limb.upper));
  }
  return list;
}

function shiftMountWorld(mount, worldDelta) {
  if (!mount || worldDelta.lengthSq() < 1e-10) return;
  const parent = mount.parent;
  if (!parent) { mount.position.add(worldDelta); return; }
  parent.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const a = new THREE.Vector3().setFromMatrixPosition(parent.matrixWorld);
  const b = a.clone().add(worldDelta);
  a.applyMatrix4(inv);
  b.applyMatrix4(inv);
  mount.position.add(b.sub(a));
}

/**
 * Lowest world vertex of the pelvis, plus the upper thigh (near the hip), that lies over the seat.
 * The hanging knee is not the sit surface — lifting to it pulls the feet off the pegs.
 * Null when those meshes are missing (fallback: pelvis joint on SEAT).
 */
function lowestSitPoint(rider, surface) {
  const meshes = pelvisThighMeshes(rider);
  if (!surface || !meshes.length || !rider.pelvis) return null;
  surface.updateWorldMatrix(true, true);
  const footprint = new THREE.Box3().setFromObject(surface);
  if (footprint.isEmpty()) return null;
  const hip = new THREE.Vector3();
  rider.pelvis.getWorldPosition(hip);
  const pelvisMeshes = new Set(collectOwnedMeshes(rider.pelvis));
  const v = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const ray = new THREE.Raycaster();
  let best = null;
  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position;
    mesh.updateWorldMatrix(true, false);
    const upperThigh = !pelvisMeshes.has(mesh);
    const stride = Math.max(1, Math.ceil(pos.count / 3500));
    for (let i = 0; i < pos.count; i += stride) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (upperThigh && v.distanceTo(hip) > 0.12) continue;
      if (v.x < footprint.min.x || v.x > footprint.max.x || v.z < footprint.min.z || v.z > footprint.max.z) continue;
      origin.set(v.x, footprint.max.y + 1.5, v.z);
      ray.set(origin, down);
      const hits = ray.intersectObject(surface, true);
      if (!hits.length) continue;
      const seatY = hits[0].point.y;
      if (!best || v.y < best.y) best = { y: v.y, seatY };
    }
  }
  return best;
}

function plantError(rider, kind) {
  const anchors = rider.anchors;
  if (!anchors) return 0;
  let err = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  let any = false;
  for (const limb of rider.limbs || []) {
    if (limb.kind !== kind) continue;
    const anchor = kind === 'leg'
      ? (limb.side === 'L' ? anchors.pegL : anchors.pegR)
      : (limb.side === 'L' ? anchors.gripL : anchors.gripR);
    if (!anchor) continue;
    any = true;
    err = Math.max(err, limb.end.getWorldPosition(a).distanceTo(anchor.getWorldPosition(b)));
  }
  return any ? err : 0;
}

/** Lean the chest forward until the hands reach the grips, without leaving the pegs. */
function reachHands(rider) {
  if (!(rider.limbs || []).some((l) => l.kind === 'arm') || !(rider.spines?.length || rider.spine)) return;
  let pitch = rider.torsoPitch ?? 0.8;
  for (; pitch <= 1.25; pitch += 0.05) {
    rider.torsoPitch = pitch;
    applyRidePose(rider, 0);
    if (plantError(rider, 'arm') <= 0.02) return;
  }
}

/**
 * Raise the posed rider until the sit flesh clears the seat by SEAT_GAP.
 * Stop early when another centimetre would pull the feet off the pegs.
 */
function liftToSeat(rider, seat) {
  let fitted = false;
  for (let step = 0; step < 14; step++) {
    applyRidePose(rider, 0);
    rider.mount.updateWorldMatrix(true, true);
    const hit = lowestSitPoint(rider, seat);
    if (!hit) return fitted;
    const dy = hit.seatY + SEAT_GAP - hit.y;
    if (dy <= 0.004) return true;
    const stepDy = Math.min(dy, 0.02);
    const before = plantError(rider, 'leg');
    shiftMountWorld(rider.mount, new THREE.Vector3(0, stepDy, 0));
    applyRidePose(rider, 0);
    const after = plantError(rider, 'leg');
    if (after > 0.03 && after > before + 0.008) {
      shiftMountWorld(rider.mount, new THREE.Vector3(0, -stepDy, 0));
      applyRidePose(rider, 0);
      rider.base.copy(rider.mount.position);
      return fitted;
    }
    rider.base.copy(rider.mount.position);
    fitted = true;
  }
  return fitted;
}

function kneesOutsideTank(rider) {
  let minAbs = Infinity;
  for (const limb of rider.limbs || []) {
    if (limb.kind !== 'leg') continue;
    limb.lower.updateWorldMatrix(true, false);
    minAbs = Math.min(minAbs, Math.abs(limb.lower.matrixWorld.elements[12]));
  }
  // Tank half-width is about 0.25 m. Knees past that sit beside the tank, not in it.
  return minAbs > 0.27;
}

function spreadLegs(rider, proxies) {
  const blocks = proxies.filter((p) => p.kind === 'tank' || p.kind === 'engine');
  if (!blocks.length) return;
  rider.abduct = rider.abduct || 0;
  for (let step = 0; step < 16; step++) {
    applyRidePose(rider, 0);
    rider.mount.updateWorldMatrix(true, true);
    let overlap = 0;
    for (const s of limbSpheres(rider)) {
      if (s.part !== 'thigh' && s.part !== 'calf') continue;
      for (const p of blocks) {
        const push = spherePushOut(s, p);
        if (push && push.length() > 0.015) overlap++;
      }
    }
    if (kneesOutsideTank(rider) || rider.abduct >= 1.25) break;
    if (!overlap && rider.abduct >= 0.3) break;
    const prev = rider.abduct;
    const before = plantError(rider, 'leg');
    rider.abduct = prev + 0.06;
    applyRidePose(rider, 0);
    const after = plantError(rider, 'leg');
    if (after > 0.03 && after > before + 0.008) {
      rider.abduct = prev;
      break;
    }
  }
  applyRidePose(rider, 0);
}

/** Signed gap: positive when the sphere is clear of the box, negative when it penetrates. */
function sphereGap(sphere, proxy) {
  const box = proxy.localBox;
  const size = box.getSize(new THREE.Vector3());
  const localCenter = box.getCenter(new THREE.Vector3());
  const mw = proxy.obj.matrixWorld;
  const e = mw.elements;
  const ax = new THREE.Vector3(e[0], e[1], e[2]);
  const ay = new THREE.Vector3(e[4], e[5], e[6]);
  const az = new THREE.Vector3(e[8], e[9], e[10]);
  const sx = ax.length() || 1;
  const sy = ay.length() || 1;
  const sz = az.length() || 1;
  ax.multiplyScalar(1 / sx);
  ay.multiplyScalar(1 / sy);
  az.multiplyScalar(1 / sz);
  const worldCenter = localCenter.applyMatrix4(mw);
  const hx = size.x * 0.5 * sx;
  const hy = size.y * 0.5 * sy;
  const hz = size.z * 0.5 * sz;
  const d = sphere.center.clone().sub(worldCenter);
  const lx = d.dot(ax);
  const ly = d.dot(ay);
  const lz = d.dot(az);
  const dx = lx - THREE.MathUtils.clamp(lx, -hx, hx);
  const dy = ly - THREE.MathUtils.clamp(ly, -hy, hy);
  const dz = lz - THREE.MathUtils.clamp(lz, -hz, hz);
  const dist = Math.hypot(dx, dy, dz);
  if (dist > 1e-5) return dist - sphere.radius;
  const pen = Math.min(hx - Math.abs(lx), hy - Math.abs(ly), hz - Math.abs(lz));
  return -(pen + sphere.radius);
}

function legClearance(rider, proxies) {
  const out = { thighTank: Infinity, thighSeat: Infinity, thighEngine: Infinity, calfTank: Infinity, calfSeat: Infinity, calfEngine: Infinity };
  const spheres = limbSpheres(rider);
  for (const s of spheres) {
    if (s.part !== 'thigh' && s.part !== 'calf') continue;
    for (const p of proxies) {
      if (p.kind !== 'tank' && p.kind !== 'seat' && p.kind !== 'engine') continue;
      const key = s.part + (p.kind === 'tank' ? 'Tank' : p.kind === 'seat' ? 'Seat' : 'Engine');
      out[key] = Math.min(out[key], sphereGap(s, p));
    }
  }
  const nums = Object.values(out).filter((n) => Number.isFinite(n));
  out.min = nums.length ? Math.min(...nums) : null;
  return out;
}

function worldArmReach(limb) {
  const ws = new THREE.Vector3();
  limb.upper.getWorldScale(ws);
  const s = Math.max(Math.abs(ws.x), Math.abs(ws.y), Math.abs(ws.z), 1e-4);
  return (limb.lower.position.length() + limb.end.position.length()) * s;
}

function barParts(steer) {
  return steer.children.filter((o) => o.position.y > 0.15 && !o.userData.l4Debug && o.name !== 'l4-proxy');
}

function rememberBars(steer) {
  if (steer.userData.l4BarBase) {
    for (const [o, p] of steer.userData.l4BarBase) o.position.copy(p);
    steer.userData.l4BarShift = new THREE.Vector3();
    return;
  }
  const map = new Map();
  for (const o of barParts(steer)) map.set(o, o.position.clone());
  steer.userData.l4BarBase = map;
  steer.userData.l4BarShift = new THREE.Vector3();
}

/** Slide the Level 4 bars back toward the seat until both hands can reach them. */
function pullBarsToReach(rider, bike) {
  const steer = bike.steer;
  const bob = rider.anchors?.bob;
  if (!steer || !bob) return 0;
  rememberBars(steer);
  applyRidePose(rider, 0);
  bob.updateWorldMatrix(true, true);
  const fwd = new THREE.Vector3(0, 0, 1).transformDirection(bob.matrixWorld);
  let pull = 0;
  const shoulder = new THREE.Vector3();
  const grip = new THREE.Vector3();
  for (const limb of rider.limbs) {
    if (limb.kind !== 'arm') continue;
    const anchor = limb.side === 'L' ? rider.anchors.gripL : rider.anchors.gripR;
    if (!anchor) continue;
    limb.upper.getWorldPosition(shoulder);
    anchor.getWorldPosition(grip);
    const to = grip.clone().sub(shoulder);
    const along = to.dot(fwd);
    const lateral2 = Math.max(0, to.lengthSq() - along * along);
    const reach = worldArmReach(limb) * 0.9;
    const maxAlong = Math.sqrt(Math.max(0, reach * reach - lateral2));
    const desired = Math.max(Math.min(along, maxAlong), Math.min(along, 0.16));
    pull = Math.max(pull, along - desired);
  }
  pull = THREE.MathUtils.clamp(pull, 0, 0.42);
  if (pull < 0.005) {
    rider.barPull = 0;
    return 0;
  }
  const worldDelta = fwd.clone().multiplyScalar(-pull);
  const q = new THREE.Quaternion();
  steer.getWorldQuaternion(q);
  const localDelta = worldDelta.applyQuaternion(q.invert());
  for (const [o, base] of steer.userData.l4BarBase) o.position.copy(base).add(localDelta);
  steer.userData.l4BarShift = localDelta.clone();
  rider.barPull = pull;
  applyRidePose(rider, 0);
  return pull;
}

function captureTank(tank) {
  if (tank.userData.l4Base) return;
  tank.updateWorldMatrix(true, true);
  const box = localAabbOf(tank);
  const nose = new THREE.Vector3(0, 0, box.max.z);
  tank.localToWorld(nose);
  if (tank.parent) tank.parent.worldToLocal(nose);
  tank.userData.l4Base = {
    position: tank.position.clone(),
    scale: tank.scale.clone(),
    box,
    noseParentZ: nose.z,
  };
  tank.traverse((o) => {
    if (o.isMesh && o.geometry?.type === 'PlaneGeometry') o.userData.l4LogoScale = o.scale.clone();
  });
}

function resetTank(tank) {
  captureTank(tank);
  const base = tank.userData.l4Base;
  tank.position.copy(base.position);
  tank.scale.copy(base.scale);
  tank.traverse((o) => {
    if (o.userData.l4LogoScale) o.scale.copy(o.userData.l4LogoScale);
  });
}

function keepTankNose(tank) {
  const base = tank.userData.l4Base;
  if (!base) return;
  tank.updateWorldMatrix(true, false);
  const nose = new THREE.Vector3(0, 0, base.box.max.z);
  tank.localToWorld(nose);
  if (tank.parent) tank.parent.worldToLocal(nose);
  tank.position.z += base.noseParentZ - nose.z;
  tank.traverse((o) => {
    if (!o.userData.l4LogoScale) return;
    o.scale.copy(o.userData.l4LogoScale);
    o.scale.x = o.userData.l4LogoScale.x / Math.max(0.35, tank.scale.z);
  });
}

function narrowTank(rider, tank) {
  resetTank(tank);
  const base = tank.userData.l4Base;
  const half = Math.max(0.05, (base.box.max.x - base.box.min.x) * 0.5 * base.scale.x);
  let hip = half;
  const left = rider.limbs.find((l) => l.kind === 'leg' && l.side === 'L');
  const right = rider.limbs.find((l) => l.kind === 'leg' && l.side === 'R');
  if (left && right) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const side = new THREE.Vector3(1, 0, 0);
    if (rider.anchors?.bob) side.transformDirection(rider.anchors.bob.matrixWorld);
    left.upper.getWorldPosition(a);
    right.upper.getWorldPosition(b);
    hip = Math.abs(a.sub(b).dot(side)) * 0.5;
  }
  const spheres = limbSpheres(rider).filter((s) => s.part === 'thigh');
  const thighR = spheres.length ? spheres.reduce((m, s) => m + s.radius, 0) / spheres.length : 0.08;
  const target = THREE.MathUtils.clamp(hip - thighR - 0.02, half * 0.62, half);
  tank.scale.x = base.scale.x * (target / half);
  tank.scale.y = base.scale.y;
  tank.scale.z = base.scale.z;
  keepTankNose(tank);
  rider.tankScaleX = tank.scale.x;
}

function shortenTankUntilClear(rider, bike) {
  const tank = bike.tank;
  captureTank(tank);
  rider.tankShortened = false;
  const gaps = () => {
    tank.updateWorldMatrix(true, true);
    bike.seat?.updateWorldMatrix(true, true);
    bike.eng?.updateWorldMatrix(true, true);
    return legClearance(rider, buildBikeProxies(bike));
  };
  for (let step = 0; step < 14; step++) {
    const gap = gaps();
    if (Math.min(gap.thighTank, gap.calfTank) >= 0.012) break;
    if (tank.scale.z <= 0.42) break;
    rider.tankShortened = true;
    tank.scale.z = Math.max(0.42, tank.scale.z * 0.88);
    keepTankNose(tank);
  }
  for (let step = 0; step < 12; step++) {
    const gap = gaps();
    const seatHit = Math.min(gap.thighSeat, gap.calfSeat);
    const engHit = Math.min(gap.thighEngine, gap.calfEngine);
    if (seatHit >= 0.01 && engHit >= 0.01) break;
    if ((rider.abduct || 0) >= 1.5) break;
    const before = plantError(rider, 'leg');
    rider.abduct = (rider.abduct || 0) + 0.1;
    applyRidePose(rider, 0);
    if (plantError(rider, 'leg') > 0.045 && plantError(rider, 'leg') > before + 0.02) {
      rider.abduct -= 0.1;
      applyRidePose(rider, 0);
      break;
    }
  }
  rider.tankScaleZ = tank.scale.z;
  return buildBikeProxies(bike);
}

function pegParts(bob, anchors) {
  if (bob.userData.l4Pegs) {
    for (const [o, p] of bob.userData.l4Pegs) o.position.copy(p);
    return bob.userData.l4Pegs;
  }
  const map = new Map();
  for (const o of bob.children) {
    if (!o.isMesh || o.userData.l4Debug) continue;
    const nearY = Math.abs(o.position.y - 0.42) < 0.05;
    const nearZ = Math.abs(o.position.z - 0.08) < 0.06;
    const outX = Math.abs(o.position.x) > 0.16 && Math.abs(o.position.x) < 0.36;
    if (nearY && nearZ && outX) map.set(o, o.position.clone());
  }
  if (anchors?.pegL) map.set(anchors.pegL, anchors.pegL.position.clone());
  if (anchors?.pegR) map.set(anchors.pegR, anchors.pegR.position.clone());
  bob.userData.l4Pegs = map;
  return map;
}

/** Raise and tuck the Level 4 pegs so a rider sat back on the seat can bend the knee. */
function placePegs(rider) {
  const bob = rider.anchors?.bob;
  if (!bob) return;
  const map = pegParts(bob, rider.anchors);
  applyRidePose(rider, 0);
  const leg = rider.limbs.find((l) => l.kind === 'leg');
  if (!leg) return;
  const reach = (leg.lower.position.length() + leg.end.position.length()) * (rider.scale || 1);
  for (const side of ['L', 'R']) {
    const limb = rider.limbs.find((l) => l.kind === 'leg' && l.side === side);
    const anchor = side === 'L' ? rider.anchors.pegL : rider.anchors.pegR;
    const base = map.get(anchor);
    if (!limb || !anchor || !base) continue;
    const hip = new THREE.Vector3();
    limb.upper.getWorldPosition(hip);
    const sign = side === 'R' ? 1 : -1;
    const target = new THREE.Vector3(
      sign * THREE.MathUtils.clamp(Math.abs(hip.x) + 0.16, 0.22, 0.34),
      THREE.MathUtils.clamp(hip.y - reach * 0.58, 0.5, 0.68),
      THREE.MathUtils.clamp(hip.z + reach * 0.22, hip.z + 0.06, hip.z + 0.32),
    );
    const local = bob.worldToLocal(target.clone());
    const delta = local.sub(base);
    delta.x = THREE.MathUtils.clamp(delta.x, -0.06, 0.06);
    delta.y = THREE.MathUtils.clamp(delta.y, 0, 0.22);
    delta.z = THREE.MathUtils.clamp(delta.z, -0.18, 0.02);
    anchor.position.copy(base).add(delta);
    for (const [o, p] of map) {
      if (o === rider.anchors.pegL || o === rider.anchors.pegR) continue;
      if (Math.sign(p.x) !== sign) continue;
      o.position.copy(p).add(delta);
    }
  }
  applyRidePose(rider, 0);
}

/**
 * Sit back on the seat, tuck toward bars brought closer, bend the legs onto
 * the pegs, then narrow and shorten the Level 4 tank until the leg spheres clear.
 */
function settleRider(rider, bike) {
  rider.torsoPitch = 0.85;
  rider.abduct = 0.28;
  rider.tankShortened = false;
  applyRidePose(rider, 0);
  if (bike?.steer) pullBarsToReach(rider, bike);
  reachHands(rider);
  const fitted = bike?.seat ? liftToSeat(rider, bike.seat) : false;
  placePegs(rider);
  if (bike?.seat) liftToSeat(rider, bike.seat);
  if (bike?.steer) pullBarsToReach(rider, bike);
  reachHands(rider);
  if (bike?.tank) narrowTank(rider, bike.tank);
  let proxies = null;
  if (rider.poseKind === 'ik' && bike?.tank && bike?.eng && bike?.steer) {
    proxies = buildBikeProxies(bike);
    spreadLegs(rider, proxies);
    if (bike.seat) liftToSeat(rider, bike.seat);
    proxies = shortenTankUntilClear(rider, bike);
    reachHands(rider);
    if (bike.seat) liftToSeat(rider, bike.seat);
  }
  rider.tankScaleX = bike?.tank?.scale.x ?? null;
  rider.tankScaleZ = bike?.tank?.scale.z ?? null;
  rider.base.copy(rider.mount.position);
  applyRidePose(rider, 0);
  return { fitted, proxies };
}

function localAabbOf(root) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  let any = false;
  root.traverse((o) => {
    if (!o.isMesh || o.userData.l4Debug) return;
    const pos = o.geometry?.attributes?.position;
    if (!pos) return;
    o.updateWorldMatrix(true, false);
    const stride = Math.max(1, Math.ceil(pos.count / 2500));
    for (let i = 0; i < pos.count; i += stride) {
      p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      box.expandByPoint(p);
      any = true;
    }
  });
  return any && !box.isEmpty() ? box : null;
}

function buildBikeProxies(bike) {
  const proxies = [];
  for (const [obj, kind] of [[bike.seat, 'seat'], [bike.tank, 'tank'], [bike.eng, 'engine']]) {
    if (!obj) continue;
    const localBox = localAabbOf(obj);
    if (localBox) proxies.push({ obj, kind, localBox });
  }
  if (bike.steer) {
    const bar = HANDLE_BOX.clone();
    const shift = bike.steer.userData.l4BarShift;
    if (shift) { bar.min.add(shift); bar.max.add(shift); }
    proxies.push({ obj: bike.steer, kind: 'handlebar', localBox: bar });
  }
  return proxies;
}

function meshCrossRadius(meshes, fallback) {
  let radius = fallback;
  const size = new THREE.Vector3();
  const ws = new THREE.Vector3();
  for (const m of meshes) {
    const geo = m.geometry;
    if (!geo) continue;
    if (!geo.boundingBox) geo.computeBoundingBox();
    geo.boundingBox.getSize(size);
    m.getWorldScale(ws);
    const dims = [size.x * Math.abs(ws.x), size.y * Math.abs(ws.y), size.z * Math.abs(ws.z)].sort((a, b) => a - b);
    radius = Math.max(radius, (dims[0] + dims[1]) * 0.25);
  }
  return THREE.MathUtils.clamp(radius || fallback, 0.035, 0.11);
}

function limbSpheres(rider) {
  const spheres = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (const limb of rider.limbs || []) {
    if (limb.kind === 'leg') {
      const upperM = collectOwnedMeshes(limb.upper);
      const lowerM = collectOwnedMeshes(limb.lower);
      const endM = collectOwnedMeshes(limb.end);
      limb.upper.getWorldPosition(a);
      limb.lower.getWorldPosition(b);
      limb.end.getWorldPosition(c);
      spheres.push({
        part: 'thigh', side: limb.side, joint: limb.upper,
        center: a.clone().add(b).multiplyScalar(0.5),
        radius: meshCrossRadius(upperM, a.distanceTo(b) * 0.22),
      });
      spheres.push({
        part: 'calf', side: limb.side, joint: limb.lower,
        center: b.clone().add(c).multiplyScalar(0.5),
        radius: meshCrossRadius(lowerM, b.distanceTo(c) * 0.2),
      });
      spheres.push({
        part: 'foot', side: limb.side, joint: limb.end,
        center: c.clone(), radius: meshCrossRadius(endM, 0.055),
      });
    } else {
      const endM = collectOwnedMeshes(limb.end);
      limb.end.getWorldPosition(c);
      spheres.push({
        part: 'hand', side: limb.side, joint: limb.end,
        center: c.clone(), radius: meshCrossRadius(endM, 0.05),
      });
    }
  }
  return spheres;
}

/** World-space push that moves a sphere out of an oriented box. Null when already clear. */
function spherePushOut(sphere, proxy) {
  const box = proxy.localBox;
  const size = box.getSize(new THREE.Vector3());
  const localCenter = box.getCenter(new THREE.Vector3());
  const mw = proxy.obj.matrixWorld;
  const e = mw.elements;
  const ax = new THREE.Vector3(e[0], e[1], e[2]);
  const ay = new THREE.Vector3(e[4], e[5], e[6]);
  const az = new THREE.Vector3(e[8], e[9], e[10]);
  const sx = ax.length() || 1;
  const sy = ay.length() || 1;
  const sz = az.length() || 1;
  ax.multiplyScalar(1 / sx);
  ay.multiplyScalar(1 / sy);
  az.multiplyScalar(1 / sz);
  const worldCenter = localCenter.applyMatrix4(mw);
  const hx = size.x * 0.5 * sx;
  const hy = size.y * 0.5 * sy;
  const hz = size.z * 0.5 * sz;
  const d = sphere.center.clone().sub(worldCenter);
  const lx = d.dot(ax);
  const ly = d.dot(ay);
  const lz = d.dot(az);
  const cx = THREE.MathUtils.clamp(lx, -hx, hx);
  const cy = THREE.MathUtils.clamp(ly, -hy, hy);
  const cz = THREE.MathUtils.clamp(lz, -hz, hz);
  const dx = lx - cx;
  const dy = ly - cy;
  const dz = lz - cz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist > 1e-5) {
    if (dist >= sphere.radius) return null;
    const k = (sphere.radius - dist) / dist;
    return ax.multiplyScalar(dx * k).add(ay.multiplyScalar(dy * k)).add(az.multiplyScalar(dz * k));
  }
  const px = hx - Math.abs(lx);
  const py = hy - Math.abs(ly);
  const pz = hz - Math.abs(lz);
  let axis = 0;
  let pen = px;
  if (py < pen) { axis = 1; pen = py; }
  if (pz < pen) { axis = 2; pen = pz; }
  const sign = axis === 0 ? (Math.sign(lx) || 1) : axis === 1 ? (Math.sign(ly) || 1) : (Math.sign(lz) || 1);
  return [ax, ay, az][axis].multiplyScalar(sign * (pen + sphere.radius));
}


function addBoxWire(parent, localBox, color) {
  const size = localBox.getSize(new THREE.Vector3());
  const center = localBox.getCenter(new THREE.Vector3());
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(size.x, 0.01), Math.max(size.y, 0.01), Math.max(size.z, 0.01)),
    new THREE.MeshBasicMaterial({ color, wireframe: true, depthTest: false, transparent: true, opacity: 0.95 }),
  );
  mesh.position.copy(center);
  mesh.userData.l4Debug = true;
  mesh.name = 'l4-proxy';
  mesh.frustumCulled = false;
  mesh.renderOrder = 20;
  mesh.raycast = () => {};
  parent.add(mesh);
}

function addSphereWire(joint, worldCenter, worldRadius, color) {
  if (!joint) return;
  const local = joint.worldToLocal(worldCenter.clone());
  const ws = new THREE.Vector3();
  joint.getWorldScale(ws);
  const s = Math.max(Math.abs(ws.x), Math.abs(ws.y), Math.abs(ws.z), 1e-4);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(worldRadius, 0.02) / s, 12, 8),
    new THREE.MeshBasicMaterial({ color, wireframe: true, depthTest: false, transparent: true, opacity: 0.9 }),
  );
  mesh.position.copy(local);
  mesh.userData.l4Debug = true;
  mesh.name = 'l4-proxy';
  mesh.frustumCulled = false;
  mesh.renderOrder = 21;
  mesh.raycast = () => {};
  joint.add(mesh);
}

function attachColliderDebug(rider, proxies) {
  const boxColor = { seat: 0x3dff7a, tank: 0xffb000, engine: 0xff4d4d, handlebar: 0x4db4ff };
  for (const p of proxies) addBoxWire(p.obj, p.localBox, boxColor[p.kind] || 0xffffff);
  for (const s of limbSpheres(rider)) addSphereWire(s.joint, s.center, s.radius, 0xffffff);
}

function pointInsideProxy(point, proxy) {
  const size = proxy.localBox.getSize(new THREE.Vector3());
  const mw = proxy.obj.matrixWorld;
  const e = mw.elements;
  const ax = new THREE.Vector3(e[0], e[1], e[2]);
  const ay = new THREE.Vector3(e[4], e[5], e[6]);
  const az = new THREE.Vector3(e[8], e[9], e[10]);
  const sx = ax.length() || 1;
  const sy = ay.length() || 1;
  const sz = az.length() || 1;
  ax.multiplyScalar(1 / sx);
  ay.multiplyScalar(1 / sy);
  az.multiplyScalar(1 / sz);
  const worldCenter = proxy.localBox.getCenter(new THREE.Vector3()).applyMatrix4(mw);
  const d = point.clone().sub(worldCenter);
  const hx = size.x * 0.5 * sx;
  const hy = size.y * 0.5 * sy;
  const hz = size.z * 0.5 * sz;
  return Math.abs(d.dot(ax)) <= hx && Math.abs(d.dot(ay)) <= hy && Math.abs(d.dot(az)) <= hz;
}

function measureSeatFit(rider, bike, proxies) {
  const meshes = pelvisThighMeshes(rider);
  let gap = null;
  let tank = 0;
  let engine = 0;
  const seat = bike?.seat;
  const sit = seat ? lowestSitPoint(rider, seat) : null;
  if (sit) gap = sit.y - sit.seatY;
  if (seat && meshes.length && proxies) {
    const tankP = proxies.find((p) => p.kind === 'tank');
    const engP = proxies.find((p) => p.kind === 'engine');
    const v = new THREE.Vector3();
    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes.position;
      mesh.updateWorldMatrix(true, false);
      const stride = Math.max(1, Math.ceil(pos.count / 2500));
      for (let i = 0; i < pos.count; i += stride) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        if (tankP && pointInsideProxy(v, tankP)) tank++;
        if (engP && pointInsideProxy(v, engP)) engine++;
      }
    }
  }
  const dist = (joint, anchor) => {
    if (!joint || !anchor) return null;
    const j = new THREE.Vector3();
    const t = new THREE.Vector3();
    return joint.getWorldPosition(j).distanceTo(anchor.getWorldPosition(t));
  };
  let foot = 0;
  let hand = 0;
  const anchors = rider.anchors;
  for (const limb of rider.limbs || []) {
    const anchor = limb.kind === 'leg'
      ? (limb.side === 'L' ? anchors?.pegL : anchors?.pegR)
      : (limb.side === 'L' ? anchors?.gripL : anchors?.gripR);
    const err = dist(limb.end, anchor);
    if (err == null) continue;
    if (limb.kind === 'leg') foot = Math.max(foot, err);
    else hand = Math.max(hand, err);
  }
  const clr = proxies?.length ? legClearance(rider, proxies) : null;
  return {
    gap, tank, engine, foot, hand,
    abduct: rider.abduct || 0,
    baseY: rider.base?.y ?? null,
    fitted: rider.seatFitted === true,
    thighTank: clr?.thighTank ?? null,
    thighSeat: clr?.thighSeat ?? null,
    thighEngine: clr?.thighEngine ?? null,
    calfTank: clr?.calfTank ?? null,
    calfSeat: clr?.calfSeat ?? null,
    calfEngine: clr?.calfEngine ?? null,
    clearMin: clr?.min ?? null,
    tankShortened: rider.tankShortened === true,
    tankScaleX: rider.tankScaleX ?? null,
    tankScaleZ: rider.tankScaleZ ?? null,
    barPull: rider.barPull ?? 0,
    pitch: rider.torsoPitch ?? null,
  };
}

/**
 * Bob-local pelvis target: as far back on the seat as the legs can still
 * plant on the pegs. The tank is shortened afterward so this spot sits behind it.
 */
function seatTargetBob(bob, seat, rider) {
  bob.updateWorldMatrix(true, true);
  const seatBox = new THREE.Box3().setFromObject(seat);
  if (seatBox.isEmpty()) return null;
  const center = seatBox.getCenter(new THREE.Vector3());
  const peg = rider?.anchors?.pegL;
  const pegW = new THREE.Vector3();
  if (peg) peg.getWorldPosition(pegW);
  else pegW.set(center.x, seatBox.min.y, center.z + 0.45);
  const leg = rider?.limbs?.find((l) => l.kind === 'leg');
  const scale = rider?.mount?.scale?.x || rider?.scale || 1;
  const reach = leg ? (leg.lower.position.length() + leg.end.position.length()) * scale * 0.97 : 0.7;
  const dy = seatBox.max.y + 0.06 - pegW.y;
  const horiz = Math.sqrt(Math.max(0, reach * reach - dy * dy));
  const dz = Math.sqrt(Math.max(0, horiz * horiz - 0.1 * 0.1));
  let z = pegW.z - dz;
  z = THREE.MathUtils.clamp(z, seatBox.min.z + 0.08, seatBox.max.z - 0.06);
  const ray = new THREE.Raycaster(new THREE.Vector3(center.x, seatBox.max.y + 0.5, z), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObject(seat, true);
  const world = hits.length ? hits[0].point.clone() : new THREE.Vector3(center.x, seatBox.max.y, z);
  world.y += 0.1;
  return bob.worldToLocal(world);
}

export function seatOnBike(rider, bob, anchors, bike = null) {
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
  rider.anchors = anchors;
  rider.scale = scale;
  const pelvisL = new THREE.Vector3();
  rider.pelvis.getWorldPosition(pelvisL);
  pelvisL.multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const seatPt = (bike?.seat && seatTargetBob(bob, bike.seat, rider)) || SEAT;
  mount.position.set(seatPt.x - pelvisL.x, seatPt.y - pelvisL.y, seatPt.z - pelvisL.z);
  rider.base.copy(mount.position);
  mount.add(scene);
  rider.abduct = 0;
  if (rider.poseKind === 'crouch' && rider.crouchClip) {
    const act = rider.mixer.clipAction(rider.crouchClip);
    act.play();
    rider.mixer.setTime(rider.crouchClip.duration * 0.5);
    rider.mixer.update(0);
    act.paused = true;
    rider.crouchAction = act;
    rider.crouchMid = rider.crouchClip.duration * 0.5;
  }
  // Pose first, then measure the sitting flesh. No seat mesh → keep the pelvis-joint placement.
  applyRidePose(rider, 0);
  rider.seatFitted = false;
  rider.torsoPitch = 0.62;
  let proxies = null;
  if (rider.poseKind !== 'place' && bike?.seat) {
    const settled = settleRider(rider, bike);
    rider.seatFitted = settled.fitted;
    proxies = settled.proxies;
  }
  scene.traverse((o) => {
    if (o.isMesh && !o.userData.l4Debug) { o.castShadow = true; o.frustumCulled = true; }
  });
  if (proxies && debugCollidersEnabled()) attachColliderDebug(rider, proxies);
  rider.fitReport = proxies ? measureSeatFit(rider, bike, proxies) : null;
  return mount;
}

function applyTorso(rider, lean) {
  const spines = (rider.spines && rider.spines.length ? rider.spines : (rider.spine ? [rider.spine] : []));
  const total = rider.torsoPitch ?? 0.85;
  spines.forEach((s, i) => {
    const share = spines.length === 1 ? total : (i === 0 ? total * 0.55 : total * 0.45 / Math.max(1, spines.length - 1));
    const roll = i === spines.length - 1 ? -lean * 0.4 : 0;
    const extra = new THREE.Quaternion().setFromEuler(new THREE.Euler(share, 0, roll, 'XYZ'));
    s.quaternion.copy(s.userData._bind.q).multiply(extra);
  });
  lookAhead(rider);
}

/** Keep the head upright, looking along the bike, while the chest tucks. */
function lookAhead(rider) {
  const head = rider.head;
  if (!head?.parent || !head.userData._bind) return;
  head.quaternion.copy(head.userData._bind.q);
  head.updateWorldMatrix(true, false);
  const parentQ = new THREE.Quaternion();
  head.parent.getWorldQuaternion(parentQ);
  const bindFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(head.userData._bind.q).normalize();
  const bob = rider.anchors?.bob;
  const ahead = new THREE.Vector3(0, 0.15, 1);
  if (bob) {
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(bob.matrixWorld);
    const up = new THREE.Vector3(0, 1, 0).transformDirection(bob.matrixWorld);
    ahead.copy(fwd).addScaledVector(up, 0.18).normalize();
  } else ahead.normalize();
  const desiredLocal = ahead.applyQuaternion(parentQ.clone().invert());
  if (desiredLocal.lengthSq() < 1e-6 || bindFwd.lengthSq() < 1e-6) return;
  desiredLocal.normalize();
  const align = new THREE.Quaternion().setFromUnitVectors(bindFwd, desiredLocal);
  head.quaternion.copy(align.multiply(head.userData._bind.q));
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
  applyTorso(rider, lean);
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
    if (limb.kind === 'leg') pole.addScaledVector(fwd, 0.85).addScaledVector(up, 0.05).addScaledVector(side, sign * (0.12 + (rider.abduct || 0)));
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

/** Half-width of the inner wall at height y. 0 above the crown. */
export function tunnelHalfWidth(y) {
  if (y <= L4_SPRING_Y) return L4_WALL_X;
  const t = (y - L4_SPRING_Y) / L4_ARCH_RY;
  if (t >= 1) return 0;
  return L4_WALL_X * Math.sqrt(Math.max(0, 1 - t * t));
}

/**
 * Analytic inside-test for the extruded tunnel profile.
 * `margin` shrinks the vertical walls and the arch inward (metres).
 */
export function tunnelContains(x, y, margin = 0) {
  const rx = L4_WALL_X - margin;
  const ry = L4_ARCH_RY - margin;
  if (rx <= 0.05) return false;
  if (y <= L4_SPRING_Y) return Math.abs(x) <= rx;
  if (ry <= 0.05) return false;
  const nx = x / rx;
  const ny = (y - L4_SPRING_Y) / ry;
  return nx * nx + ny * ny <= 1;
}

/**
 * Bike-center x interval so the contact point (road height) and the leaned
 * rider both stay `L4_WALL_INSET` inside the shell.
 */
export function bikeLateralLimit(y, leanZ, heading = Math.PI) {
  const roadHalf = Math.max(0.35, tunnelHalfWidth(Math.max(0, y)) - L4_WALL_INSET);
  const yaw = heading + Math.PI;
  const s = Math.sin(leanZ);
  const c = Math.cos(leanZ);
  const lx = -L4_RIDER_H * s;
  const wy = y + L4_RIDER_H * c;
  const wx = lx * Math.cos(yaw);
  const riderHalf = Math.max(0, tunnelHalfWidth(wy) - L4_WALL_INSET);
  let lo = Math.max(-roadHalf, -riderHalf - wx);
  let hi = Math.min(roadHalf, riderHalf - wx);
  if (!(hi >= lo)) {
    const mid = Math.max(-roadHalf, Math.min(roadHalf, -wx));
    lo = hi = mid;
  }
  return { lo, hi };
}

/**
 * If `b` is outside the inset profile, slide it toward `a` along that segment
 * until it is inside. Returns true when the point moved. Writes into `out`.
 */
export function pullInsideTunnel(ax, ay, az, bx, by, bz, margin, out) {
  if (tunnelContains(bx, by, margin)) {
    out.set(bx, by, bz);
    return false;
  }
  let sx = ax;
  let sy = ay;
  let sz = az;
  if (!tunnelContains(sx, sy, margin)) {
    const half = Math.max(0, tunnelHalfWidth(Math.max(0, sy)) - margin - 0.02);
    sx = Math.max(-half, Math.min(half, sx));
    const crown = L4_SPRING_Y + Math.max(0.05, L4_ARCH_RY - margin) - 0.02;
    if (sy > crown) sy = crown;
    if (sy < 0.2) sy = 0.2;
  }
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) * 0.5;
    const x = sx + (bx - sx) * mid;
    const y = sy + (by - sy) * mid;
    if (tunnelContains(x, y, margin)) lo = mid;
    else hi = mid;
  }
  out.set(sx + (bx - sx) * lo, sy + (by - sy) * lo, sz + (bz - sz) * lo);
  return true;
}

const _camFocus = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camSafe = new THREE.Vector3();
const _camLook = new THREE.Vector3();

function buildTunnel(scene) {
  const profile = [];
  profile.push([-L4_WALL_X, 0]);
  profile.push([-L4_WALL_X, L4_SPRING_Y]);
  const arc = 7;
  for (let i = 1; i < arc; i++) {
    const ang = Math.PI * (1 - i / arc);
    profile.push([Math.cos(ang) * L4_WALL_X, L4_SPRING_Y + Math.sin(ang) * L4_ARCH_RY]);
  }
  profile.push([L4_WALL_X, L4_SPRING_Y]);
  profile.push([L4_WALL_X, 0]);
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
#l4pick canvas{width:100%;height:248px;display:block;border-radius:10px;background:radial-gradient(#243044,#0c1016)}
#l4pick .go{margin-top:14px;width:100%;min-height:52px;border:0;border-radius:12px;background:#4f7a3a;color:#fff;font:bold 20px sans-serif;touch-action:manipulation}
#l4pick .go:disabled{opacity:.45}
#l4pick .hint{margin:8px 0 0;font-size:12px;opacity:.6;text-align:center}
#l4pick .err{color:#ff8d7a;font-size:14px;min-height:1.2em;text-align:center}
#l4pick label.card{position:relative}
#l4pick label.card input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
#l4setBtn{position:absolute;right:14px;top:58px;z-index:6;min-height:44px;padding:8px 14px;border-radius:10px;border:2px solid rgba(255,255,255,.55);background:rgba(0,0,0,.45);color:#fff;font:bold 15px sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#l4set{position:fixed;inset:0;z-index:28;display:none;align-items:center;justify-content:center;background:rgba(6,8,12,.55);padding:16px;box-sizing:border-box}
#l4set.on{display:flex}
#l4set .sheet{width:min(420px,100%);background:#141820;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);touch-action:manipulation}
#l4set h3{margin:0 0 12px;color:#ffd24a;font-size:22px}
#l4set .k{margin:0 0 8px;font-size:13px;letter-spacing:.04em;opacity:.75}
#l4set .modes{display:flex;gap:8px;flex-wrap:wrap}
#l4set .modes button{flex:1 1 140px;min-height:48px;border-radius:12px;border:2px solid rgba(255,255,255,.3);background:transparent;color:#fff;font:bold 15px sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#l4set .modes button.on{background:#ffd24a;color:#1b2a3a;border-color:#ffd24a}
#l4set label.zoom{display:block;margin-top:16px;font-size:15px}
#l4set input[type=range]{display:block;width:100%;margin-top:10px;height:36px;touch-action:pan-x}
#l4set .done{margin-top:16px;width:100%;min-height:48px;border:0;border-radius:12px;background:#4f7a3a;color:#fff;font:bold 18px sans-serif;touch-action:manipulation}
`;
  document.head.appendChild(s);
}

const CAM_KEY = 'guru-run-l4-cam';
function readCam() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAM_KEY) || '{}');
    const mode = raw.mode === 'near' ? 'near' : 'far';
    let zoom = Number(raw.zoom);
    if (!Number.isFinite(zoom)) zoom = 100;
    zoom = Math.round(THREE.MathUtils.clamp(zoom, 60, 150));
    return { mode, zoom };
  } catch {
    return { mode: 'far', zoom: 100 };
  }
}
function writeCam(cam) {
  try { localStorage.setItem(CAM_KEY, JSON.stringify({ mode: cam.mode, zoom: cam.zoom })); } catch { /* private mode */ }
}

/** Frame a preview camera to the model's current world bounds (after its own scale). */
function framePreviewCamera(cam, model, margin = 1.28) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const vFov = THREE.MathUtils.degToRad(cam.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.2, cam.aspect));
  const halfH = Math.max(size.y, 0.001) * 0.5 * margin;
  const halfW = Math.max(size.x, size.z, 0.001) * 0.5 * margin;
  const dist = Math.max(halfH / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2));
  cam.position.set(center.x, center.y, center.z + dist);
  cam.near = Math.max(0.01, dist * 0.02);
  cam.far = dist * 4 + size.length() + 2;
  cam.lookAt(center);
  cam.updateProjectionMatrix();
  return { center, dist, size };
}

function startPreview(canvas, gltf) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 80);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.4));
  const dir = new THREE.DirectionalLight(0xfff1d2, 1.8);
  dir.position.set(1.5, 2.4, 3);
  scene.add(dir);
  const model = gltf.scene;
  captureBind(model);
  restoreBind(model);
  model.rotation.set(0, 0, 0);
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  scene.add(model);
  model.updateMatrixWorld(true);
  const resize = () => {
    const w = canvas.clientWidth || canvas.width || 280;
    const h = canvas.clientHeight || canvas.height || 248;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    cam.aspect = w / Math.max(1, h);
    cam.updateProjectionMatrix();
  };
  resize();
  framePreviewCamera(cam, model);
  const mixer = new THREE.AnimationMixer(model);
  const idle = findClip(gltf.animations, ['idle']);
  if (idle) mixer.clipAction(idle).play();
  let alive = true;
  let last = performance.now();
  let smoothDist = 0;
  let smoothY = 0;
  let haveSmooth = false;
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);
  const loop = (now) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mixer.update(dt);
    model.rotation.y += dt * 0.35;
    const framed = framePreviewCamera(cam, model);
    if (framed) {
      if (!haveSmooth) { smoothDist = framed.dist; smoothY = framed.center.y; haveSmooth = true; }
      else {
        smoothDist += (framed.dist - smoothDist) * 0.18;
        smoothY += (framed.center.y - smoothY) * 0.18;
      }
      cam.position.set(framed.center.x, smoothY, framed.center.z + smoothDist);
      cam.lookAt(framed.center.x, smoothY, framed.center.z);
    }
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return {
    stop() {
      alive = false;
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
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
  camera.near = 0.05;
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
  // GRIP_* is in bike-root space. Convert through the root so a spawned offset (z = 2) still lands on the bars.
  anchors.gripL.position.copy(B.steer.worldToLocal(B.root.localToWorld(GRIP_L.clone())));
  anchors.gripR.position.copy(B.steer.worldToLocal(B.root.localToWorld(GRIP_R.clone())));
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
  let wallCd = 0;
  let wallPush = 0;
  let invul = 0;
  let raceT = 0;
  let finishT = -1;
  let done = false;
  let racing = false;
  let rider = null;
  let eng = null;
  let last = performance.now();
  const camSet = readCam();
  let camHold = '';
  camPos.set(0, 3.2, -4);

  function chaseMargin() {
    const near = camera.near;
    const aspect = Math.max(camera.aspect || 1, 0.5);
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * near;
    const halfW = halfH * aspect;
    // 0.3 m inside the shell, plus the near-plane corner so the wall is not clipped.
    return L4_CAM_MARGIN + Math.hypot(halfW, halfH);
  }

  function applyChase(dt) {
    const gp = B.root.position;
    const zoom = camSet.zoom;
    const mul = 100 / zoom;
    const key = camSet.mode + ':' + zoom;
    const changed = key !== camHold;
    camHold = key;
    const snap = changed && !(camSet.mode !== 'near' && zoom === 100);
    const nearMode = camSet.mode === 'near';
    let fovTarget;
    let alpha;
    // Daleko at 100% keeps the original chase offsets; every mode is then kept inside the shell.
    if (!nearMode && zoom === 100) {
      _camDesired.set(Math.sin(heading) * 6.2, 2.9, Math.cos(heading) * 6.2).add(gp);
      _camLook.set(gp.x, gp.y + 1.5, gp.z + 3);
      alpha = 1 - Math.pow(0.01, dt);
      fovTarget = 58 + speed * 1.1;
    } else {
      const dist = (nearMode ? 3.2 : 6.2) * mul;
      const height = nearMode ? 1.72 : 2.9;
      const lookY = nearMode ? 1.22 : 1.5;
      const fovBase = nearMode ? 42 : 58;
      const fovKick = nearMode ? 0.2 : 1.1;
      if (nearMode) {
        const fx = -Math.sin(heading);
        const fz = -Math.cos(heading);
        const lookA = 0.35;
        _camDesired.set(gp.x - fx * dist, gp.y + height, gp.z - fz * dist);
        _camLook.set(gp.x + fx * lookA, gp.y + lookY, gp.z + fz * lookA);
        alpha = snap ? 1 : Math.min(1, dt * 45);
      } else {
        _camDesired.set(Math.sin(heading) * dist, height, Math.cos(heading) * dist).add(gp);
        _camLook.set(gp.x, gp.y + lookY, gp.z + 3 * mul);
        alpha = snap ? 1 : 1 - Math.pow(0.01, dt);
      }
      fovTarget = fovBase + speed * fovKick;
    }
    camera.near = 0.05;
    camera.fov += (fovTarget - camera.fov) * Math.min(1, dt * 3);
    const margin = chaseMargin();
    _camFocus.set(gp.x, gp.y + 1.35, gp.z);
    const pulled = pullInsideTunnel(
      _camFocus.x, _camFocus.y, _camFocus.z,
      _camDesired.x, _camDesired.y, _camDesired.z,
      margin, _camSafe,
    );
    const smooth = 1 - Math.pow(0.001, dt);
    const k = snap ? 1 : (pulled ? Math.min(alpha, smooth) : alpha);
    camPos.lerp(_camSafe, k);
    if (!tunnelContains(camPos.x, camPos.y, margin)) {
      pullInsideTunnel(_camFocus.x, _camFocus.y, _camFocus.z, camPos.x, camPos.y, camPos.z, margin, camPos);
    }
    camera.position.copy(camPos);
    camera.lookAt(_camLook);
    camera.updateProjectionMatrix();
  }

  function applyDebugCam() {
    const lock = window.__l4camLock;
    if (!lock) return;
    camera.position.set(lock.x, lock.y, lock.z);
    camera.lookAt(lock.tx, lock.ty, lock.tz);
    if (Number.isFinite(lock.fov)) camera.fov = lock.fov;
    camera.near = 0.05;
    camera.updateProjectionMatrix();
  }

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
    cam: camSet.mode, zoom: camSet.zoom,
    camDist: camera.position.distanceTo(B.root.position),
    camY: camera.position.y, camAhead: B.root.position.z - camera.position.z, fov: camera.fov,
    camX: camera.position.x, camZ: camera.position.z,
    camInside: tunnelContains(camera.position.x, camera.position.y, L4_CAM_MARGIN),
    camNear: camera.near,
    heading, lean: B.lean.rotation.z,
  });
  window.__l4 = state;
  window.__l4obs = obs;
  if (debugCollidersEnabled()) {
    window.__l4debug = {
      scene, camera, renderer,
      get bike() { return B; },
      get rider() { return rider; },
    };
  }

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
    document.getElementById('l4setBtn')?.style.setProperty('display', 'none');
    document.getElementById('l4set')?.classList.remove('on');
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
    seatOnBike(rider, B.bob, anchors, { seat: B.seat, tank: B.tank, eng: B.eng, steer: B.steer });
    const fit = rider.fitReport || {};
    window.__l4rider = {
      pose: rider.poseKind, jump: rider.jumpName, limbs: rider.limbs.length,
      abduct: rider.abduct || 0, baseY: rider.base.y, fitted: rider.seatFitted === true,
      gap: fit.gap ?? null, tank: fit.tank ?? null, engine: fit.engine ?? null,
      foot: fit.foot ?? null, hand: fit.hand ?? null,
      thighTank: fit.thighTank ?? null, thighSeat: fit.thighSeat ?? null, thighEngine: fit.thighEngine ?? null,
      calfTank: fit.calfTank ?? null, calfSeat: fit.calfSeat ?? null, calfEngine: fit.calfEngine ?? null,
      clearMin: fit.clearMin ?? null,
      tankShortened: fit.tankShortened === true,
      tankScaleX: fit.tankScaleX ?? null, tankScaleZ: fit.tankScaleZ ?? null,
      barPull: fit.barPull ?? 0, pitch: fit.pitch ?? null,
    };
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
      camera.near = 0.05;
      _camFocus.set(gp.x, gp.y + 1.35, gp.z);
      if (!tunnelContains(camPos.x, camPos.y, chaseMargin())) {
        pullInsideTunnel(_camFocus.x, _camFocus.y, _camFocus.z, camPos.x, camPos.y, camPos.z, chaseMargin(), camPos);
      }
      camera.position.copy(camPos);
      camera.lookAt(gp.x, gp.y + 1.35, gp.z + 2);
      applyDebugCam();
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
    gp.z = Math.max(gp.z, -1);
    if (wallPush) {
      gp.x += wallPush * dt;
      wallPush *= Math.exp(-dt * 4.5);
      if (Math.abs(wallPush) < 0.05) wallPush = 0;
    }
    const lim = bikeLateralLimit(gp.y, B.lean.rotation.z, heading);
    let into = 0;
    if (gp.x > lim.hi) { gp.x = lim.hi; into = 1; }
    else if (gp.x < lim.lo) { gp.x = lim.lo; into = -1; }
    wallCd = Math.max(0, wallCd - dt);
    if (into && finishT < 0 && wallCd <= 0) {
      wallCd = L4_WALL_HIT_CD;
      wallPush = -into * (2.1 + Math.min(speed, 16) * 0.05);
      speed = speed > 8 ? Math.max(8, speed * 0.92) : speed * 0.92;
      heading = THREE.MathUtils.clamp(heading - into * 0.18, Math.PI - 0.7, Math.PI + 0.7);
      gp.x = Math.min(lim.hi, Math.max(lim.lo, gp.x - into * 0.1));
      hits++;
      if (elB) elB.textContent = 'Nárazy ' + hits;
      showToast('Náraz!');
    }
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
    // Re-clamp after lean and jump so the rendered pose stays inside the shell.
    {
      const limNow = bikeLateralLimit(gp.y, B.lean.rotation.z, heading);
      if (gp.x > limNow.hi) gp.x = limNow.hi;
      else if (gp.x < limNow.lo) gp.x = limNow.lo;
    }
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
    applyChase(dt);
    applyDebugCam();
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
          <canvas id="l4prevC" width="320" height="280" hidden></canvas>
          <b>Nahrát vlastní GLB</b>
          <small id="l4fileName">klipy Idle, Walk, Run, Jump</small>
        </label>
      </div>
      <button type="button" class="go" id="l4go">Jedu!</button>
      <p class="hint">Volba se uloží v tomto prohlížeči. Plyn, šipky a Skok jako na levelu 2.</p>
      <p class="err" id="l4err"></p>
    </div>`;
  document.body.appendChild(root);
  const stage = document.getElementById('stage');
  const setBtn = document.createElement('button');
  setBtn.id = 'l4setBtn';
  setBtn.type = 'button';
  setBtn.textContent = 'Nastavení';
  const setPanel = document.createElement('div');
  setPanel.id = 'l4set';
  setPanel.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Nastavení">
      <h3>Nastavení</h3>
      <p class="k">Kamera</p>
      <div class="modes" role="radiogroup" aria-label="Kamera">
        <button type="button" data-cam="far" role="radio">Daleko (výchozí)</button>
        <button type="button" data-cam="near" role="radio">Blízko</button>
      </div>
      <label class="zoom">Přiblížení <span id="l4zoomVal"></span>
        <input id="l4zoom" type="range" min="60" max="150" step="1" value="${camSet.zoom}" aria-label="Přiblížení kamery" />
      </label>
      <button type="button" class="done" id="l4setClose">Hotovo</button>
    </div>`;
  stage.appendChild(setBtn);
  document.body.appendChild(setPanel);
  const zoomInput = setPanel.querySelector('#l4zoom');
  const zoomVal = setPanel.querySelector('#l4zoomVal');
  const syncCamUi = () => {
    setPanel.querySelectorAll('[data-cam]').forEach((b) => {
      const on = b.getAttribute('data-cam') === camSet.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    zoomInput.value = String(camSet.zoom);
    zoomVal.textContent = camSet.zoom + ' %';
  };
  syncCamUi();
  setBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); setPanel.classList.add('on'); });
  setPanel.querySelector('#l4setClose').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); setPanel.classList.remove('on'); });
  setPanel.addEventListener('pointerdown', (e) => { if (e.target === setPanel) { e.preventDefault(); setPanel.classList.remove('on'); } });
  setPanel.querySelector('.sheet').addEventListener('pointerdown', (e) => e.stopPropagation());
  setPanel.querySelectorAll('[data-cam]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      camSet.mode = b.getAttribute('data-cam') === 'near' ? 'near' : 'far';
      writeCam(camSet);
      syncCamUi();
    });
  });
  const onZoom = () => {
    camSet.zoom = Math.round(THREE.MathUtils.clamp(Number(zoomInput.value) || 100, 60, 150));
    writeCam(camSet);
    zoomVal.textContent = camSet.zoom + ' %';
  };
  zoomInput.addEventListener('input', onZoom);
  zoomInput.addEventListener('pointerdown', (e) => e.stopPropagation());
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
  let customPreview = null;
  let customGltf = null;
  const canvasC = root.querySelector('#l4prevC');
  function showCustomPreview(gltf) {
    if (customPreview) { customPreview.stop(); customPreview = null; }
    canvasC.hidden = false;
    customPreview = startPreview(canvasC, gltf);
  }

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
      showCustomPreview(customGltf);
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
      showCustomPreview(customGltf);
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
    if (customPreview) { customPreview.stop(); customPreview = null; }
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
