// Procedurální model Fiškule (zaječice) — outfit v2 (vest/scarf/cargo) + prior head/fur
// API: buildFiskule() → { root, body, head, arms, legs, tail, compass }
// animateGuru z guru-model.js očekává legs[i].children[2] = foot group.
import * as THREE from 'three';

function makeFurNoiseMap() {
  // denser directional fur grain for MeshStandard bump/roughness
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d'), img = ctx.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 140 + ((Math.random() * 110) | 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // long soft strands
  ctx.lineCap = 'round';
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const len = 3 + Math.random() * 9;
    const dx = (Math.random() - .5) * 3;
    ctx.globalAlpha = .1 + Math.random() * .22;
    ctx.strokeStyle = Math.random() > .55 ? '#f5efe6' : '#3a2416';
    ctx.lineWidth = .6 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dx * .5, y + len * .45, x + dx, y + len);
    ctx.stroke();
  }
  // fine short undercoat speckles
  ctx.globalAlpha = .25;
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#2a1810';
    ctx.fillRect(Math.random() * s, Math.random() * s, 1.2, 1.2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3.2, 3.2);
  tex.needsUpdate = true;
  return tex;
}

function makeCottonMap() {
  // soft cotton-ball fluff for white tail
  const s = 96, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8f4ee';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * 18;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,.55)');
    g.addColorStop(.55, 'rgba(240,235,228,.2)');
    g.addColorStop(1, 'rgba(210,200,190,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 500; i++) {
    ctx.globalAlpha = .12 + Math.random() * .2;
    ctx.strokeStyle = Math.random() > .4 ? '#fff' : '#c8beb4';
    const x = Math.random() * s, y = Math.random() * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - .5) * 5, y + 1 + Math.random() * 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.6, 1.6);
  tex.needsUpdate = true;
  return tex;
}

function makeFaceMap() {
  // UV-ish face: cream muzzle blob + soft cheek warmth + freckle noise
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * .5, s * .62, 8, s * .5, s * .55, s * .48);
  g.addColorStop(0, '#f3e6c9');
  g.addColorStop(.45, '#e8d5b0');
  g.addColorStop(.75, '#c9a878');
  g.addColorStop(1, '#a67c52');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // soft cheek blush
  for (const sx of [.28, .72]) {
    const rg = ctx.createRadialGradient(s * sx, s * .58, 2, s * sx, s * .58, s * .18);
    rg.addColorStop(0, 'rgba(220,140,120,.35)');
    rg.addColorStop(1, 'rgba(220,140,120,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, s, s);
  }
  // fur speckles
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${140 + (Math.random() * 80) | 0},${100 + (Math.random() * 60) | 0},${60 + (Math.random() * 40) | 0},${.12 + Math.random() * .2})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeIrisMap() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, s * .45);
  g.addColorStop(0, '#3a1e0a');
  g.addColorStop(.35, '#7a4a1c');
  g.addColorStop(.7, '#5a3412');
  g.addColorStop(1, '#2a1608');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, s * .45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,160,.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * s * .4, cy + Math.sin(a) * s * .4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

let _furNoise, _faceMap, _irisMap, _cottonMap;
function furNoise() { return _furNoise || (_furNoise = makeFurNoiseMap()); }
function faceMap() { return _faceMap || (_faceMap = makeFaceMap()); }
function irisMap() { return _irisMap || (_irisMap = makeIrisMap()); }
function cottonMap() { return _cottonMap || (_cottonMap = makeCottonMap()); }

export function buildFiskule() {
  const noise = furNoise();
  const faceTex = faceMap();
  const irisTex = irisMap();
  const cottonTex = cottonMap();
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...extra });
  const furMat = (c, r = .98, bump = .07) => std(c, r, { roughnessMap: noise, bumpMap: noise, bumpScale: bump });
  // Palette z turnaroundu: warm brown / cream / olive vest / terracotta shorts+scarf / brass
  const mat = {
    fur: furMat(0xa67c52, .98, .08),
    furLight: furMat(0xe8dcc5, .97, .065),
    furDark: furMat(0x4a3020, .96, .075),
    furFace: std(0xe8d5b0, .92, { map: faceTex, roughnessMap: noise, bumpMap: noise, bumpScale: .04 }),
    pink: std(0xe8b0a8, .88, { bumpMap: noise, bumpScale: .025 }),
    white: std(0xf6f1ea, .99, { map: cottonTex, roughnessMap: cottonTex, bumpMap: cottonTex, bumpScale: .09 }),
    cotton: std(0xffffff, .995, { map: cottonTex, roughnessMap: cottonTex, bumpMap: cottonTex, bumpScale: .11 }),
    shirt: std(0xd4c094, .9),
    vest: std(0x6a7148, .9),
    vestDark: std(0x4e5436, .92),
    vestLight: std(0x7a8256, .88),
    shorts: std(0xa84832, .9),
    shortsDark: std(0x7a3424, .92),
    shortsLight: std(0xb85a42, .88),
    scarf: std(0xb81f1a, .84),
    scarfDark: std(0x8a1612, .88),
    leather: std(0x5a3a22, .65, { metalness: .08 }),
    metal: std(0xc4a060, .3, { metalness: .72 }),
    brass: std(0xd4af37, .28, { metalness: .82 }),
    glass: std(0x1a1816, .12, { metalness: .55, emissive: 0x080706, emissiveIntensity: .12 }),
    gold: std(0xd9a530, .28, { metalness: .88 }),
    face: std(0xf2e6c8, .55),
    nose: std(0xd77f86, .42, { emissive: 0x4a1820, emissiveIntensity: .08 }),
    eyeW: std(0xffffff, .2),
    eyeRim: std(0x3a2818, .7),
    iris: std(0xffffff, .28, { map: irisTex, emissive: 0x2a1508, emissiveIntensity: .12 }),
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
  const SH = (r, w = 28, h = 20) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);

  // trup: tan shirt + olive utility vest (turnaround volume)
  body.add(mesh(lathe([[0, .78], [.28, .8], [.3, .95], [.3, 1.12], [.27, 1.28], [.17, 1.38], [0, 1.4]], 24), mat.shirt));
  // vest shell — slightly thicker/boxier utility silhouette
  body.add(mesh(lathe([[.0, .78], [.32, .8], [.335, .96], [.335, 1.14], [.3, 1.28], [.22, 1.35], [.02, 1.35]], 24), mat.vest, [0, 0, -.008], [1, 1, .97]));
  // open placket showing shirt
  body.add(mesh(new THREE.BoxGeometry(.08, .42, .04), mat.shirt, [0, 1.08, .3], null, [-.04, 0, 0]));
  // collar flaps
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.14, .06, .04), mat.vestLight, [s * .1, 1.34, .22], null, [.35, 0, s * -.5]));
  });
  // chest pockets with flaps + brass snaps
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.15, .13, .045), mat.vestDark, [s * .175, .94, .31]));
    body.add(mesh(new THREE.BoxGeometry(.155, .045, .03), mat.vestLight, [s * .175, 1.015, .335], null, [.15, 0, 0]));
    body.add(mesh(new THREE.CylinderGeometry(.014, .014, .012, 8), mat.brass, [s * .175, .975, .35], null, [Math.PI / 2, 0, 0]));
  });
  // center brass buttons
  [1.18, 1.08, .98].forEach(y => {
    body.add(mesh(new THREE.CylinderGeometry(.012, .012, .01, 8), mat.brass, [0, y, .32], null, [Math.PI / 2, 0, 0]));
  });
  // red bandana — wrapped under vest collar + front knot/tails
  body.add(mesh(new THREE.TorusGeometry(.185, .055, 10, 22), mat.scarf, [0, 1.36, .02], [1.05, 1, .95], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 18), mat.scarfDark, [0, 1.35, .04], [1, 1, .9], [Math.PI / 2, .1, 0]));
  // draped front triangle + knot
  body.add(mesh(new THREE.ConeGeometry(.16, .28, 3), mat.scarf, [0, 1.24, .3], [1.1, 1, .28], [Math.PI + .3, 0, 0]));
  body.add(mesh(new THREE.SphereGeometry(.045, 10, 8), mat.scarfDark, [.02, 1.3, .32]));
  body.add(mesh(new THREE.BoxGeometry(.05, .1, .035), mat.scarf, [.1, 1.2, .32], null, [0, 0, .45]));
  body.add(mesh(new THREE.BoxGeometry(.045, .09, .03), mat.scarfDark, [-.06, 1.18, .31], null, [0, 0, -.35]));
  // terracotta cargo shorts — fuller hips + waistband
  body.add(mesh(lathe([[0, .48], [.32, .5], [.36, .62], [.355, .78], [.32, .84], [0, .84]], 24), mat.shorts));
  body.add(mesh(new THREE.CylinderGeometry(.33, .33, .055, 24), mat.shortsDark, [0, .82, 0]));
  // belt loops hint
  [-1, 0, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.04, .07, .025), mat.shortsLight, [s * .22, .82, .3]));
  });
  // front fly seam
  body.add(mesh(new THREE.BoxGeometry(.02, .14, .02), mat.shortsDark, [0, .68, .34]));

  // nohy: [0] šortky, [1] cargo kapsa, [2] foot  (animateGuru foot index)
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * .155, .66, 0);
    // fuller cargo leg volume
    g.add(mesh(lathe([[0, 0], [.2, -.02], [.22, -.2], [.21, -.36], [0, -.36]], 16), mat.shorts));
    // cargo pocket with flap (single mesh group as children[1])
    const pocket = new THREE.Group();
    pocket.position.set(s * .18, -.16, 0);
    g.add(pocket);
    pocket.add(mesh(new THREE.BoxGeometry(.1, .16, .1), mat.shortsDark, [0, 0, 0]));
    pocket.add(mesh(new THREE.BoxGeometry(.105, .045, .04), mat.shortsLight, [0, .085, .02], null, [.2, 0, 0]));
    pocket.add(mesh(new THREE.CylinderGeometry(.01, .01, .01, 6), mat.brass, [0, .05, .055], null, [Math.PI / 2, 0, 0]));
    const foot = new THREE.Group();
    foot.position.set(0, -.58, .1);
    g.add(foot);
    foot.add(mesh(new THREE.CapsuleGeometry(.08, .22, 4, 8), mat.fur, [0, .18, -.08]));
    foot.add(mesh(S(.15, 14, 12), mat.fur, [0, 0, .02], [1, .55, 1.9]));
    foot.add(mesh(S(.1, 12, 10), mat.furLight, [0, -.02, .2], [1, .5, 1]));
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

  // --- hlava v2: turnaround ears/cheeks/eyes (fiskule-ref) ---
  const head = new THREE.Group();
  head.position.set(0, 1.64, .02);
  head.scale.setScalar(1.2);
  body.add(head);
  // skull — slightly taller, rounded crown
  head.add(mesh(SH(.36, 36, 28), mat.fur, [0, .04, -.02], [1.05, 1.08, 1.02]));
  // prominent fluffy cheeks — widen lower face (turnaround silhouette)
  [-1, 1].forEach(s => {
    head.add(mesh(SH(.2, 28, 22), mat.fur, [s * .3, -.06, .06], [.95, 1.05, .95]));
    head.add(mesh(SH(.14, 24, 18), mat.fur, [s * .32, -.12, .12], [.8, .9, .85]));
    head.add(mesh(SH(.13, 22, 16), mat.furFace, [s * .24, -.1, .22], [.75, .8, .7]));
  });
  // cream muzzle + chin taper
  head.add(mesh(SH(.23, 28, 22), mat.furFace, [0, -.15, .2], [1.25, .88, 1.18]));
  head.add(mesh(SH(.13, 22, 16), mat.furLight, [0, -.12, .34], [1.15, .72, .9]));
  head.add(mesh(SH(.1, 18, 14), mat.furFace, [0, -.22, .18], [1.05, .7, .95]));
  // nose + philtrum hint
  head.add(mesh(SH(.048, 16, 12), mat.nose, [0, -.07, .42], [1.45, .9, 1]));
  head.add(mesh(SH(.014, 8, 6), mat.hl, [-.014, -.055, .455]));
  head.add(mesh(new THREE.BoxGeometry(.012, .06, .01), mat.mouth, [0, -.12, .4]));
  // mouth
  head.add(mesh(new THREE.TorusGeometry(.07, .011, 6, 16, Math.PI * .8), mat.mouth, [0, -.2, .36], null, [0, 0, Math.PI * 1.1]));

  [-1, 1].forEach(s => {
    // almond doe-eyes — wider X, softer Y, slight outer-down tilt
    const e = new THREE.Group();
    e.position.set(s * .15, .05, .3);
    e.rotation.set(-.06, s * .28, s * .12);
    head.add(e);
    e.add(mesh(SH(.065, 16, 12), mat.eyeRim, [0, 0, -.014], [1.45, 1.15, .45]));
    e.add(mesh(SH(.105, 26, 20), mat.eyeW, [0, 0, 0], [1.25, 1.05, .55]));
    e.add(mesh(SH(.068, 22, 16), mat.iris, [s * .008, -.006, .038], [1.05, 1.0, .45]));
    e.add(mesh(SH(.034, 14, 10), mat.pupil, [s * .008, -.006, .058], [1, 1.02, .4]));
    e.add(mesh(SH(.02, 8, 6), mat.hl, [s * -.02 + .012, .026, .07]));
    e.add(mesh(SH(.01, 6, 6), mat.hl, [s * .02, -.012, .068]));
    // soft brow arc
    head.add(mesh(new THREE.CapsuleGeometry(.014, .09, 3, 6), mat.furDark, [s * .15, .155, .32], null, [0, 0, s * 1.15]));
    // long upright ears — slight outward tip curve, pink inner, dark tips
    const ear = new THREE.Group();
    ear.position.set(s * .12, .3, -.06);
    ear.rotation.set(-.08, s * .12, -s * .18);
    head.add(ear);
    // base fluff at skull
    ear.add(mesh(SH(.12, 16, 12), mat.fur, [0, .06, 0], [1.1, .7, .55]));
    // main shaft — taller, flatter depth
    ear.add(mesh(new THREE.CapsuleGeometry(.105, .78, 8, 16), mat.fur, [0, .48, 0], [.95, 1, .32]));
    // tip bends slightly outward
    const tip = new THREE.Group();
    tip.position.set(0, .9, 0);
    tip.rotation.z = -s * .28;
    tip.rotation.x = -.12;
    ear.add(tip);
    tip.add(mesh(new THREE.CapsuleGeometry(.095, .18, 6, 12), mat.fur, [0, .08, 0], [.9, 1, .3]));
    tip.add(mesh(SH(.1, 14, 12), mat.furDark, [0, .16, 0], [1.05, .95, .35]));
    tip.add(mesh(SH(.06, 12, 10), mat.furDark, [0, .26, 0], [.9, .75, .28]));
    // pink inner canal (peach from turnaround)
    ear.add(mesh(new THREE.CapsuleGeometry(.068, .62, 6, 12), mat.pink, [0, .46, .04], [.95, 1, .18]));
    ear.add(mesh(SH(.055, 12, 10), mat.pink, [0, .12, .035], [1.1, .8, .35]));
    head.ears = head.ears || [];
    head.ears.push(ear);
  });

  // pásek brýlí + mosazné brýle na čele
  head.add(mesh(new THREE.TorusGeometry(.34, .03, 8, 32), mat.leather, [0, .16, -.01], [1.08, 1, 1.04], [Math.PI / 2 - .28, 0, 0]));
  const gog = new THREE.Group();
  gog.position.set(0, .26, .26);
  gog.rotation.x = -1.0;
  head.add(gog);
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.CylinderGeometry(.095, .105, .085, 18), mat.leather, [s * .115, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.085, .018, 6, 18), mat.brass, [s * .115, .044, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.078, .078, .022, 18), mat.glass, [s * .115, .048, 0]));
    gog.add(mesh(SH(.018, 8, 6), mat.hl, [s * .115 - .02, .058, .032]));
  });
  gog.add(mesh(new THREE.BoxGeometry(.055, .032, .042), mat.brass, [0, .012, 0]));

  // fluffy white cotton-ball tail (turnaround puff)
  const tail = new THREE.Group();
  tail.position.set(0, .68, -.32);
  body.add(tail);
  // core volume
  tail.add(mesh(S(.155, 18, 14), mat.cotton, [0, .02, -.02], [1.05, 1.1, 1.05]));
  tail.add(mesh(S(.12, 16, 12), mat.white, [0, -.02, -.08], [1.1, 1, 1.15]));
  // overlapping fluff clumps — cotton-ball silhouette
  const clumps = [
    [.08, .06, -.1, .1], [-.07, .07, -.09, .095], [0, .12, -.12, .09],
    [.05, -.05, -.14, .085], [-.06, -.04, -.13, .08], [.1, .02, -.04, .075],
    [-.1, .01, -.05, .075], [0, .08, .02, .07], [.04, .14, -.05, .065],
    [-.05, .13, -.06, .065], [.02, -.08, -.06, .07], [-.02, .16, -.1, .055],
  ];
  clumps.forEach(([x, y, z, r]) => {
    tail.add(mesh(S(r, 12, 10), mat.cotton, [x, y, z]));
  });
  // soft highlight tufts
  tail.add(mesh(S(.045, 10, 8), mat.white, [.06, .1, -.16], [1.1, 1, 1]));
  tail.add(mesh(S(.04, 8, 6), mat.white, [-.05, .11, -.15]));

  return { root, body, head, arms, legs, tail, compass };
}
