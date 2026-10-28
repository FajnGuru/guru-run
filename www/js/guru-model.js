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
  // Stronger white muzzle: soft rim darkening + directional fluff strokes
  const s = 160, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * .5, s * .52, 6, s * .5, s * .5, s * .58);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(.35, '#faf7f1');
  g.addColorStop(.7, '#ebe3d6');
  g.addColorStop(1, '#cfc4b4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // short white fluff strokes (radial-ish from center)
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const dx = x - s * .5, dy = y - s * .5;
    const ang = Math.atan2(dy, dx) + (Math.random() - .5) * .6;
    const len = 3 + Math.random() * 9;
    const a = 210 + ((Math.random() * 45) | 0);
    ctx.strokeStyle = `rgba(${a},${a - 3},${a - 12},${.35 + Math.random() * .45})`;
    ctx.lineWidth = .5 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  // soft speckles / pores
  for (let i = 0; i < 280; i++) {
    const v = 185 + ((Math.random() * 55) | 0);
    ctx.fillStyle = `rgba(${v},${v - 4},${v - 12},${.4})`;
    ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1 + (Math.random() * 2) | 0, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.35, 1.35);
  tex.needsUpdate = true;
  return tex;
}

function makeCrownMap() {
  // Stronger dark crown: layered strokes + soft mottling (husky scalp under cap)
  const s = 160, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const bg = ctx.createRadialGradient(s * .5, s * .4, 10, s * .5, s * .5, s * .65);
  bg.addColorStop(0, '#3a3e46');
  bg.addColorStop(.45, '#2a2d34');
  bg.addColorStop(1, '#181a1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 1100; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const len = 3 + Math.random() * 11;
    const v = 22 + ((Math.random() * 55) | 0);
    const lite = Math.random() > .72;
    ctx.strokeStyle = lite
      ? `rgba(${v + 40},${v + 42},${v + 48},${.45})`
      : `rgb(${v},${v + 2},${v + 5})`;
    ctx.lineWidth = .55 + Math.random() * 1.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * (.15 + Math.random() * .35), y + len);
    ctx.stroke();
  }
  // soft mottles
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 14;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(70,74,82,.35)');
    rg.addColorStop(1, 'rgba(20,22,26,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.1, 2.1);
  tex.needsUpdate = true;
  return tex;
}

function makeIrisMap() {
  // Deep husky-green iris: limbal ring, radial fibers, soft pupil hole (less sticker)
  const s = 96, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2, R = s * .48;
  ctx.clearRect(0, 0, s, s);
  const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
  rg.addColorStop(0, '#0c2a18');
  rg.addColorStop(.18, '#145a32');
  rg.addColorStop(.42, '#1f9a52');
  rg.addColorStop(.62, '#168048');
  rg.addColorStop(.82, '#0e4a2a');
  rg.addColorStop(1, '#061810');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // radial fibers
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2 + (Math.random() - .5) * .05;
    const bright = i % 3 === 0;
    ctx.strokeStyle = bright ? 'rgba(180,255,200,0.22)' : 'rgba(10,40,20,0.35)';
    ctx.lineWidth = bright ? 1.1 : .7;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
    ctx.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2));
    ctx.stroke();
  }
  // limbal ring
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(4,16,10,0.85)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(30,120,70,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // pupil disc (texture fallback under 3D pupil)
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#030805';
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
    pawPad: std(0xd4a090, .75),
    pawSole: std(0xc48a78, .8),
    furHead: furMat(0xf6f3ee, .99, .07),
    furMuzzle: std(0xffffff, .96, { map: muzTex, roughnessMap: muzTex, bumpMap: muzTex, bumpScale: .08 }),
    furGrey: furMat(0x9aa0a8, .97, .06),
    furDark: furMat(0x3a3d44, .96, .07),
    furCrown: std(0x2c2e34, .96, { map: crownTex, roughnessMap: crownTex, bumpMap: crownTex, bumpScale: .11 }),
    pink: std(0xf0b8b0, .9),
    shirt: std(0xf7f7f5, .88),
    shirtShade: std(0xe4e2dc, .9),
    jeans: std(0x2a4a86, .92),
    jeansDark: std(0x1e3766, .93),
    jeansMid: std(0x355894, .91),
    seam: std(0xd8d4cc, .7),
    leather: std(0x6a3b20, .62, { metalness: .08 }),
    leatherDark: std(0x4a2814, .68, { metalness: .06 }),
    metal: std(0xb5a078, .28, { metalness: .78 }),
    glass: std(0x1a1816, .12, { metalness: .55, emissive: 0x0a0806, emissiveIntensity: .15 }),
    nose: std(0x141010, .38),
    eyeW: std(0xf4f7f8, .22, { emissive: 0xdde8ec, emissiveIntensity: .04 }),
    eyeRim: std(0x12100e, .9),
    eyeSocket: std(0x2a2622, .92),
    iris: std(0xffffff, .22, { map: irisTex, emissive: 0x0a5028, emissiveIntensity: .28 }),
    irisRing: std(0x061810, .55),
    pupil: std(0x020302, .12),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    hlSoft: new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: .55 }),
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

  // --- trup: košile s objemem / švy (ne holý válec) ---
  body.add(mesh(lathe([[0, 1.08], [.3, 1.1], [.325, 1.2], [.34, 1.4], [.335, 1.55], [.31, 1.68], [.24, 1.78], [.14, 1.84], [0, 1.85]], 28), mat.shirt));
  // ramena + prsní objem
  [-1, 1].forEach(s => {
    body.add(mesh(S(.13, 14, 12), mat.shirt, [s * .29, 1.72, .02], [1.15, .75, 1]));
    body.add(mesh(S(.1, 12, 10), mat.shirtShade, [s * .18, 1.48, .22], [1.1, .85, .7]));
  });
  // límec + placket
  [-1, 1].forEach(s => body.add(mesh(new THREE.ConeGeometry(.11, .2, 3), mat.shirt, [s * .09, 1.78, .17], [1, 1, .4], [Math.PI - .3, 0, s * .6])));
  body.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 20), mat.shirt, [0, 1.81, .02], null, [Math.PI / 2 - .25, 0, 0]));
  body.add(mesh(new THREE.BoxGeometry(.07, .68, .025), mat.shirtShade, [0, 1.45, .33]));
  body.add(mesh(new THREE.BoxGeometry(.01, .68, .008), mat.seam, [-.028, 1.45, .34]));
  body.add(mesh(new THREE.BoxGeometry(.01, .68, .008), mat.seam, [.028, 1.45, .34]));
  for (let i = 0; i < 5; i++) {
    body.add(mesh(new THREE.CylinderGeometry(.016, .016, .012, 8), std(0xd8d8d8, .4, { metalness: .4 }), [0, 1.7 - i * .13, .345], null, [Math.PI / 2, 0, 0]));
  }
  // náprsní kapsa + boční švy košile
  body.add(mesh(new THREE.BoxGeometry(.14, .12, .02), mat.shirtShade, [.16, 1.52, .32]));
  body.add(mesh(new THREE.BoxGeometry(.12, .025, .012), mat.seam, [.16, 1.57, .332]));
  [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(.01, .62, .008), mat.seam, [s * .33, 1.42, .05], null, [0, s * .4, 0])));
  // spodní lem košile přes pásek
  body.add(mesh(lathe([[.28, 1.12], [.33, 1.14], [.335, 1.2], [.3, 1.22], [0, 1.22]], 24), mat.shirtShade));

  // opasek — vrstvy + poutka (ne holý válec)
  body.add(mesh(new THREE.TorusGeometry(.312, .038, 8, 28), mat.leather, [0, 1.1, 0], [1, 1, 1.02], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.TorusGeometry(.318, .018, 6, 28), mat.leatherDark, [0, 1.1, 0], [1, 1, 1.02], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + .15;
    body.add(mesh(new THREE.BoxGeometry(.04, .1, .025), mat.leatherDark,
      [Math.sin(a) * .325, 1.1, Math.cos(a) * .325], null, [0, a, 0]));
  }
  body.add(mesh(new THREE.BoxGeometry(.14, .1, .04), mat.metal, [0, 1.1, .335]));
  body.add(mesh(new THREE.BoxGeometry(.05, .08, .02), mat.metal, [0, 1.1, .36], null, [0, 0, Math.PI / 2]));
  body.add(mesh(new THREE.BoxGeometry(.09, .06, .035), mat.leather, [.12, 1.1, .33]));

  // boky džíny — yoke, kapsy, švy
  body.add(mesh(lathe([[0, .8], [.28, .82], [.34, .92], [.345, 1.05], [.33, 1.1], [0, 1.1]], 28), mat.jeans));
  body.add(mesh(lathe([[.2, 1.0], [.34, 1.02], [.345, 1.08], [.3, 1.1], [0, 1.1]], 24), mat.jeansDark)); // yoke
  body.add(mesh(new THREE.BoxGeometry(.014, .26, .012), mat.stitch, [0, .94, .34])); // fly
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.16, .14, .03), mat.jeansDark, [s * .2, .96, .3], null, [0, 0, s * .08]));
    body.add(mesh(new THREE.BoxGeometry(.14, .03, .012), mat.stitch, [s * .2, 1.02, .318]));
    body.add(mesh(new THREE.BoxGeometry(.01, .28, .01), mat.stitch, [s * .34, .94, .02], null, [0, s * .5, 0])); // side seam
    // zadní kapsa náznak
    body.add(mesh(new THREE.BoxGeometry(.14, .12, .025), mat.jeansMid, [s * .16, .98, -.3], null, [0, 0, -s * .1]));
  });

  // --- nohy — children[0]=kalhoty, [1]=lem, [2]=foot ---
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .165, .97, 0);
    // [0] kalhoty, [1] lem, [2] foot — extras až po foot
    const pant = mesh(lathe([[0, 0], [.17, -.02], [.165, -.22], [.15, -.42], [.145, -.62], [.155, -.76], [.16, -.8], [0, -.8]], 20), mat.jeans);
    g.add(pant);
    g.add(mesh(new THREE.TorusGeometry(.158, .022, 6, 16), mat.jeansDark, [0, -.78, 0], null, [Math.PI / 2, 0, 0]));
    const foot = new THREE.Group();
    foot.position.set(0, -.85, .06);
    g.add(foot);
    // ankle fluff under jeans cuff
    foot.add(mesh(S(.14, 14, 12), mat.fur, [0, .12, -.02], [1.05, .7, 1.1]));
    // main paw body — elongated, not a ball
    foot.add(mesh(S(.17, 18, 14), mat.fur, [0, .02, .04], [1.15, .55, 1.55]));
    // heel / sole volume
    foot.add(mesh(S(.12, 14, 12), mat.furGrey, [0, -.04, -.08], [1.05, .4, .85]));
    foot.add(mesh(new THREE.BoxGeometry(.22, .04, .32), mat.pawSole, [0, -.08, .06]));
    // metacarpal pad
    foot.add(mesh(S(.09, 12, 10), mat.pawPad, [0, -.06, .02], [1.3, .35, 1.1]));
    // 4 readable toes + pads
    [-1.35, -.45, .45, 1.35].forEach((t, i) => {
      const x = t * .055;
      foot.add(mesh(S(.055, 12, 10), mat.fur, [x, -.02, .26], [1.05, .75, 1.25]));
      foot.add(mesh(S(.032, 10, 8), mat.pawPad, [x, -.055, .28], [1.1, .4, 1]));
      // tiny claw tip
      foot.add(mesh(S(.018, 6, 6), mat.furGrey, [x, -.02, .34], [1, .5, 1.2]));
    });
    // šev + koleno jako děti pant mesh (neposouvají children[2])
    pant.add(mesh(new THREE.BoxGeometry(.012, .72, .01), mat.stitch, [s * .155, -.38, 0]));
    pant.add(mesh(S(.09, 10, 8), mat.jeansMid, [0, -.35, .06], [1.15, .7, .9]));
    body.add(g);
    return g;
  });

  // --- paže — rukávy s lemem / švem ---
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .31, 1.7, 0);
    g.rotation.z = s * .14;
    g.add(mesh(lathe([[0, 0], [.12, -.02], [.115, -.28], [.11, -.52], [.12, -.62], [.125, -.66], [0, -.66]], 18), mat.shirt));
    g.add(mesh(new THREE.TorusGeometry(.118, .02, 6, 14), mat.shirtShade, [0, -.64, 0], null, [Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.BoxGeometry(.01, .55, .008), mat.seam, [s * .1, -.32, 0]));
    // paw hand — palm + fingers (readable silhouette)
    const hand = new THREE.Group();
    hand.position.set(0, -.76, .02);
    g.add(hand);
    hand.add(mesh(S(.11, 14, 12), mat.fur, [0, 0, 0], [1.05, .95, .85]));
    hand.add(mesh(S(.07, 12, 10), mat.pawPad, [0, -.02, .06], [1.2, .5, .9]));
    // thumb
    hand.add(mesh(S(.045, 10, 8), mat.fur, [-s * .1, .02, .04], [.9, .85, 1]));
    hand.add(mesh(S(.025, 8, 6), mat.pawPad, [-s * .11, -.01, .07], [1, .45, .9]));
    // 3 fingers
    [-.06, 0, .06].forEach((x, i) => {
      hand.add(mesh(S(.04, 10, 8), mat.fur, [x, -.08, .05], [.95, 1.1, .9]));
      hand.add(mesh(S(.022, 8, 6), mat.pawPad, [x, -.11, .07], [1.05, .4, .95]));
    });
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
    // jemnější fluff clumps (jen hlava)
    head.add(mesh(SH(.055, 12, 10), mat.furHead, [s * .36, -.08, .14], [.9, 1.1, .85]));
    head.add(mesh(SH(.048, 12, 10), mat.furMuzzle, [s * .28, -.2, .28], [1.1, .8, 1]));
    head.add(mesh(SH(.05, 12, 10), mat.furGrey, [s * .34, .08, .06], [.85, .9, .7]));
    head.add(mesh(SH(.042, 10, 8), mat.furCrown, [s * .22, .2, -.12], [1, .7, .8]));
  });
  // brada + bílá morda
  head.add(mesh(SH(.3, 32, 24), mat.furMuzzle, [0, -.2, .12], [1.28, .82, 1.12]));
  head.add(mesh(SH(.23, 32, 24), mat.furMuzzle, [0, -.12, .38], [1.08, .85, 1.42]));
  // chin / forehead fluff clumps
  head.add(mesh(SH(.07, 14, 12), mat.furMuzzle, [0, -.28, .22], [1.2, .7, 1]));
  head.add(mesh(SH(.055, 12, 10), mat.furMuzzle, [.08, -.24, .3], [.9, .75, .95]));
  head.add(mesh(SH(.055, 12, 10), mat.furMuzzle, [-.08, -.24, .3], [.9, .75, .95]));
  head.add(mesh(SH(.06, 12, 10), mat.furCrown, [0, .22, -.08], [1.1, .65, .9]));
  head.add(mesh(SH(.045, 10, 8), mat.furHead, [0, .12, .28], [.8, .6, .7]));
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
  // Crash flat lolling tongue v2 — wide Extrude, thin depth, tip child for flop
  // Shape in XY (width×length); rotateX(π/2) → flat face in XZ (reads flat from camera)
  const tongue = new THREE.Group();
  tongue.position.set(.035, -.055, .1);
  // hang forward-down-right so flat top faces camera on idle look-back
  tongue.rotation.set(.72, .18, .28);
  jaw.add(tongue);
  const makeTongueGeo = (halfW, len) => {
    const sh = new THREE.Shape();
    sh.moveTo(-halfW * .45, 0);
    sh.lineTo(halfW * .45, 0);
    sh.bezierCurveTo(halfW * .95, len * .12, halfW * 1.05, len * .45, halfW * .75, len * .72);
    sh.bezierCurveTo(halfW * .45, len * .92, halfW * .18, len, 0, len * 1.02);
    sh.bezierCurveTo(-halfW * .18, len, -halfW * .45, len * .92, -halfW * .75, len * .72);
    sh.bezierCurveTo(-halfW * 1.05, len * .45, -halfW * .95, len * .12, -halfW * .45, 0);
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .01, bevelSegments: 2, curveSegments: 12,
    });
    geo.translate(0, 0, -.006);
    // flat XY → stick forward (+Z), thin in Y
    geo.rotateX(Math.PI / 2);
    return geo;
  };
  const tRoot = new THREE.Mesh(makeTongueGeo(.095, .14), mat.tongue);
  tRoot.castShadow = true;
  tongue.add(tRoot);
  // tip segment (wider pad) — animated flop
  const tip = new THREE.Group();
  tip.position.set(0, -.01, .13);
  tip.rotation.x = .35;
  tongue.add(tip);
  const tTip = new THREE.Mesh(makeTongueGeo(.1, .16), mat.tongue);
  tTip.castShadow = true;
  tip.add(tTip);
  // groove on tip (flat dark line, not a rod)
  tip.add(mesh(new THREE.BoxGeometry(.012, .004, .12), std(0xc43a4e, .55), [0, .01, .02]));
  tongue.tip = tip;
  tongue.userData.baseX = tongue.rotation.x;
  tongue.userData.baseY = tongue.rotation.y;
  tongue.userData.baseZ = tongue.rotation.z;
  tip.userData.baseX = tip.rotation.x;
  head.tongue = tongue;
  // čelo / šedá kresba
  head.add(mesh(SH(.15, 24, 16), mat.furGrey, [0, .18, .32], [.5, 1.05, .42], [-.35, 0, 0]));
  [-1, 1].forEach(s => {
    // obloukové obočí — 3-segment arch (čitelnější oblouk)
    const brow = new THREE.Group();
    brow.position.set(s * .15, .24, .36);
    brow.rotation.set(.12, s * .15, s * .95);
    head.add(brow);
    brow.add(mesh(new THREE.CapsuleGeometry(.016, .055, 4, 8), mat.brow, [-.055, -.012, 0], null, [0, 0, .55]));
    brow.add(mesh(new THREE.CapsuleGeometry(.018, .07, 4, 8), mat.brow, [0, .01, .005], [1.05, 1, 1], [0, 0, 0]));
    brow.add(mesh(new THREE.CapsuleGeometry(.015, .05, 4, 8), mat.brow, [.052, -.008, 0], null, [0, 0, -.5]));
    // oči — socket + rim + sclera + deep iris + limbal ring + pupil + dual HL
    const e = new THREE.Group();
    e.position.set(s * .15, .075, .39);
    e.rotation.y = s * .26;
    head.add(e);
    e.add(mesh(SH(.095, 18, 14), mat.eyeSocket, [0, -.008, -.02], [1.45, 1.35, .7]));
    e.add(mesh(SH(.078, 18, 14), mat.eyeRim, [0, 0, -.005], [1.38, 1.32, .52]));
    e.add(mesh(SH(.132, 32, 24), mat.eyeW, [0, 0, 0], [1.16, 1.2, .72]));
    // iris slightly domed / inset
    e.add(mesh(SH(.086, 28, 22), mat.iris, [0, -.002, .048], [1.08, 1.1, .62]));
    e.add(mesh(new THREE.TorusGeometry(.078, .008, 8, 24), mat.irisRing, [0, -.002, .055], [1, 1.02, 1], [Math.PI / 2, 0, 0]));
    e.add(mesh(SH(.038, 16, 12), mat.pupil, [0, -.002, .078], [1, 1.05, .55]));
    // dual highlights (large + small) — less sticker, wet look
    e.add(mesh(SH(.026, 10, 8), mat.hl, [s * -.03 + .008, .036, .1]));
    e.add(mesh(SH(.012, 8, 6), mat.hlSoft, [s * .022, -.016, .098]));
    e.add(mesh(SH(.008, 6, 6), mat.hl, [s * -.018, -.02, .102]));
    // šedé boční marky
    head.add(mesh(SH(.2, 24, 18), mat.furGrey, [s * .34, .1, -.1], [.48, 1.05, 1]));
    head.add(mesh(SH(.1, 16, 12), mat.furCrown, [s * .3, .22, -.08], [.55, .7, .6]));
    // uši — jemnější (tracked for idle twitch)
    const ear = new THREE.Group();
    ear.position.set(s * .28, .36, -.02);
    ear.rotation.set(-.1, 0, -s * .32);
    ear.userData.base = { x: ear.rotation.x, y: ear.rotation.y, z: ear.rotation.z };
    head.add(ear);
    ear.add(mesh(new THREE.ConeGeometry(.2, .46, 6, 1), mat.furCrown, [0, .16, 0], [1, 1, .55], [0, Math.PI / 4, 0]));
    ear.add(mesh(new THREE.ConeGeometry(.12, .32, 6, 1), mat.pink, [0, .13, .055], [1, 1, .3], [0, Math.PI / 4, 0]));
    ear.add(mesh(SH(.065, 14, 12), mat.furDark, [0, .32, -.02], [1.15, .55, .5]));
    head.ears = head.ears || [];
    head.ears.push(ear);
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
  const a = Math.abs(speed);
  const dt = t.dt;
  const lerp = (cur, tgt, rate) => cur + (tgt - cur) * Math.min(1, dt * rate);
  // plynulejší náběh intenzity chůze (ne skok 0→1)
  const kTgt = Math.min(1, a / 3.6);
  g._moveK = lerp(g._moveK || 0, kTgt, 7);
  const mk = g._moveK;
  // kadence: pomalejší base, plynulejší přechod walk→run
  const cadence = 2.2 + a * (running ? 1.25 : .95);
  g.phase = (g.phase || 0) + dt * cadence;
  const p = g.phase;
  const sn = Math.sin(p);
  const snLag = Math.sin(p - .28); // paže mírně zpožděné = měkčí
  const walkAmp = mk * (running ? .82 : .52);
  const armAmp = walkAmp * .88;

  // nohy — lerp místo přímého přiřazení
  g.legs[0].rotation.x = lerp(g.legs[0].rotation.x, sn * walkAmp, 11);
  g.legs[1].rotation.x = lerp(g.legs[1].rotation.x, -sn * walkAmp, 11);
  g.legs.forEach((l, i) => {
    const footLift = Math.max(0, (i ? sn : -sn)) * .4 * mk;
    l.children[2].rotation.x = lerp(l.children[2].rotation.x, footLift, 13);
  });
  // paže — lag + měkčí rate
  g.arms[0].rotation.x = lerp(g.arms[0].rotation.x, -snLag * armAmp, 9);
  g.arms[1].rotation.x = lerp(g.arms[1].rotation.x, snLag * armAmp, 9);

  // body bob: 2× za krok, + idle breath; jemnější než abs(cos)
  const strideBob = (1 - Math.cos(p * 2)) * .5; // 0..1
  const idle = 1 - mk;
  const breathWave = Math.sin(t.now / 680);
  const breath = idle * breathWave * .032;
  g.body.position.y = lerp(g.body.position.y, strideBob * .05 * mk + breath, 9);
  // lean / hip sway — soft rates
  const leanX = (running && a > 5 ? .11 : mk * .035);
  g.body.rotation.x = lerp(g.body.rotation.x, leanX, 5);
  g.body.rotation.y = lerp(g.body.rotation.y, sn * .048 * mk, 7);
  g.body.rotation.z = lerp(g.body.rotation.z, sn * .03 * mk, 7);
  // walk squash + subtle idle chest breath
  const wsq = Math.sin(p * 2) * .022 * mk;
  const bsc = idle * breathWave * .014;
  const sx = 1 + wsq * .35 + bsc, sy = 1 - wsq + bsc * .6, sz = 1 + wsq * .35 + bsc;
  g.body.scale.x = lerp(g.body.scale.x, sx, 10);
  g.body.scale.y = lerp(g.body.scale.y, sy, 10);
  g.body.scale.z = lerp(g.body.scale.z, sz, 10);

  // lookCam: tělo otáčí game3d (~180°); tady jen jemný glance
  const wantLook = !!t.lookCam;
  g._lookT = Math.min(1, Math.max(0, (g._lookT || 0) + (wantLook ? dt * 2.0 : -dt * 3.0)));
  const look = g._lookT;
  const walkY = a < .5 && look < .2 ? Math.sin(t.now / 950) * .1 : 0;
  const tgtY = walkY + look * (.18 + Math.sin(t.now / 800) * .04);
  const tgtZ = sn * .035 * mk * (1 - look) + look * .05;
  const tgtX = look * -.05 + breath * .4;
  g.head.rotation.y = lerp(g.head.rotation.y, tgtY, 8);
  g.head.rotation.z = lerp(g.head.rotation.z, tgtZ, 8);
  g.head.rotation.x = lerp(g.head.rotation.x, tgtX, 8);
  // Crash tongue flop — root sway + tip waggle (reads as floppy, not a rod)
  if (g.head.tongue) {
    const tong = g.head.tongue;
    const n = t.now;
    const bx = tong.userData.baseX ?? tong.rotation.x;
    const by = tong.userData.baseY ?? tong.rotation.y;
    const bz = tong.userData.baseZ ?? tong.rotation.z;
    tong.rotation.x = bx + Math.sin(n / 280) * .12 + Math.sin(n / 170) * .05;
    tong.rotation.y = by + Math.sin(n / 310) * .07;
    tong.rotation.z = bz + Math.sin(n / 230) * .16;
    if (tong.tip) {
      const tbx = tong.tip.userData.baseX ?? tong.tip.rotation.x;
      tong.tip.rotation.x = tbx + Math.sin(n / 190) * .22;
      tong.tip.rotation.z = Math.sin(n / 160) * .18;
      tong.tip.rotation.y = Math.sin(n / 250) * .08;
    }
  }
  // ocas — plynulejší
  const tailSp = a > 1 ? 100 : 180;
  g.tail.rotation.y = lerp(g.tail.rotation.y, Math.sin(t.now / tailSp) * (.4 + mk * .2), 6);
  g.tail.rotation.x = lerp(g.tail.rotation.x, -.18 - mk * .06, 5);

  // idle ear twitch (Guru + Fiškule via head.ears)
  if (g.head.ears && g.head.ears.length) {
    g.head.ears.forEach((ear, i) => {
      const b = ear.userData.base || (ear.userData.base = {
        x: ear.rotation.x, y: ear.rotation.y, z: ear.rotation.z,
      });
      const side = i ? 1 : -1;
      const soft = Math.sin(t.now / 920 + i * 1.7) * .035 * idle;
      // occasional twitch spike
      const spike = Math.pow(Math.max(0, Math.sin(t.now / 510 + i * 2.3)), 12) * .22 * idle;
      ear.rotation.z = lerp(ear.rotation.z, b.z + soft * side + spike * side, 10);
      ear.rotation.x = lerp(ear.rotation.x, b.x + soft * .4 - spike * .15, 10);
      ear.rotation.y = lerp(ear.rotation.y, b.y + Math.sin(t.now / 1100 + i) * .02 * idle, 8);
    });
  }
}
