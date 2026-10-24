import * as THREE from 'three';
import { dirOf } from './sim.js';

// ---------- 風的流線:頭亮尾暗、邊緣淡出,疊加發光 ----------
export class WindLines {
  constructor(scene, count) {
    this.n = count;
    this.p = Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 140, y: 0.5 + Math.random() * 11, z: (Math.random() - 0.5) * 140, l: 0.6 + Math.random() * 1.2, a: 0.4 + Math.random() * 0.6 }));
    this.pos = new Float32Array(count * 6);
    this.col = new Float32Array(count * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo = g;
    this.mesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  update(dt, wind, boat) {
    const [wx, wz] = dirOf(wind.from + 180);
    const sp = wind.kn * 0.3, S = 70;
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i];
      p.x += wx * sp * dt * (0.8 + p.a * 0.4); p.z += wz * sp * dt * (0.8 + p.a * 0.4);
      let rx = p.x - boat.x, rz = p.z - boat.z;
      if (rx > S) p.x -= 2 * S; else if (rx < -S) p.x += 2 * S;
      if (rz > S) p.z -= 2 * S; else if (rz < -S) p.z += 2 * S;
      rx = p.x - boat.x; rz = p.z - boat.z;
      const edge = 1 - Math.min(1, Math.max(Math.abs(rx), Math.abs(rz)) / S);
      const fade = Math.min(1, edge * 4) * p.a;
      const len = (1.6 + wind.kn * 0.2) * p.l;
      const k = i * 6;
      this.pos[k] = p.x; this.pos[k + 1] = p.y; this.pos[k + 2] = p.z;
      this.pos[k + 3] = p.x - wx * len; this.pos[k + 4] = p.y; this.pos[k + 5] = p.z - wz * len;
      // 頭(順風端)亮,尾暗
      this.col[k] = 1.0 * fade * 0.22; this.col[k + 1] = 0.9 * fade * 0.22; this.col[k + 2] = 0.8 * fade * 0.22;
      this.col[k + 3] = 0; this.col[k + 4] = 0; this.col[k + 5] = 0;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

// ---------- 船首浪花 ----------
const softTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(cv);
})();
export class Spray {
  constructor(scene, count = 90) {
    this.n = count;
    this.pos = new Float32Array(count * 3).fill(-9999);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.idx = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo = g;
    this.mesh = new THREE.Points(g, new THREE.PointsMaterial({ map: softTex, color: '#fff3ea', size: 0.3, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  emit(x, y, z, vx, vy, vz) {
    const i = this.idx++ % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = 0.9;
  }
  update(dt, boat, bowX, bowZ, rightX, rightZ) {
    if (boat.speed > 4.2 && !boat.moored) {
      const amount = 1;
      const [fx, fz] = dirOf(boat.heading);
      for (let k = 0; k < amount; k++) {
        if (Math.random() > 0.16) continue;
        const side = Math.random() < 0.5 ? -1 : 1;
        const sp = 1.3 + Math.random() * 1.4;
        this.emit(bowX, 0.25, bowZ, rightX * side * sp + fx * 1.2, 0.8 + Math.random() * 0.9, rightZ * side * sp + fz * 1.2);
      }
    }
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; continue; }
      this.life[i] -= dt;
      this.vel[i * 3 + 1] -= 7.5 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < 0) this.life[i] = 0;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
