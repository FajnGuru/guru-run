// Procedurální model Fiškule (zaječice) podle referenčního listu
import * as THREE from 'three';

export function buildFiskule() {
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const mat = {
    fur: std(0xa8784a, .95), furLight: std(0xd9b88c, .95), furDark: std(0x4a3020, .95), pink: std(0xe8a0a0, .9), white: std(0xf6f1ea, .95),
    shirt: std(0xd8c49a, .85), vest: std(0x5e6b2e, .9), shorts: std(0x8e2e22, .9), scarf: std(0xb3261e, .8),
    leather: std(0x5a3a22, .6), metal: std(0xa08860, .35, { metalness: .7 }), glass: std(0x2a2622, .15, { metalness: .5 }),
    gold: std(0xd9a530, .3, { metalness: .85 }), face: std(0xf2e6c8, .4), nose: std(0xd77f86, .4),
    eyeW: std(0xffffff, .3), iris: std(0x6a3a14, .3), pupil: std(0x080808, .2), hl: new THREE.MeshBasicMaterial({ color: 0xffffff }), mouth: std(0x3a2220, .8),
  };
  const mesh = (g, m, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, m); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const S = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 18) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // trup: košile + vesta
  body.add(mesh(lathe([[0, .78], [.27, .8], [.29, .95], [.29, 1.12], [.26, 1.28], [.16, 1.38], [0, 1.4]]), mat.shirt));
  body.add(mesh(lathe([[.0, .8], [.3, .8], [.31, .95], [.31, 1.12], [.28, 1.27], [.2, 1.34], [.01, 1.34]], 18), mat.vest, [0, 0, -.005], [1, 1, .98]));
  // výstřih košile vpředu (béžový pruh) + kapsy vesty
  body.add(mesh(new THREE.BoxGeometry(.07, .4, .05), mat.shirt, [0, 1.08, .29], null, [-.05, 0, 0]));
  [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(.13, .1, .03), std(0x4c5824), [s * .17, .95, .3])));
  // šátek
  body.add(mesh(new THREE.TorusGeometry(.17, .07, 8, 18), mat.scarf, [0, 1.38, 0], [1, 1, .9], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.ConeGeometry(.17, .3, 3), mat.scarf, [0, 1.24, .27], [1, 1, .3], [Math.PI + .25, 0, 0]));
  // šortky
  body.add(mesh(lathe([[0, .5], [.3, .52], [.33, .66], [.31, .82], [0, .82]]), mat.shorts));
  body.add(mesh(new THREE.CylinderGeometry(.305, .305, .05, 20), std(0x6e2018), [0, .8, 0]));

  // nohy: šortky -> chlupatá lýtka -> velká chodidla
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .145, .66, 0);
    g.add(mesh(lathe([[0, 0], [.18, -.02], [.19, -.24], [.2, -.33], [0, -.33]], 14), mat.shorts));
    g.add(mesh(new THREE.BoxGeometry(.06, .13, .11), std(0x7a261c), [s * .15, -.17, 0]));    // boční kapsa
    const foot = new THREE.Group(); foot.position.set(0, -.58, .1); g.add(foot);
    foot.add(mesh(new THREE.CapsuleGeometry(.08, .22, 4, 8), mat.fur, [0, .18, -.08]));
    foot.add(mesh(S(.15), mat.fur, [0, 0, .02], [1, .55, 1.9]));
    foot.add(mesh(S(.1), mat.furLight, [0, -.02, .2], [1, .5, 1]));
    body.add(g); return g;
  });

  // paže: krátký rukáv + chlupaté předloktí + tlapka
  let compass;
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .3, 1.24, 0); g.rotation.z = s * .18;
    g.add(mesh(S(.13, 12, 10), mat.shirt, [0, -.08, 0], [1, 1.25, 1]));
    g.add(mesh(new THREE.CapsuleGeometry(.07, .26, 4, 8), mat.fur, [0, -.33, 0]));
    g.add(mesh(S(.095), mat.fur, [0, -.52, .02], [.9, 1.1, .9]));
    if (s < 0) {
      compass = new THREE.Group(); compass.position.set(0, -.6, .1); compass.rotation.x = 2.67; compass.scale.setScalar(1.35);
      compass.add(mesh(new THREE.CylinderGeometry(.13, .13, .05, 22), mat.gold));
      compass.add(mesh(new THREE.CylinderGeometry(.105, .105, .055, 22), mat.face));
      const nd = mesh(new THREE.ConeGeometry(.03, .17, 4), std(0xb3261e, .5), [0, .032, 0], [1, 1, .3], [Math.PI / 2, 0, 0]); compass.add(nd); compass.needle = nd;
      compass.add(mesh(new THREE.TorusGeometry(.025, .008, 6, 10), mat.gold, [0, 0, -.14], null, [Math.PI / 2, 0, 0]));
      g.add(compass);
    }
    body.add(g); return g;
  });
  // pořadí: pravá ruka (s=1) drží kompas -> prohnout v lokti dopředu
  arms[0].rotation.set(-1.1, 0, -.35);

  // hlava
  const head = new THREE.Group(); head.position.set(0, 1.64, .02); head.scale.setScalar(1.2); body.add(head);
  head.add(mesh(S(.35, 24, 16), mat.fur, [0, 0, 0], [1.05, 1, 1]));
  head.add(mesh(S(.2, 18, 12), mat.furLight, [0, -.12, .17], [1.1, .75, 1]));          // světlá tvář/čumáček
  [-1, 1].forEach(s => head.add(mesh(S(.08, 12, 10), mat.furLight, [s * .07, -.11, .3], [1, .8, .9])));
  head.add(mesh(S(.045, 10, 8), mat.nose, [0, -.06, .37], [1.3, .9, .9]));
  head.add(mesh(new THREE.TorusGeometry(.07, .01, 6, 14, Math.PI * .8), mat.mouth, [0, -.17, .32], null, [0, 0, Math.PI * 1.1]));
  [-1, 1].forEach(s => {
    const e = new THREE.Group(); e.position.set(s * .13, .05, .26); e.rotation.y = s * .35; head.add(e);
    e.add(mesh(S(.095, 14, 10), mat.eyeW, [0, 0, 0], [1, 1.1, .6]));
    e.add(mesh(S(.062, 12, 10), mat.iris, [0, -.005, .035], [1, 1.05, .45]));
    e.add(mesh(S(.032, 10, 8), mat.pupil, [0, -.005, .06], [1, 1, .4]));
    e.add(mesh(S(.016, 6, 6), mat.hl, [s * -.015 + .01, .025, .07]));
    head.add(mesh(new THREE.CapsuleGeometry(.018, .09, 3, 6), mat.furDark, [s * .13, .16, .28], null, [0, 0, s * 1.35]));
    // dlouhé uši
    const ear = new THREE.Group(); ear.position.set(s * .13, .26, -.04); ear.rotation.set(-.08, 0, -s * .2); head.add(ear);
    ear.add(mesh(new THREE.CapsuleGeometry(.12, .55, 4, 10), mat.fur, [0, .38, 0], [1, 1, .4]));
    ear.add(mesh(new THREE.CapsuleGeometry(.08, .45, 4, 8), mat.pink, [0, .36, .035], [1, 1, .25]));
    ear.add(mesh(S(.11, 10, 8), mat.furDark, [0, .7, 0], [.95, .8, .38]));
    head.ears = head.ears || []; head.ears.push(ear);
    // fousky/tváře do stran
    head.add(mesh(S(.1, 10, 8), mat.fur, [s * .3, -.1, .04], [.55, .9, 1]));
  });
  // brýle na pásku kolem hlavy (na čele)
  head.add(mesh(new THREE.TorusGeometry(.33, .028, 6, 28), mat.leather, [0, .15, -.01], [1.06, 1, 1.02], [Math.PI / 2 - .3, 0, 0]));
  const gog = new THREE.Group(); gog.position.set(0, .25, .25); gog.rotation.x = -1.0; head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.09, .1, .08, 16), mat.leather, [s * .11, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.08, .015, 6, 16), mat.metal, [s * .11, .042, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.075, .075, .02, 16), mat.glass, [s * .11, .045, 0]));
  });

  // bílý ocásek
  const tail = new THREE.Group(); tail.position.set(0, .68, -.3); body.add(tail);
  tail.add(mesh(S(.13, 12, 10), mat.white, [0, 0, -.04], [1, 1.1, 1]));
  tail.add(mesh(S(.07, 8, 6), mat.white, [0, .07, -.12]));

  return { root, body, head, arms, legs, tail, compass };
}
