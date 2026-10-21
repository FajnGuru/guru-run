// Procedurální model Guru (husky) podle referencí z Grok Imagine
import * as THREE from 'three';

export function buildGuru() {
  const std = (c, r = .8, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const mat = {
    fur: std(0xf4f2ef, .95), furGrey: std(0xb9bcc2, .95), furDark: std(0x6c6f75, .95), pink: std(0xe9a7a0, .9),
    shirt: std(0xf7f7f5, .7), jeans: std(0x2d4f8e, .9), jeansDark: std(0x223d70, .9),
    leather: std(0x6a3b20, .55), leatherDark: std(0x4a2814, .6), metal: std(0x9a8a70, .35, { metalness: .7 }),
    glass: std(0x2a2622, .15, { metalness: .5 }), nose: std(0x1d1715, .35), eyeW: std(0xffffff, .3),
    iris: std(0x2fae6a, .3), pupil: std(0x080808, .2), hl: new THREE.MeshBasicMaterial({ color: 0xffffff }), mouth: std(0x3a2a28, .8),
  };
  const mesh = (g, m, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, m); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const S = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // --- trup: košile (lathe, hruškovitý) ---
  body.add(mesh(lathe([[0, 1.08], [.3, 1.1], [.32, 1.22], [.33, 1.42], [.32, 1.58], [.29, 1.7], [.2, 1.8], [0, 1.83]]), mat.shirt));
  // límec
  [-1, 1].forEach(s => body.add(mesh(new THREE.ConeGeometry(.11, .2, 3), mat.shirt, [s * .09, 1.78, .17], [1, 1, .4], [Math.PI - .3, 0, s * .6])));
  body.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 20), mat.shirt, [0, 1.81, .02], null, [Math.PI / 2 - .25, 0, 0]));
  for (let i = 0; i < 4; i++) body.add(mesh(new THREE.CylinderGeometry(.018, .018, .01, 8), std(0xdedede), [0, 1.68 - i * .15, .325 + (i > 1 ? .01 : 0)], null, [Math.PI / 2, 0, 0]));
  // opasek
  body.add(mesh(new THREE.CylinderGeometry(.325, .32, .08, 24), mat.leather, [0, 1.1, 0]));
  body.add(mesh(new THREE.BoxGeometry(.13, .1, .03), mat.metal, [0, 1.1, .32]));
  body.add(mesh(new THREE.BoxGeometry(.08, .055, .035), mat.leatherDark, [0, 1.1, .325]));
  // boky džíny
  body.add(mesh(lathe([[0, .82], [.27, .84], [.32, .95], [.325, 1.07], [0, 1.07]]), mat.jeans));

  // --- nohy ---
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .165, .97, 0);
    g.add(mesh(lathe([[0, 0], [.155, -.02], [.15, -.4], [.155, -.7], [.16, -.78], [0, -.78]], 14), mat.jeans));
    g.add(mesh(new THREE.TorusGeometry(.155, .02, 6, 16), mat.jeansDark, [0, -.76, 0], null, [Math.PI / 2, 0, 0]));
    const foot = new THREE.Group(); foot.position.set(0, -.85, .06); g.add(foot);
    foot.add(mesh(S(.21), mat.fur, [0, 0, 0], [1.05, .62, 1.4]));
    [-1, 0, 1].forEach(t => foot.add(mesh(S(.065, 10, 8), mat.fur, [t * .085, -.02, .23], [1, .8, 1])));
    body.add(g); return g;
  });

  // --- paže ---
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .31, 1.7, 0); g.rotation.z = s * .14;
    g.add(mesh(lathe([[0, 0], [.115, -.02], [.11, -.3], [.105, -.6], [.12, -.64], [0, -.64]], 14), mat.shirt));
    g.add(mesh(new THREE.TorusGeometry(.11, .02, 6, 14), mat.shirt, [0, -.62, 0], null, [Math.PI / 2, 0, 0]));
    const hand = mesh(S(.13), mat.fur, [0, -.76, .02], [.95, 1.05, .85]); g.add(hand);
    g.add(mesh(S(.055, 8, 6), mat.fur, [-s * .09, -.71, .08]));
    body.add(g); return g;
  });

  // --- hlava ---
  const head = new THREE.Group(); head.position.set(0, 2.24, .02); body.add(head);
  head.add(mesh(S(.44, 28, 20), mat.fur, [0, 0, 0], [1.08, 1.0, .98]));                // lebka
  head.add(mesh(S(.3, 20, 14), mat.fur, [0, -.2, .12], [1.25, .8, 1.1]));              // tváře/brada
  head.add(mesh(S(.22, 20, 14), mat.fur, [0, -.13, .36], [1.05, .82, 1.4]));          // čumák
  head.add(mesh(S(.085, 14, 10), mat.nose, [0, -.06, .64], [1.25, .85, .9]));          // nos
  head.add(mesh(S(.03, 8, 6), mat.hl, [-.03, -.025, .7]));
  // úsměv
  const smile = mesh(new THREE.TorusGeometry(.09, .011, 6, 16, Math.PI * .8), mat.mouth, [0, -.21, .55], null, [0, 0, Math.PI * 1.1]); head.add(smile);
  head.add(mesh(new THREE.CylinderGeometry(.008, .008, .09, 6), mat.mouth, [0, -.15, .6], null, [-.4, 0, 0]));
  // šedá kresba na čele + tmavé obočí
  head.add(mesh(S(.16, 16, 10), mat.furGrey, [0, .17, .33], [.55, 1.1, .45], [-.35, 0, 0]));
  [-1, 1].forEach(s => {
    head.add(mesh(new THREE.CapsuleGeometry(.025, .12, 3, 6), mat.furDark, [s * .17, .17, .38], null, [0, 0, s * 1.25]));
    // oko
    const e = new THREE.Group(); e.position.set(s * .16, .06, .37); e.rotation.y = s * .32; head.add(e);
    e.add(mesh(S(.1, 16, 12), mat.eyeW, [0, 0, 0], [1.05, 1, .6]));
    e.add(mesh(S(.068, 14, 10), mat.iris, [0, -.003, .04], [1, 1, .45]));
    e.add(mesh(S(.036, 10, 8), mat.pupil, [0, -.003, .066], [1, 1, .4]));
    e.add(mesh(S(.016, 6, 6), mat.hl, [s * -.02 + .01, .025, .08]));
    // tváře – šedé po stranách lebky
    head.add(mesh(S(.2, 14, 10), mat.furGrey, [s * .33, .1, -.12], [.5, 1, 1]));
    // uši trčí z čepice
    const ear = new THREE.Group(); ear.position.set(s * .28, .36, -.02); ear.rotation.set(-.1, 0, -s * .32); head.add(ear);
    ear.add(mesh(new THREE.ConeGeometry(.2, .46, 4, 1), mat.fur, [0, .16, 0], [1, 1, .55], [0, Math.PI / 4, 0]));
    ear.add(mesh(new THREE.ConeGeometry(.12, .32, 4, 1), mat.pink, [0, .13, .055], [1, 1, .3], [0, Math.PI / 4, 0]));
    // klapky čepice
    const flap = mesh(new THREE.CapsuleGeometry(.1, .42, 4, 10), mat.leather, [s * .45, -.16, -.02], [.45, 1, 1.05], [0, 0, s * .1]); head.add(flap);
    head.add(mesh(new THREE.TorusGeometry(.035, .01, 6, 10), mat.metal, [s * .5, -.42, .02], null, [0, Math.PI / 2, 0]));
  });
  // čepice – vrchlík přes temeno a zadní část
  const cap = mesh(new THREE.SphereGeometry(.47, 28, 16, 0, Math.PI * 2, 0, Math.PI * .5), mat.leather, [0, .0, -.04], [1.08, 1.12, 1.03], [-.22, 0, 0]); head.add(cap);
  head.add(mesh(new THREE.TorusGeometry(.45, .025, 8, 32), mat.leatherDark, [0, .1, .06], [1.08, 1.03, 1], [Math.PI / 2 - .22, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.2, .02, 6, 20, Math.PI), mat.leatherDark, [0, .3, .24], [1.2, 1, 1], [-.3, 0, 0])); // šev
  head.add(mesh(new THREE.SphereGeometry(.47, 20, 10, Math.PI * 1.1, Math.PI * .8, Math.PI * .35, Math.PI * .4), mat.leather, [0, 0, -.04], [1.08, 1.12, 1.03])); // zadní díl
  // brýle na čele
  const gog = new THREE.Group(); gog.position.set(0, .36, .33); gog.rotation.x = -.95; head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.13, .14, .1, 18), mat.leatherDark, [s * .155, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.115, .02, 6, 18), mat.metal, [s * .155, .048, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.11, .11, .02, 18), mat.glass, [s * .155, .05, 0]));
  });
  gog.add(mesh(new THREE.BoxGeometry(.08, .04, .05), mat.leatherDark, [0, .01, 0]));

  // --- ocas: chuchvalec ---
  const tail = new THREE.Group(); tail.position.set(0, 1.0, -.3); body.add(tail);
  tail.add(mesh(S(.14, 12, 10), mat.fur, [0, .02, -.08], [1, 1, 1.2]));
  tail.add(mesh(S(.19, 14, 10), mat.fur, [0, .1, -.24], [1, 1.2, 1]));
  tail.add(mesh(S(.16, 12, 10), mat.fur, [0, .3, -.3], [1, 1.1, 1]));
  tail.add(mesh(S(.11, 10, 8), mat.fur, [0, .44, -.24]));

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
