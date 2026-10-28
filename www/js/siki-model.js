// Procedurální model SIKI (klokan) – PR1: hlava v2 (oči, uši, čupřina, úsměv)
// API: buildSiki() → { root, body, head, arms, legs, tail }
// DŮLEŽITÉ: legs[i].children[2] = foot group (motorbike pose).
import * as THREE from 'three';

function textTex(text, w, h, font, color = '#fff') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.strokeStyle = '#1b2a4a'; x.lineWidth = h * .06; x.strokeText(text, w / 2, h / 2); x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Soft brown fur grain for head (cached, mobile-friendly 96px). */
function makeFurMap() {
  const s = 96, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c4a070';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const len = 2 + Math.random() * 8;
    const ang = -0.55 + Math.random() * 1.1;
    const g = 140 + ((Math.random() * 70) | 0);
    ctx.strokeStyle = `rgb(${g},${g - 25},${g - 55})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

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

export function buildSiki() {
  const furMap = makeFurMap();
  const muzzleMap = makeMuzzleMap();
  const irisMap = makeIrisMap();
  const std = (c, r = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const mat = {
    fur: std(0xa8703f, .95, { map: furMap }),
    furHead: std(0xb07a45, .92, { map: furMap }),
    furLight: std(0xe8c9a0, .95, { map: muzzleMap }),
    furFace: std(0xd4ae78, .93, { map: furMap }),
    furDark: std(0x5a3418, .95),
    tuft: std(0x4a2a12, .9),
    pink: std(0xe8aea4, .88),
    pinkDeep: std(0xd08078, .9),
    red: std(0xc0282d, .8), white: std(0xf2f2f2, .8), navy: std(0x23305e, .8),
    denim: std(0x52698f, .95), denimLight: std(0x8ea0bd, .95),
    leather: std(0x8a5530, .6), leatherDark: std(0x5c3418, .6),
    steel: std(0xb8bec6, .3, { metalness: .8 }), handle: std(0xc0282d, .5),
    nose: std(0x1a1414, .32, { metalness: .1, emissive: 0x1a1010, emissiveIntensity: .05 }),
    noseWet: std(0x0a0808, .14, { metalness: .2 }),
    eyeW: std(0xffffff, .28),
    iris: std(0xffffff, .35, { map: irisMap }),
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

  // dlouhý silný ocas
  const tail = new THREE.Group(); tail.position.set(0, 1.0, -.35); body.add(tail);
  for (let i = 0; i < 26; i++) { const t = i / 25; tail.add(mesh(S(.2 - t * .14, 12, 8), mat.fur, [0, -Math.pow(t, .8) * .92, -.12 - t * 1.35], [1, .95, 1.15])); }

  return { root, body, head, arms, legs, tail };
}
