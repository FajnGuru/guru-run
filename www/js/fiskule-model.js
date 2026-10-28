// Procedurální model Fiškule (zaječice) — PR10 polish: blink lids (shared animateGuru)
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
    vestSeam: std(0x3a4028, .95),
    button: std(0xe8d48a, .28, { metalness: .7, emissive: 0x3a2a08, emissiveIntensity: .12 }),
    buttonRim: std(0xa07828, .32, { metalness: .8 }),
    shorts: std(0xa84832, .9),
    shortsDark: std(0x7a3424, .92),
    shortsLight: std(0xb85a42, .88),
    scarf: std(0xb81f1a, .84),
    scarfDark: std(0x8a1612, .88),
    scarfDeep: std(0x6a100e, .9),
    leather: std(0x5a3a22, .65, { metalness: .08 }),
    boot: std(0x4a2e1a, .7, { metalness: .06 }),
    bootDark: std(0x2e1a10, .75),
    bootLight: std(0x6a4230, .65),
    pawPad: std(0xd4a090, .75),
    pawSole: std(0xb87868, .82),
    metal: std(0xc4a060, .3, { metalness: .72 }),
    brass: std(0xe0b84a, .22, { metalness: .9, emissive: 0x3a2a08, emissiveIntensity: .15 }),
    brassDark: std(0xa07828, .3, { metalness: .85, emissive: 0x2a1e06, emissiveIntensity: .08 }),
    glass: std(0x141210, .08, { metalness: .65, emissive: 0x1a2830, emissiveIntensity: .18 }),
    glassLens: std(0x0c1014, .06, { metalness: .7, emissive: 0x243040, emissiveIntensity: .22 }),
    gold: std(0xe8bc3a, .2, { metalness: .92, emissive: 0x4a3408, emissiveIntensity: .18 }),
    face: std(0xf2e6c8, .55),
    dial: std(0xf5ecd4, .45),
    dialInk: std(0x2a1c10, .7),
    needleRed: std(0xc41e1a, .35, { emissive: 0x4a0808, emissiveIntensity: .25 }),
    needleBlue: std(0x2a3a6a, .4, { emissive: 0x081020, emissiveIntensity: .1 }),
    nose: std(0xd07078, .32, { metalness: .08, emissive: 0x4a1820, emissiveIntensity: .1 }),
    noseWet: std(0xb85860, .18, { metalness: .15 }),
    pinkDeep: std(0xd09088, .9),
    lip: std(0xc47878, .7),
    whisker: std(0x3a2a20, .55),
    eyeW: std(0xffffff, .2),
    eyeRim: std(0x3a2818, .7),
    iris: std(0xffffff, .28, { map: irisTex, emissive: 0x2a1508, emissiveIntensity: .12 }),
    pupil: std(0x080808, .18),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    hlSoft: new THREE.MeshBasicMaterial({ color: 0xfff0e8, transparent: true, opacity: .5 }),
    mouth: std(0x2a1816, .88),
    mouthDeep: std(0x1a0c0c, .92),
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
  // vest shell v2 — thicker utility silhouette + side seams
  body.add(mesh(lathe([[.0, .78], [.32, .8], [.335, .96], [.335, 1.14], [.3, 1.28], [.22, 1.35], [.02, 1.35]], 24), mat.vest, [0, 0, -.008], [1, 1, .97]));
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.014, .5, .01), mat.vestSeam, [s * .32, 1.05, .08], null, [0, s * .35, 0]));
  });
  // open placket showing shirt + stitch rails
  body.add(mesh(new THREE.BoxGeometry(.08, .42, .04), mat.shirt, [0, 1.08, .3], null, [-.04, 0, 0]));
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.012, .4, .008), mat.vestSeam, [s * .038, 1.08, .318]));
  });
  // collar flaps
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.14, .06, .04), mat.vestLight, [s * .1, 1.34, .22], null, [.35, 0, s * -.5]));
    body.add(mesh(new THREE.BoxGeometry(.12, .012, .008), mat.vestSeam, [s * .1, 1.318, .235], null, [.35, 0, s * -.5]));
  });
  // chest pockets v2 — bag, flap, stitch frame, snap
  const addVestBtn = (x, y, z, r = .014) => {
    body.add(mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, .007, 8), mat.buttonRim, [x, y, z], null, [Math.PI / 2, 0, 0]));
    body.add(mesh(new THREE.CylinderGeometry(r, r, .011, 8), mat.button, [x, y, z + .004], null, [Math.PI / 2, 0, 0]));
    body.add(mesh(SH(r * .32, 5, 4), mat.hlSoft, [x - r * .22, y + r * .18, z + .01]));
  };
  [-1, 1].forEach(s => {
    const px = s * .175;
    body.add(mesh(new THREE.BoxGeometry(.155, .14, .05), mat.vestDark, [px, .94, .31]));
    // stitch frame
    body.add(mesh(new THREE.BoxGeometry(.148, .012, .008), mat.vestSeam, [px, .875, .338]));
    [-1, 1].forEach(ss => body.add(mesh(new THREE.BoxGeometry(.01, .125, .008), mat.vestSeam, [px + ss * .068, .94, .338])));
    // flap + under-shadow
    body.add(mesh(new THREE.BoxGeometry(.16, .048, .032), mat.vestLight, [px, 1.02, .34], null, [.18, 0, 0]));
    body.add(mesh(new THREE.BoxGeometry(.15, .014, .01), mat.vestSeam, [px, .995, .352], null, [.18, 0, 0]));
    addVestBtn(px, .995, .355, .012);
  });
  // lower slash pockets hint
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.12, .018, .02), mat.vestDark, [s * .2, .82, .3], null, [0, 0, s * .4]));
    body.add(mesh(new THREE.BoxGeometry(.1, .01, .008), mat.vestSeam, [s * .2, .825, .31], null, [0, 0, s * .4]));
  });
  // center placket buttons (rim + face)
  [1.22, 1.12, 1.02, .92].forEach(y => addVestBtn(0, y, .325, .013));
  // red bandana wrap (static) + swaying front knot/tails group
  body.add(mesh(new THREE.TorusGeometry(.185, .055, 10, 22), mat.scarf, [0, 1.36, .02], [1.05, 1, .95], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 18), mat.scarfDark, [0, 1.35, .04], [1, 1, .9], [Math.PI / 2, .1, 0]));
  const scarf = new THREE.Group();
  scarf.position.set(0, 1.28, .3);
  scarf.userData.base = { x: 0, y: 0, z: 0 };
  body.add(scarf);
  body.scarf = scarf;
  // draped front triangle
  scarf.add(mesh(new THREE.ConeGeometry(.16, .26, 3), mat.scarf, [0, -.04, .02], [1.1, 1, .28], [Math.PI + .25, 0, 0]));
  scarf.add(mesh(new THREE.ConeGeometry(.1, .14, 3), mat.scarfDark, [0, -.02, .04], [1, 1, .35], [Math.PI + .15, 0, 0]));
  // knot
  scarf.add(mesh(new THREE.SphereGeometry(.048, 10, 8), mat.scarfDark, [.02, .02, .04]));
  scarf.add(mesh(new THREE.SphereGeometry(.03, 8, 6), mat.scarfDeep, [-.01, .01, .05]));
  // dangling tails (animated in animateGuru)
  scarf.tails = [];
  [
    [.1, -.02, .04, .55, .12, .14],
    [-.07, -.04, .03, -.4, .1, .12],
  ].forEach(([tx, ty, tz, rz, w, h], i) => {
    const tail = new THREE.Group();
    tail.position.set(tx, ty, tz);
    tail.rotation.z = rz;
    tail.userData.base = { x: 0, y: 0, z: rz };
    scarf.add(tail);
    scarf.tails.push(tail);
    const matTail = i ? mat.scarfDark : mat.scarf;
    tail.add(mesh(new THREE.BoxGeometry(w * .45, h, .03), matTail, [0, -h * .45, 0]));
    tail.add(mesh(new THREE.BoxGeometry(w * .35, h * .55, .024), mat.scarfDeep, [0, -h * .95, 0]));
    // tip flutter child
    const tip = new THREE.Group();
    tip.position.set(0, -h * 1.25, 0);
    tip.userData.baseX = 0;
    tip.userData.baseZ = 0;
    tail.add(tip);
    tip.add(mesh(new THREE.BoxGeometry(w * .28, .05, .02), matTail, [0, -.02, 0]));
    tip.add(mesh(new THREE.ConeGeometry(.028, .06, 3), mat.scarfDeep, [0, -.06, 0], [1, 1, .5]));
    tail.tip = tip;
  });
  // terracotta cargo shorts — fuller hips + waistband
  body.add(mesh(lathe([[0, .48], [.32, .5], [.36, .62], [.355, .78], [.32, .84], [0, .84]], 24), mat.shorts));
  body.add(mesh(new THREE.CylinderGeometry(.33, .33, .055, 24), mat.shortsDark, [0, .82, 0]));
  // belt loops hint
  [-1, 0, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.04, .07, .025), mat.shortsLight, [s * .22, .82, .3]));
  });
  // front fly seam
  body.add(mesh(new THREE.BoxGeometry(.02, .14, .02), mat.shortsDark, [0, .68, .34]));

  // nohy: [0] šortky, [1] cargo kapsa, [2] foot  (animateGuru + motorbike — DO NOT reorder)
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
    // foot group MUST stay children[2] — all paw/boot meshes live inside
    const foot = new THREE.Group();
    foot.position.set(0, -.58, .1);
    g.add(foot);
    // ankle cuff / short boot top (reads separation from cargo shorts while running)
    foot.add(mesh(new THREE.CylinderGeometry(.095, .11, .1, 12), mat.boot, [0, .22, -.06]));
    foot.add(mesh(new THREE.TorusGeometry(.1, .018, 6, 14), mat.bootDark, [0, .27, -.06], null, [Math.PI / 2, 0, 0]));
    foot.add(mesh(new THREE.BoxGeometry(.04, .03, .02), mat.brass, [0, .27, .04])); // buckle hint
    // shin fur peek above cuff
    foot.add(mesh(new THREE.CapsuleGeometry(.075, .14, 4, 8), mat.fur, [0, .32, -.08]));
    // main paw / boot body — elongated for side silhouette
    foot.add(mesh(S(.155, 14, 12), mat.boot, [0, .02, .02], [1.1, .55, 1.85]));
    foot.add(mesh(S(.12, 12, 10), mat.bootLight, [0, .04, .08], [1.05, .45, 1.3]));
    // cream toe fur peeking from boot opening
    foot.add(mesh(S(.11, 12, 10), mat.furLight, [0, -.01, .22], [1.05, .5, 1.15]));
    // dark sole plate (readable from side/behind)
    foot.add(mesh(new THREE.BoxGeometry(.2, .035, .36), mat.bootDark, [0, -.075, .06]));
    foot.add(mesh(new THREE.BoxGeometry(.18, .02, .1), mat.pawSole, [0, -.09, .22])); // toe sole
    // main pad + toe pads
    foot.add(mesh(S(.08, 10, 8), mat.pawPad, [0, -.055, .05], [1.35, .35, 1.15]));
    [-.08, -.028, .028, .08].forEach((x, i) => {
      const z = .28 + (i === 1 || i === 2 ? .02 : 0);
      foot.add(mesh(S(.042, 8, 6), mat.fur, [x, -.02, z], [1, .7, 1.15]));
      foot.add(mesh(S(.025, 6, 5), mat.pawPad, [x, -.05, z + .02], [1.1, .4, 1]));
      // tiny claw tip for distance pop
      foot.add(mesh(S(.012, 5, 4), mat.furLight, [x, -.025, z + .05], [1, .45, 1.3]));
    });
    // heel bump
    foot.add(mesh(S(.07, 10, 8), mat.bootDark, [0, -.02, -.12], [1.05, .5, .7]));
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
      // ornate brass compass — readable while running; needle kept on compass.needle
      compass = new THREE.Group();
      compass.position.set(0, -.6, .12);
      compass.rotation.x = 2.67;
      compass.scale.setScalar(1.5);
      // thick case + rim
      compass.add(mesh(new THREE.CylinderGeometry(.14, .14, .055, 28), mat.gold));
      compass.add(mesh(new THREE.CylinderGeometry(.145, .145, .02, 28), mat.brassDark, [0, -.03, 0]));
      compass.add(mesh(new THREE.TorusGeometry(.132, .018, 8, 28), mat.brass, [0, .028, 0], null, [Math.PI / 2, 0, 0]));
      compass.add(mesh(new THREE.TorusGeometry(.118, .008, 6, 24), mat.brassDark, [0, .036, 0], null, [Math.PI / 2, 0, 0]));
      // cream dial
      compass.add(mesh(new THREE.CylinderGeometry(.112, .112, .012, 28), mat.dial, [0, .03, 0]));
      // tick marks + cardinals
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const major = i % 3 === 0;
        const tick = mesh(
          new THREE.BoxGeometry(major ? .018 : .01, major ? .04 : .025, .006),
          major ? mat.dialInk : mat.brassDark,
          [Math.sin(ang) * .085, .038, Math.cos(ang) * .085],
          null,
          [0, ang, 0],
        );
        compass.add(tick);
      }
      // N marker pip (north)
      compass.add(mesh(new THREE.ConeGeometry(.02, .03, 3), mat.needleRed, [0, .042, .072], null, [Math.PI, 0, 0]));
      // glass dome over dial
      compass.add(mesh(new THREE.SphereGeometry(.11, 20, 12, 0, Math.PI * 2, 0, Math.PI * .45), mat.glassLens, [0, .035, 0], [1, .55, 1]));
      compass.add(mesh(SH(.02, 8, 6), mat.hl, [.04, .08, .04]));
      // needle group — red north / blue south; rotation.z driven by holdCompass
      const nd = new THREE.Group();
      nd.position.set(0, .045, 0);
      compass.add(nd);
      nd.add(mesh(new THREE.ConeGeometry(.028, .14, 4), mat.needleRed, [0, 0, .05], [1, 1, .35], [Math.PI / 2, 0, 0]));
      nd.add(mesh(new THREE.ConeGeometry(.022, .1, 4), mat.needleBlue, [0, 0, -.04], [1, 1, .3], [-Math.PI / 2, 0, 0]));
      nd.add(mesh(new THREE.CylinderGeometry(.015, .015, .02, 10), mat.brass, [0, 0, 0]));
      compass.needle = nd;
      // bail ring
      compass.add(mesh(new THREE.TorusGeometry(.03, .01, 8, 14), mat.gold, [0, 0, -.155], null, [Math.PI / 2, 0, 0]));
      compass.add(mesh(new THREE.TorusGeometry(.018, .006, 6, 10), mat.brass, [0, 0, -.175], null, [Math.PI / 2, 0, 0]));
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
  // nos + tlama v2 — wetter nose HL, nostrils, finer smile
  const noseG = new THREE.Group();
  noseG.position.set(0, -.07, .42);
  head.add(noseG);
  noseG.add(mesh(SH(.05, 16, 12), mat.nose, [0, 0, 0], [1.5, .92, 1.05]));
  // nostril divots
  [-1, 1].forEach(s => {
    noseG.add(mesh(SH(.016, 8, 6), mat.noseWet, [s * .028, -.008, .025], [1.1, .65, .5]));
    noseG.add(mesh(SH(.009, 6, 5), std(0x8a4048, .9), [s * .03, -.01, .035], [1, .5, .4]));
  });
  // dual wet highlights
  noseG.add(mesh(SH(.016, 8, 6), mat.hl, [-.016, .01, .04]));
  noseG.add(mesh(SH(.009, 6, 5), mat.hlSoft, [.014, -.006, .042]));
  noseG.add(mesh(SH(.006, 5, 4), mat.hl, [-.004, -.012, .045]));
  // philtrum crease
  head.add(mesh(new THREE.BoxGeometry(.014, .07, .012), mat.mouth, [0, -.125, .405]));
  // finer smile — soft lip arc + slight open corner pockets
  const smile = new THREE.Group();
  smile.position.set(0, -.2, .36);
  head.add(smile);
  smile.add(mesh(new THREE.TorusGeometry(.078, .012, 6, 18, Math.PI * .85), mat.lip, [0, 0, 0], [1.05, .55, 1], [0, 0, Math.PI * 1.08]));
  smile.add(mesh(new THREE.TorusGeometry(.065, .007, 5, 14, Math.PI * .7), mat.mouth, [0, -.008, .008], [1.05, .5, 1], [0, 0, Math.PI * 1.1]));
  // tiny open-mouth hint at center
  smile.add(mesh(SH(.028, 10, 8), mat.mouthDeep, [0, -.012, .01], [1.4, .45, .6]));
  // soft cheek smile dimples near corners
  [-1, 1].forEach(s => {
    smile.add(mesh(SH(.022, 8, 6), mat.furFace, [s * .075, .005, .02], [.9, .7, .55]));
    smile.add(mesh(SH(.012, 6, 5), mat.lip, [s * .07, -.01, .025], [1, .55, .5]));
  });

  [-1, 1].forEach(s => {
    // almond doe-eyes — wider X, softer Y, slight outer-down tilt + blink lid
    const e = new THREE.Group();
    e.position.set(s * .15, .05, .3);
    e.rotation.set(-.06, s * .28, s * .12);
    head.add(e);
    head.eyes = head.eyes || [];
    head.eyes.push(e);
    e.add(mesh(SH(.065, 16, 12), mat.eyeRim, [0, 0, -.014], [1.45, 1.15, .45]));
    e.add(mesh(SH(.105, 26, 20), mat.eyeW, [0, 0, 0], [1.25, 1.05, .55]));
    e.add(mesh(SH(.068, 22, 16), mat.iris, [s * .008, -.006, .038], [1.05, 1.0, .45]));
    e.add(mesh(SH(.034, 14, 10), mat.pupil, [s * .008, -.006, .058], [1, 1.02, .4]));
    e.add(mesh(SH(.02, 8, 6), mat.hl, [s * -.02 + .012, .026, .07]));
    e.add(mesh(SH(.01, 6, 6), mat.hl, [s * .02, -.012, .068]));
    const lid = mesh(SH(.1, 10, 8), mat.furDark, [0, .048, .02], [1.25, .35, .65]);
    lid.scale.y = .18;
    lid.userData.baseY = .048;
    e.add(lid);
    e.lid = lid;
    // soft brow arc
    head.add(mesh(new THREE.CapsuleGeometry(.014, .09, 3, 6), mat.furDark, [s * .15, .155, .32], null, [0, 0, s * 1.15]));
    // long upright ears v2 — inner canal, rim fluff, tip (tracked for shared idle twitch)
    const ear = new THREE.Group();
    ear.position.set(s * .12, .3, -.06);
    ear.rotation.set(-.08, s * .12, -s * .18);
    ear.userData.base = { x: ear.rotation.x, y: ear.rotation.y, z: ear.rotation.z };
    head.add(ear);
    // base fluff at skull
    ear.add(mesh(SH(.12, 16, 12), mat.fur, [0, .06, 0], [1.15, .75, .6]));
    ear.add(mesh(SH(.07, 12, 10), mat.furLight, [s * .04, .08, .02], [.9, .7, .55]));
    // main shaft — taller, flatter depth
    ear.add(mesh(new THREE.CapsuleGeometry(.105, .78, 8, 16), mat.fur, [0, .48, 0], [.95, 1, .32]));
    // soft outer rim (reads thickness from side)
    ear.add(mesh(new THREE.CapsuleGeometry(.09, .7, 6, 12), mat.furDark, [0, .46, -.025], [1.05, 1, .18]));
    // tip bends slightly outward
    const tip = new THREE.Group();
    tip.position.set(0, .9, 0);
    tip.rotation.z = -s * .28;
    tip.rotation.x = -.12;
    tip.userData.baseZ = tip.rotation.z;
    tip.userData.baseX = tip.rotation.x;
    ear.add(tip);
    tip.add(mesh(new THREE.CapsuleGeometry(.095, .18, 6, 12), mat.fur, [0, .08, 0], [.9, 1, .3]));
    tip.add(mesh(SH(.1, 14, 12), mat.furDark, [0, .16, 0], [1.05, .95, .35]));
    tip.add(mesh(SH(.06, 12, 10), mat.furDark, [0, .26, 0], [.9, .75, .28]));
    tip.add(mesh(SH(.035, 8, 6), mat.fur, [s * .02, .22, .01], [.8, .7, .4])); // tip tuft
    // pink inner + deeper canal fold
    ear.add(mesh(new THREE.CapsuleGeometry(.068, .62, 6, 12), mat.pink, [0, .46, .04], [.95, 1, .18]));
    ear.add(mesh(new THREE.CapsuleGeometry(.035, .4, 5, 8), mat.pinkDeep, [0, .42, .055], [1, 1, .35]));
    ear.add(mesh(SH(.055, 12, 10), mat.pink, [0, .12, .035], [1.15, .85, .4]));
    ear.add(mesh(SH(.03, 8, 6), mat.pinkDeep, [0, .1, .05], [1.2, .7, .45])); // canal pocket
    // leading-edge rim fluff (mobile-friendly clumps)
    ear.add(mesh(SH(.028, 8, 6), mat.furDark, [s * .07, .35, .02], [.75, 1.2, .45]));
    ear.add(mesh(SH(.025, 8, 6), mat.furDark, [s * -.06, .5, .015], [.7, 1.1, .4]));
    ear.add(mesh(SH(.022, 6, 6), mat.fur, [s * .05, .65, .02], [.65, 1, .4]));
    ear.tip = tip;
    head.ears = head.ears || [];
    head.ears.push(ear);
  });
  // short low-poly whiskers (3 per side) from cream muzzle
  [-1, 1].forEach(s => {
    [
      [s * .14, -.14, .28, .18, -.05, .1, -.08],
      [s * .12, -.17, .26, .22, -.02, .02, .05],
      [s * .1, -.2, .24, .16, .04, -.08, .15],
    ].forEach(([bx, by, bz, len, tiltY, tiltZ, tiltX]) => {
      const w = new THREE.Mesh(
        new THREE.CapsuleGeometry(.0035, len, 2, 4),
        mat.whisker,
      );
      w.position.set(bx, by, bz);
      w.rotation.set(tiltX, s * (.5 + tiltY), s * (.95 + tiltZ));
      w.castShadow = false;
      w.receiveShadow = false;
      head.add(w);
    });
  });
  // leather strap + brass aviator goggles on forehead (readable brass/glass)
  head.add(mesh(new THREE.TorusGeometry(.35, .032, 10, 36), mat.leather, [0, .16, -.01], [1.1, 1, 1.05], [Math.PI / 2 - .28, 0, 0]));
  head.add(mesh(new THREE.TorusGeometry(.34, .014, 6, 28), mat.brassDark, [0, .165, 0], [1.05, 1, 1.02], [Math.PI / 2 - .28, 0, 0]));
  const gog = new THREE.Group();
  gog.position.set(0, .27, .27);
  gog.rotation.x = -1.0;
  head.add(gog);
  [-1, 1].forEach(s => {
    // leather cup
    gog.add(mesh(new THREE.CylinderGeometry(.1, .112, .09, 20), mat.leather, [s * .12, 0, 0]));
    // double brass rim for silhouette while running
    gog.add(mesh(new THREE.TorusGeometry(.095, .022, 8, 22), mat.brass, [s * .12, .048, 0], null, [Math.PI / 2, 0, 0]));
    gog.add(mesh(new THREE.TorusGeometry(.08, .01, 6, 18), mat.brassDark, [s * .12, .055, 0], null, [Math.PI / 2, 0, 0]));
    // dark glass lens + specular catch
    gog.add(mesh(new THREE.CylinderGeometry(.082, .082, .02, 20), mat.glassLens, [s * .12, .052, 0]));
    gog.add(mesh(new THREE.CylinderGeometry(.07, .07, .008, 16), mat.glass, [s * .12, .06, 0]));
    gog.add(mesh(SH(.022, 8, 6), mat.hl, [s * .12 - .025, .068, .035]));
    gog.add(mesh(SH(.01, 6, 6), mat.hl, [s * .12 + .02, .055, .04]));
  });
  // brass bridge + hinge nubs
  gog.add(mesh(new THREE.BoxGeometry(.06, .035, .045), mat.brass, [0, .015, 0]));
  gog.add(mesh(new THREE.CylinderGeometry(.018, .018, .04, 8), mat.brassDark, [0, .02, 0], null, [0, 0, Math.PI / 2]));
  [-1, 1].forEach(s => {
    gog.add(mesh(new THREE.SphereGeometry(.015, 8, 6), mat.brass, [s * .055, .02, .01]));
  });

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
