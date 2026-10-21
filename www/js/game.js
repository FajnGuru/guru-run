/* Guru Run: Celetná – prototyp (Phaser 3, offline) */
const W = 960, H = 540, GROUND = 470, LEVEL_W = 14000;
const C = { fur: 0xf2f2f2, grey: 0x8a9099, suit: 0x4f7a3a, cap: 0x7a4a26, goggle: 0x9fd3e8 };

function makeTextures(s) {
  const g = s.make.graphics({ add: false });
  // Guru – husky
  const guru = (key, legA, legB, spin) => {
    g.clear();
    g.fillStyle(C.suit).fillRoundedRect(12, 30, 32, 30, 8);          // kombinéza
    g.fillStyle(0x3d5f2c).fillRect(14 + legA, 56, 9, 12).fillRect(33 + legB, 56, 9, 12);
    g.fillStyle(C.grey).fillTriangle(0, 34, 14, 40, 12, 30);          // ocas
    g.fillStyle(C.grey).fillCircle(36, 20, 16);                        // hlava
    g.fillStyle(C.fur).fillCircle(40, 25, 11).fillEllipse(50, 27, 14, 9); // maska + čumák
    g.fillStyle(0x222222).fillCircle(56, 26, 3);
    g.fillStyle(C.cap).fillRoundedRect(20, 2, 32, 12, 6).fillTriangle(22, 4, 28, -6, 32, 6);
    g.fillStyle(C.goggle).fillCircle(32, 12, 4).fillCircle(42, 12, 4);
    g.lineStyle(2, 0x3a2a1a).strokeCircle(32, 12, 4).strokeCircle(42, 12, 4);
    g.fillStyle(0x222222).fillCircle(45, 20, 2);
    if (spin) { g.lineStyle(3, 0xffffff, .8).strokeEllipse(30, 36, 68, 30); }
    g.generateTexture(key, 64, 70);
  };
  guru('guru0', 0, 0); guru('guru1', -4, 4); guru('guru2', 4, -4); guru('guruSpin', 0, 0, true);
  g.clear(); g.fillStyle(0xffffff).fillRoundedRect(4, 6, 20, 6, 3).fillCircle(5, 6, 4).fillCircle(5, 12, 4).fillCircle(23, 6, 4).fillCircle(23, 12, 4); g.generateTexture('bone', 28, 18);
  g.clear(); g.fillStyle(0xc68a3c).fillRect(0, 0, 44, 44); g.lineStyle(3, 0x7a4a1a).strokeRect(1, 1, 42, 42).lineBetween(0, 0, 44, 44).lineBetween(44, 0, 0, 44);
  g.fillStyle(0x4f7a3a).fillRect(8, 16, 28, 12); g.generateTexture('crate', 44, 44);
  g.clear(); g.fillStyle(0x6b3b1a).fillCircle(20, 20, 20); g.lineStyle(3, 0x3a1f0c).strokeCircle(20, 20, 19).lineBetween(2, 14, 38, 14).lineBetween(2, 26, 38, 26); g.generateTexture('barrel', 40, 40);
  g.clear(); g.fillStyle(0x8892a6).fillEllipse(20, 20, 34, 22).fillCircle(34, 10, 8); g.fillStyle(0xff9900).fillTriangle(40, 10, 48, 12, 40, 14); g.fillStyle(0x111111).fillCircle(36, 8, 2); g.fillStyle(0x5a6378).fillEllipse(14, 16, 18, 10); g.generateTexture('pigeon', 50, 34);
  g.clear(); g.fillStyle(0x8b5a2b).fillRect(10, 40, 80, 50); g.fillStyle(0xb03030).fillTriangle(0, 42, 50, 0, 100, 42); g.fillStyle(0x222222).fillRoundedRect(36, 58, 28, 32, 12); g.generateTexture('doghouse', 100, 90);
  g.clear(); g.fillStyle(0x5c5f66).fillRect(0, 0, 64, 70); g.lineStyle(1, 0x3f4247); for (let y = 0; y < 70; y += 14) g.lineBetween(0, y, 64, y); for (let x = 0; x < 64; x += 16) g.lineBetween(x + (x % 32 ? 0 : 8), 0, x + 8, 70); g.generateTexture('cobble', 64, 70);
  g.clear(); g.fillStyle(0x66ccff, .35).fillCircle(40, 40, 40); g.generateTexture('shield', 80, 80);
  // paws
  [['pawB', 0xcd7f32], ['pawS', 0xc0c0c0], ['pawG', 0xffd700], ['pawX', 0x444444]].forEach(([k, c]) => { g.clear(); g.fillStyle(c).fillEllipse(40, 52, 40, 32).fillCircle(18, 24, 9).fillCircle(32, 12, 9).fillCircle(48, 12, 9).fillCircle(62, 24, 9); g.generateTexture(k, 80, 72); });
  g.destroy();
}

function drawCity(s, factor, color, baseY, hMin, hMax, seed, windows) {
  const g = s.add.graphics().setScrollFactor(factor, 0);
  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  for (let x = -100; x < LEVEL_W * factor + W + 200; ) {
    const w = rnd.between(90, 170), h = rnd.between(hMin, hMax);
    g.fillStyle(color).fillRect(x, baseY - h, w, h);
    g.fillTriangle(x - 6, baseY - h, x + w / 2, baseY - h - rnd.between(20, 60), x + w + 6, baseY - h);
    if (windows) { g.fillStyle(0xffe9a8, .7); for (let wy = baseY - h + 20; wy < baseY - 30; wy += 36) for (let wx = x + 14; wx < x + w - 20; wx += 30) g.fillRect(wx, wy, 14, 20); g.fillStyle(color); }
    x += w + rnd.between(0, 10);
  }
}

class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  preload() { this.load.image('art', '../assets/guru.jpg'); }
  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1b2a3a);
    const a = this.add.image(250, H / 2, 'art'); a.setScale(Math.min(380 / a.width, 440 / a.height));
    this.add.text(640, 130, 'GURU RUN', { font: 'bold 64px sans-serif', color: '#ffd24a' }).setOrigin(.5);
    this.add.text(640, 195, 'Celetná', { font: '36px sans-serif', color: '#fff' }).setOrigin(.5);
    this.add.text(640, 290, '← → běh   ↑ / mezera skok   X otočka\nNa mobilu: tlačítka dole', { font: '20px sans-serif', color: '#cde', align: 'center' }).setOrigin(.5);
    const t = this.add.text(640, 400, '▶ ŤUKNI / ENTER PRO START', { font: 'bold 28px sans-serif', color: '#7fe07f' }).setOrigin(.5);
    this.tweens.add({ targets: t, alpha: .3, yoyo: true, repeat: -1, duration: 600 });
    const go = () => { if (this.scale.isFullscreen === false && this.sys.game.device.input.touch) { try { this.scale.startFullscreen(); } catch (e) {} } this.scene.start('Game'); };
    this.input.once('pointerdown', go); this.input.keyboard.once('keydown-ENTER', go); this.input.keyboard.once('keydown-SPACE', go);
  }
}

class Game extends Phaser.Scene {
  constructor() { super('Game'); }
  create() {
    makeTextures(this);
    this.lives = 3; this.bones = 0; this.totalBones = 0; this.crates = 0; this.totalCrates = 0; this.hurt = false; this.shield = false; this.spinning = false; this.startTime = this.time.now; this.done = false;
    this.physics.world.setBounds(0, 0, LEVEL_W, H + 200);
    this.cameras.main.setBounds(0, 0, LEVEL_W, H).setBackgroundColor(0x8ec5e8);
    this.add.circle(800, 90, 40, 0xfff3b0).setScrollFactor(0);
    drawCity(this, .2, 0x6f87a3, 420, 150, 260, 1, false);
    drawCity(this, .5, 0xd9b38c, 440, 110, 200, 2, true);
    // Prašná brána na konci (pozadí)
    const pb = this.add.graphics().setScrollFactor(.5, 0), px = LEVEL_W * .5 - 200;
    pb.fillStyle(0x3a3a3a).fillRect(px, 140, 140, 300).fillTriangle(px - 10, 140, px + 70, 40, px + 150, 140); pb.fillStyle(0x1b1b1b).fillRoundedRect(px + 40, 340, 60, 100, 28);

    // zem s dírami
    this.ground = this.physics.add.staticGroup();
    this.gaps = [[2200, 140], [4100, 160], [6300, 150], [8600, 180], [10400, 160], [12200, 170]];
    let x = 0;
    while (x < LEVEL_W) {
      const gap = this.gaps.find(([gx, gw]) => x >= gx && x < gx + gw);
      if (gap) { x = gap[0] + gap[1]; continue; }
      this.ground.create(x + 32, GROUND + 35, 'cobble'); x += 64;
    }
    this.player = this.physics.add.sprite(100, GROUND - 60, 'guru0').setCollideWorldBounds(true);
    this.player.body.setSize(36, 62).setOffset(14, 6); this.player.setGravityY(1400);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.physics.add.collider(this.player, this.ground);
    this.cameras.main.startFollow(this.player, true, .12, .12, -120, 0);
    this.checkpoint = 100;

    this.bonesG = this.physics.add.group({ allowGravity: false });
    for (let bx = 400; bx < LEVEL_W - 400; bx += 90) {
      if (this.gaps.some(([gx, gw]) => bx > gx - 40 && bx < gx + gw + 40)) { this.addBone(bx, GROUND - 170); continue; }
      if (Math.floor(bx / 900) % 2 === 0) this.addBone(bx, GROUND - 30 - (bx % 270 === 0 ? 90 : 0));
    }
    this.cratesG = this.physics.add.staticGroup();
    [800, 1500, 2900, 3500, 5000, 5800, 7200, 7900, 9300, 9900, 11200, 12900].forEach((cx, i) => {
      const c = this.cratesG.create(cx, GROUND - 22, 'crate'); c.content = i % 4 === 3 ? 'shield' : 'bones'; this.totalCrates++;
    });
    this.physics.add.collider(this.player, this.cratesG, (p, c) => { if (p.body.touching.down && c.body.touching.up && p.body.velocity.y >= 0) { this.breakCrate(c); p.setVelocityY(-500); } });
    this.physics.add.overlap(this.player, this.bonesG, (p, b) => { b.destroy(); this.gainBones(1); });

    this.pigeons = this.physics.add.group();
    [1900, 3800, 5500, 7600, 9600, 11800, 13200].forEach(px => { const p = this.pigeons.create(px, GROUND - 20, 'pigeon'); p.home = px; p.dir = -1; p.setGravityY(1400); });
    this.physics.add.collider(this.pigeons, this.ground);
    this.physics.add.overlap(this.player, this.pigeons, (pl, pg) => {
      if (this.spinning || (pl.body.velocity.y > 50 && pl.y < pg.y - 20)) { this.kill(pg); if (!this.spinning) pl.setVelocityY(-450); } else this.hit();
    });
    this.barrels = this.physics.add.group();
    this.physics.add.collider(this.barrels, this.ground);
    this.physics.add.overlap(this.player, this.barrels, (pl, br) => { if (this.spinning) { this.kill(br); } else this.hit(); });
    this.time.addEvent({ delay: 3800, loop: true, callback: () => this.spawnBarrel() });

    this.goal = this.physics.add.staticImage(LEVEL_W - 250, GROUND - 45, 'doghouse');
    this.add.rectangle(LEVEL_W - 380, GROUND - 90, 6, 180, 0xdddddd); this.add.triangle(LEVEL_W - 357, GROUND - 160, 0, 0, 0, 40, 44, 20, 0x4f7a3a);
    this.physics.add.overlap(this.player, this.goal, () => this.finish());

    this.shieldFx = this.add.image(0, 0, 'shield').setVisible(false);
    this.hud = this.add.text(16, 12, '', { font: 'bold 22px sans-serif', color: '#fff', stroke: '#000', strokeThickness: 4 }).setScrollFactor(0).setDepth(10);
    this.setupInput();
  }
  addBone(x, y) { const b = this.bonesG.create(x, y, 'bone'); this.totalBones++; this.tweens.add({ targets: b, y: y - 8, yoyo: true, repeat: -1, duration: 700 }); }
  gainBones(n) { this.bones += n; if (Math.floor(this.bones / 100) > Math.floor((this.bones - n) / 100)) { this.lives++; this.flash('+1 ŽIVOT!'); } }
  breakCrate(c) {
    if (!c.active) return; this.crates++;
    for (let i = 0; i < 6; i++) { const p = this.add.rectangle(c.x, c.y, 10, 10, 0xc68a3c); this.tweens.add({ targets: p, x: c.x + Phaser.Math.Between(-60, 60), y: c.y - Phaser.Math.Between(20, 90), alpha: 0, duration: 500, onComplete: () => p.destroy() }); }
    if (c.content === 'shield') { this.shield = true; this.flash('ŠTÍT!'); } else { this.gainBones(5); this.flash('+5 🦴'); }
    c.destroy();
  }
  kill(e) { e.disableBody(true, false); this.tweens.add({ targets: e, y: e.y - 120, angle: 360, alpha: 0, duration: 500, onComplete: () => e.destroy() }); }
  spawnBarrel() {
    if (this.done) return; const x = this.player.x + W * .8; if (x > LEVEL_W - 500) return;
    const b = this.barrels.create(x, GROUND - 30, 'barrel'); b.setVelocityX(-220).setGravityY(1400); b.setAngularVelocity(-300);
    this.time.delayedCall(9000, () => b.active && b.destroy());
  }
  flash(t) { const tx = this.add.text(this.player.x, this.player.y - 60, t, { font: 'bold 22px sans-serif', color: '#ffd24a', stroke: '#000', strokeThickness: 4 }).setOrigin(.5); this.tweens.add({ targets: tx, y: tx.y - 50, alpha: 0, duration: 900, onComplete: () => tx.destroy() }); }
  hit(fall) {
    if (this.hurt || this.done) return;
    if (navigator.vibrate) navigator.vibrate(fall ? [80, 40, 80] : 120);
    if (this.shield && !fall) { this.shield = false; this.hurt = true; this.time.delayedCall(800, () => this.hurt = false); return; }
    this.lives--; this.hurt = true; this.cameras.main.shake(200, .01);
    if (this.lives < 0) { this.done = true; this.physics.pause(); this.showEnd(false); return; }
    if (fall) { this.player.setPosition(this.checkpoint, GROUND - 80).setVelocity(0, 0); } else this.player.setVelocity(-this.player.flipX * 0 - 250 * (this.player.flipX ? -1 : 1), -400);
    this.tweens.add({ targets: this.player, alpha: .3, yoyo: true, repeat: 5, duration: 100, onComplete: () => { this.player.alpha = 1; this.hurt = false; } });
  }
  setupInput() {
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,SPACE,X,A,D,W,K,J');
    this.touch = { left: false, right: false, jump: false, spin: false };
    this.input.addPointer(3);
    const btn = (x, y, label, key, r = 46) => {
      const c = this.add.circle(x, y, r, 0x000000, .35).setScrollFactor(0).setDepth(20).setStrokeStyle(3, 0xffffff, .6).setInteractive();
      this.add.text(x, y, label, { font: 'bold 22px sans-serif', color: '#fff' }).setOrigin(.5).setScrollFactor(0).setDepth(21);
      c.on('pointerdown', () => { this.touch[key] = true; c.setFillStyle(0xffffff, .35); });
      const up = () => { this.touch[key] = false; c.setFillStyle(0x000000, .35); };
      c.on('pointerup', up); c.on('pointerout', up);
    };
    btn(70, H - 80, '←', 'left'); btn(180, H - 80, '→', 'right');
    btn(W - 190, H - 80, 'Skok', 'jump'); btn(W - 75, H - 140, 'Otočka', 'spin', 50);
  }
  update(t) {
    if (this.done) return;
    const p = this.player, k = this.keys, T = this.touch;
    const left = k.LEFT.isDown || k.A.isDown || T.left, right = k.RIGHT.isDown || k.D.isDown || T.right;
    const jump = k.UP.isDown || k.SPACE.isDown || k.W.isDown || k.K.isDown || T.jump;
    const spin = k.X.isDown || k.J.isDown || T.spin;
    const onGround = p.body.blocked.down || p.body.touching.down;
    if (left) { p.setVelocityX(-280); p.setFlipX(true); } else if (right) { p.setVelocityX(280); p.setFlipX(false); } else p.setVelocityX(0);
    if (jump && onGround && !this.jumpHeld) p.setVelocityY(-680);
    this.jumpHeld = jump;
    if (spin && !this.spinning && !this.spinCd) {
      this.spinning = true; this.spinCd = true;
      this.time.delayedCall(450, () => this.spinning = false); this.time.delayedCall(700, () => this.spinCd = false);
    }
    if (this.spinning) { p.setTexture('guruSpin'); p.angle += 40; this.cratesG.getChildren().forEach(c => { if (c.active && Math.abs(c.x - p.x) < 60 && Math.abs(c.y - p.y) < 50) this.breakCrate(c); }); }
    else { p.angle = 0; p.setTexture(!onGround ? 'guru1' : (p.body.velocity.x !== 0 ? (Math.floor(t / 120) % 2 ? 'guru1' : 'guru2') : 'guru0')); }
    if (onGround && !this.gaps.some(([gx, gw]) => p.x > gx - 80 && p.x < gx + gw + 80)) this.checkpoint = p.x;
    if (p.y > H + 60) this.hit(true);
    this.pigeons.getChildren().forEach(pg => { if (!pg.body.enable) return; if (Math.abs(pg.x - pg.home) > 120) pg.dir *= -1; pg.setVelocityX(60 * pg.dir); pg.setFlipX(pg.dir > 0); });
    this.shieldFx.setVisible(this.shield).setPosition(p.x, p.y);
    const s = Math.floor((this.time.now - this.startTime) / 1000);
    this.hud.setText(`❤ ${this.lives}   🦴 ${this.bones}   📦 ${this.crates}/${this.totalCrates}   ⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}${this.shield ? '   🛡' : ''}`);
  }
  finish() { if (this.done) return; this.done = true; this.physics.pause(); this.showEnd(true); }
  showEnd(won) {
    const s = Math.floor((this.time.now - this.startTime) / 1000);
    const pct = (this.bones / Math.max(1, this.totalBones + this.totalCrates * 5)) * 100;
    const paws = won ? (pct >= 75 && this.crates === this.totalCrates ? 3 : pct >= 45 ? 2 : 1) : 0;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, .7).setScrollFactor(0).setDepth(30);
    const tx = (y, t, f) => this.add.text(W / 2, y, t, { font: f, color: '#fff', align: 'center' }).setOrigin(.5).setScrollFactor(0).setDepth(31);
    tx(90, won ? 'CÍL! Guru doběhl domů 🏠' : 'KONEC HRY', 'bold 42px sans-serif');
    ['pawB', 'pawS', 'pawG'].forEach((k, i) => this.add.image(W / 2 - 110 + i * 110, 200, i < paws ? k : 'pawX').setScrollFactor(0).setDepth(31));
    tx(260, ['', 'Bronzová tlapka', 'Stříbrná tlapka', 'Zlatá tlapka'][paws], 'bold 24px sans-serif');
    tx(330, `Kostičky: ${this.bones}   Bedny: ${this.crates}/${this.totalCrates}   Čas: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, '22px sans-serif');
    const r = tx(420, '↻ Hrát znovu (ťukni / ENTER)', 'bold 26px sans-serif').setColor('#7fe07f');
    this.time.delayedCall(600, () => { this.input.once('pointerdown', () => this.scene.restart()); this.input.keyboard.once('keydown-ENTER', () => this.scene.restart()); });
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#1b2a3a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  input: { activePointers: 4 }, scene: [Title, Game]
});
