// Procedurální kreslený pražský holub s červenou pilotní čepičkou
import * as THREE from 'three';
export function buildBird() {
  const std = (c, r = .8, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });
  const m = { body: std(0x8e9bb0), dark: std(0x5d677a), wing: std(0x9aa7bb), bar: std(0x3f4655),
    neck: std(0x3f8f6a, .35, { metalness: .6, emissive: 0x3a1f5a, emissiveIntensity: .35 }), eye: std(0xff8a1a, .3), pupil: std(0x111111, .2),
    beak: std(0x3a3a3a, .5), cere: std(0xe9e4dc), cap: std(0xc0392b, .6), feet: std(0xd0606a) };
  const mesh = (g, mat, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, mat); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  body.add(mesh(S(.4), m.body, [0, 0, 0], [.85, .8, 1.3]));                // trup (dopředu = +z)
  body.add(mesh(S(.3), m.neck, [0, .2, .32], [.9, 1, .9]));                // duhový krk
  const head = new THREE.Group(); head.position.set(0, .42, .5); body.add(head);
  head.add(mesh(S(.2), m.dark));
  head.add(mesh(new THREE.ConeGeometry(.05, .2, 8), m.beak, [0, -.03, .24], null, [Math.PI / 2, 0, 0]));
  head.add(mesh(S(.045, 8, 6), m.cere, [0, .01, .17]));
  [-1, 1].forEach(s => { head.add(mesh(S(.06, 10, 8), m.eye, [s * .12, .05, .1])); head.add(mesh(S(.03, 8, 6), m.pupil, [s * .155, .055, .12])); });
  head.add(mesh(new THREE.SphereGeometry(.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.cap, [0, .07, -.02], [1.1, .9, 1.15]));
  head.add(mesh(new THREE.BoxGeometry(.2, .02, .1), m.cap, [0, .07, .17]));        // kšilt
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .28, .12, .05); body.add(w);
    w.add(mesh(S(.35, 12, 8), m.wing, [s * .35, 0, -.05], [1, .12, .55]));
    w.add(mesh(new THREE.BoxGeometry(.5, .03, .06), m.bar, [s * .38, .03, -.12])); w.side = s; return w; });
  body.add(mesh(new THREE.ConeGeometry(.22, .45, 6), m.dark, [0, -.02, -.6], [1.2, .25, 1], [-Math.PI / 2, 0, 0])); // ocas
  [-1, 1].forEach(s => body.add(mesh(new THREE.CylinderGeometry(.025, .025, .2, 5), m.feet, [s * .12, -.38, .05])));
  root.scale.setScalar(1.3);
  return { root, body, head, wings };
}
export function flap(b, t, mode) {
  // mode: 'fly' mávání, 'tele' křídla dozadu, 'dive' přitažená
  b.wings.forEach(w => {
    if (mode === 'fly') { w.rotation.z = w.side * Math.sin(t * 14) * .8; w.rotation.y = 0; }
    else { w.rotation.z = w.side * -.15; w.rotation.y = -w.side * (mode === 'dive' ? 1.1 : .7 + Math.sin(t * 30) * .05); }
  });
}
