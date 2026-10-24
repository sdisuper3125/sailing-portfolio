import * as THREE from 'three';
import { dirOf } from './sim.js';
import { isLand } from './geo.js';

function makeDolphin() {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhongMaterial({ color: '#7f97ad', shininess: 80, specular: '#ffd6c0' });
  const belly = new THREE.MeshPhongMaterial({ color: '#eef3f6', shininess: 40 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), skin); body.scale.set(0.55, 0.52, 2.0); g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 8), belly); bel.scale.set(0.5, 0.42, 1.9); bel.position.y = -0.1; g.add(bel);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), skin); beak.rotation.x = -Math.PI / 2; beak.position.set(0, -0.04, -1.15); g.add(beak);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), skin); fin.position.set(0, 0.42, 0.05); fin.rotation.x = 0.4; g.add(fin);
  const tail = new THREE.Group(); tail.position.z = 1.0;
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), skin); f.position.x = sx * 0.22; f.rotation.y = sx * 0.4; tail.add(f); }
  g.add(tail); g.userData.tail = tail;
  g.scale.setScalar(1.15);
  return g;
}

export class Dolphins {
  constructor(scene, onSpawn) {
    this.scene = scene; this.on = onSpawn || (() => {});
    this.pod = null; this.timer = 38 + Math.random() * 22; this.sightings = 0;
  }
  spawn(boat) {
    for (let tries = 0; tries < 8; tries++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const [dx, dz] = dirOf(boat.heading + side * (50 + Math.random() * 30));
      const cx = boat.x + dx * (24 + Math.random() * 10), cz = boat.z + dz * (24 + Math.random() * 10);
      if (isLand(cx, cz, 8)) continue;
      const heading = boat.heading + side * 12;
      const members = [0, 1, 2].map((k) => { const m = makeDolphin(); this.scene.add(m); return { m, off: (k - 1) * 3.2, back: k * 2.5, ph: Math.random() * 3 + k * 0.9 }; });
      this.pod = { cx, cz, heading, t: 0, life: 15, members };
      this.sightings++; this.on(this.sightings);
      return true;
    }
    return false;
  }
  update(dt, boat, playing) {
    if (!this.pod) {
      if (playing) { this.timer -= dt; if (this.timer <= 0) { if (this.spawn(boat)) this.timer = 150 + Math.random() * 120; else this.timer = 8; } }
      return;
    }
    const p = this.pod; p.t += dt;
    const [fx, fz] = dirOf(p.heading), rx = fz, rz = -fx;
    const sp = 8 + boat.speed * 0.8;
    p.cx += fx * sp * dt; p.cz += fz * sp * dt;
    for (const d of p.members) {
      const x = p.cx + rx * d.off - fx * d.back, z = p.cz + rz * d.off - fz * d.back;
      const w = p.t * 2.6 + d.ph, s = Math.sin(w);
      const y = s > 0 ? Math.pow(s, 0.8) * 1.9 - 0.15 : -1.2;
      const vy = Math.cos(w) * 2.6 * 1.9;
      d.m.position.set(x, y, z);
      d.m.rotation.set(0, Math.atan2(-fx, -fz), 0);
      d.m.rotateX(Math.atan2(vy, sp) * (s > 0 ? 0.9 : 0.2));
      d.m.userData.tail.rotation.x = Math.sin(p.t * 9 + d.ph) * 0.35;
      d.m.visible = true;
    }
    if (p.t > p.life) { for (const d of p.members) this.scene.remove(d.m); this.pod = null; }
  }
}
