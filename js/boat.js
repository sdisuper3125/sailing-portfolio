import * as THREE from 'three';

// 船體尺寸(遊戲尺度,船長約 3.6 單位),前進方向為 -Z,右舷為 +X
export const BOAT_L = 3.6;
const L = BOAT_L, BMAX = 0.6;
const HULL = '#2a6a52';       // Solaris 墨綠
const ANTIFOUL = '#5a2327';
const CREAM = '#fff6ea';

function halfBeam(s) {
  if (s < 0.5) return BMAX * (1 - Math.pow(1 - s / 0.5, 2.0));
  if (s < 0.74) return BMAX;
  return BMAX * (1 - 0.26 * Math.pow((s - 0.74) / 0.26, 2));
}
const deckY = (s) => 0.34 + 0.14 * Math.pow(1 - s, 2.2) + 0.02 * s;
const keelY = (s) => -0.36 * (1 - Math.pow(Math.min(1, Math.abs(s - 0.45) / 0.62), 2.2));
const zOf = (s) => -L / 2 + s * L;

// ---------- 紋理 ----------
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const teakTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c99259'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    g.fillStyle = `hsl(28 ${42 + Math.random() * 10}% ${54 + Math.random() * 8}%)`; g.fillRect(0, y, w, 14);
    g.fillStyle = 'rgba(40,24,12,.55)'; g.fillRect(0, y + 14, w, 2);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(90,50,20,.14)'; g.fillRect(Math.random() * w, y + 2, 20 + Math.random() * 60, 1); }
    const off = (y / 16) % 2 ? 70 : 170;
    g.fillStyle = 'rgba(40,24,12,.45)'; g.fillRect(off, y, 2, 14);
  }
}, true);
const sailTex = (batten = true) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#fffaf2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(190,160,140,.5)'; g.lineWidth = 1.3;
  for (let i = 1; i < 9; i++) { const y = (i / 9) * h; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(w * 0.5, y + 8, w, y - 4); g.stroke(); }
  if (batten) { g.strokeStyle = 'rgba(120,90,80,.55)'; g.lineWidth = 2.2; for (let i = 1; i < 5; i++) { const y = (i / 5) * h; g.beginPath(); g.moveTo(w * 0.55, y); g.lineTo(w, y - 6); g.stroke(); } }
  g.fillStyle = 'rgba(255,111,91,.9)'; g.fillRect(0, h - 10, w, 10);
});

// ---------- 小工具 ----------
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const phong = (color, extra = {}) => new THREE.MeshPhongMaterial({ color, shininess: 70, specular: '#ffd6b0', ...extra });
function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof mat === 'string' ? lam(mat) : mat); m.position.set(x, y, z); return m; }
function cyl(r0, r1, h, mat, x, y, z, seg = 8) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), typeof mat === 'string' ? lam(mat) : mat); m.position.set(x, y, z); return m; }
function line(pts, color = '#f4e8d8', op = 0.85) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op })); }
function tube(pts, r, color) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.1), 24, r, 5, false), lam(color)); }

// ---------- 船殼 ----------
function makeHull() {
  const NS = 30, pos = [], col = [], idx = [];
  const cCream = new THREE.Color(CREAM), cHull = new THREE.Color(HULL), cAnti = new THREE.Color(ANTIFOUL);
  let NP = 0;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, b = halfBeam(s), yd = deckY(s), yk = keelY(s), z = zOf(s);
    const ys = [yd, yd - 0.04, yd - 0.047, 0.05, 0.043, -0.01, -0.017];
    for (let k = 1; k <= 6; k++) ys.push(-0.017 + (yk + 0.017) * (k / 6));
    NP = ys.length;
    for (let side = 0; side < 2; side++) for (const y of ys) {
      const t = Math.min(1, Math.max(0, (yd - y) / (yd - yk || 1)));
      const x = b * Math.pow(Math.cos(t * Math.PI / 2), 0.55) * (side ? -1 : 1);
      pos.push(x, y, z);
      const c = y > yd - 0.043 ? cCream : y > 0.047 ? cHull : y > -0.013 ? cCream : cAnti;
      col.push(c.r, c.g, c.b);
    }
  }
  const row = NP * 2;
  for (let i = 0; i < NS; i++) for (let side = 0; side < 2; side++) for (let p = 0; p < NP - 1; p++) {
    const a = i * row + side * NP + p, b = a + 1, c = a + row, d = c + 1;
    if (side === 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  // 船尾板(獨立頂點,全部用船殼色)
  const last = NS * row, base = pos.length / 3;
  for (let q = 0; q < row; q++) { pos.push(pos[(last + q) * 3], pos[(last + q) * 3 + 1], pos[(last + q) * 3 + 2]); col.push(cHull.r, cHull.g, cHull.b); }
  const center = pos.length / 3;
  pos.push(0, deckY(1) - 0.05, zOf(1)); col.push(cHull.r, cHull.g, cHull.b);
  for (let p = 0; p < NP - 1; p++) { idx.push(center, base + p, base + p + 1); idx.push(center, base + NP + p + 1, base + NP + p); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo, phong('#ffffff', { vertexColors: true, side: THREE.DoubleSide, emissive: '#0f2a22' }));
}

function makeDeck(tex) {
  const NS = 30, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, b = halfBeam(s) - 0.015, y = deckY(s) + 0.003, z = zOf(s);
    for (const [x, dy] of [[-b, 0], [0, 0.025], [b, 0]]) { pos.push(x, y + dy, z); uv.push(x * 1.3, z * 1.3); }
  }
  for (let i = 0; i < NS; i++) for (let k = 0; k < 2; k++) {
    const a = i * 3 + k, b = a + 1, c = a + 3, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
}

// ---------- 帆(網格) ----------
function gridMesh(N, mat) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((N + 1) * (N + 1) * 3), uv = new Float32Array((N + 1) * (N + 1) * 2), idx = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = (j * (N + 1) + i) * 2; uv[k] = i / N; uv[k + 1] = 1 - j / N; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.userData.N = N; return m;
}

// ---------- 小人與小艇(上岸清理用) ----------
export function makeDinghy() {
  const g = new THREE.Group();
  const tubeMat = lam('#ffcc3d');
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.78, 6, 10), tubeMat);
    t.rotation.x = Math.PI / 2; t.position.set(sx * 0.2, 0.1, 0); g.add(t);
  }
  const bow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), tubeMat); bow.scale.set(1.05, 0.65, 1); bow.position.set(0, 0.1, -0.52); g.add(bow);
  g.add(box(0.36, 0.02, 0.8, '#7a5a3a', 0, 0.05, 0));
  g.add(box(0.3, 0.03, 0.08, '#6a4a2a', 0, 0.16, 0.12));
  return g;
}
export function makePerson() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 4, 8), lam('#ff7a2a')); body.position.y = 0.2; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), lam('#f3c9a0')); head.position.y = 0.37; g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.045, 10), lam('#fff6ea')); hat.position.y = 0.43; g.add(hat);
  const legs = box(0.12, 0.1, 0.07, '#26425f', 0, 0.06, 0); g.add(legs);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lam('#22262e')); bag.position.set(0, 0.2, 0.1); bag.scale.set(1, 1.1, 0.9); bag.visible = false; g.add(bag);
  g.userData.bag = bag; g.userData.body = body;
  return g;
}

function makeAnchor() {
  const g = new THREE.Group();
  const iron = phong('#3b3f48', { shininess: 30 });
  g.add(cyl(0.012, 0.012, 0.3, iron, 0, 0.15, 0, 6));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 5, 10), iron); ring.position.y = 0.3; g.add(ring);
  const stock = cyl(0.008, 0.008, 0.2, iron, 0, 0.26, 0, 5); stock.rotation.z = Math.PI / 2; g.add(stock);
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), iron); f.position.set(sx * 0.08, 0.04, 0); f.rotation.z = sx * 1.1; g.add(f); }
  return g;
}

export class BoatModel {
  constructor() {
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.root.add(this.tilt);
    this.tilt.scale.setScalar(1.25);
    const t = this.tilt;
    const teak = teakTex();
    t.add(makeHull(), makeDeck(teak));

    // 龍骨與舵
    const keel = box(0.07, 0.55, 0.7, '#3a2528', 0, -0.6, zOf(0.5)); t.add(keel);
    const bulb = box(0.16, 0.12, 0.5, '#2a1a1d', 0, -0.9, zOf(0.5)); t.add(bulb);
    const rudder = box(0.04, 0.45, 0.22, '#3a2528', 0, -0.2, zOf(0.97)); t.add(rudder);

    // 舷緣護欄與欄杆
    const railMat = phong('#e8eef0', { shininess: 90 });
    const lifeline = (sx) => {
      const pts = [];
      for (let k = 0; k <= 8; k++) { const s = 0.1 + (0.86 * k) / 8; pts.push([sx * (halfBeam(s) - 0.05), deckY(s) + 0.2, zOf(s)]); }
      return tube(pts, 0.006, '#dfe6ea');
    };
    t.add(lifeline(1), lifeline(-1));
    for (const sx of [-1, 1]) for (let k = 0; k <= 8; k++) {
      const s = 0.1 + (0.86 * k) / 8;
      t.add(cyl(0.01, 0.012, 0.2, railMat, sx * (halfBeam(s) - 0.05), deckY(s) + 0.1, zOf(s), 6));
    }
    // 船頭欄(pulpit)與船尾欄(pushpit)
    t.add(tube([[-0.16, deckY(0.06) + 0.2, zOf(0.1)], [-0.07, deckY(0.02) + 0.22, zOf(0.04)], [0.07, deckY(0.02) + 0.22, zOf(0.04)], [0.16, deckY(0.06) + 0.2, zOf(0.1)]], 0.009, '#dfe6ea'));
    t.add(tube([[-0.36, deckY(0.96) + 0.2, zOf(0.93)], [-0.2, deckY(1) + 0.22, zOf(1)], [0.2, deckY(1) + 0.22, zOf(1)], [0.36, deckY(0.96) + 0.2, zOf(0.93)]], 0.009, '#dfe6ea'));
    // 航行燈
    t.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: '#ff4a4a' })).translateX(-0.17).translateY(deckY(0.1) + 0.2).translateZ(zOf(0.1)));
    t.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: '#4aff7a' })).translateX(0.17).translateY(deckY(0.1) + 0.2).translateZ(zOf(0.1)));

    // 艙頂(梯形平面擠出)與窗
    const cz0 = zOf(0.27), cz1 = zOf(0.64), y0 = deckY(0.45);
    const shp = new THREE.Shape([[-0.27, -cz0 - 0.18], [0.27, -cz0 - 0.18], [0.40, -cz1 + 0.05], [0.40, -cz1 - 0.05], [-0.40, -cz1 - 0.05], [-0.40, -cz1 + 0.05]].map(([x, y]) => new THREE.Vector2(x, y)));
    const cabin = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 2 }), phong(CREAM, { shininess: 50 }));
    cabin.rotation.x = -Math.PI / 2; cabin.position.y = y0; t.add(cabin);
    const glass = phong('#10263d', { shininess: 120, specular: '#ffe0c0' });
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const z = zOf(0.34 + k * 0.09);
      const w = box(0.012, 0.075, 0.2, glass, sx * 0.405, y0 + 0.13, z);
      w.rotation.y = sx * 0.04; t.add(w);
    }
    t.add(box(0.46, 0.08, 0.012, glass, 0, y0 + 0.13, cz0 + 0.04).rotateX(-0.2));
    t.add(box(0.28, 0.025, 0.28, '#eadfce', 0, y0 + 0.265, zOf(0.4)));            // 天窗
    t.add(box(0.2, 0.012, 0.2, glass, 0, y0 + 0.282, zOf(0.4)));
    t.add(box(0.1, 0.05, 0.06, '#fff0dc', 0.2, y0 + 0.26, zOf(0.55)));            // 通風口

    // 駕駛艙
    const cockpitZ = zOf(0.8);
    t.add(box(0.5, 0.012, 0.52, '#8c5f3a', 0, deckY(0.8) + 0.012, cockpitZ));
    for (const sx of [-1, 1]) {
      t.add(box(0.07, 0.1, 0.58, CREAM, sx * 0.31, deckY(0.8) + 0.07, cockpitZ));
      t.add(box(0.1, 0.03, 0.42, '#a77449', sx * 0.25, deckY(0.8) + 0.04, cockpitZ));
      t.add(cyl(0.026, 0.026, 0.035, phong('#cfd6dc'), sx * 0.31, deckY(0.8) + 0.14, zOf(0.7), 10));
    }
    t.add(box(0.7, 0.1, 0.07, CREAM, 0, deckY(0.8) + 0.07, zOf(0.96)));
    t.add(cyl(0.025, 0.04, 0.18, phong('#2d3338'), 0, deckY(0.8) + 0.1, zOf(0.86), 8));
    const wheel = new THREE.Group(); wheel.position.set(0, deckY(0.8) + 0.25, zOf(0.86)); wheel.rotation.x = -0.15;
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 20), lam('#3a2a22')));
    for (let k = 0; k < 3; k++) { const sp = cyl(0.004, 0.004, 0.2, lam('#cfd6dc'), 0, 0, 0, 4); sp.rotation.z = (k * Math.PI) / 3; wheel.add(sp); }
    t.add(wheel); this.wheel = wheel;

    // 桅桿、橫撐、支索
    this.mastZ = zOf(0.34); this.mastBase = deckY(0.34) + 0.02; this.mastH = 4.7;
    const mastMat = phong('#f1ebe0', { shininess: 90 });
    t.add(cyl(0.02, 0.032, this.mastH, mastMat, 0, this.mastBase + this.mastH / 2, this.mastZ, 10));
    const sprY = this.mastBase + this.mastH * 0.5;
    for (const sx of [-1, 1]) {
      const sp = box(0.5, 0.012, 0.03, mastMat, sx * 0.25, sprY, this.mastZ); sp.rotation.z = sx * 0.1; t.add(sp);
      t.add(line([[0, this.mastBase + this.mastH * 0.97, this.mastZ], [sx * 0.5, sprY, this.mastZ], [sx * (halfBeam(0.34) - 0.03), deckY(0.34) + 0.02, this.mastZ]], '#eadfce', 0.8));
      t.add(line([[sx * 0.5, sprY, this.mastZ], [sx * (halfBeam(0.34) - 0.03), deckY(0.3) + 0.02, this.mastZ - 0.25]], '#eadfce', 0.6));
    }
    const top = [0, this.mastBase + this.mastH, this.mastZ];
    t.add(line([[0, deckY(0.0) + 0.04, zOf(0.0)], top, [0, deckY(1) + 0.05, zOf(1)]]));
    const vane = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), new THREE.MeshBasicMaterial({ color: '#ff7a59' }));
    vane.position.set(0, this.mastBase + this.mastH + 0.14, this.mastZ); t.add(vane); this.vane = vane;
    t.add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' })).translateY(this.mastBase + this.mastH * 0.94).translateZ(this.mastZ + 0.04));

    // 帆桿
    this.boomY = this.mastBase + 0.8; this.boomLen = 1.8;
    this.boom = cyl(0.02, 0.02, this.boomLen, mastMat, 0, this.boomY, this.mastZ, 8); t.add(this.boom);
    t.add(box(0.05, 0.05, 0.05, '#cfd6dc', 0, this.boomY, this.mastZ));

    // 帆
    const mainMat = new THREE.MeshLambertMaterial({ map: sailTex(true), side: THREE.DoubleSide, emissive: '#fff0e2', emissiveIntensity: 0.6 });
    const jibMat = new THREE.MeshLambertMaterial({ map: sailTex(false), side: THREE.DoubleSide, emissive: '#fff0e2', emissiveIntensity: 0.6 });
    this.main = gridMesh(14, mainMat); t.add(this.main);
    this.jib = gridMesh(12, jibMat); t.add(this.jib);
    this.spinMesh = gridMesh(16, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: '#553020', emissiveIntensity: 0.35 }));
    // 球帆頂點色:放射狀彩色分片
    const sc = this.spinMesh.geometry, N = 16, colArr = new Float32Array((N + 1) * (N + 1) * 3);
    const pal = ['#ff6b4a', '#fff6ea', '#ff9ec0', '#fff6ea', '#2fb7a3', '#fff6ea'].map((c) => new THREE.Color(c));
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const c = pal[Math.min(pal.length - 1, Math.floor((i / N) * pal.length))]; const k = (j * (N + 1) + i) * 3; colArr[k] = c.r; colArr[k + 1] = c.g; colArr[k + 2] = c.b; }
    sc.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    this.spinMesh.visible = false; t.add(this.spinMesh);

    // 錨(船頭)與錨鏈
    this.anchor = makeAnchor(); this.anchor.scale.setScalar(1.3); t.add(this.anchor);
    this.chain = cyl(0.008, 0.008, 1, phong('#454a54', { shininess: 20 }), 0, 0, 0, 5); this.chain.visible = false; t.add(this.chain);
    t.add(box(0.1, 0.03, 0.26, '#cfd6dc', 0, deckY(0.0) + 0.1, zOf(0) - 0.05));       // 錨滾輪
    this.anchorT = 0;
    this.setAnchor(0);

    // 船尾吊掛小艇
    this.dinghy = makeDinghy(); this.dinghy.scale.setScalar(0.34);
    this.dinghy.position.set(0, deckY(1) + 0.3, zOf(1) + 0.12); t.add(this.dinghy);
  }

  // 錨:t = 0 收起,1 落下
  setAnchor(tt) {
    this.anchorT = tt;
    const stow = new THREE.Vector3(0, deckY(0.0) + 0.2, zOf(0) - 0.15);
    const down = new THREE.Vector3(0, -2.4, zOf(0) - 0.8);
    this.anchor.position.lerpVectors(stow, down, tt);
    this.anchor.rotation.x = tt > 0.02 ? 0 : 1.2;
    this.chain.visible = tt > 0.02;
    if (this.chain.visible) {
      const a = new THREE.Vector3(0, deckY(0.0) + 0.12, zOf(0) - 0.05), b = this.anchor.position.clone().add(new THREE.Vector3(0, 0.3, 0));
      const dir = b.clone().sub(a), len = dir.length();
      this.chain.scale.set(1, len, 1);
      this.chain.position.copy(a).addScaledVector(dir, 0.5);
      this.chain.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }
  }

  // 帆形:a = 帆與中線夾角(弧度,朝下風側),side = +1 風自右舷,flutter 0..1
  setSails(a, side, flutter, time, jibOn = 1) {
    const N = this.main.userData.N;
    const mP = this.main.geometry.attributes.position;
    const dir = new THREE.Vector3(-side * Math.sin(a), 0, Math.cos(a));
    const nrm = new THREE.Vector3(-side * Math.cos(a), 0, -Math.sin(a));
    const mastTop = this.mastBase + this.mastH * 0.97;
    const H = mastTop - this.boomY, Lb = this.boomLen;
    const belly = 0.36 * (1 - flutter * 0.9);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = i / N, v = j / N;                       // v=0 帆頂, v=1 帆底
      const h = 1 - v;
      const fl = flutter * Math.sin(time * 14 + u * 5 + h * 7) * 0.12 * (0.3 + u);
      const bulge = belly * Math.sin(Math.PI * u) * (1 - 0.35 * h) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, h * 1.1 + 0.05))) + fl;
      const reach = Lb * u * (1 - h * 0.9);
      const k = (j * (N + 1) + i) * 3;
      mP.array[k] = dir.x * reach + nrm.x * bulge;
      mP.array[k + 1] = this.boomY + h * H;
      mP.array[k + 2] = this.mastZ + dir.z * reach + nrm.z * bulge;
    }
    mP.needsUpdate = true; this.main.geometry.computeVertexNormals();
    this.boom.position.set(dir.x * Lb / 2, this.boomY, this.mastZ + dir.z * Lb / 2);
    this.boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

    this.jib.visible = jibOn > 0.02;
    if (!this.jib.visible) return;
    const jP = this.jib.geometry.attributes.position, NJ = this.jib.userData.N;
    const aj = Math.min(a * 0.92 + 0.02, 1.35);
    const jdir = new THREE.Vector3(-side * Math.sin(aj), 0, Math.cos(aj));
    const jn = new THREE.Vector3(-side * Math.cos(aj), 0, -Math.sin(aj));
    const tack = new THREE.Vector3(0, deckY(0.03) + 0.12, zOf(0.03));
    const head = new THREE.Vector3(0, this.mastBase + this.mastH * 0.9, this.mastZ + 0.02);
    const sheetLen = (this.mastZ - tack.z) * 0.98 + 0.3;
    const jb = 0.28 * (1 - flutter * 0.9);
    const clew = new THREE.Vector3(tack.x + jdir.x * sheetLen, tack.y + 0.03, tack.z + jdir.z * sheetLen);
    for (let j = 0; j <= NJ; j++) for (let i = 0; i <= NJ; i++) {
      const u = i / NJ, h = 1 - j / NJ;
      const fl = flutter * Math.sin(time * 15 + u * 6 + h * 5) * 0.12 * (0.3 + u);
      const bx = tack.x + (clew.x - tack.x) * u, by = tack.y + (clew.y - tack.y) * u, bz = tack.z + (clew.z - tack.z) * u;
      const px = bx + (head.x - bx) * h, py = by + (head.y - by) * h, pz = bz + (head.z - bz) * h;
      const bulge = jb * Math.sin(Math.PI * u) * (1 - 0.4 * h) + fl;
      const k = (j * (NJ + 1) + i) * 3;
      jP.array[k] = px + jn.x * bulge; jP.array[k + 1] = py; jP.array[k + 2] = pz + jn.z * bulge;
    }
    jP.needsUpdate = true; this.jib.geometry.computeVertexNormals();
  }

  // 球帆:hoist 0..1 升起程度,side = +1 風自右舷(帆朝下風側外張)
  setSpin(hoist, side, time) {
    this.spinMesh.visible = hoist > 0.02;
    if (!this.spinMesh.visible) return;
    const N = this.spinMesh.userData.N, P = this.spinMesh.geometry.attributes.position;
    const T = new THREE.Vector3(0, deckY(0) + 0.5, zOf(0) - 0.7);
    const Hd = new THREE.Vector3(0, this.mastBase + this.mastH * 0.97, this.mastZ - 0.1);
    const C = new THREE.Vector3(-side * 1.9, deckY(0.1) + 0.9, zOf(0.0) - 0.35);
    const Bv = new THREE.Vector3(-side * 0.25, 0.2, -1).normalize();
    const size = 1.15 * hoist;
    const hh = Math.pow(hoist, 0.7);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = i / N, v = j / N;          // v=0 帆頂
      const h = 1 - v;
      const foot = T.clone().lerp(C, u);
      const p = foot.lerp(Hd, h);
      const w = 4 * u * (1 - u) * Math.pow(Math.sin(Math.PI * Math.min(1, h * 0.92 + 0.04)), 0.7);
      const fl = Math.sin(time * 6 + u * 4 + h * 5) * 0.05 * (1.1 - hoist);
      p.addScaledVector(Bv, w * size + fl);
      p.y += w * 0.15 * size;
      // 從船頭向外長出
      p.sub(T).multiplyScalar(hh).add(T);
      const k = (j * (N + 1) + i) * 3;
      P.array[k] = p.x; P.array[k + 1] = p.y; P.array[k + 2] = p.z;
    }
    P.needsUpdate = true; this.spinMesh.geometry.computeVertexNormals();
  }

  setVane(awaRad) {
    this.vane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(awaRad), 0, -Math.cos(awaRad)));
  }
}
