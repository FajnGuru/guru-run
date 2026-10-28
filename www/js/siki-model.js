// Procedurální model SIKI (klokan) – PR10 polish: blink, ear twitch, distance logos
// API: buildSiki() → { root, body, head, arms, legs, tail, belt }; animateSiki(g, t, opts?)
// DŮLEŽITÉ: legs[i].children[2] = foot group (motorbike pose).
// Tail.segs = cascade segments; bike pose lays tail over seat.
// belt = leather tool belt group; animateSiki jiggles it lightly when bike/speed.
// head.eyes[].lid + head.ears[] driven by animateSiki (blink / twitch).
import * as THREE from 'three';

function textTex(text, w, h, font, color = '#fff', opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  const stroke = opts.stroke || '#1a2040';
  const lw = opts.lineWidth ?? h * .07;
  if (lw > 0) { x.strokeStyle = stroke; x.lineWidth = lw; x.lineJoin = 'round'; x.strokeText(text, w / 2, h / 2); }
  x.fillStyle = color; x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

/** Sandy/tawny kangaroo fur grain (cached, mobile-friendly 128px). */
let _furMap, _muzzleMap, _irisMap;
function makeFurMap() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  // light brown base (turnaround sandy tawny)
  ctx.fillStyle = '#c9955e';
  ctx.fillRect(0, 0, s, s);
  // directional short fur strokes
  for (let i = 0; i < 1100; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const len = 2.5 + Math.random() * 10;
    const ang = -0.65 + Math.random() * 1.3;
    const lite = Math.random() > .55;
    const r = lite ? 210 + ((Math.random() * 35) | 0) : 120 + ((Math.random() * 50) | 0);
    const g = lite ? r - 35 : r - 40;
    const b = lite ? r - 75 : r - 70;
    ctx.strokeStyle = `rgba(${r},${g},${b},${.45 + Math.random() * .45})`;
    ctx.lineWidth = 0.45 + Math.random() * 1.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  // soft mottles
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * s, y = Math.random() * s, rad = 3 + Math.random() * 12;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, 'rgba(160,100,50,.28)');
    rg.addColorStop(1, 'rgba(180,120,60,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2.4);
  tex.needsUpdate = true;
  return tex;
}
function furMap() { return _furMap || (_furMap = makeFurMap()); }

/** Cream muzzle fluff. */
function makeMuzzleMap() {
  const s = 96, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s * .5, s * .52, 4, s * .5, s * .5, s * .55);
  g.addColorStop(0, '#fff8ec');
  g.addColorStop(.55, '#f0d9b4');
  g.addColorStop(1, '#d4b48a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 180; i++) {
    const v = 210 + ((Math.random() * 40) | 0);
    ctx.fillStyle = `rgba(${v},${v - 18},${v - 50},${.35})`;
    ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.4, 1.4);
  tex.needsUpdate = true;
  return tex;
}

/** Warm brown iris with limbal ring. */
function makeIrisMap() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2, cy = s / 2, r = s * .48;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  g.addColorStop(0, '#4a2810');
  g.addColorStop(.35, '#7a4a1c');
  g.addColorStop(.72, '#5a3414');
  g.addColorStop(.9, '#2a1608');
  g.addColorStop(1, '#120a04');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.strokeStyle = `rgba(180,120,50,${.15 + Math.random() * .25})`;
    ctx.lineWidth = .6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * .85, cy + Math.sin(a) * r * .85);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
function muzzleMap() { return _muzzleMap || (_muzzleMap = makeMuzzleMap()); }
function irisMap() { return _irisMap || (_irisMap = makeIrisMap()); }

/** Soft denim twill (mobile 96px). */
let _denimMap;
function makeDenimMap() {
  const s = 96, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a7296';
  ctx.fillRect(0, 0, s, s);
  // twill diagonals
  for (let i = -s; i < s * 2; i += 3) {
    ctx.strokeStyle = i % 6 === 0 ? 'rgba(255,255,255,.08)' : 'rgba(20,30,50,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + s, s);
    ctx.stroke();
  }
  // weave grain
  for (let i = 0; i < 400; i++) {
    const v = 70 + ((Math.random() * 50) | 0);
    ctx.fillStyle = `rgba(${v},${v + 15},${v + 35},${.35})`;
    ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1 + (Math.random() * 2) | 0, 1);
  }
  // orange stitch flecks
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(200,130,50,.35)';
    ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 2, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  tex.needsUpdate = true;
  return tex;
}
function denimMap() { return _denimMap || (_denimMap = makeDenimMap()); }

export function buildSiki() {
  const noise = furMap();
  const muz = muzzleMap();
  const iris = irisMap();
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const furMat = (c, r = .96, bump = .05) => std(c, r, {
    map: noise, roughnessMap: noise, bumpMap: noise, bumpScale: bump,
  });
  const mat = {
    fur: furMat(0xb88955, .96, .055),
    furHead: furMat(0xb07a45, .94, .06),
    furLight: std(0xe8c9a0, .95, { map: muz, roughnessMap: muz, bumpMap: muz, bumpScale: .04 }),
    furFace: furMat(0xd4ae78, .94, .045),
    furBelly: furMat(0xd8b07a, .97, .035),
    furDark: furMat(0x5a3418, .95, .07),
    furTail: furMat(0xa8703f, .95, .065),
    tuft: std(0x4a2a12, .9),
    pink: std(0xe8aea4, .88),
    pinkDeep: std(0xd08078, .9),
    red: std(0xc0282d, .78),
    redDeep: std(0x9a1e24, .82),
    white: std(0xf5f5f5, .75),
    whiteSoft: std(0xe8e8ec, .8),
    navy: std(0x23305e, .78),
    navyDeep: std(0x1a2448, .82),
    denim: std(0x52698f, .95, { map: denimMap(), roughnessMap: denimMap(), bumpMap: denimMap(), bumpScale: .04 }),
    denimLight: std(0x7a92b4, .92, { map: denimMap(), bumpMap: denimMap(), bumpScale: .03 }),
    denimDark: std(0x3a4e6e, .96, { map: denimMap(), bumpMap: denimMap(), bumpScale: .05 }),
    stitch: std(0xc9883a, .7),
    strap: std(0x7a4a28, .75),
    strapDark: std(0x5a3218, .8),
    leather: std(0x8a5530, .62),
    leatherMid: std(0x6e4224, .68),
    leatherDark: std(0x5c3418, .7),
    leatherLight: std(0xa66a3a, .55),
    steel: std(0xb8bec6, .28, { metalness: .85 }),
    steelDark: std(0x7a828c, .32, { metalness: .75 }),
    handle: std(0xc0282d, .48),
    handleDeep: std(0x8a1a1e, .55),
    nose: std(0x1a1414, .32, { metalness: .1, emissive: 0x1a1010, emissiveIntensity: .05 }),
    noseWet: std(0x0a0808, .14, { metalness: .2 }),
    eyeW: std(0xffffff, .28),
    iris: std(0xffffff, .35, { map: iris }),
    pupil: std(0x080808, .2),
    eyeSocket: std(0x8a5a35, .95),
    brow: std(0x4a2a12, .9),
    hl: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    hlSoft: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55 }),
    mouth: std(0x4a1e1e, .85),
    mouthDeep: std(0x2a1010, .95),
    lip: std(0xa06050, .75),
    teeth: std(0xfafafa, .35),
    gum: std(0xc07070, .8),
    brass: std(0xc9a24a, .35, { metalness: .8 }),
  };
  const mesh = (g, m, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, m); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const S = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h);
  const SH = (r, w = 22, h = 16) => new THREE.SphereGeometry(r, w, h);
  const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const decal = (tex, w, h, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(...p); if (r) m.rotation.set(...r); return m; };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);

  // trup – dres v2 (červeno-bílo-modrý athletic jersey, turnaround)
  // red torso body
  body.add(mesh(lathe([[0, 1.25], [.4, 1.28], [.43, 1.5], [.42, 1.8], [.38, 2.05], [.29, 2.2], [.15, 2.3], [0, 2.32]]), mat.red));
  // white horizontal chest band (mid jersey)
  body.add(mesh(lathe([[0, 1.72], [.425, 1.74], [.43, 1.92], [.41, 2.02], [0, 2.02]]), mat.white, [0, 0, 0], [1.015, 1, 1.015]));
  // white yoke / upper shoulders
  body.add(mesh(lathe([[0, 2.08], [.37, 2.1], [.33, 2.22], [.2, 2.3], [0, 2.32]]), mat.whiteSoft, [0, .002, 0], [1.02, 1, 1.02]));
  // collar ring (navy)
  body.add(mesh(new THREE.TorusGeometry(.145, .028, 8, 20), mat.navy, [0, 2.285, .04], null, [Math.PI / 2 - .18, 0, 0]));
  body.add(mesh(new THREE.TorusGeometry(.13, .014, 6, 16), mat.white, [0, 2.29, .045], null, [Math.PI / 2 - .18, 0, 0]));
  // subtle red shoulder panels under white yoke (side read)
  [-1, 1].forEach(s => {
    body.add(mesh(SH(.12, 12, 10), mat.redDeep, [s * .32, 2.12, .05], [.9, .7, 1.1]));
  });
  // bold white SIKI across upper chest (distance-readable)
  const sikiTex = textTex('SIKI', 384, 128, 'bold 108px Arial, sans-serif', '#ffffff', { stroke: '#121830', lineWidth: 14 });
  body.add(decal(sikiTex, .48, .17, [0, 1.95, .46]));
  // tiny navy underline under SIKI for athletic look
  body.add(mesh(new THREE.BoxGeometry(.4, .014, .01), mat.navy, [0, 1.86, .465]));
  // montérky v2 – džínové lacláče (bib, brown straps, X back, pockets, tail cutout)
  // front bib (sits below jersey SIKI)
  body.add(mesh(new THREE.BoxGeometry(.52, .52, .07), mat.denim, [0, 1.58, .44]));
  // bib edge stitch lines
  body.add(mesh(new THREE.BoxGeometry(.48, .01, .01), mat.stitch, [0, 1.82, .48]));
  body.add(mesh(new THREE.BoxGeometry(.48, .01, .01), mat.stitch, [0, 1.35, .48]));
  // chest pocket on bib
  body.add(mesh(new THREE.BoxGeometry(.28, .2, .04), mat.denimLight, [0, 1.6, .485]));
  body.add(mesh(new THREE.BoxGeometry(.26, .015, .01), mat.stitch, [0, 1.69, .51]));
  // small SIKI on bib pocket (bike ref) — jersey keeps the large chest mark
  const bibSiki = textTex('SIKI', 288, 100, 'bold 84px Arial, sans-serif', '#ffffff', { stroke: '#1a2a44', lineWidth: 10 });
  body.add(decal(bibSiki, .28, .1, [0, 1.6, .515]));
  // brass buttons at bib top corners
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.CylinderGeometry(.035, .035, .02, 10), mat.brass, [s * .2, 1.8, .485], null, [Math.PI / 2, 0, 0]));
    body.add(mesh(new THREE.CylinderGeometry(.012, .012, .015, 6), mat.strapDark, [s * .2, 1.8, .495], null, [Math.PI / 2, 0, 0]));
  });
  // brown leather/canvas straps (front) + brass buckles
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.075, .78, .035), mat.strap, [s * .2, 1.98, .44], null, [-.1, 0, s * .08]));
    body.add(mesh(new THREE.BoxGeometry(.09, .06, .04), mat.brass, [s * .205, 1.84, .47]));
    body.add(mesh(new THREE.BoxGeometry(.05, .03, .02), mat.strapDark, [s * .205, 1.84, .495]));
  });
  // rear panel + X crossed straps
  body.add(mesh(new THREE.BoxGeometry(.5, .4, .06), mat.denim, [0, 1.55, -.44]));
  // tail cutout notch (seat opening for thick kangaroo tail)
  body.add(mesh(new THREE.BoxGeometry(.22, .18, .05), mat.denimDark, [0, 1.28, -.46]));
  [-1, 1].forEach(s => {
    // crossed X straps on back
    body.add(mesh(new THREE.BoxGeometry(.07, .85, .03), mat.strap, [s * .05, 1.95, -.44], null, [.12, 0, -s * .55]));
    // back pockets
    body.add(mesh(new THREE.BoxGeometry(.18, .2, .035), mat.denimLight, [s * .16, 1.42, -.48]));
    body.add(mesh(new THREE.BoxGeometry(.16, .012, .01), mat.stitch, [s * .16, 1.51, -.5]));
  });
  // hip / seat denim (waist) — slightly thicker silhouette
  body.add(mesh(lathe([[0, .95], [.42, .97], [.48, 1.12], [.47, 1.34], [.4, 1.4], [0, 1.4]]), mat.denim));
  // side seam stitch hints
  [-1, 1].forEach(s => {
    body.add(mesh(new THREE.BoxGeometry(.012, .35, .01), mat.stitch, [s * .47, 1.2, .05], null, [0, 0, 0]));
  });
  // pracovní opasek v2 – brown leather tool belt (pouches, wrench, pliers)
  const belt = new THREE.Group();
  belt.position.set(0, 1.3, 0);
  belt.userData.baseY = 1.3;
  body.add(belt);
  // main strap
  belt.add(mesh(new THREE.CylinderGeometry(.48, .48, .09, 24), mat.leather, [0, 0, 0]));
  // top edge stitch hint
  belt.add(mesh(new THREE.TorusGeometry(.485, .008, 4, 24), mat.leatherLight, [0, .04, 0], null, [Math.PI / 2, 0, 0]));
  belt.add(mesh(new THREE.TorusGeometry(.485, .008, 4, 24), mat.leatherDark, [0, -.04, 0], null, [Math.PI / 2, 0, 0]));
  // front buckle (silver/brass plate + prong)
  belt.add(mesh(new THREE.BoxGeometry(.14, .1, .035), mat.steel, [0, 0, .485]));
  belt.add(mesh(new THREE.BoxGeometry(.1, .06, .02), mat.brass, [0, 0, .505]));
  belt.add(mesh(new THREE.BoxGeometry(.02, .07, .015), mat.steelDark, [0, 0, .515]));
  // belt loops (keepers)
  [-1, 1].forEach(s => {
    belt.add(mesh(new THREE.BoxGeometry(.04, .1, .04), mat.leatherMid, [s * .12, 0, .48]));
  });

  /** Hip pouch with flap — local coords, yaw toward outside. */
  const makePouch = (x, z, yaw) => {
    const g = new THREE.Group();
    g.position.set(x, -.14, z);
    g.rotation.y = yaw;
    // body
    g.add(mesh(new THREE.BoxGeometry(.2, .26, .11), mat.leatherDark, [0, 0, 0]));
    // front face slightly lighter
    g.add(mesh(new THREE.BoxGeometry(.18, .22, .02), mat.leatherMid, [0, -.01, .06]));
    // flap
    g.add(mesh(new THREE.BoxGeometry(.2, .1, .12), mat.leather, [0, .12, .01], null, [-.35, 0, 0]));
    // flap snap
    g.add(mesh(new THREE.CylinderGeometry(.02, .02, .015, 8), mat.brass, [0, .06, .08], null, [Math.PI / 2, 0, 0]));
    // side stitch
    g.add(mesh(new THREE.BoxGeometry(.015, .2, .01), mat.leatherLight, [-.095, 0, .05]));
    g.add(mesh(new THREE.BoxGeometry(.015, .2, .01), mat.leatherLight, [.095, 0, .05]));
    belt.add(g);
    return g;
  };
  // front-side hip pouches (refs: one each hip)
  makePouch(-.42, .28, -Math.PI * .35);
  makePouch(.42, .28, Math.PI * .35);
  // rear small pouch / spare
  makePouch(-.28, -.4, Math.PI * .75);
  makePouch(.28, -.4, -Math.PI * .75);

  /** Adjustable / open-end wrench — silver. */
  const makeWrench = (x, z, yaw, tipUp = .18) => {
    const g = new THREE.Group();
    g.position.set(x, tipUp * .35, z);
    g.rotation.y = yaw;
    g.rotation.z = .12;
    // handle
    g.add(mesh(new THREE.BoxGeometry(.035, .28, .02), mat.steel, [0, -.02, 0]));
    g.add(mesh(new THREE.BoxGeometry(.045, .04, .025), mat.steelDark, [0, -.14, 0]));
    // open jaw head
    g.add(mesh(new THREE.BoxGeometry(.09, .06, .025), mat.steel, [0, .14, 0]));
    g.add(mesh(new THREE.BoxGeometry(.03, .05, .02), mat.steelDark, [-.03, .17, 0]));
    g.add(mesh(new THREE.BoxGeometry(.025, .04, .02), mat.steel, [.035, .16, 0]));
    // adjustment knob (crescent)
    g.add(mesh(new THREE.CylinderGeometry(.018, .018, .03, 8), mat.steelDark, [.02, .12, .02], null, [0, 0, Math.PI / 2]));
    belt.add(g);
    return g;
  };
  /** Combination pliers — red handles + steel jaws. */
  const makePliers = (x, z, yaw) => {
    const g = new THREE.Group();
    g.position.set(x, .08, z);
    g.rotation.y = yaw;
    g.rotation.z = -.08;
    // red handles (spread)
    g.add(mesh(new THREE.BoxGeometry(.04, .2, .035), mat.handle, [-.03, -.06, 0], null, [0, 0, .18]));
    g.add(mesh(new THREE.BoxGeometry(.04, .2, .035), mat.handle, [.03, -.06, 0], null, [0, 0, -.18]));
    g.add(mesh(new THREE.BoxGeometry(.035, .06, .03), mat.handleDeep, [-.045, -.14, 0], null, [0, 0, .18]));
    g.add(mesh(new THREE.BoxGeometry(.035, .06, .03), mat.handleDeep, [.045, -.14, 0], null, [0, 0, -.18]));
    // pivot
    g.add(mesh(new THREE.CylinderGeometry(.025, .025, .04, 8), mat.steelDark, [0, .04, 0], null, [Math.PI / 2, 0, 0]));
    // jaws
    g.add(mesh(new THREE.BoxGeometry(.035, .1, .028), mat.steel, [-.02, .12, 0], null, [0, 0, -.12]));
    g.add(mesh(new THREE.BoxGeometry(.035, .1, .028), mat.steel, [.02, .12, 0], null, [0, 0, .12]));
    g.add(mesh(new THREE.BoxGeometry(.02, .04, .02), mat.steelDark, [-.03, .17, 0]));
    g.add(mesh(new THREE.BoxGeometry(.02, .04, .02), mat.steelDark, [.03, .17, 0]));
    belt.add(g);
    return g;
  };
  // tools tucked in belt (match turnaround: wrenches + red-handle pliers)
  makeWrench(-.22, .46, -.15, .2);
  makeWrench(.48, -.05, Math.PI * .55, .18);
  makeWrench(-.48, -.12, -Math.PI * .6, .16);
  makePliers(.2, .46, .2);
  makePliers(-.05, -.48, Math.PI);
  // spare screwdriver-ish stem in a loop
  {
    const sd = new THREE.Group();
    sd.position.set(.32, .12, .38);
    sd.rotation.y = .5;
    sd.add(mesh(new THREE.CylinderGeometry(.012, .012, .22, 6), mat.steel, [0, 0, 0]));
    sd.add(mesh(new THREE.CylinderGeometry(.022, .02, .07, 8), mat.handle, [0, -.12, 0]));
    belt.add(sd);
  }


  // nohy – nohavice s tlustým ohrnutím (rolled cuffs), velká chodidla
  // children: [0]=pant, [1]=cuffGroup, [2]=foot  — foot index required by motorbike
  const legs = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .22, 1.05, 0);
    // pant leg (short cut above ankle)
    g.add(mesh(lathe([[0, 0], [.23, -.02], [.225, -.4], [.22, -.55], [0, -.55]], 16), mat.denim));
    // thick rolled cuff group
    const cuff = new THREE.Group(); cuff.position.set(0, -.58, 0); g.add(cuff);
    cuff.add(mesh(new THREE.CylinderGeometry(.25, .25, .14, 18), mat.denimLight, [0, 0, 0]));
    cuff.add(mesh(new THREE.CylinderGeometry(.245, .245, .06, 16), mat.denimDark, [0, -.08, 0]));
    cuff.add(mesh(new THREE.TorusGeometry(.25, .018, 6, 18), mat.stitch, [0, .06, 0], null, [Math.PI / 2, 0, 0]));
    // kangaroo foot
    const foot = new THREE.Group(); foot.position.set(0, -.92, .15); g.add(foot);
    foot.add(mesh(new THREE.CapsuleGeometry(.11, .2, 4, 8), mat.fur, [0, .2, -.15]));
    foot.add(mesh(S(.18), mat.fur, [0, 0, .05], [.85, .5, 2.4]));
    [-1, 0, 1].forEach(t => foot.add(mesh(new THREE.ConeGeometry(.025, .08, 5), mat.furDark, [t * .06, -.03, .47], null, [Math.PI / 2, 0, 0])));
    body.add(g); return g;
  });

  // paže – bílé rukávy + pruhy (bílá / navy / bílá) + 69 na ramenou
  const num69 = textTex('69', 192, 140, 'bold 112px Arial, sans-serif', '#ffffff', { stroke: '#121830', lineWidth: 12 });
  const arms = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .4, 2.08, 0); g.rotation.z = s * .14; body.add(g);
    // shoulder pad (white → red blend at deltoid)
    g.add(mesh(S(.13, 14, 12), mat.white));
    g.add(mesh(S(.1, 12, 10), mat.red, [0, -.02, 0], [.95, .85, .95]));
    // white long sleeve body
    g.add(mesh(lathe([[0, 0], [.155, -.02], [.15, -.22], [.145, -.48], [.135, -.68], [0, -.68]], 16), mat.white));
    // upper-arm red panel strip (athletic) under 69
    g.add(mesh(new THREE.CylinderGeometry(.152, .152, .16, 16), mat.red, [0, -.14, 0]));
    // forearm stripe stack near cuff: thick white / thin navy / white / thin red hint
    g.add(mesh(new THREE.CylinderGeometry(.148, .148, .07, 16), mat.whiteSoft, [0, -.42, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.15, .15, .045, 16), mat.navy, [0, -.48, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.147, .147, .055, 16), mat.white, [0, -.535, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.149, .149, .03, 14), mat.redDeep, [0, -.575, 0]));
    g.add(mesh(new THREE.CylinderGeometry(.146, .146, .04, 14), mat.navyDeep, [0, -.61, 0]));
    // cuff rim
    g.add(mesh(new THREE.CylinderGeometry(.14, .138, .05, 14), mat.whiteSoft, [0, -.655, 0]));
    // bold 69 on outer upper arm / shoulder
    const n = decal(num69, .26, .2, [s * .16, -.15, 0], [0, s * Math.PI / 2, 0]);
    g.add(n);
    // soft side read of 69 (slightly forward so camera catches it)
    const n2 = decal(num69, .22, .17, [s * .13, -.15, .11], [0, s * Math.PI / 3, 0]);
    n2.material.opacity = .85; n2.material.transparent = true;
    g.add(n2);
    // fur hand
    g.add(mesh(S(.13), mat.fur, [0, -.78, .02], [.85, 1.1, .85]));
    return g;
  });

  // krk + hlava v2 (Pixar / Crash — turnaround refs)
  body.add(mesh(new THREE.CylinderGeometry(.16, .22, .5, 16), mat.furHead, [0, 2.52, .03]));
  body.add(mesh(new THREE.CylinderGeometry(.12, .15, .46, 12), mat.furLight, [0, 2.5, .12]));
  const head = new THREE.Group(); head.position.set(0, 2.95, .1); head.scale.setScalar(1.12); body.add(head);

  // lebka + tváře
  head.add(mesh(SH(.36, 28, 20), mat.furHead, [0, .02, -.02], [1.02, 1.08, 1]));
  head.add(mesh(SH(.2, 18, 14), mat.furFace, [0, -.02, .18], [1.15, .95, .9]));
  [-1, 1].forEach(s => {
    head.add(mesh(SH(.14, 16, 12), mat.furHead, [s * .26, -.02, .06], [.95, 1.05, .9]));
    head.add(mesh(SH(.1, 14, 10), mat.furFace, [s * .22, -.08, .2], [.85, .9, .8]));
  });

  // dlouhý krémový čumák
  head.add(mesh(SH(.22, 22, 16), mat.furLight, [0, -.14, .3], [1.05, .88, 1.55]));
  head.add(mesh(SH(.16, 18, 14), mat.furLight, [0, -.2, .38], [1.1, .7, 1.25]));
  head.add(mesh(SH(.1, 14, 10), mat.furLight, [0, -.24, .28], [1.05, .65, .95]));

  // nos — kulatý, mokrý, s HL
  const noseG = new THREE.Group(); noseG.position.set(0, -.08, .62); head.add(noseG);
  noseG.add(mesh(SH(.095, 16, 14), mat.nose, [0, 0, 0], [1.35, .9, 1]));
  [-1, 1].forEach(s => {
    noseG.add(mesh(SH(.026, 8, 6), mat.noseWet, [s * .042, -.01, .04], [1.1, .65, .5]));
  });
  noseG.add(mesh(SH(.024, 8, 6), mat.hl, [-.028, .01, .055]));
  noseG.add(mesh(SH(.01, 6, 6), mat.hlSoft, [.02, -.01, .06]));

  // otevřený přátelský úsměv + zuby (Crash hint)
  const jaw = new THREE.Group(); jaw.position.set(0, -.22, .48); head.add(jaw);
  jaw.add(mesh(SH(.12, 16, 10), mat.mouth, [0, -.01, .02], [1.35, .55, .85]));
  jaw.add(mesh(SH(.07, 12, 8), mat.mouthDeep, [0, -.005, -.01], [1.1, .4, .7]));
  // upper lip rim
  jaw.add(mesh(new THREE.TorusGeometry(.09, .012, 6, 16, Math.PI), mat.lip, [0, .02, .04], [1.3, .7, 1], [Math.PI, 0, 0]));
  // gums + two central upper teeth
  jaw.add(mesh(new THREE.BoxGeometry(.12, .02, .02), mat.gum, [0, .005, .08]));
  [-1, 1].forEach(s => {
    jaw.add(mesh(new THREE.BoxGeometry(.038, .04, .022), mat.teeth, [s * .028, -.012, .09]));
  });

  // oči — velké expresivní (Crash / Pixar)
  head.eyes = [];
  [-1, 1].forEach(s => {
    const e = new THREE.Group();
    e.position.set(s * .145, .1, .28);
    e.rotation.set(-.08, s * .28, s * .05);
    head.add(e);
    head.eyes.push(e);
    // soft socket
    e.add(mesh(SH(.11, 14, 10), mat.eyeSocket, [0, 0, -.02], [1.15, 1.2, .55]));
    // sclera
    e.add(mesh(SH(.105, 16, 12), mat.eyeW, [0, 0, 0], [1.05, 1.15, .55]));
    // iris + pupil
    e.add(mesh(SH(.072, 14, 12), mat.iris, [0, -.008, .04], [1, 1.08, .42]));
    e.add(mesh(SH(.038, 10, 8), mat.pupil, [0, -.008, .065], [1, 1.05, .38]));
    // dual highlights
    e.add(mesh(SH(.02, 8, 6), mat.hl, [s * -.02 + .012, .028, .078]));
    e.add(mesh(SH(.01, 6, 6), mat.hlSoft, [s * .02 - .008, -.01, .08]));
    // soft upper lid (blink-ready)
    const lid = mesh(SH(.11, 12, 8), mat.furHead, [0, .055, .015], [1.15, .32, .65]);
    lid.scale.y = .2;
    lid.userData.baseY = .055;
    e.add(lid);
    e.lid = lid;
    // thick expressive brow
    head.add(mesh(new THREE.CapsuleGeometry(.022, .1, 3, 6), mat.brow, [s * .14, .22, .3], null, [0, 0, s * 1.15]));
  });

  // vysoké uši s růžovým vnitřkem
  head.ears = [];
  [-1, 1].forEach(s => {
    const ear = new THREE.Group();
    ear.position.set(s * .18, .28, -.08);
    ear.rotation.set(-.12, s * .1, -s * .28);
    ear.userData.base = { x: ear.rotation.x, y: ear.rotation.y, z: ear.rotation.z };
    head.add(ear);
    head.ears.push(ear);
    // outer fur capsule
    ear.add(mesh(new THREE.CapsuleGeometry(.11, .58, 6, 12), mat.furHead, [0, .4, 0], [1, 1, .42]));
    // rim darken
    ear.add(mesh(new THREE.CapsuleGeometry(.095, .52, 5, 10), mat.furDark, [0, .38, -.025], [1.05, 1, .2]));
    // pink interior
    ear.add(mesh(new THREE.CapsuleGeometry(.075, .48, 5, 10), mat.pink, [0, .38, .045], [.95, 1, .22]));
    ear.add(mesh(new THREE.CapsuleGeometry(.04, .32, 4, 8), mat.pinkDeep, [0, .34, .06], [1, 1, .35]));
    // canal pocket
    ear.add(mesh(SH(.045, 10, 8), mat.pinkDeep, [0, .12, .05], [1.15, .75, .45]));
    // tip
    ear.add(mesh(SH(.06, 10, 8), mat.furDark, [0, .72, -.01], [1.1, .55, .5]));
    // base fluff where ear meets crown
    ear.add(mesh(SH(.08, 12, 10), mat.furHead, [0, .04, 0], [1.3, .7, .85]));
  });

  // ježatá čupřina (forehead tuft) — tmavší, směrem dopředu
  const tuft = new THREE.Group(); tuft.position.set(0, .32, -.02); head.add(tuft);
  for (let i = 0; i < 11; i++) {
    const a = (i - 5) * .22;
    const lean = -.55 + (i % 3) * .12;
    tuft.add(mesh(
      new THREE.ConeGeometry(.045 + (i % 3) * .01, .18 + (i % 4) * .04, 5),
      i % 2 ? mat.tuft : mat.furDark,
      [Math.sin(a) * .1, .08 + Math.cos(a) * .02, .02 + (i % 3) * .04],
      null,
      [lean, a * .4, -a * .85]
    ));
  }
  // soft base mound under tuft
  tuft.add(mesh(SH(.1, 12, 10), mat.furDark, [0, 0, 0], [1.4, .55, 1.1]));

  // --- ocas v2: silný svalnatý klokaní ocas (base → tip), sedí přes sedlo na bike ---
  // standing: hangs back/down; bike pose: K.tail.rotation.x ≈ .25 lays it over the seat
  const tail = new THREE.Group();
  tail.position.set(0, 1.05, -.32);
  body.add(tail);

  // base (hip attach) — thick muscular root
  const t0 = new THREE.Group();
  tail.add(t0);
  t0.add(mesh(S(.22, 16, 12), mat.furTail, [0, -.02, -.08], [1.15, 1.05, 1.25]));
  t0.add(mesh(S(.16, 14, 10), mat.fur, [.07, .02, -.06], [.95, .9, 1]));
  t0.add(mesh(S(.14, 12, 10), mat.furDark, [-.06, .04, -.1], [.9, .85, .95]));
  t0.add(mesh(S(.1, 10, 8), mat.furBelly, [0, -.08, -.04], [1.1, .7, .9])); // underside

  // mid — long thick shaft
  const t1 = new THREE.Group();
  t1.position.set(0, -.12, -.28);
  t0.add(t1);
  t1.add(mesh(S(.2, 16, 12), mat.furTail, [0, -.06, -.16], [1.1, 1.15, 1.35]));
  t1.add(mesh(S(.16, 14, 10), mat.fur, [0, -.14, -.34], [1.05, 1.1, 1.25]));
  t1.add(mesh(S(.12, 12, 10), mat.fur, [.06, -.04, -.22], [.95, 1, 1.1]));
  t1.add(mesh(S(.11, 12, 10), mat.furDark, [-.05, -.08, -.28], [.9, .95, 1]));
  t1.add(mesh(S(.09, 10, 8), mat.furBelly, [0, -.18, -.2], [1.15, .65, 1]));
  t1.add(mesh(S(.07, 8, 6), mat.fur, [.05, -.2, -.4], [.85, .8, .9])); // fluff clump

  // tip — tapers + slight upward curl (reads over bike seat when rotated)
  const t2 = new THREE.Group();
  t2.position.set(0, -.22, -.48);
  t1.add(t2);
  t2.add(mesh(S(.13, 14, 10), mat.furTail, [0, -.04, -.12], [1.05, 1.1, 1.2]));
  t2.add(mesh(S(.1, 12, 10), mat.fur, [0, .02, -.26], [1, 1.05, 1.15]));
  t2.add(mesh(S(.07, 10, 8), mat.fur, [0, .08, -.38], [.95, .95, 1]));
  t2.add(mesh(S(.05, 8, 6), mat.furDark, [0, .12, -.46], [1, .85, .9])); // tip tuft
  t2.add(mesh(S(.045, 8, 6), mat.fur, [.03, .06, -.34], [.85, .8, .85]));
  t2.add(mesh(S(.04, 8, 6), mat.furBelly, [0, -.02, -.3], [1.1, .6, .9]));

  // cascade segs for animateSiki sway
  tail.segs = [t0, t1, t2];
  // standing rest: slight downward hang; bike bumps root.x to ~.25
  t0.userData.base = { x: .08, y: 0, z: 0 };
  t1.userData.base = { x: .18, y: 0, z: 0 };
  t2.userData.base = { x: -.22, y: 0, z: 0 }; // tip curls up
  t0.rotation.x = .08;
  t1.rotation.x = .18;
  t2.rotation.x = -.22;

  return { root, body, head, arms, legs, tail, belt };
}

/** Subtle idle / motion tail sway (cascade). opts: { bike?: boolean, amp?: number }.
 *  Safe with game3d/motorbike that also set tail.rotation.y / .x — we blend segs only
 *  unless opts.driveRoot is true. */
export function animateSiki(g, t, opts = {}) {
  if (!g) return;
  const dt = t.dt ?? 0.016;
  const now = t.now ?? 0;
  const lerp = (cur, tgt, rate) => cur + (tgt - cur) * Math.min(1, dt * rate);
  const amp = opts.amp ?? (opts.bike ? .12 : .22);
  const sp = opts.bike ? 200 : 320;
  const wave = Math.sin(now / sp);
  const wave2 = Math.sin(now / (sp * 1.35) + .7);
  const spd = opts.speed ?? (opts.bike ? 10 : 0);
  if (g.tail && opts.driveRoot) {
    const baseX = opts.bike ? .25 : 0;
    g.tail.rotation.y = lerp(g.tail.rotation.y, wave * amp, 7);
    g.tail.rotation.x = lerp(g.tail.rotation.x, baseX + wave2 * amp * .25, 6);
    g.tail.rotation.z = lerp(g.tail.rotation.z || 0, wave * amp * .2, 6);
  }
  if (g.tail?.segs) {
    g.tail.segs.forEach((seg, i) => {
      const b = seg.userData.base || { x: 0, y: 0, z: 0 };
      const lag = i * .55;
      const w = Math.sin(now / sp - lag);
      const a = amp * (.55 + i * .35);
      seg.rotation.y = lerp(seg.rotation.y, b.y + w * a, 8);
      seg.rotation.x = lerp(seg.rotation.x, b.x + Math.sin(now / (sp * 1.2) - lag) * a * .35, 7);
      seg.rotation.z = lerp(seg.rotation.z, b.z + w * a * .25, 7);
    });
  }
  // cheap tool-belt jiggle (rider / motion) — uses opts.speed when passed
  if (g.belt) {
    const j = Math.min(1, Math.abs(spd) / 14) * (opts.amp ?? .1);
    const wob = Math.sin(now / 48);
    const wob2 = Math.sin(now / 37 + 1.1);
    const baseY = g.belt.userData.baseY ?? g.belt.position.y;
    g.belt.position.y = lerp(g.belt.position.y, baseY + wob * j * .018, 10);
    g.belt.rotation.z = lerp(g.belt.rotation.z, wob2 * j * .06, 9);
    g.belt.rotation.x = lerp(g.belt.rotation.x, wob * j * .03, 9);
  }
  // ear twitch (standing + soft on bike)
  if (g.head?.ears?.length) {
    const idleAmt = opts.bike ? .35 : Math.max(0, 1 - Math.min(1, Math.abs(spd) / 8));
    g.head.ears.forEach((ear, i) => {
      const b = ear.userData.base || (ear.userData.base = {
        x: ear.rotation.x, y: ear.rotation.y, z: ear.rotation.z,
      });
      const side = i ? 1 : -1;
      const soft = Math.sin(now / 920 + i * 1.6) * .045 * (idleAmt + .15);
      const spike = Math.pow(Math.max(0, Math.sin(now / 540 + i * 2.1)), 14) * (.16 * idleAmt + .03);
      ear.rotation.z = lerp(ear.rotation.z, b.z + soft * side + spike * side, 10);
      ear.rotation.x = lerp(ear.rotation.x, b.x + soft * .4 - spike * .1, 10);
      ear.rotation.y = lerp(ear.rotation.y, b.y + Math.sin(now / 1100 + i) * .03 * idleAmt, 8);
    });
  }
  // blink via head.eyes[].lid
  if (g.head?.eyes?.length) {
    const off = g._blinkOff || 0;
    const cycle = ((now / 1000) + off) % 3.8;
    let blinkAmt = 0;
    if (cycle < .11) blinkAmt = Math.sin((cycle / .11) * Math.PI);
    else if (cycle > .2 && cycle < .3) blinkAmt = Math.sin(((cycle - .2) / .1) * Math.PI) * .8;
    g.head.eyes.forEach(eye => {
      if (!eye.lid) return;
      const lid = eye.lid;
      const baseY = lid.userData.baseY ?? .05;
      lid.scale.y = lerp(lid.scale.y, .18 + blinkAmt * 1.55, 22);
      lid.position.y = lerp(lid.position.y, baseY - blinkAmt * .045, 22);
      eye.scale.y = lerp(eye.scale.y, 1 - blinkAmt * .32, 20);
    });
  }
}
