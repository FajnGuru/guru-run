// Procedurální retro motorka (café racer / scrambler) – PR6: tank + SIKI logo
import * as THREE from 'three';
import { buildSiki } from './siki-model.js';

function textTex(text, opts = {}) {
  const w = opts.w || 320, h = opts.h || 110;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.font = opts.font || `bold ${opts.size || 88}px Arial, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opts.stroke) {
    x.strokeStyle = opts.stroke; x.lineWidth = opts.lineWidth || 10; x.lineJoin = 'round';
    x.strokeText(text, w / 2, h / 2 + 2);
  }
  x.fillStyle = opts.fill || '#0a0a0a';
  x.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

/** Horizontal brushed-metal grain (mobile 128px). */
let _brushMap;
function brushMap() {
  if (_brushMap) return _brushMap;
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c4c8ce';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    const v = 160 + ((Math.sin(y * .7) * 18 + Math.random() * 40) | 0);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${.35 + Math.random() * .25})`;
    ctx.fillRect(0, y, s, 1);
  }
  for (let i = 0; i < 80; i++) {
    const y = (Math.random() * s) | 0;
    ctx.strokeStyle = `rgba(255,255,255,${.08 + Math.random() * .12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y + (Math.random() * 2 - 1));
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.needsUpdate = true;
  return (_brushMap = tex);
}

export function buildMotorbike(withRider = true) {
  const std = (c, r = .6, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });
  const brush = brushMap();
  const m = {
    chrome: std(0xdfe3e8, .18, { metalness: .95 }),
    silver: std(0xb9bec4, .32, { metalness: .82, map: brush, roughnessMap: brush, bumpMap: brush, bumpScale: .03 }),
    silverSoft: std(0xc8ccd2, .38, { metalness: .75, map: brush, bumpMap: brush, bumpScale: .02 }),
    tire: std(0x161616, .9),
    black: std(0x1e1e1e, .5),
    engine: std(0x5a5d62, .5, { metalness: .6 }),
    glass: std(0xfff6d0, .1, { emissive: 0xfff2b0, emissiveIntensity: .6 }),
    seat: std(0x111111, .72),
    seatSoft: std(0x1a1a1a, .78),
    rubber: std(0x222222, .85),
  };
  const mesh = (g, mat, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, mat); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const cyl = (r, l, mat, a, b) => { // válec mezi body a,b
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), k = mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 8), mat);
    k.position.copy(A).add(B).multiplyScalar(.5); k.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return k; };
  const root = new THREE.Group(), lean = new THREE.Group(); root.add(lean); const bob = new THREE.Group(); lean.add(bob);
  const R = .36;
  const wheel = () => { const w = new THREE.Group(), spin = new THREE.Group(); w.add(spin);
    spin.add(mesh(new THREE.TorusGeometry(R - .04, .07, 10, 28), m.tire, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    spin.add(mesh(new THREE.TorusGeometry(R - .11, .018, 6, 24), m.chrome, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    spin.add(mesh(new THREE.CylinderGeometry(.06, .06, .14, 12), m.chrome, [0, 0, 0], null, [0, 0, Math.PI / 2]));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; spin.add(cyl(.006, 0, m.chrome, [(i % 2 ? .04 : -.04), 0, 0], [0, Math.sin(a) * (R - .11), Math.cos(a) * (R - .11)])); }
    spin.add(mesh(new THREE.CylinderGeometry(.12, .12, .02, 16), m.silverSoft, [.06, 0, 0], null, [0, 0, Math.PI / 2])); // kotouč
    w.spin = spin; return w; };
  const rear = wheel(); rear.position.set(0, R, -.72); bob.add(rear);
  const steer = new THREE.Group(); steer.position.set(0, .95, .52); steer.rotation.x = .38; bob.add(steer);
  const front = wheel(); front.position.set(0, -.62, .25); // v souřadnicích řízení
  const fg = new THREE.Group(); fg.rotation.x = -.38; steer.add(fg); // vyrovnat kolo
  front.position.set(0, R - .95, .52 - .52 + .28); fg.add(front);
  [-1, 1].forEach(s => { steer.add(cyl(.025, 0, m.chrome, [s * .1, .1, 0], [s * .1, -.7, 0])); });
  // round headlight (café)
  steer.add(mesh(new THREE.CylinderGeometry(.12, .11, .12, 18), m.chrome, [0, .02, .14], null, [Math.PI / 2, 0, 0]));
  steer.add(mesh(new THREE.CylinderGeometry(.095, .095, .02, 18), m.glass, [0, .02, .205], null, [Math.PI / 2, 0, 0]));
  steer.add(mesh(new THREE.TorusGeometry(.11, .012, 6, 18), m.chrome, [0, .02, .14], null, [0, 0, 0]));
  steer.add(cyl(.018, 0, m.chrome, [-.36, .22, -.08], [.36, .22, -.08]));                                                     // řídítka
  [-1, 1].forEach(s => { steer.add(mesh(new THREE.CylinderGeometry(.03, .03, .12, 8), m.black, [s * .34, .22, -.08], null, [0, 0, Math.PI / 2]));
    steer.add(cyl(.008, 0, m.chrome, [s * .26, .22, -.08], [s * .32, .42, -.06])); steer.add(mesh(new THREE.CylinderGeometry(.05, .05, .015, 12), m.chrome, [s * .33, .45, -.06], null, [Math.PI / 2, 0, 0])); });
  // front fender (short café)
  bob.add(mesh(new THREE.BoxGeometry(.14, .025, .42), m.silverSoft, [0, .78, .48], null, [-.28, 0, 0]));
  bob.add(mesh(new THREE.BoxGeometry(.12, .02, .18), m.silver, [0, .7, .68], null, [-.55, 0, 0]));
  // rám
  bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .95, -.45])); bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .42, .05]));
  bob.add(cyl(.03, 0, m.black, [0, .95, -.45], [0, .4, -.72]));

  // —— tank v2: teardrop café / scrambler, brushed silver + bold SIKI ——
  const tank = new THREE.Group();
  tank.position.set(0, 1.08, .18);
  bob.add(tank);
  // main teardrop body (elongated Z, flatter Y)
  tank.add(mesh(new THREE.SphereGeometry(.28, 20, 14), m.silver, [0, 0, 0], [.88, .58, 1.72]));
  // lower belly fill for volume
  tank.add(mesh(new THREE.SphereGeometry(.2, 14, 10), m.silverSoft, [0, -.06, -.02], [.95, .45, 1.55]));
  // nose taper toward headstock
  tank.add(mesh(new THREE.SphereGeometry(.14, 12, 10), m.silver, [0, -.02, .32], [1.05, .7, 1.1]));
  // rear kneepad / side swell (classic café)
  [-1, 1].forEach(s => {
    tank.add(mesh(new THREE.SphereGeometry(.1, 10, 8), m.silverSoft, [s * .16, -.04, -.05], [.55, .7, 1.2]));
  });
  // filler cap
  tank.add(mesh(new THREE.CylinderGeometry(.05, .055, .03, 14), m.chrome, [0, .14, .05]));
  tank.add(mesh(new THREE.CylinderGeometry(.02, .02, .02, 8), m.black, [0, .16, .05]));
  // bold black SIKI on both flanks
  const sikiTank = textTex('SIKI', { fill: '#0a0a0a', size: 92, w: 340, h: 120 });
  [-1, 1].forEach(s => {
    const d = new THREE.Mesh(
      new THREE.PlaneGeometry(.32, .12),
      new THREE.MeshStandardMaterial({
        map: sikiTank, transparent: true, roughness: .55, metalness: .1,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
      })
    );
    d.position.set(s * .245, .02, .02);
    d.rotation.y = s * Math.PI / 2;
    d.rotation.z = s * -.02;
    tank.add(d);
  });

  // —— seat bench v2: flat black leather café bench ——
  const seat = new THREE.Group();
  seat.position.set(0, 1.02, -.4);
  bob.add(seat);
  // main bench (long, flat)
  seat.add(mesh(new THREE.BoxGeometry(.28, .07, .72), m.seat, [0, 0, 0], null, [.06, 0, 0]));
  // top pad slightly softer / wider
  seat.add(mesh(new THREE.BoxGeometry(.3, .035, .68), m.seatSoft, [0, .04, .01], null, [.06, 0, 0]));
  // front step-down toward tank
  seat.add(mesh(new THREE.BoxGeometry(.26, .05, .12), m.seat, [0, -.02, .38], null, [-.2, 0, 0]));
  // rear slight upkick / loop end
  seat.add(mesh(new THREE.BoxGeometry(.26, .06, .1), m.seat, [0, .03, -.38], null, [.35, 0, 0]));
  // stitching ridge hint
  seat.add(mesh(new THREE.BoxGeometry(.02, .02, .6), m.rubber, [0, .055, 0], null, [.06, 0, 0]));

  // rear fender (silver, follows tire)
  bob.add(mesh(new THREE.BoxGeometry(.26, .035, .36), m.silverSoft, [0, .9, -.86], null, [-.2, 0, 0]));
  bob.add(mesh(new THREE.BoxGeometry(.22, .025, .16), m.silver, [0, .78, -1.02], null, [-.55, 0, 0]));

  // motor + výfuk (unchanged silhouette, slight chrome refresh)
  const eng = new THREE.Group(); eng.position.set(0, .55, .02); eng.scale.setScalar(1.3); bob.add(eng);
  eng.add(mesh(new THREE.BoxGeometry(.28, .26, .4), m.engine));
  for (let i = 0; i < 5; i++) eng.add(mesh(new THREE.BoxGeometry(.32, .015, .2), m.silverSoft, [0, .18 + i * .035, .08], null, [.35, 0, 0]));
  eng.add(mesh(new THREE.CylinderGeometry(.12, .12, .32, 16), m.silver, [0, -.08, -.08], null, [0, 0, Math.PI / 2]));
  bob.add(cyl(.04, 0, m.chrome, [.17, .5, .2], [.2, .32, -.2])); bob.add(cyl(.045, 0, m.chrome, [.2, .32, -.2], [.22, .42, -.95]));
  bob.add(cyl(.02, 0, m.chrome, [-.12, .5, -.55], [-.12, .95, -.5])); bob.add(cyl(.02, 0, m.chrome, [.12, .5, -.55], [.12, .95, -.5])); // tlumiče
  const res = { root, lean, bob, steer, front, rear, R, tank, seat };
  if (withRider) {
    const K = buildSiki(); const r = K.root; r.scale.setScalar(.56); r.position.set(0, .5, -.26); bob.add(r);
    K.body.rotation.x = .15;
    K.legs.forEach((l, i) => { l.rotation.set(-.85, 0, (i ? 1 : -1) * .32); l.children[2].rotation.x = .7; });
    K.arms.forEach((a, i) => a.rotation.set(-1.2, 0, (i ? 1 : -1) * .25));
    K.tail.rotation.x = .25;
    res.rider = K;
  }
  return res;
}
