// Procedurální retro motorka (café racer) + SIKI v jezdecké pozici
import * as THREE from 'three';
import { buildSiki } from './siki-model.js';

function textTex(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.font = 'bold 70px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1a1a1a'; x.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildMotorbike(withRider = true) {
  const std = (c, r = .6, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });
  const m = { chrome: std(0xdfe3e8, .18, { metalness: .95 }), silver: std(0xb9bec4, .3, { metalness: .8 }), tire: std(0x161616, .9), black: std(0x1e1e1e, .5),
    engine: std(0x5a5d62, .5, { metalness: .6 }), glass: std(0xfff6d0, .1, { emissive: 0xfff2b0, emissiveIntensity: .6 }), seat: std(0x111111, .7) };
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
    spin.add(mesh(new THREE.CylinderGeometry(.12, .12, .02, 16), m.silver, [.06, 0, 0], null, [0, 0, Math.PI / 2])); // kotouč
    w.spin = spin; return w; };
  const rear = wheel(); rear.position.set(0, R, -.72); bob.add(rear);
  const steer = new THREE.Group(); steer.position.set(0, .95, .52); steer.rotation.x = .38; bob.add(steer);
  const front = wheel(); front.position.set(0, -.62, .25); // v souřadnicích řízení
  const fg = new THREE.Group(); fg.rotation.x = -.38; steer.add(fg); // vyrovnat kolo
  front.position.set(0, R - .95, .52 - .52 + .28); fg.add(front);
  [-1, 1].forEach(s => { steer.add(cyl(.025, 0, m.chrome, [s * .1, .1, 0], [s * .1, -.7, 0])); });
  steer.add(mesh(new THREE.CylinderGeometry(.11, .1, .1, 16), m.chrome, [0, .02, .14], null, [Math.PI / 2, 0, 0]));       // světlo
  steer.add(mesh(new THREE.CylinderGeometry(.09, .09, .02, 16), m.glass, [0, .02, .2], null, [Math.PI / 2, 0, 0]));
  steer.add(cyl(.018, 0, m.chrome, [-.36, .22, -.08], [.36, .22, -.08]));                                                     // řídítka
  [-1, 1].forEach(s => { steer.add(mesh(new THREE.CylinderGeometry(.03, .03, .12, 8), m.black, [s * .34, .22, -.08], null, [0, 0, Math.PI / 2]));
    steer.add(cyl(.008, 0, m.chrome, [s * .26, .22, -.08], [s * .32, .42, -.06])); steer.add(mesh(new THREE.CylinderGeometry(.05, .05, .015, 12), m.chrome, [s * .33, .45, -.06], null, [Math.PI / 2, 0, 0])); });
  bob.add(mesh(new THREE.BoxGeometry(.12, .02, .5), m.silver, [0, .78, .5], null, [-.2, 0, 0]));  // blatník
  // rám, nádrž, sedlo, motor, výfuk
  bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .95, -.45])); bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .42, .05]));
  bob.add(cyl(.03, 0, m.black, [0, .95, -.45], [0, .4, -.72]));
  const tank = mesh(new THREE.SphereGeometry(.26, 18, 12), m.silver, [0, 1.06, .2], [.95, .68, 1.5]); bob.add(tank);
  [-1, 1].forEach(s => { const d = new THREE.Mesh(new THREE.PlaneGeometry(.26, .1), new THREE.MeshStandardMaterial({ map: textTex('SIKI'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    d.position.set(s * .25, 1.07, .2); d.rotation.y = s * Math.PI / 2; bob.add(d); });
  bob.add(mesh(new THREE.BoxGeometry(.26, .09, .62), m.seat, [0, 1.0, -.38], null, [.05, 0, 0]));
  bob.add(mesh(new THREE.BoxGeometry(.24, .04, .3), m.silver, [0, .92, -.82], null, [-.15, 0, 0]));  // zadní blatník
  const eng = new THREE.Group(); eng.position.set(0, .55, .02); eng.scale.setScalar(1.3); bob.add(eng);
  eng.add(mesh(new THREE.BoxGeometry(.28, .26, .4), m.engine));
  for (let i = 0; i < 5; i++) eng.add(mesh(new THREE.BoxGeometry(.32, .015, .2), m.silver, [0, .18 + i * .035, .08], null, [.35, 0, 0]));
  eng.add(mesh(new THREE.CylinderGeometry(.12, .12, .32, 16), m.silver, [0, -.08, -.08], null, [0, 0, Math.PI / 2]));
  bob.add(cyl(.04, 0, m.chrome, [.17, .5, .2], [.2, .32, -.2])); bob.add(cyl(.045, 0, m.chrome, [.2, .32, -.2], [.22, .42, -.95]));
  bob.add(cyl(.02, 0, m.chrome, [-.12, .5, -.55], [-.12, .95, -.5])); bob.add(cyl(.02, 0, m.chrome, [.12, .5, -.55], [.12, .95, -.5])); // tlumiče
  const res = { root, lean, bob, steer, front, rear, R };
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
