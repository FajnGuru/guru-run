// Procedurální model Guru (husky) — first-pass look upgrade (méně plastu, čitelnější oči/brýle)
// API: buildGuru() → { root, body, head, arms, legs, tail }; animateGuru(g, t, speed, running)
// DŮLEŽITÉ: legs[i].children[2] musí zůstat foot group (animateGuru + motorbike).
import * as THREE from 'three';

/** Jedna malá noise mapa sdílená všemi fur materiály — levný „srst“ feel bez GLTF. */
function makeFurNoiseMap() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d'), img = ctx.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 180 + ((Math.random() * 75) | 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  tex.needsUpdate = true;
  return tex;
}

let _furNoise;
function furNoise() { return _furNoise || (_furNoise = makeFurNoiseMap()); }

export function buildGuru() {
  const noise = furNoise();
  const std = (c, r = .8, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...extra });
  const furMat = (c, r = .98) => std(c, r, {
    roughnessMap: noise,
    bumpMap: noise,
    bumpScale: .035,
  });
  const mat = {
    fur: furMat(0xf2efe9),
    furGrey: furMat(0xa8adb6, .97),
    furDark: furMat(0x5e6168, .96),
    pink: std(0xe9a7a0, .92),
    shirt: std(0xf7f7f5, .88),
    jeans: std(0x2a4a86, .92),
    jeansDark: std(0x1e3766, .93),
    leather: std(0x6a3b20, .62, { metalness: .08 }),
    leatherDark: std(0x4a2814, .68, { metalness: .06 }),
    metal: std(0xb5a078, .28, { metalness: .78 }),
    glass: std(0x1a1816, .12, { metalness: .55, emissive: 0x0a0806, emissiveIntensity: .15 }),
    nose: std(0x1a1412, .42),
    eyeW: std(0xffffff, .22),
    iris: std(0x2cae62, .28, { emissive: 0x0a3a1a, emissiveIntensity: .22 }),
    pupil: std(0x050505, .18),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: std(0x3a2a28, .85),
    stitch: std(0x8b5a2b, .75),
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
  const S = (r, w = 22, h = 16) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 22) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);

  // --- trup: košile (lathe, hruškovitý) + jemný objem ramen ---
  body.add(mesh(lathe([[0, 1.08], [.3, 1.1], [.32, 1.22], [.33, 1.42], [.32, 1.58], [.29, 1.7], [.2, 1.8], [0, 1.83]]), mat.shirt));
  [-1, 1].forEach(s => body.add(mesh(S(.12, 12, 10), mat.shirt, [s * .28, 1.72, 0], [1.1, .7, .95])));
  // límec
  [-1, 1].forEach(s => body.add(mesh(new THREE.ConeGeometry(.11, .2, 3), mat.shirt, [s * .09, 1.78, .17], [1, 1, .4], [Math.PI - .3, 0, s * .6])));
  body.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 20), mat.shirt, [0, 1.81, .02], null, [Math.PI / 2 - .25, 0, 0]));
  for (let i = 0; i < 4; i++) {
    body.add(mesh(new THREE.CylinderGeometry(.018, .018, .01, 8), std(0xdedede, .45, { metalness: .35 }), [0, 1.68 - i * .15, .325 + (i > 1 ? .01 : 0)], null, [Math.PI / 2, 0, 0]));
  }
  // opasek
  body.add(mesh(new THREE.CylinderGeometry(.325, .32, .08, 24), mat.leather, [0, 1.1, 0]));
  body.add(mesh(new THREE.BoxGeometry(.13, .1, .03), mat.metal, [0, 1.1, .32]));
  body.add(mesh(new THREE.BoxGeometry(.08, .055, .035), mat.leatherDark, [0, 1.1, .325]));
  // boky džíny + jemný šev vpředu
  body.add(mesh(lathe([[0, .82], [.27, .84], [.32, .95], [.325, 1.07], [0, 1.07]]), mat.jeans));
  body.add(mesh(new THREE.BoxGeometry(.012, .22, .01), mat.stitch, [0, .95, .325]));

  // --- nohy — children[0]=kalhoty, [1]=lem, [2]=foot ---
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .165, .97, 0);
    g.add(mesh(lathe([[0, 0], [.155, -.02], [.15, -.4], [.155, -.7], [.16, -.78], [0, -.78]], 16), mat.jeans));
    g.add(mesh(new THREE.TorusGeometry(.155, .02, 6, 16), mat.jeansDark, [0, -.76, 0], null, [Math.PI / 2, 0, 0]));
    const foot = new THREE.Group();
    foot.position.set(0, -.85, .06);
    g.add(foot);
    foot.add(mesh(S(.21, 16, 12), mat.fur, [0, 0, 0], [1.05, .62, 1.4]));
    foot.add(mesh(S(.12, 12, 10), mat.furGrey, [0, -.02, -.06], [.9, .45, .7])); // patní chlup
    [-1, 0, 1].forEach(t => foot.add(mesh(S(.065, 10, 8), mat.fur, [t * .085, -.02, .23], [1, .8, 1])));
    body.add(g);
    return g;
  });

  // --- paže ---
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .31, 1.7, 0);
    g.rotation.z = s * .14;
    g.add(mesh(lathe([[0, 0], [.115, -.02], [.11, -.3], [.105, -.6], [.12, -.64], [0, -.64]], 16), mat.shirt));
    g.add(mesh(new THREE.TorusGeometry(.11, .02, 6, 14), mat.shirt, [0, -.62, 0], null, [Math.PI / 2, 0, 0]));
    const hand = mesh(S(.13, 14, 12), mat.fur, [0, -.76, .02], [.95, 1.05, .85]);
    g.add(hand);
    g.add(mesh(S(.055, 8, 6), mat.fur, [-s * .09, -.71, .08]));
    // drobné chlupy u zápěstí
    g.add(mesh(S(.04, 8, 6), mat.furGrey, [s * .04, -.68, .06], [1, .7, .8]));
    body.add(g);
    return g;
  });

  // --- hlava ---
  const head = new THREE.Group();
  head.position.set(0, 2.24, .02);
  body.add(head);
  head.add(mesh(S(.44, 28, 20), mat.fur, [0, 0, 0], [1.08, 1.0, .98]));
  // líce / chmýří — silueta měkčí než jedna koule
  [-1, 1].forEach(s => {
    head.add(mesh(S(.18, 14, 12), mat.fur, [s * .28, -.05, .08], [.85, .95, .9]));
    head.add(mesh(S(.12, 12, 10), mat.fur, [s * .22, -.18, .18], [.9, .7, .85]));
  });
  head.add(mesh(S(.3, 20, 14), mat.fur, [0, -.2, .12], [1.25, .8, 1.1]));
  head.add(mesh(S(.22, 20, 14), mat.fur, [0, -.13, .36], [1.05, .82, 1.4]));
  head.add(mesh(S(.085, 14, 10), mat.nose, [0, -.06, .64], [1.25, .85, .9]));
  head.add(mesh(S(.03, 8, 6), mat.hl, [-.03, -.025, .7]));
  // úsměv
  head.add(mesh(new THREE.TorusGeometry(.09, .011, 6, 16, Math.PI * .8), mat.mouth, [0, -.21, .55], null, [0, 0, Math.PI * 1.1]));
  head.add(mesh(new THREE.CylinderGeometry(.008, .008, .09, 6), mat.mouth, [0, -.15, .6], null, [-.4, 0, 0]));
  // šedá kresba na čele + tmavé obočí
  head.add(mesh(S(.16, 16, 10), mat.furGrey, [0, .17, .33], [.55, 1.1, .45], [-.35, 0, 0]));
  [-1, 1].forEach(s => {
    head.add(mesh(new THREE.CapsuleGeometry(.025, .12, 3, 6), mat.furDark, [s * .17, .17, .38], null, [0, 0, s * 1.25]));
    // oko — větší bělmo + čitelnější iris
    const e = new THREE.Group();
    e.position.set(s * .16, .06, .37);
    e.rotation.y = s * .32;
    head.add(e);
    e.add(mesh(S(.105, 16, 12), mat.eyeW, [0, 0, 0], [1.08, 1.05, .62]));
    e.add(mesh(S(.072, 14, 10), mat.iris, [0, -.003, .045], [1, 1, .48]));
    e.add(mesh(S(.038, 10, 8), mat.pupil, [0, -.003, .07], [1, 1, .42]));
    e.add(mesh(S(.018, 6, 6), mat.hl, [s * -.02 + .012, .028, .085]));
    e.add(mesh(S(.01, 6, 6), mat.hl, [s * .02, -.01, .082]));
    // šedé tváře
    head.add(mesh(S(.2, 14, 10), mat.furGrey, [s * .33, .1, -.12], [.5, 1, 1]));
    // uši
    const ear = new THREE.Group();
    ear.position.set(s * .28, .36, -.02);
    ear.rotation.set(-.1, 0, -s * .32);
    head.add(ear);
    ear.add(mesh(new THREE.ConeGeometry(.2, .46, 4, 1), mat.fur, [0, .16, 0], [1, 1, .55], [0, Math.PI / 4, 0]));
    ear.add(mesh(new THREE.ConeGeometry(.12, .32, 4, 1), mat.pink, [0, .13, .055], [1, 1, .3], [0, Math.PI / 4, 0]));
    ear.add(mesh(S(.06, 8, 6), mat.furGrey, [0, .32, -.02], [1.2, .6, .5]));
    // klapky čepice
    head.add(mesh(new THREE.CapsuleGeometry(.1, .42, 4, 10), mat.leather, [s * .45, -.16, -.02], [.45, 1, 1.05], [0, 0, s * .1]));
    head.add(mesh(new THREE.TorusGeometry(.035, .01, 6, 10), mat.metal, [s * .5, -.42, .02], null, [0, Math.PI / 2, 0]));
  });
  // čepice
  head.add(mesh(new THREE.SphereGeometry(.47, 28, 16, 0, Math.PI * 2, 0, Math.PI * .5), mat.leather, [0, .0, -.04], [1.08, 1.12, 1.03], [-.22, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.45, .025, 8, 32), mat.leatherDark, [0, .1, .06], [1.08, 1.03, 1], [Math.PI / 2 - .22, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.2, .02, 6, 20, Math.PI), mat.leatherDark, [0, .3, .24], [1.2, 1, 1], [-.3, 0, 0]));
  head.add(mesh(new THREE.SphereGeometry(.47, 20, 10, Math.PI * 1.1, Math.PI * .8, Math.PI * .35, Math.PI * .4), mat.leather, [0, 0, -.04], [1.08, 1.12, 1.03]));
  // brýle na čele — silnější rám + tmavší sklo
  const gog = new THREE.Group();
  gog.position.set(0, .36, .33);
  gog.rotation.x = -.95;
  head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.13, .14, .1, 18), mat.leatherDark, [s * .155, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.115, .022, 6, 18), mat.metal, [s * .155, .048, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.11, .11, .022, 18), mat.glass, [s * .155, .05, 0]));
    gog.add(mesh(S(.025, 6, 6), mat.hl, [s * .155 - .03, .06, .04]));
  });
  gog.add(mesh(new THREE.BoxGeometry(.08, .04, .05), mat.leatherDark, [0, .01, 0]));

  // --- ocas: hustší chuchvalec ---
  const tail = new THREE.Group();
  tail.position.set(0, 1.0, -.3);
  body.add(tail);
  tail.add(mesh(S(.14, 14, 12), mat.fur, [0, .02, -.08], [1, 1, 1.2]));
  tail.add(mesh(S(.19, 14, 12), mat.fur, [0, .1, -.24], [1, 1.2, 1]));
  tail.add(mesh(S(.14, 12, 10), mat.furGrey, [0, .18, -.28], [.85, 1, .9]));
  tail.add(mesh(S(.16, 12, 10), mat.fur, [0, .3, -.3], [1, 1.1, 1]));
  tail.add(mesh(S(.11, 10, 8), mat.fur, [0, .44, -.24]));
  tail.add(mesh(S(.08, 8, 6), mat.furGrey, [.06, .38, -.22], [.9, .8, .9]));

  return { root, body, head, arms, legs, tail };
}

export function animateGuru(g, t, speed, running) {
  const a = Math.abs(speed), k = Math.min(1, a / 4), sw = k * (running ? .95 : .6);
  g.phase = (g.phase || 0) + t.dt * (3 + a * 1.5);
  const p = g.phase, sn = Math.sin(p);
  g.legs[0].rotation.x = sn * sw; g.legs[1].rotation.x = -sn * sw;
  g.legs.forEach((l, i) => l.children[2].rotation.x = Math.max(0, (i ? sn : -sn)) * .5 * k);
  g.arms[0].rotation.x = -sn * sw * .9; g.arms[1].rotation.x = sn * sw * .9;
  g.body.position.y = Math.abs(Math.cos(p)) * .07 * k;
  g.body.rotation.x += ((running && a > 5 ? .16 : 0) - g.body.rotation.x) * Math.min(1, t.dt * 6);
  g.body.rotation.y = Math.sin(p) * .06 * k;
  g.head.rotation.z = Math.sin(p) * .04 * k;
  g.head.rotation.y = a < .5 ? Math.sin(t.now / 900) * .15 : 0;
  g.tail.rotation.y = Math.sin(t.now / (a > 1 ? 90 : 160)) * .55; g.tail.rotation.x = -.2;
}
