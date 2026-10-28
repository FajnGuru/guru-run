// Procedurální retro motorka (café racer / scrambler) – PR8: rider pose on bike
import * as THREE from 'three';
import { buildSiki } from './siki-model.js';

function textTex(text, opts = {}) {
  const w = opts.w || 320, h = opts.h || 110;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.font = opts.font || `bold ${opts.size || 88}px Arial, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opts.stroke) {
    x.strokeStyle = opts.stroke; x.lineWidth = opts.lineWidth || 10; x.lineJoin = 'round';
    x.strokeText(text, w / 2, h / 2 + 2);
  }
  x.fillStyle = opts.fill || '#0a0a0a';
  x.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

/** Horizontal brushed-metal grain (mobile 128px). */
let _brushMap;
function brushMap() {
  if (_brushMap) return _brushMap;
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c4c8ce';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    const v = 160 + ((Math.sin(y * .7) * 18 + Math.random() * 40) | 0);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${.35 + Math.random() * .25})`;
    ctx.fillRect(0, y, s, 1);
  }
  for (let i = 0; i < 80; i++) {
    const y = (Math.random() * s) | 0;
    ctx.strokeStyle = `rgba(255,255,255,${.08 + Math.random() * .12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y + (Math.random() * 2 - 1));
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.needsUpdate = true;
  return (_brushMap = tex);
}

export function buildMotorbike(withRider = true) {
  const std = (c, r = .6, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });
  const brush = brushMap();
  const m = {
    chrome: std(0xdfe3e8, .18, { metalness: .95 }),
    silver: std(0xb9bec4, .32, { metalness: .82, map: brush, roughnessMap: brush, bumpMap: brush, bumpScale: .03 }),
    silverSoft: std(0xc8ccd2, .38, { metalness: .75, map: brush, bumpMap: brush, bumpScale: .02 }),
    tire: std(0x161616, .9),
    black: std(0x1e1e1e, .5),
    engine: std(0x5a5d62, .5, { metalness: .6 }),
    engineDark: std(0x3a3d42, .55, { metalness: .5 }),
    engineFin: std(0xa8aeb6, .35, { metalness: .7 }),
    glass: std(0xfff6d0, .1, { emissive: 0xfff2b0, emissiveIntensity: .6 }),
    mirrorGlass: std(0xa8c4d8, .15, { metalness: .4, emissive: 0x406080, emissiveIntensity: .15 }),
    seat: std(0x111111, .72),
    seatSoft: std(0x1a1a1a, .78),
    rubber: std(0x222222, .85),
  };
  const mesh = (g, mat, p = [0, 0, 0], s, r) => { const k = new THREE.Mesh(g, mat); k.position.set(...p); if (s) k.scale.set(...s); if (r) k.rotation.set(...r); k.castShadow = true; return k; };
  const cyl = (r, l, mat, a, b) => { // válec mezi body a,b
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), k = mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 8), mat);
    k.position.copy(A).add(B).multiplyScalar(.5); k.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return k; };
  const root = new THREE.Group(), lean = new THREE.Group(); root.add(lean); const bob = new THREE.Group(); lean.add(bob);
  const R = .36;
  // spoked wheel v2 — denser spokes, rim lip, hub; spin group for game3d
  const wheel = () => {
    const w = new THREE.Group(), spin = new THREE.Group(); w.add(spin);
    const rimR = R - .11;
    // tire
    spin.add(mesh(new THREE.TorusGeometry(R - .04, .075, 10, 32), m.tire, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    // tread hint (thin outer ring)
    spin.add(mesh(new THREE.TorusGeometry(R - .01, .012, 6, 28), m.black, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    // chrome rim + inner lip
    spin.add(mesh(new THREE.TorusGeometry(rimR, .02, 6, 28), m.chrome, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    spin.add(mesh(new THREE.TorusGeometry(rimR - .04, .01, 5, 24), m.silverSoft, [0, 0, 0], null, [0, Math.PI / 2, 0]));
    // hub
    spin.add(mesh(new THREE.CylinderGeometry(.07, .07, .12, 14), m.chrome, [0, 0, 0], null, [0, 0, Math.PI / 2]));
    spin.add(mesh(new THREE.CylinderGeometry(.035, .035, .14, 10), m.black, [0, 0, 0], null, [0, 0, Math.PI / 2]));
    // 18 crossed spokes (both flanges) — readable scrambler look
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2;
      const y = Math.sin(a) * rimR, z = Math.cos(a) * rimR;
      spin.add(cyl(.005, 0, m.chrome, [.05, 0, 0], [0, y, z]));
      spin.add(cyl(.005, 0, m.chrome, [-.05, 0, 0], [0, y, z]));
    }
    // brake disc (right side)
    spin.add(mesh(new THREE.CylinderGeometry(.14, .14, .012, 20), m.silverSoft, [.07, 0, 0], null, [0, 0, Math.PI / 2]));
    spin.add(mesh(new THREE.CylinderGeometry(.05, .05, .014, 12), m.chrome, [.075, 0, 0], null, [0, 0, Math.PI / 2]));
    w.spin = spin; return w;
  };
  const rear = wheel(); rear.position.set(0, R, -.72); bob.add(rear);
  const steer = new THREE.Group(); steer.position.set(0, .95, .52); steer.rotation.x = .38; bob.add(steer);
  const front = wheel(); front.position.set(0, -.62, .25); // v souřadnicích řízení
  const fg = new THREE.Group(); fg.rotation.x = -.38; steer.add(fg); // vyrovnat kolo
  front.position.set(0, R - .95, .52 - .52 + .28); fg.add(front);
  // front forks
  [-1, 1].forEach(s => {
    steer.add(cyl(.028, 0, m.chrome, [s * .1, .12, 0], [s * .1, -.72, 0]));
    steer.add(cyl(.032, 0, m.black, [s * .1, -.35, 0], [s * .1, -.72, 0])); // lower slider
  });
  // round headlight v2 (large café / scrambler)
  const hl = new THREE.Group(); hl.position.set(0, .02, .14); steer.add(hl);
  hl.add(mesh(new THREE.CylinderGeometry(.13, .12, .14, 20), m.chrome, [0, 0, 0], null, [Math.PI / 2, 0, 0]));
  hl.add(mesh(new THREE.TorusGeometry(.125, .014, 6, 20), m.chrome, [0, 0, .02]));
  hl.add(mesh(new THREE.CylinderGeometry(.105, .105, .025, 20), m.glass, [0, 0, .08], null, [Math.PI / 2, 0, 0]));
  hl.add(mesh(new THREE.CylinderGeometry(.04, .04, .01, 12), m.chrome, [0, 0, .095], null, [Math.PI / 2, 0, 0])); // bulb hint
  // handlebars
  steer.add(cyl(.018, 0, m.chrome, [-.38, .22, -.08], [.38, .22, -.08]));
  [-1, 1].forEach(s => {
    // grips
    steer.add(mesh(new THREE.CylinderGeometry(.032, .03, .13, 8), m.rubber, [s * .36, .22, -.08], null, [0, 0, Math.PI / 2]));
    // round bar-end mirrors (stem + disc)
    const mir = new THREE.Group();
    mir.position.set(s * .34, .42, -.04);
    mir.rotation.z = s * -.15;
    steer.add(mir);
    mir.add(cyl(.007, 0, m.chrome, [0, -.18, -.02], [0, 0, 0]));
    mir.add(mesh(new THREE.CylinderGeometry(.055, .055, .018, 16), m.chrome, [0, .02, 0], null, [Math.PI / 2, s * .35, 0]));
    mir.add(mesh(new THREE.CylinderGeometry(.045, .045, .01, 16), m.mirrorGlass, [0, .02, s * .012], null, [Math.PI / 2, s * .35, 0]));
  });
  // front fender (short café)
  bob.add(mesh(new THREE.BoxGeometry(.14, .025, .42), m.silverSoft, [0, .78, .48], null, [-.28, 0, 0]));
  bob.add(mesh(new THREE.BoxGeometry(.12, .02, .18), m.silver, [0, .7, .68], null, [-.55, 0, 0]));
  // rám
  bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .95, -.45])); bob.add(cyl(.03, 0, m.black, [0, .98, .45], [0, .42, .05]));
  bob.add(cyl(.03, 0, m.black, [0, .95, -.45], [0, .4, -.72]));

  // —— tank v2: teardrop café / scrambler, brushed silver + bold SIKI ——
  const tank = new THREE.Group();
  tank.position.set(0, 1.08, .18);
  bob.add(tank);
  // main teardrop body (elongated Z, flatter Y)
  tank.add(mesh(new THREE.SphereGeometry(.28, 20, 14), m.silver, [0, 0, 0], [.88, .58, 1.72]));
  // lower belly fill for volume
  tank.add(mesh(new THREE.SphereGeometry(.2, 14, 10), m.silverSoft, [0, -.06, -.02], [.95, .45, 1.55]));
  // nose taper toward headstock
  tank.add(mesh(new THREE.SphereGeometry(.14, 12, 10), m.silver, [0, -.02, .32], [1.05, .7, 1.1]));
  // rear kneepad / side swell (classic café)
  [-1, 1].forEach(s => {
    tank.add(mesh(new THREE.SphereGeometry(.1, 10, 8), m.silverSoft, [s * .16, -.04, -.05], [.55, .7, 1.2]));
  });
  // filler cap
  tank.add(mesh(new THREE.CylinderGeometry(.05, .055, .03, 14), m.chrome, [0, .14, .05]));
  tank.add(mesh(new THREE.CylinderGeometry(.02, .02, .02, 8), m.black, [0, .16, .05]));
  // bold black SIKI on both flanks
  const sikiTank = textTex('SIKI', { fill: '#0a0a0a', size: 92, w: 340, h: 120 });
  [-1, 1].forEach(s => {
    const d = new THREE.Mesh(
      new THREE.PlaneGeometry(.32, .12),
      new THREE.MeshStandardMaterial({
        map: sikiTank, transparent: true, roughness: .55, metalness: .1,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
      })
    );
    d.position.set(s * .245, .02, .02);
    d.rotation.y = s * Math.PI / 2;
    d.rotation.z = s * -.02;
    tank.add(d);
  });

  // —— seat bench v2: flat black leather café bench ——
  const seat = new THREE.Group();
  seat.position.set(0, 1.02, -.4);
  bob.add(seat);
  // main bench (long, flat)
  seat.add(mesh(new THREE.BoxGeometry(.28, .07, .72), m.seat, [0, 0, 0], null, [.06, 0, 0]));
  // top pad slightly softer / wider
  seat.add(mesh(new THREE.BoxGeometry(.3, .035, .68), m.seatSoft, [0, .04, .01], null, [.06, 0, 0]));
  // front step-down toward tank
  seat.add(mesh(new THREE.BoxGeometry(.26, .05, .12), m.seat, [0, -.02, .38], null, [-.2, 0, 0]));
  // rear slight upkick / loop end
  seat.add(mesh(new THREE.BoxGeometry(.26, .06, .1), m.seat, [0, .03, -.38], null, [.35, 0, 0]));
  // stitching ridge hint
  seat.add(mesh(new THREE.BoxGeometry(.02, .02, .6), m.rubber, [0, .055, 0], null, [.06, 0, 0]));

  // rear fender (silver, follows tire)
  bob.add(mesh(new THREE.BoxGeometry(.26, .035, .36), m.silverSoft, [0, .9, -.86], null, [-.2, 0, 0]));
  bob.add(mesh(new THREE.BoxGeometry(.22, .025, .16), m.silver, [0, .78, -1.02], null, [-.55, 0, 0]));

  // —— engine v2: block + readable cooling fins + cases ——
  const eng = new THREE.Group(); eng.position.set(0, .55, .02); eng.scale.setScalar(1.3); bob.add(eng);
  eng.add(mesh(new THREE.BoxGeometry(.26, .24, .38), m.engine));
  eng.add(mesh(new THREE.BoxGeometry(.22, .12, .2), m.engineDark, [0, .1, .05]));
  // cooling fins (both flanks + top) — denser / thicker for silhouette
  for (let i = 0; i < 8; i++) {
    const y = -.02 + i * .035;
    eng.add(mesh(new THREE.BoxGeometry(.34, .012, .18), m.engineFin, [0, y, .1], null, [.2, 0, 0]));
  }
  for (let i = 0; i < 5; i++) {
    eng.add(mesh(new THREE.BoxGeometry(.3, .01, .12), m.silverSoft, [0, .14 + i * .028, -.05]));
  }
  // crankcase / primary cover
  eng.add(mesh(new THREE.CylinderGeometry(.13, .13, .28, 18), m.silver, [0, -.1, -.06], null, [0, 0, Math.PI / 2]));
  eng.add(mesh(new THREE.CylinderGeometry(.08, .08, .3, 14), m.chrome, [0, -.1, -.06], null, [0, 0, Math.PI / 2]));
  // carb / intake stub
  eng.add(mesh(new THREE.CylinderGeometry(.04, .05, .08, 10), m.black, [0, .08, .22], null, [Math.PI / 2, 0, 0]));

  // —— chrome exhaust v2: header + muffler can (right side) ——
  bob.add(cyl(.035, 0, m.chrome, [.16, .52, .18], [.2, .38, -.05]));
  bob.add(cyl(.038, 0, m.chrome, [.2, .38, -.05], [.22, .36, -.45]));
  // muffler body
  bob.add(mesh(new THREE.CylinderGeometry(.055, .05, .42, 12), m.chrome, [.22, .4, -.72], null, [Math.PI / 2 + .08, 0, 0]));
  bob.add(mesh(new THREE.CylinderGeometry(.048, .042, .06, 12), m.chrome, [.22, .38, -.95], null, [Math.PI / 2 + .08, 0, 0]));
  bob.add(mesh(new THREE.TorusGeometry(.05, .01, 6, 12), m.chrome, [.22, .42, -.55], null, [Math.PI / 2, 0, 0]));
  // heat shield plate
  bob.add(mesh(new THREE.BoxGeometry(.04, .06, .22), m.silverSoft, [.18, .44, -.25], null, [.15, 0, 0]));
  // left stub pipe hint (balance silhouette)
  bob.add(cyl(.028, 0, m.chrome, [-.15, .5, .1], [-.18, .4, -.25]));

  // —— dual rear shocks v2: spring + damper ——
  [-1, 1].forEach(s => {
    // damper body
    bob.add(cyl(.018, 0, m.chrome, [s * .12, .48, -.55], [s * .12, .98, -.48]));
    // coil spring (stacked rings along shock)
    for (let i = 0; i < 7; i++) {
      const t = (i + .5) / 7;
      const y = .48 + t * (.98 - .48);
      const z = -.55 + t * (-.48 - -.55);
      bob.add(mesh(new THREE.TorusGeometry(.032, .007, 5, 10), m.chrome, [s * .12, y, z], null, [0.55, 0, 0]));
    }
    // top / bottom mounts
    bob.add(mesh(new THREE.SphereGeometry(.025, 8, 6), m.black, [s * .12, .98, -.48]));
    bob.add(mesh(new THREE.SphereGeometry(.025, 8, 6), m.black, [s * .12, .48, -.55]));
  });
  // swingarm hint
  bob.add(cyl(.016, 0, m.black, [-.1, .42, -.2], [-.1, .38, -.7]));
  bob.add(cyl(.016, 0, m.black, [.1, .42, -.2], [.1, .38, -.7]));
  // footpegs (target for rider feet near engine)
  [-1, 1].forEach(s => {
    bob.add(mesh(new THREE.CylinderGeometry(.018, .018, .1, 8), m.chrome, [s * .22, .42, .08], null, [0, 0, Math.PI / 2]));
    bob.add(mesh(new THREE.CylinderGeometry(.022, .02, .04, 8), m.rubber, [s * .28, .42, .08], null, [0, 0, Math.PI / 2]));
  });
  const res = { root, lean, bob, steer, front, rear, R, tank, seat, eng };
  if (withRider) {
    const K = poseSikiOnBike(buildSiki());
    bob.add(K.root);
    res.rider = K;
  }
  return res;
}

/** Seat Siki on the café bike to match turnaround ref.
 *  CRITICAL: keeps legs[i].children[2] as the foot group (game3d / animateSiki). */
export function poseSikiOnBike(K) {
  const r = K.root;
  r.scale.setScalar(.56);
  // upright on bench — hips over seat (seat ~ y 1.02, z -.4)
  r.position.set(0, .54, -.2);

  // upright torso (slight forward lean only)
  K.body.rotation.set(.05, 0, 0);
  if (K.head) K.head.rotation.set(-.06, 0, 0); // look along road

  // legs: knees bent, feet down/forward toward engine pegs
  // children[2] MUST remain the foot group
  K.legs.forEach((l, i) => {
    const s = i ? 1 : -1;
    l.rotation.set(-1.05, s * .06, s * .42);
    const foot = l.children[2];
    if (!foot) return;
    foot.rotation.set(1.05, s * -.05, s * -.12);
    // nudge sole toward peg without replacing the group
    foot.position.set(0, -.9, .18);
  });

  // arms: reach forward/out to handlebar grips (paws on bars)
  K.arms.forEach((a, i) => {
    const s = i ? 1 : -1;
    // shoulder a bit forward toward bars
    a.position.set(s * .38, 2.02, .12);
    a.rotation.set(-1.42, s * .22, s * .55);
  });

  // thick tail laid over seat / rear fender (horizontal, tip slight curl)
  K.tail.rotation.set(.62, 0, 0);
  if (K.tail.segs) {
    const [t0, t1, t2] = K.tail.segs;
    // flatter cascade so mass reads over the bench, not hanging down
    if (t0) {
      t0.userData.base = { x: .04, y: 0, z: 0 };
      t0.rotation.set(.04, 0, 0);
    }
    if (t1) {
      t1.userData.base = { x: .1, y: 0, z: 0 };
      t1.rotation.set(.1, 0, 0);
    }
    if (t2) {
      t2.userData.base = { x: -.18, y: 0, z: 0 }; // tip curls up
      t2.rotation.set(-.18, 0, 0);
    }
  }

  return K;
}
