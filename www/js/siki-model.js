// Procedurální model SIKI (klokan) – opravář v dresu a montérkách
import * as THREE from 'three';

function textTex(text, w, h, font, color = '#fff') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.strokeStyle = '#1b2a4a'; x.lineWidth = h * .06; x.strokeText(text, w / 2, h / 2); x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildSiki() {
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const mat = {
    fur: std(0xa8703f, .95), furLight: std(0xe2c29a, .95), furDark: std(0x5a3418, .95), pink: std(0xe3a19a, .9),
    red: std(0xc0282d, .8), white: std(0xf2f2f2, .8), navy: std(0x23305e, .8), denim: std(0x52698f, .95), denimLight: std(0x8ea0bd, .95),
    leather: std(0x8a5530, .6), leatherDark: std(0x5c3418, .6), steel: std(0xb8bec6, .3, { metalness: .8 }), handle: std(0xc0282d, .5),
    nose: std(0x1a1414, .35), eyeW: std(0xffffff, .3), iris: std(0x6a3a14, .3), pupil: std(0x080808, .2), hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: std(0x4a1e1e, .8), teeth: std(0xfafafa, .4), brass: std(0xc9a24a, .35, { metalness: .8 }),
  };
  const mesh = (g, m, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, m); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const S = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const decal = (tex, w, h, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(...p); if (r) m.rotation.set(...r); return m; };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // trup – dres
  body.add(mesh(lathe([[0, 1.25], [.4, 1.28], [.43, 1.5], [.42, 1.8], [.38, 2.05], [.29, 2.2], [.15, 2.3], [0, 2.32]]), mat.red));
  body.add(mesh(lathe([[.0, 2.0], [.385, 2.03], [.33, 2.19], [.2, 2.3], [0, 2.32]]), mat.white, [0, .005, 0], [1.01, 1, 1.01])); // bílá ramena
  body.add(mesh(new THREE.TorusGeometry(.14, .03, 6, 16), mat.navy, [0, 2.28, .03], null, [Math.PI / 2 - .2, 0, 0]));
  body.add(decal(textTex('SIKI', 256, 96, 'bold 78px sans-serif'), .36, .14, [0, 1.98, .45]));
  // montérky – laclík vpředu a vzadu + popruhy
  body.add(mesh(new THREE.BoxGeometry(.5, .5, .06), mat.denim, [0, 1.6, .43]));
  body.add(mesh(new THREE.BoxGeometry(.24, .16, .02), mat.denimLight, [0, 1.62, .465]));
  body.add(mesh(new THREE.BoxGeometry(.46, .42, .06), mat.denim, [0, 1.58, -.43]));
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.07, .75, .03), mat.denim, [s * .2, 1.98, .43], null, [-.12, 0, s * .1]));
    body.add(mesh(new THREE.BoxGeometry(.07, .7, .03), mat.denim, [s * .12, 1.98, -.43], null, [.1, 0, -s * .35]));
    body.add(mesh(new THREE.BoxGeometry(.06, .05, .03), mat.brass, [s * .21, 1.84, .465]));
  });
  // kalhoty – boky
  body.add(mesh(lathe([[0, .95], [.4, .97], [.46, 1.15], [.45, 1.36], [0, 1.36]]), mat.denim));
  // pracovní opasek s brašnami a nářadím
  body.add(mesh(new THREE.CylinderGeometry(.47, .47, .1, 24), mat.leather, [0, 1.3, 0]));
  body.add(mesh(new THREE.BoxGeometry(.12, .1, .03), mat.brass, [0, 1.3, .47]));
  [[-1, .62], [1, .62], [-1, -.3], [1, -.3]].forEach(([s, a]) => {
    const ang = s * (Math.PI / 2 - a);
    const px = Math.sin(ang) * .49, pz = Math.cos(ang) * .49;
    const p = mesh(new THREE.BoxGeometry(.18, .24, .09), mat.leatherDark, [px, 1.17, pz], null, [0, ang, 0]); body.add(p);
    const tool = mesh(new THREE.BoxGeometry(.035, .22, .02), mat.steel, [px, 1.36, pz], null, [0, ang, .15 * s]); body.add(tool);
    body.add(mesh(new THREE.BoxGeometry(.05, .1, .03), mat.handle, [px + .05 * Math.cos(ang), 1.33, pz - .05 * Math.sin(ang)], null, [0, ang, 0]));
  });

  // nohy – nohavice s ohrnutím, velká chodidla
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .22, 1.05, 0);
    g.add(mesh(lathe([[0, 0], [.22, -.02], [.22, -.45], [.21, -.62], [0, -.62]], 16), mat.denim));
    g.add(mesh(new THREE.CylinderGeometry(.235, .235, .12, 16), mat.denimLight, [0, -.62, 0]));
    const foot = new THREE.Group(); foot.position.set(0, -.92, .15); g.add(foot);
    foot.add(mesh(new THREE.CapsuleGeometry(.11, .2, 4, 8), mat.fur, [0, .2, -.15]));
    foot.add(mesh(S(.18), mat.fur, [0, 0, .05], [.85, .5, 2.4]));
    [-1, 0, 1].forEach(t => foot.add(mesh(new THREE.ConeGeometry(.025, .08, 5), mat.furDark, [t * .06, -.03, .47], null, [Math.PI / 2, 0, 0])));
    body.add(g); return g;
  });

  // paže – rukáv s pruhy, tlapky
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .4, 2.08, 0); g.rotation.z = s * .14; body.add(g);
    g.add(mesh(S(.12), mat.white));
    g.add(mesh(lathe([[0, 0], [.15, -.02], [.14, -.4], [.13, -.66], [0, -.66]], 14), mat.red));
    g.add(mesh(new THREE.CylinderGeometry(.143, .143, .08, 14), mat.navy, [0, -.38, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.141, .141, .05, 14), mat.white, [0, -.46, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.138, .138, .05, 14), mat.white, [0, -.31, 0]));
    const n = decal(textTex('69', 128, 96, 'bold 80px sans-serif'), .24, .18, [s * .152, -.17, 0], [0, s * Math.PI / 2, 0]); g.add(n);
    g.add(mesh(S(.13), mat.fur, [0, -.78, .02], [.85, 1.1, .85]));
    return g;
  });

  // krk + hlava
  body.add(mesh(new THREE.CylinderGeometry(.15, .2, .55, 14), mat.fur, [0, 2.5, .03]));
  body.add(mesh(new THREE.CylinderGeometry(.11, .14, .5, 12), mat.furLight, [0, 2.48, .1]));
  const head = new THREE.Group(); head.position.set(0, 2.93, .08); head.scale.setScalar(1.05); body.add(head);
  head.add(mesh(S(.34, 24, 16), mat.fur, [0, 0, 0], [1, 1.05, 1]));
  head.add(mesh(S(.22, 18, 12), mat.fur, [0, -.13, .28], [.95, .85, 1.6]));          // dlouhý čumák
  head.add(mesh(S(.17, 16, 12), mat.furLight, [0, -.2, .33], [1, .7, 1.4]));       // světlá brada
  head.add(mesh(S(.09, 12, 10), mat.nose, [0, -.08, .6], [1.3, .85, .9]));
  head.add(mesh(S(.025, 8, 6), mat.hl, [-.03, -.04, .67]));
  // otevřený úsměv
  head.add(mesh(new THREE.SphereGeometry(.11, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat.mouth, [0, -.21, .47], [1, .55, .5]));
  head.add(mesh(new THREE.BoxGeometry(.1, .035, .02), mat.teeth, [0, -.225, .54]));
  [-1, 1].forEach(s => {
    const e = new THREE.Group(); e.position.set(s * .15, .08, .25); e.rotation.y = s * .35; head.add(e);
    e.add(mesh(S(.1, 14, 10), mat.eyeW, [0, 0, 0], [1, 1.1, .6]));
    e.add(mesh(S(.068, 12, 10), mat.iris, [0, -.005, .04], [1, 1.05, .45]));
    e.add(mesh(S(.036, 10, 8), mat.pupil, [0, -.005, .066], [1, 1, .4]));
    e.add(mesh(S(.018, 6, 6), mat.hl, [s * -.015 + .01, .03, .08]));
    head.add(mesh(new THREE.CapsuleGeometry(.025, .12, 3, 6), mat.furDark, [s * .15, .21, .27], null, [0, 0, s * 1.3]));
    const ear = new THREE.Group(); ear.position.set(s * .2, .26, -.06); ear.rotation.set(-.15, 0, -s * .3); head.add(ear);
    ear.add(mesh(new THREE.CapsuleGeometry(.12, .52, 4, 10), mat.fur, [0, .36, 0], [1, 1, .45]));
    ear.add(mesh(new THREE.CapsuleGeometry(.08, .42, 4, 8), mat.pink, [0, .36, .05], [1, 1, .25]));
  });
  // ježatá čupřina
  for (let i = 0; i < 9; i++) { const a = (i - 4) * .28; head.add(mesh(new THREE.ConeGeometry(.05, .2, 5), mat.furDark, [Math.sin(a) * .12, .36 + Math.cos(a) * .02, -.02 + (i % 3) * .05], null, [-.3 + (i % 3) * .2, 0, -a * .9])); }

  // dlouhý silný ocas
  const tail = new THREE.Group(); tail.position.set(0, 1.0, -.35); body.add(tail);
  for (let i = 0; i < 26; i++) { const t = i / 25; tail.add(mesh(S(.2 - t * .14, 12, 8), mat.fur, [0, -Math.pow(t, .8) * .92, -.12 - t * 1.35], [1, .95, 1.15])); }

  return { root, body, head, arms, legs, tail };
}
