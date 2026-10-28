// Procedurální model Fiškule (zaječice) — first-pass look podle turnaround reference
// API: buildFiskule() → { root, body, head, arms, legs, tail, compass }
// animateGuru z guru-model.js očekává legs[i].children[2] = foot group.
import * as THREE from 'three';

function makeFurNoiseMap() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d'), img = ctx.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 175 + ((Math.random() * 80) | 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  tex.needsUpdate = true;
  return tex;
}

let _furNoise;
function furNoise() { return _furNoise || (_furNoise = makeFurNoiseMap()); }

export function buildFiskule() {
  const noise = furNoise();
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...extra });
  const furMat = (c, r = .98) => std(c, r, { roughnessMap: noise, bumpMap: noise, bumpScale: .04 });
  // Palette z turnaroundu: warm brown / cream / olive vest / terracotta shorts+scarf / brass
  const mat = {
    fur: furMat(0xa67c52),
    furLight: furMat(0xe8dcc5, .97),
    furDark: furMat(0x4a3020, .96),
    pink: std(0xe8b0a8, .9),
    white: furMat(0xf6f1ea, .99),
    shirt: std(0xd8c49a, .9),
    vest: std(0x6b704c, .92),
    vestDark: std(0x555a3c, .93),
    shorts: std(0xa34b37, .91),
    shortsDark: std(0x7a3628, .92),
    scarf: std(0xb3261e, .86),
    leather: std(0x5a3a22, .65, { metalness: .08 }),
    metal: std(0xc4a060, .3, { metalness: .72 }),
    brass: std(0xd4af37, .28, { metalness: .82 }),
    glass: std(0x1a1816, .12, { metalness: .55, emissive: 0x080706, emissiveIntensity: .12 }),
    gold: std(0xd9a530, .28, { metalness: .88 }),
    face: std(0xf2e6c8, .55),
    nose: std(0xd77f86, .45),
    eyeW: std(0xffffff, .22),
    iris: std(0x6a3a14, .28, { emissive: 0x2a1508, emissiveIntensity: .18 }),
    pupil: std(0x080808, .18),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: std(0x3a2220, .85),
  };
  const mesh = (g, m, p = [0, 0, 0], s, r) => {
    const k = new THREE.Mesh(g, m);
    k.position.set(...p);
    if (s) k.scale.set(...s);
    if (r) k.rotation.set(...r);
    k.castShadow = true;
    k.receiveShadow = true;
    return k;
  };
  const S = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);

  // trup: košile + vesta (více „utility“ siluety)
  body.add(mesh(lathe([[0, .78], [.27, .8], [.29, .95], [.29, 1.12], [.26, 1.28], [.16, 1.38], [0, 1.4]]), mat.shirt));
  body.add(mesh(lathe([[.0, .8], [.3, .8], [.31, .95], [.31, 1.12], [.28, 1.27], [.2, 1.34], [.01, 1.34]], 20), mat.vest, [0, 0, -.005], [1, 1, .98]));
  // výstřih + kapsy vesty s chlopněmi
  body.add(mesh(new THREE.BoxGeometry(.07, .4, .05), mat.shirt, [0, 1.08, .29], null, [-.05, 0, 0]));
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.14, .11, .035), mat.vestDark, [s * .17, .95, .3]));
    body.add(mesh(new THREE.BoxGeometry(.12, .04, .02), mat.vest, [s * .17, 1.02, .322])); // chlopeň
    body.add(mesh(new THREE.CylinderGeometry(.012, .012, .01, 6), mat.brass, [s * .17, .98, .34], null, [Math.PI / 2, 0, 0]));
  });
  // šátek — výraznější červený kontrast
  body.add(mesh(new THREE.TorusGeometry(.17, .075, 8, 18), mat.scarf, [0, 1.38, 0], [1, 1, .9], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.ConeGeometry(.18, .32, 3), mat.scarf, [0, 1.22, .28], [1, 1, .32], [Math.PI + .25, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(.06, .08, .04), mat.scarf, [.08, 1.18, .3], null, [0, 0, .4])); // uzel
  // šortky cargo
  body.add(mesh(lathe([[0, .5], [.3, .52], [.33, .66], [.31, .82], [0, .82]]), mat.shorts));
  body.add(mesh(new THREE.CylinderGeometry(.305, .305, .05, 20), mat.shortsDark, [0, .8, 0]));

  // nohy: [0] šortky, [1] kapsa, [2] foot
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .145, .66, 0);
    g.add(mesh(lathe([[0, 0], [.18, -.02], [.19, -.24], [.2, -.33], [0, -.33]], 14), mat.shorts));
    g.add(mesh(new THREE.BoxGeometry(.07, .14, .12), mat.shortsDark, [s * .16, -.17, 0]));
    const foot = new THREE.Group();
    foot.position.set(0, -.58, .1);
    g.add(foot);
    foot.add(mesh(new THREE.CapsuleGeometry(.08, .22, 4, 8), mat.fur, [0, .18, -.08]));
    foot.add(mesh(S(.15, 14, 12), mat.fur, [0, 0, .02], [1, .55, 1.9]));
    foot.add(mesh(S(.1, 12, 10), mat.furLight, [0, -.02, .2], [1, .5, 1]));
    // prsty
    [-1, 0, 1].forEach(t => foot.add(mesh(S(.045, 8, 6), mat.fur, [t * .07, -.04, .28], [1, .7, 1.1])));
    body.add(g);
    return g;
  });

  // paže: krátký rukáv + chlupaté předloktí + tlapka
  let compass;
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .3, 1.24, 0);
    g.rotation.z = s * .18;
    g.add(mesh(S(.13, 12, 10), mat.shirt, [0, -.08, 0], [1, 1.25, 1]));
    g.add(mesh(new THREE.CapsuleGeometry(.07, .26, 4, 8), mat.fur, [0, -.33, 0]));
    g.add(mesh(S(.095, 12, 10), mat.fur, [0, -.52, .02], [.9, 1.1, .9]));
    g.add(mesh(S(.04, 8, 6), mat.furLight, [0, -.55, .08], [.9, .7, .8]));
    if (s < 0) {
      compass = new THREE.Group();
      compass.position.set(0, -.6, .1);
      compass.rotation.x = 2.67;
      compass.scale.setScalar(1.35);
      compass.add(mesh(new THREE.CylinderGeometry(.13, .13, .05, 22), mat.gold));
      compass.add(mesh(new THREE.TorusGeometry(.12, .012, 6, 20), mat.brass, [0, .02, 0], null, [Math.PI / 2, 0, 0]));
      compass.add(mesh(new THREE.CylinderGeometry(.105, .105, .055, 22), mat.face));
      // hvězdicová růžice (8 krátkých paprsků)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const ray = mesh(new THREE.BoxGeometry(.012, .09, .008), std(0x8a6a30, .4, { metalness: .5 }),
          [Math.sin(ang) * .02, .028, Math.cos(ang) * .02], null, [0, ang, 0]);
        compass.add(ray);
      }
      const nd = mesh(new THREE.ConeGeometry(.03, .17, 4), std(0xb3261e, .5), [0, .032, 0], [1, 1, .3], [Math.PI / 2, 0, 0]);
      compass.add(nd);
      compass.needle = nd;
      compass.add(mesh(new THREE.TorusGeometry(.025, .008, 6, 10), mat.gold, [0, 0, -.14], null, [Math.PI / 2, 0, 0]));
      g.add(compass);
    }
    body.add(g);
    return g;
  });
  arms[0].rotation.set(-1.1, 0, -.35);

  // hlava — chibi, cream muzzle, dlouhé uši
  const head = new THREE.Group();
  head.position.set(0, 1.64, .02);
  head.scale.setScalar(1.2);
  body.add(head);
  head.add(mesh(S(.35, 24, 16), mat.fur, [0, 0, 0], [1.05, 1, 1]));
  // měkčí líce
  [-1, 1].forEach(s => {
    head.add(mesh(S(.14, 12, 10), mat.fur, [s * .26, -.02, .05], [.75, .9, .85]));
  });
  head.add(mesh(S(.2, 18, 12), mat.furLight, [0, -.12, .17], [1.15, .78, 1.05]));
  [-1, 1].forEach(s => head.add(mesh(S(.08, 12, 10), mat.furLight, [s * .07, -.11, .3], [1, .8, .9])));
  head.add(mesh(S(.048, 10, 8), mat.nose, [0, -.06, .37], [1.35, .9, .95]));
  head.add(mesh(S(.015, 6, 6), mat.hl, [-.015, -.045, .41]));
  head.add(mesh(new THREE.TorusGeometry(.07, .01, 6, 14, Math.PI * .8), mat.mouth, [0, -.17, .32], null, [0, 0, Math.PI * 1.1]));
  [-1, 1].forEach(s => {
    const e = new THREE.Group();
    e.position.set(s * .13, .05, .26);
    e.rotation.y = s * .35;
    head.add(e);
    e.add(mesh(S(.098, 14, 10), mat.eyeW, [0, 0, 0], [1.05, 1.12, .62]));
    e.add(mesh(S(.065, 12, 10), mat.iris, [0, -.005, .038], [1, 1.05, .48]));
    e.add(mesh(S(.034, 10, 8), mat.pupil, [0, -.005, .062], [1, 1, .42]));
    e.add(mesh(S(.017, 6, 6), mat.hl, [s * -.015 + .01, .026, .072]));
    e.add(mesh(S(.009, 6, 6), mat.hl, [s * .018, -.012, .07]));
    head.add(mesh(new THREE.CapsuleGeometry(.018, .09, 3, 6), mat.furDark, [s * .13, .16, .28], null, [0, 0, s * 1.35]));
    // dlouhé uši (výška ~ hlava) + tmavé tipy
    const ear = new THREE.Group();
    ear.position.set(s * .13, .26, -.04);
    ear.rotation.set(-.08, 0, -s * .2);
    head.add(ear);
    ear.add(mesh(new THREE.CapsuleGeometry(.12, .62, 4, 10), mat.fur, [0, .42, 0], [1, 1, .4]));
    ear.add(mesh(new THREE.CapsuleGeometry(.08, .5, 4, 8), mat.pink, [0, .4, .035], [1, 1, .25]));
    ear.add(mesh(S(.12, 10, 8), mat.furDark, [0, .78, 0], [1, .85, .4]));
    head.ears = head.ears || [];
    head.ears.push(ear);
    head.add(mesh(S(.1, 10, 8), mat.fur, [s * .3, -.1, .04], [.55, .9, 1]));
  });
  // pásek brýlí + mosazné brýle na čele
  head.add(mesh(new THREE.TorusGeometry(.33, .028, 6, 28), mat.leather, [0, .15, -.01], [1.06, 1, 1.02], [Math.PI / 2 - .3, 0, 0]));
  const gog = new THREE.Group();
  gog.position.set(0, .25, .25);
  gog.rotation.x = -1.0;
  head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.09, .1, .08, 16), mat.leather, [s * .11, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.08, .016, 6, 16), mat.brass, [s * .11, .042, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.075, .075, .02, 16), mat.glass, [s * .11, .045, 0]));
    gog.add(mesh(S(.018, 6, 6), mat.hl, [s * .11 - .02, .055, .03]));
  });
  gog.add(mesh(new THREE.BoxGeometry(.05, .03, .04), mat.brass, [0, .01, 0]));

  // bílý cotton-ball ocásek (hustší)
  const tail = new THREE.Group();
  tail.position.set(0, .68, -.3);
  body.add(tail);
  tail.add(mesh(S(.14, 14, 12), mat.white, [0, 0, -.04], [1, 1.15, 1]));
  tail.add(mesh(S(.09, 10, 8), mat.white, [.05, .05, -.08], [.9, .9, .9]));
  tail.add(mesh(S(.08, 8, 6), mat.white, [-.04, .06, -.1]));
  tail.add(mesh(S(.07, 8, 6), mat.white, [0, .1, -.14]));

  return { root, body, head, arms, legs, tail, compass };
}
