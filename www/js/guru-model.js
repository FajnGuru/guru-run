// Procedurální model Guru (husky) — head refine: canvas fur/muzzle/iris + jemnější geo hlavy
// API: buildGuru() → { root, body, head, arms, legs, tail }; animateGuru(g, t, speed, running)
// t.lookCam = true → jemný glance hlavy (tělo otáčí game3d); Fiškule/cutscény nechávají false/undefined
// DŮLEŽITÉ: legs[i].children[2] musí zůstat foot group (animateGuru + motorbike).
import * as THREE from 'three';

/** Canvas textury jen pro hlavu — srst, morda, iris (cached, mobile-friendly). */
function makeFurNoiseMap(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8b8b8';
  ctx.fillRect(0, 0, size, size);
  // směrové „chlupy“ + grain
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const len = 3 + Math.random() * 10;
    const ang = -0.4 + Math.random() * 0.8;
    const g = 140 + ((Math.random() * 90) | 0);
    ctx.strokeStyle = `rgb(${g},${g},${g})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  for (let i = 0; i < 400; i++) {
    const g = 100 + ((Math.random() * 120) | 0);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect((Math.random() * size) | 0, (Math.random() * size) | 0, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  tex.needsUpdate = true;
  return tex;
}

function makeMuzzleMap() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * .5, s * .55, 8, s * .5, s * .5, s * .55);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(.55, '#f4f1ea');
  g.addColorStop(1, '#e0d8cc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 180; i++) {
    const a = 200 + ((Math.random() * 40) | 0);
    ctx.fillStyle = `rgb(${a},${a - 4},${a - 10})`;
    ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1 + (Math.random() * 2) | 0, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.2, 1.2);
  tex.needsUpdate = true;
  return tex;
}

function makeCrownMap() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a2c30';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const len = 2 + Math.random() * 8;
    const v = 30 + ((Math.random() * 50) | 0);
    ctx.strokeStyle = `rgb(${v},${v + 2},${v + 4})`;
    ctx.lineWidth = 0.7 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * .3, y + len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.8, 1.8);
  tex.needsUpdate = true;
  return tex;
}

function makeIrisMap() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;
  const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, s * .48);
  rg.addColorStop(0, '#1a5a32');
  rg.addColorStop(.35, '#2cae62');
  rg.addColorStop(.7, '#1e8a4a');
  rg.addColorStop(1, '#0d3a22');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#07150c';
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

let _furNoise, _muzzleMap, _crownMap, _irisMap;
function furNoise() { return _furNoise || (_furNoise = makeFurNoiseMap()); }
function muzzleMap() { return _muzzleMap || (_muzzleMap = makeMuzzleMap()); }
function crownMap() { return _crownMap || (_crownMap = makeCrownMap()); }
function irisMap() { return _irisMap || (_irisMap = makeIrisMap()); }

export function buildGuru() {
  const noise = furNoise();
  const muzTex = muzzleMap();
  const crownTex = crownMap();
  const irisTex = irisMap();
  const std = (c, r = .8, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...extra });
  const furMat = (c, r = .98, bump = .04) => std(c, r, {
    roughnessMap: noise,
    bumpMap: noise,
    bumpScale: bump,
  });
  const mat = {
    fur: furMat(0xf2efe9, .98, .035),
    furHead: furMat(0xf6f3ee, .99, .055),
    furMuzzle: std(0xffffff, .97, { map: muzTex, roughnessMap: noise, bumpMap: noise, bumpScale: .045 }),
    furGrey: furMat(0x9aa0a8, .97, .05),
    furDark: furMat(0x3a3d44, .96, .06),
    furCrown: std(0x2c2e34, .97, { map: crownTex, roughnessMap: crownTex, bumpMap: crownTex, bumpScale: .07 }),
    pink: std(0xf0b8b0, .9),
    shirt: std(0xf7f7f5, .88),
    jeans: std(0x2a4a86, .92),
    jeansDark: std(0x1e3766, .93),
    leather: std(0x6a3b20, .62, { metalness: .08 }),
    leatherDark: std(0x4a2814, .68, { metalness: .06 }),
    metal: std(0xb5a078, .28, { metalness: .78 }),
    glass: std(0x1a1816, .12, { metalness: .55, emissive: 0x0a0806, emissiveIntensity: .15 }),
    nose: std(0x141010, .38),
    eyeW: std(0xffffff, .18),
    eyeRim: std(0x1a1816, .85),
    iris: std(0xffffff, .25, { map: irisTex, emissive: 0x0a3a1a, emissiveIntensity: .18 }),
    pupil: std(0x050505, .15),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: std(0x2a1816, .85),
    tongue: std(0xe84a5f, .5, { emissive: 0x4a1018, emissiveIntensity: .14 }),
    gum: std(0xc47878, .7),
    stitch: std(0x8b5a2b, .75),
    brow: std(0x12100e, .88),
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
  // vyšší segmentace jen na hlavě
  const SH = (r, w = 36, h = 28) => new THREE.SphereGeometry(r, w, h);
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

  // --- hlava: jemnější geo + canvas srst / morda / iris ---
  const head = new THREE.Group();
  head.position.set(0, 2.24, .02);
  body.add(head);
  // lebka — světlá srst
  head.add(mesh(SH(.44, 40, 32), mat.furHead, [0, 0, 0], [1.08, 1.0, .98]));
  // tmavý temenní „crown“ (husky marking pod čepicí)
  head.add(mesh(new THREE.SphereGeometry(.42, 32, 20, 0, Math.PI * 2, 0, Math.PI * .42), mat.furCrown, [0, .06, -.02], [1.05, 1.05, 1.0], [-.15, 0, 0]));
  // líce / multi-layer chmýří
  [-1, 1].forEach(s => {
    head.add(mesh(SH(.19, 28, 22), mat.furHead, [s * .29, -.04, .1], [.88, 1.0, .92]));
    head.add(mesh(SH(.13, 24, 18), mat.furMuzzle, [s * .24, -.16, .2], [.95, .75, .9]));
    head.add(mesh(SH(.09, 18, 14), mat.furHead, [s * .32, .02, -.02], [.7, .85, .75]));
  });
  // brada + bílá morda
  head.add(mesh(SH(.3, 32, 24), mat.furMuzzle, [0, -.2, .12], [1.28, .82, 1.12]));
  head.add(mesh(SH(.23, 32, 24), mat.furMuzzle, [0, -.12, .38], [1.08, .85, 1.42]));
  // mostík / šedý přechod kolem očí
  head.add(mesh(SH(.14, 24, 16), mat.furGrey, [0, .08, .34], [.7, .55, .5], [-.2, 0, 0]));
  [-1, 1].forEach(s => head.add(mesh(SH(.1, 18, 14), mat.furGrey, [s * .14, .1, .34], [.55, .7, .4])));
  // nos
  head.add(mesh(SH(.09, 20, 16), mat.nose, [0, -.05, .66], [1.3, .88, .95]));
  head.add(mesh(SH(.028, 10, 8), mat.hl, [-.028, -.02, .72]));
  // úšklebek + jazyk
  const jaw = new THREE.Group();
  jaw.position.set(0, -.22, .48);
  head.add(jaw);
  jaw.add(mesh(SH(.145, 24, 16), mat.mouth, [0, -.02, .02], [1.4, .55, .95]));
  jaw.add(mesh(new THREE.SphereGeometry(.115, 18, 12, 0, Math.PI * 2, 0, Math.PI * .55), mat.gum, [0, .025, .05], [1.25, .72, 1.05]));
  // plochý „plácající“ jazyk (Crash) — extrude silhouette, ne tyčka
  const tongue = new THREE.Group();
  tongue.position.set(.02, -.06, .14);
  tongue.rotation.set(1.05, .15, .45);
  jaw.add(tongue);
  const tShape = new THREE.Shape();
  tShape.moveTo(0, 0);
  tShape.bezierCurveTo(.055, .01, .075, .08, .055, .16);
  tShape.bezierCurveTo(.035, .22, .01, .25, 0, .255);
  tShape.bezierCurveTo(-.01, .25, -.035, .22, -.055, .16);
  tShape.bezierCurveTo(-.075, .08, -.055, .01, 0, 0);
  const tGeo = new THREE.ExtrudeGeometry(tShape, {
    depth: .016, bevelEnabled: true, bevelThickness: .01, bevelSize: .014, bevelSegments: 2, curveSegments: 10,
  });
  tGeo.translate(0, 0, -.008);
  const tMesh = new THREE.Mesh(tGeo, mat.tongue);
  tMesh.castShadow = true;
  tongue.add(tMesh);
  // střední rýha
  tongue.add(mesh(new THREE.BoxGeometry(.008, .18, .004), std(0xc43a4e, .55), [0, .12, .012]));
  tongue.userData.baseX = tongue.rotation.x;
  tongue.userData.baseZ = tongue.rotation.z;
  head.tongue = tongue;
  // čelo / šedá kresba
  head.add(mesh(SH(.15, 24, 16), mat.furGrey, [0, .18, .32], [.5, 1.05, .42], [-.35, 0, 0]));
  [-1, 1].forEach(s => {
    // obloukové obočí — 2 segmenty
    head.add(mesh(new THREE.CapsuleGeometry(.02, .11, 4, 8), mat.brow, [s * .18, .23, .37], null, [.1, .2 * s, s * 1.0]));
    head.add(mesh(new THREE.CapsuleGeometry(.018, .08, 4, 8), mat.brow, [s * .1, .26, .38], null, [0, 0, s * .55]));
    // oči — rim + větší iris mapa
    const e = new THREE.Group();
    e.position.set(s * .15, .075, .39);
    e.rotation.y = s * .26;
    head.add(e);
    e.add(mesh(SH(.08, 16, 12), mat.eyeRim, [0, 0, -.01], [1.35, 1.35, .55]));
    e.add(mesh(SH(.128, 28, 20), mat.eyeW, [0, 0, 0], [1.18, 1.22, .68]));
    e.add(mesh(SH(.088, 24, 18), mat.iris, [0, -.002, .052], [1.05, 1.08, .55]));
    e.add(mesh(SH(.042, 14, 12), mat.pupil, [0, -.002, .08], [1, 1.05, .48]));
    e.add(mesh(SH(.024, 8, 8), mat.hl, [s * -.028 + .01, .038, .098]));
    e.add(mesh(SH(.012, 8, 8), mat.hl, [s * .028, -.018, .094]));
    // šedé boční marky
    head.add(mesh(SH(.2, 24, 18), mat.furGrey, [s * .34, .1, -.1], [.48, 1.05, 1]));
    head.add(mesh(SH(.1, 16, 12), mat.furCrown, [s * .3, .22, -.08], [.55, .7, .6]));
    // uši — jemnější
    const ear = new THREE.Group();
    ear.position.set(s * .28, .36, -.02);
    ear.rotation.set(-.1, 0, -s * .32);
    head.add(ear);
    ear.add(mesh(new THREE.ConeGeometry(.2, .46, 6, 1), mat.furCrown, [0, .16, 0], [1, 1, .55], [0, Math.PI / 4, 0]));
    ear.add(mesh(new THREE.ConeGeometry(.12, .32, 6, 1), mat.pink, [0, .13, .055], [1, 1, .3], [0, Math.PI / 4, 0]));
    ear.add(mesh(SH(.065, 14, 12), mat.furDark, [0, .32, -.02], [1.15, .55, .5]));
    // klapky čepice
    head.add(mesh(new THREE.CapsuleGeometry(.1, .42, 4, 10), mat.leather, [s * .45, -.16, -.02], [.45, 1, 1.05], [0, 0, s * .1]));
    head.add(mesh(new THREE.TorusGeometry(.035, .01, 6, 10), mat.metal, [s * .5, -.42, .02], null, [0, Math.PI / 2, 0]));
  });
  // čepice + brýle (beze změny logiky)
  head.add(mesh(new THREE.SphereGeometry(.47, 32, 18, 0, Math.PI * 2, 0, Math.PI * .5), mat.leather, [0, .0, -.04], [1.08, 1.12, 1.03], [-.22, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.45, .025, 8, 32), mat.leatherDark, [0, .1, .06], [1.08, 1.03, 1], [Math.PI / 2 - .22, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.2, .02, 6, 20, Math.PI), mat.leatherDark, [0, .3, .24], [1.2, 1, 1], [-.3, 0, 0]));
  head.add(mesh(new THREE.SphereGeometry(.47, 24, 12, Math.PI * 1.1, Math.PI * .8, Math.PI * .35, Math.PI * .4), mat.leather, [0, 0, -.04], [1.08, 1.12, 1.03]));
  const gog = new THREE.Group();
  gog.position.set(0, .36, .33);
  gog.rotation.x = -.95;
  head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.13, .14, .1, 20), mat.leatherDark, [s * .155, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.115, .022, 6, 20), mat.metal, [s * .155, .048, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.11, .11, .022, 20), mat.glass, [s * .155, .05, 0]));
    gog.add(mesh(SH(.025, 8, 8), mat.hl, [s * .155 - .03, .06, .04]));
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
  const dt = t.dt;
  g.phase = (g.phase || 0) + dt * (3 + a * 1.5);
  const p = g.phase, sn = Math.sin(p);
  g.legs[0].rotation.x = sn * sw; g.legs[1].rotation.x = -sn * sw;
  g.legs.forEach((l, i) => l.children[2].rotation.x = Math.max(0, (i ? sn : -sn)) * .5 * k);
  g.arms[0].rotation.x = -sn * sw * .9; g.arms[1].rotation.x = sn * sw * .9;
  g.body.position.y = Math.abs(Math.cos(p)) * .07 * k;
  g.body.rotation.x += ((running && a > 5 ? .16 : 0) - g.body.rotation.x) * Math.min(1, dt * 6);
  g.body.rotation.y = Math.sin(p) * .06 * k;
  // lookCam: tělo otáčí game3d (~180°); tady jen jemný glance, ať se netočí dvojitě
  const wantLook = !!t.lookCam;
  g._lookT = Math.min(1, Math.max(0, (g._lookT || 0) + (wantLook ? dt * 2.2 : -dt * 3.5)));
  const look = g._lookT;
  const walkY = a < .5 && look < .2 ? Math.sin(t.now / 900) * .12 : 0;
  const tgtY = walkY + look * (.18 + Math.sin(t.now / 800) * .04);
  const tgtZ = Math.sin(p) * .04 * k * (1 - look) + look * .06;
  const tgtX = look * -.05;
  const lerp = (cur, tgt, rate) => cur + (tgt - cur) * Math.min(1, dt * rate);
  g.head.rotation.y = lerp(g.head.rotation.y, tgtY, 10);
  g.head.rotation.z = lerp(g.head.rotation.z, tgtZ, 10);
  g.head.rotation.x = lerp(g.head.rotation.x, tgtX, 10);
  // jemný flop jazyka
  if (g.head.tongue) {
    const tong = g.head.tongue;
    const bx = tong.userData.baseX ?? tong.rotation.x;
    const bz = tong.userData.baseZ ?? tong.rotation.z;
    tong.rotation.x = bx + Math.sin(t.now / 320) * .1;
    tong.rotation.z = bz + Math.sin(t.now / 260) * .14;
  }
  g.tail.rotation.y = Math.sin(t.now / (a > 1 ? 90 : 160)) * .55; g.tail.rotation.x = -.2;
}
