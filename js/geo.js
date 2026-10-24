// 地理資料與投影。1 單位 = 1 公里,x 向東,z 向南(北方為 -z)。
export const KX = 102;
export const KZ = 111;
export const project = (lon, lat) => [(lon - 121) * KX, -(lat - 23.5) * KZ];

// 台灣本島簡化海岸線 [經度, 緯度],由基隆順時針(沿東岸往南、西岸往北)
const TAIWAN_LL = [
  [121.74, 25.15], [121.94, 25.02], [122.0, 25.0], [121.9, 24.86], [121.88, 24.6],
  [121.84, 24.45], [121.77, 24.31], [121.68, 24.15], [121.62, 23.98], [121.55, 23.82],
  [121.52, 23.6], [121.45, 23.35], [121.38, 23.1], [121.3, 22.97], [121.2, 22.75],
  [121.0, 22.55], [120.9, 22.35], [120.88, 22.2], [120.85, 21.9], [120.75, 22.0],
  [120.7, 22.08], [120.65, 22.25], [120.6, 22.36], [120.52, 22.46], [120.45, 22.47],
  [120.4, 22.5], [120.27, 22.58], [120.2, 22.82], [120.14, 23.0], [120.1, 23.18],
  [120.12, 23.38], [120.14, 23.68], [120.18, 23.8], [120.32, 23.93], [120.41, 24.05],
  [120.5, 24.27], [120.6, 24.42], [120.68, 24.5], [120.88, 24.7], [120.92, 24.85],
  [121.05, 25.03], [121.15, 25.1], [121.28, 25.15], [121.4, 25.18], [121.5, 25.28],
  [121.57, 25.29], [121.64, 25.25], [121.7, 25.19],
];

// 中央山脈脊線 [經度, 緯度, 高度]
const RIDGE_LL = [
  [121.45, 24.75, 4.5], [121.3, 24.35, 8], [121.2, 24.05, 10.5], [121.05, 23.6, 11],
  [120.98, 23.2, 9.5], [120.92, 22.8, 8], [120.88, 22.4, 5.5], [120.85, 22.1, 2.5],
];

function smoothClosed(pts, sub = 4) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < sub; s++) {
      const t = s / sub, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => hash(a * 57 + b * 131);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return h(xi, yi) * (1 - u) * (1 - v) + h(xi + 1, yi) * u * (1 - v) + h(xi, yi + 1) * (1 - u) * v + h(xi + 1, yi + 1) * u * v;
}
export function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15; }

function blob(cx, cz, rx, rz, seed, n = 26) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + 0.36 * vnoise(Math.cos(a) * 1.7 + seed, Math.sin(a) * 1.7 + seed * 2);
    pts.push([cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]);
  }
  return pts;
}

function bboxOf(poly) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const [x, z] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
}

const mk = (id, poly, peak) => ({ id, poly, peak, bbox: bboxOf(poly) });

const taiwanPoly = smoothClosed(TAIWAN_LL.map(([lo, la]) => project(lo, la)), 4);
const isl = (lon, lat, rx, rz, seed, peak, id) => {
  const [cx, cz] = project(lon, lat);
  return mk(id, blob(cx, cz, rx, rz, seed), peak);
};

export const LANDS = [
  mk('taiwan', taiwanPoly, 1),
  isl(119.58, 23.57, 13, 8, 1.3, 0.7, 'penghu1'),
  isl(119.6, 23.67, 5, 4, 2.2, 0.6, 'penghu2'),
  isl(119.5, 23.6, 5, 5, 3.1, 0.6, 'penghu3'),
  isl(119.5, 23.37, 5, 4, 4.4, 0.6, 'penghu4'),
  isl(119.43, 23.21, 3.5, 3, 5.5, 0.5, 'penghu5'),
  isl(121.49, 22.66, 6, 6, 6.6, 3.2, 'green'),
  isl(121.55, 22.05, 7.5, 9, 7.7, 4.6, 'lanyu'),
  isl(120.37, 22.34, 4, 4, 8.8, 1.2, 'xiaoliuqiu'),
];

export const RIDGE = RIDGE_LL.map(([lo, la, h]) => [...project(lo, la), h]);

export function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

export function distEdge(poly, x, z) {
  let best = 1e9;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j], [bx, bz] = poly[i];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) best = d;
  }
  return best;
}

export function isLand(x, z, margin = 0) {
  for (const L of LANDS) {
    const b = L.bbox;
    if (x < b.x0 - margin || x > b.x1 + margin || z < b.z0 - margin || z > b.z1 + margin) continue;
    if (inside(L.poly, x, z)) return true;
    if (margin > 0 && distEdge(L.poly, x, z) < margin) return true;
  }
  return false;
}

// 山脈高度(公里,已含誇張)
export function mountainHeight(x, z) {
  let best = 0;
  for (let i = 0; i < RIDGE.length - 1; i++) {
    const [ax, az, ah] = RIDGE[i], [bx, bz, bh] = RIDGE[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    const peak = ah + (bh - ah) * t;
    const h = peak * Math.exp(-Math.pow(d / 21, 2));
    if (h > best) best = h;
  }
  return best;
}

// 港口(dock 為海上停靠點)
const P = (lon, lat) => project(lon, lat);
export const PORT_DEFS = [
  { id: 'keelung', lon: 121.78, lat: 25.2 },
  { id: 'hualien', lon: 121.7, lat: 23.98 },
  { id: 'kaohsiung', lon: 120.2, lat: 22.6 },
  { id: 'taitung', lon: 121.3, lat: 22.78 },
  { id: 'penghu', lon: 119.76, lat: 23.56 },
  { id: 'tamsui', lon: 121.33, lat: 25.22 },
  { id: 'wuqi', lon: 120.42, lat: 24.27 },
].map((p) => { const [x, z] = P(p.lon, p.lat); return { ...p, x, z }; });

// 離岸航道節點(供自動航行繞島)
export const RING = [
  [122.15, 25.15], [122.0, 24.5], [121.85, 23.6], [121.55, 23.05], [121.05, 22.3],
  [120.85, 21.75], [120.55, 21.95], [120.25, 22.3], [119.97, 23.0], [119.97, 23.5],
  [120.02, 24.0], [120.5, 24.78], [121.0, 25.25], [121.6, 25.45],
].map(([lo, la]) => P(lo, la));

// 離 (x,z) 最近的海岸點 [px, pz, 距離]
export function nearestOnCoast(x, z) {
  let best = [0, 0, 1e9];
  for (const L of LANDS) {
    const poly = L.poly;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, az] = poly[j], [bx, bz] = poly[i];
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      const px = ax + dx * t, pz = az + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < best[2]) best = [px, pz, d];
    }
  }
  return best;
}

// 各港口的上岸點(海岸邊)與岸上三堆垃圾位置
export function landingFor(p) {
  const [cx, cz, d] = nearestOnCoast(p.x, p.z);
  const ux = (cx - p.x) / (d || 1), uz = (cz - p.z) / (d || 1);   // 由海指向岸
  const tx = -uz, tz = ux;                                         // 沿岸切線
  const place = (k0, j) => {
    for (const sc of [1, 0.6, 0.3, 0]) {
      const k = k0 * sc;
      for (let m = 0.8; m < 6; m += 0.3) {
        const px = cx + ux * m + tx * k, pz = cz + uz * m + tz * k;
        if (isLand(px, pz, 0)) return [px, pz];
      }
    }
    return [cx + ux * (1 + j * 0.9), cz + uz * (1 + j * 0.9)];
  };
  const piles = [-13, 4, 15].map((k, j) => place(k, j));
  return { shore: [cx - ux * 0.3, cz - uz * 0.3], dir: [ux, uz], piles };
}

// 燈塔礁岩半徑約 5,碼頭離岸至少 14,避免礁岩壓進陸地
for (const p of PORT_DEFS) { const [cx, cz, d] = nearestOnCoast(p.x, p.z); if (d < 14 && d > 0.01) { const k = (14 - d) / d; p.x += (p.x - cx) * k; p.z += (p.z - cz) * k; } }
