import * as THREE from 'three';
import { PORT_DEFS, RING, landingFor, isLand } from './geo.js';
import { makeDinghy, makePerson } from './boat.js';
import { dirOf, rad, wrap360 } from './sim.js';

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lam = (c, e = {}) => new THREE.MeshLambertMaterial({ color: c, ...e });

function trashMesh(kind) {
  const g = new THREE.Group();
  if (kind === 0) {            // 寶特瓶
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.85, 10), lam('#bfe3ff', { transparent: true, opacity: 0.85 })); b.rotation.z = Math.PI / 2; g.add(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8), lam('#ff7a2a')); c.rotation.z = Math.PI / 2; c.position.x = 0.46; g.add(c);
  } else if (kind === 1) {     // 塑膠袋
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), lam('#f4f4f4', { transparent: true, opacity: 0.9 })); b.scale.set(1, 0.3, 0.8); g.add(b);
  } else if (kind === 2) {     // 漁網
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 14), lam('#3f9a58')); t.rotation.x = Math.PI / 2; g.add(t);
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 6, 12), lam('#2f7a46')); t2.rotation.x = Math.PI / 2; t2.position.set(0.12, 0.02, 0.1); g.add(t2);
  } else {                     // 鐵罐 / 保麗龍
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), lam('#f6efe2')); g.add(b);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 10), lam('#c9ccd2')); r.position.set(0.1, 0.25, 0); g.add(r);
  }
  g.scale.setScalar(1.7);
  return g;
}

function heap(rand) {
  const g = new THREE.Group();
  const cols = ['#6fb4ff', '#ff8a3d', '#2b2f38', '#3f9a58', '#3f9a58', '#2f7a46'];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4 + rand() * 0.6, 0.25 + rand() * 0.4, 0.4 + rand() * 0.5), lam(cols[Math.floor(rand() * cols.length)]));
    m.position.set((rand() - 0.5) * 1.3, 0.2 + rand() * 0.35, (rand() - 0.5) * 1.3); m.rotation.set(rand(), rand() * 3, rand());
    g.add(m);
  }
  const net = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 6, 12), lam('#3f9a58')); net.rotation.x = Math.PI / 2; net.position.y = 0.15; g.add(net);
  return g;
}

export class Cleanup {
  constructor(scene, onEvent) {
    this.scene = scene; this.on = onEvent || (() => {});
    const rand = rng(20261017);
    // ----- 海上漂浮垃圾 -----
    this.floating = [];
    const spots = [];
    PORT_DEFS.forEach((P, i) => { for (let k = 0; k < 5; k++) spots.push([P.x, P.z, 16 + rand() * 38]); });
    RING.forEach((R) => { for (let k = 0; k < 2; k++) spots.push([R[0], R[1], 4 + rand() * 22]); });
    for (const [cx, cz, rr] of spots) {
      for (let tries = 0; tries < 12; tries++) {
        const a = rand() * Math.PI * 2, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        if (isLand(x, z, 6)) continue;
        const rk = rand(), kind = rk < 0.34 ? 0 : rk < 0.58 ? 1 : rk < 0.97 ? 2 : 3, mesh = trashMesh(kind);
        mesh.position.set(x, 0.1, z); mesh.rotation.y = rand() * 6.28;
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 24), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; mesh.add(ring); ring.scale.setScalar(1 / 1.7);
        scene.add(mesh);
        this.floating.push({ mesh, ring, x, z, kind, got: false, t: -1, ph: rand() * 6 });
        break;
      }
    }
    // ----- 岸邊垃圾堆與碼頭 -----
    this.beaches = PORT_DEFS.map((P) => {
      const L = landingFor(P);
      const piles = L.piles.map(([x, z]) => { const h = heap(rand); h.position.set(x, 0.3, z); scene.add(h); return { mesh: h, x, z, done: false }; });
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 3.4), lam('#a8794e'));
      pier.position.set(L.shore[0] - L.dir[0] * 1.2, 0.2, L.shore[1] - L.dir[1] * 1.2);
      pier.rotation.y = Math.atan2(L.dir[0], L.dir[1]); scene.add(pier);
      const mk = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 8), new THREE.MeshBasicMaterial({ color: '#ff8a3d', fog: false }));
      mk.rotation.x = Math.PI; mk.position.set(L.piles[1][0], 6.2, L.piles[1][1]); scene.add(mk);
      return { L, piles, marker: mk, cleaned: false };
    });
    this.total = this.floating.length + this.beaches.length * 3;
    this.count = 0; this.kg = 0;
    // ----- 小艇與小人 -----
    this.dinghy = makeDinghy(); this.dinghy.scale.setScalar(2.1); this.dinghy.visible = false; scene.add(this.dinghy);
    this.cargo = [0, 1, 2].map((k) => { const h = heap(rand); h.scale.setScalar(0.17); h.position.set((k - 1) * 0.1, 0.2 + (k === 1 ? 0.08 : 0), -0.2 + k * 0.2); h.visible = false; this.dinghy.add(h); return h; });
    this.person = makePerson(); this.person.scale.setScalar(2.7); this.person.visible = false; scene.add(this.person);
    this.run = null;
    this.focus = null;
  }

  // 離哪個岸邊登陸點最近(且尚未清理),距離 maxD 內才回傳索引
  nearestLanding(boat, maxD = 30) {
    let best = -1, bd = maxD;
    this.beaches.forEach((b, i) => {
      if (b.cleaned) return;
      const d = Math.hypot(b.L.shore[0] - boat.x, b.L.shore[1] - boat.z);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  start(i, boat, model) {
    if (this.run || i < 0) return false;
    const B = this.beaches[i];
    const [fx, fz] = dirOf(boat.heading);
    const sx = boat.x - fx * 2.6, sz = boat.z - fz * 2.6;
    const shore = [B.L.shore[0] - B.L.dir[0] * 1.4, B.L.shore[1] - B.L.dir[1] * 1.4];
    const steps = [
      { type: 'dinghy', to: shore },
      { type: 'wait', t: 0.5 },
      { type: 'land' },
    ];
    B.piles.forEach((p, k) => { steps.push({ type: 'walk', to: [p.x - B.L.dir[0] * 0.8, p.z - B.L.dir[1] * 0.8] }); steps.push({ type: 'pick', k }); steps.push({ type: 'walk', to: [B.L.shore[0], B.L.shore[1]] }); steps.push({ type: 'drop', k }); });
    steps.push({ type: 'board' }, { type: 'dinghy', to: [sx, sz] }, { type: 'finish' });
    this.run = { i, B, steps, s: 0, t: 0, boat, model, pos: [sx, sz], riding: true, picked: 0 };
    this.dinghy.position.set(sx, 0.12, sz); this.dinghy.visible = true; this.cargo.forEach((c) => (c.visible = false));
    this.person.visible = true; this.person.userData.bag.visible = false;
    model.dinghy.visible = false;
    this.on('start', i);
    return true;
  }

  update(dt, time, boat, surf = () => 0) {
    // 漂浮垃圾:浮動、被撈起動畫
    for (const f of this.floating) {
      if (f.got) {
        if (f.t >= 0) { f.t += dt; const k = f.t / 0.6; f.mesh.scale.setScalar(1.7 * (1 + k * 0.5) * Math.max(0, 1 - k)); f.mesh.position.y += dt * 3; if (k >= 1) { f.mesh.visible = false; f.t = -2; } }
        continue;
      }
      f.mesh.position.y = 0.2 + surf(f.x, f.z) + Math.sin(time * 1.4 + f.ph) * 0.05;
      f.mesh.rotation.z = Math.sin(time * 1.1 + f.ph) * 0.15;
      f.ring.material.opacity = 0.35 + 0.25 * Math.sin(time * 3 + f.ph);
      if (!boat.moored || true) {
        const d = Math.hypot(f.x - boat.x, f.z - boat.z);
        if (d < 3.6) { f.got = true; f.t = 0; f.ring.visible = false; this.count++; this.kg += 0.3; this.on('float', f.kind); }
      }
    }
    for (const b of this.beaches) { if (!b.cleaned) b.marker.position.y = 6.2 + Math.sin(time * 2.4) * 0.35; }
    this.focus = null;
    const r = this.run; if (!r) return;
    const st = r.steps[r.s];
    if (!st) { this.run = null; return; }
    this.focus = r.riding ? [(r.boat.x + r.B.L.shore[0]) / 2, (r.boat.z + r.B.L.shore[1]) / 2] : [this.person.position.x, this.person.position.z];
    const moveTo = (obj, to, speed, y) => {
      const dx = to[0] - obj.position.x, dz = to[1] - obj.position.z, d = Math.hypot(dx, dz);
      if (d < 0.08) return true;
      const m = Math.min(d, speed * dt);
      obj.position.x += (dx / d) * m; obj.position.z += (dz / d) * m; obj.position.y = y;
      obj.rotation.y = Math.atan2(-dx, -dz) + (obj === this.dinghy ? 0 : Math.PI);
      return d - m < 0.08;
    };
    const P = this.person;
    if (st.type === 'dinghy') {
      // 繞開燈塔礁岩(半徑約 5.2,小艇留 2 的餘裕)
      const D = this.dinghy.position, C = PORT_DEFS[r.i], R = 7.4;
      let wp = st.to, direct = true;
      const vx = st.to[0] - D.x, vz = st.to[1] - D.z, vl = Math.hypot(vx, vz) || 1;
      const tt = Math.max(0, Math.min(1, ((C.x - D.x) * vx + (C.z - D.z) * vz) / (vl * vl)));
      const px = D.x + vx * tt - C.x, pz = D.z + vz * tt - C.z, pd = Math.hypot(px, pz);
      if (pd < R && Math.hypot(st.to[0] - C.x, st.to[1] - C.z) > R) {
        let nx = px, nz = pz; if (pd < 0.4) { nx = -vz / vl; nz = vx / vl; } else { nx /= pd; nz /= pd; }
        wp = [C.x + nx * R * 1.18, C.z + nz * R * 1.18]; direct = false;
      }
      const reached = moveTo(this.dinghy, wp, 6.5, 0.14 + surf(D.x, D.z) + Math.sin(time * 4) * 0.02);
      const dc = Math.hypot(D.x - C.x, D.z - C.z);
      if (dc < 6.4 && dc > 0.01) { D.x = C.x + (D.x - C.x) / dc * 6.4; D.z = C.z + (D.z - C.z) / dc * 6.4; }
      const done = direct && reached;
      if (r.riding) { P.position.set(this.dinghy.position.x, this.dinghy.position.y + 0.2, this.dinghy.position.z); P.rotation.y = this.dinghy.rotation.y; }
      if (done) { r.s++; r.t = 0; }
    } else if (st.type === 'wait') { r.t += dt; if (r.t > st.t) { r.s++; r.t = 0; } }
    else if (st.type === 'land') { r.riding = false; P.position.set(r.B.L.shore[0], 0.34, r.B.L.shore[1]); r.s++; }
    else if (st.type === 'walk') {
      const done = moveTo(P, st.to, 6.0, 0.34 + Math.abs(Math.sin(time * 9)) * 0.12);
      if (done) { r.s++; r.t = 0; }
    } else if (st.type === 'pick') {
      r.t += dt;
      const pile = r.B.piles[st.k];
      P.userData.body.rotation.x = Math.sin(r.t * 8) * 0.5;
      pile.mesh.scale.setScalar(Math.max(0.001, 1 - r.t / 1.3));
      if (r.t > 1.3) {
        pile.mesh.visible = false; pile.done = true; P.userData.body.rotation.x = 0; P.userData.bag.visible = true;
        this.count++; this.kg += 2.4; r.picked++; this.on('pile', r.picked);
        r.s++; r.t = 0;
      }
    } else if (st.type === 'drop') {
      r.t += dt; P.userData.body.rotation.x = Math.sin(r.t * 8) * 0.4;
      if (r.t > 0.6) { P.userData.body.rotation.x = 0; P.userData.bag.visible = false; this.cargo[st.k].visible = true; r.s++; r.t = 0; }
    } else if (st.type === 'board') {
      r.t += dt; if (r.t > 0.5) { r.riding = true; P.userData.bag.visible = false; r.s++; r.t = 0; }
    } else if (st.type === 'finish') {
      r.t += dt;
      if (r.t > 0.4) {
        this.dinghy.visible = false; this.cargo.forEach((c) => (c.visible = false)); P.visible = false; r.model.dinghy.visible = true;
        r.B.cleaned = true; r.B.marker.visible = false; this.on('done', r.i);
        this.run = null;
      }
    }
  }
}
