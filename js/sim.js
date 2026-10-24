// 純邏輯:風、帆船物理、自動航行與航道規劃(不依賴 three.js,可在 Node 測試)
import { PORT_DEFS, RING, isLand } from './geo.js';

export const COAST_MARGIN = 1.7; // 離陸地一格以內過不去

export const rad = Math.PI / 180;
export const wrap180 = (a) => { a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a; };
export const wrap360 = (a) => ((a % 360) + 360) % 360;
export const dirOf = (deg) => [Math.sin(deg * rad), -Math.cos(deg * rad)];

export const KN_TO_UNITS = 1.45; // 1 節 = 幾單位/秒(誇張的遊戲尺度)
export const ARRIVE_R = 11;

const POLAR = [[0, 0], [30, 0.04], [40, 0.42], [50, 0.78], [60, 0.92], [75, 1.0], [90, 1.04], [110, 1.08], [130, 1.0], [150, 0.88], [170, 0.74], [180, 0.7]];
export function polar(twa) {
  twa = Math.abs(wrap180(twa));
  for (let i = 1; i < POLAR.length; i++) {
    if (twa <= POLAR[i][0]) {
      const [a0, f0] = POLAR[i - 1], [a1, f1] = POLAR[i];
      return f0 + ((twa - a0) / (a1 - a0)) * (f1 - f0);
    }
  }
  return 0.7;
}

export class Wind {
  constructor() { this.t = 0; this.base = 40; this.baseTarget = 40; this.from = 40; this.kn = 12; this.update(0); }
  setBase(deg) { this.baseTarget = deg; }
  update(dt) {
    this.t += dt;
    this.base = wrap360(this.base + wrap180(this.baseTarget - this.base) * Math.min(1, dt * 0.8));
    this.from = wrap360(this.base + 24 * Math.sin((this.t * 2 * Math.PI) / 110) + 9 * Math.sin((this.t * 2 * Math.PI) / 37 + 1.3));
    this.kn = 12.5 + 2.5 * Math.sin((this.t * 2 * Math.PI) / 53 + 0.6) + 1.2 * Math.sin((this.t * 2 * Math.PI) / 17);
  }
}

export class Boat {
  constructor(x, z, heading) {
    Object.assign(this, { x, z, heading, turnRate: 0, speed: 0, heel: 0, awa: 40, aws: 10, twa: 90, blocked: false, moored: false, side: 1, motor: 0, spin: false, spinWarn: false });
  }
  update(dt, steer, wind, timeScale = 1) {
    // 轉向
    const maxRate = 46 * (0.35 + 0.65 * Math.min(1, this.speed / 4));
    this.turnRate += (steer * maxRate - this.turnRate) * Math.min(1, dt * 3);
    this.heading = wrap360(this.heading + this.turnRate * dt * timeScale * (this.moored ? 0.3 : 1));
    // 速度(極線圖)
    this.twa = wrap180(wind.from - this.heading);
    let f = polar(this.twa);
    this.spinWarn = false;
    if (this.spin) {
      const a = Math.abs(this.twa);
      if (a < 85) { f *= 0.8; this.spinWarn = true; }
      else if (a < 110) f *= 0.9 + 0.25 * ((a - 85) / 25);
      else f *= 1.15;
    }
    if (this.motor > 0) this.motor -= dt;
    let target = this.moored ? 0 : Math.max(wind.kn * 0.58 * f + 0.35, this.motor > 0 ? 4.5 : 0);
    this.speed += (target - this.speed) * Math.min(1, dt * (this.moored ? 3.2 : target < this.speed ? 0.9 : 0.55));
    // 位置
    const [dx, dz] = dirOf(this.heading);
    const v = this.speed * KN_TO_UNITS * dt * timeScale;
    let nx = this.x + dx * v, nz = this.z + dz * v;
    this.blocked = false;
    if (isLand(nx, nz, COAST_MARGIN)) {
      this.blocked = true;
      // 沿岸滑行:嘗試把航向偏轉,取偏轉最小且可通行的方向
      let moved = false;
      for (const off of [25, -25, 50, -50, 75, -75, 100, -100]) {
        const [sx, sz] = dirOf(this.heading + off);
        const cx = this.x + sx * v * 0.6, cz = this.z + sz * v * 0.6;
        if (!isLand(cx, cz, COAST_MARGIN)) { nx = cx; nz = cz; moved = true; break; }
      }
      if (!moved) { nx = this.x; nz = this.z; }
      this.speed *= 0.985;
    }
    // 燈塔礁岩禁入區
    for (const P of PORT_DEFS) {
      const ex = nx - P.x, ez = nz - P.z, ed = Math.hypot(ex, ez);
      if (ed < 8.0 && ed > 0.001) { nx = P.x + ex / ed * 8.0; nz = P.z + ez / ed * 8.0; this.speed *= 0.995; }
    }
    this.x = nx; this.z = nz;
    // 視風
    const wk = wind.kn;
    const wox = Math.sin(wind.from * rad) * wk, woz = -Math.cos(wind.from * rad) * wk;
    const ax = this.speed * dx + wox, az = this.speed * dz + woz;
    this.aws = Math.hypot(ax, az);
    this.awa = wrap180(Math.atan2(ax, -az) / rad - this.heading);
    if (Math.abs(this.awa) > 1) this.side = Math.sign(this.awa);
    // 傾斜
    const awr = Math.abs(this.awa) * rad;
    const heelT = Math.min(21, 0.085 * this.aws * this.aws * Math.sin(awr) * (this.speed > 0.8 ? 1 : 0.3));
    this.heel += (heelT - this.heel) * Math.min(1, dt * 1.5);
  }
}

// ---------- 航道規劃 ----------
function clear(a, b, margin) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.ceil(d / 1.5));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (isLand(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, margin)) return false;
  }
  return true;
}

let GRAPH = null;
function buildGraph() {
  const nodes = [...PORT_DEFS.map((p) => [p.x, p.z]), ...RING];
  const adj = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
      if (d < 260 && clear(nodes[i], nodes[j], 2.2)) { adj[i].push([j, d]); adj[j].push([i, d]); }
    }
  }
  return { nodes, adj };
}

export function planRoute(fx, fz, portIndex) {
  if (!GRAPH) GRAPH = buildGraph();
  const { nodes, adj } = GRAPH;
  const to = [PORT_DEFS[portIndex].x, PORT_DEFS[portIndex].z];
  const from = [fx, fz];
  if (clear(from, to, 1.2)) return [to];
  const n = nodes.length;
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  let any = false;
  for (let i = 0; i < n; i++) {
    if (clear(from, nodes[i], 1.2)) { dist[i] = Math.hypot(nodes[i][0] - fx, nodes[i][1] - fz); any = true; }
  }
  if (!any) return [to];
  for (;;) {
    let u = -1, best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0 || u === portIndex) break;
    done[u] = true;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  if (!isFinite(dist[portIndex])) return [to];
  const path = [];
  for (let c = portIndex; c >= 0; c = prev[c]) path.unshift(nodes[c]);
  return path;
}

function rayClear(x, z, deg, len, margin) {
  const [dx, dz] = dirOf(deg);
  for (let d = 3; d <= len; d += 3) if (isLand(x + dx * d, z + dz * d, margin)) return false;
  return true;
}
function avoid(boat, desired) {
  for (const off of [0, 12, -12, 25, -25, 40, -40, 60, -60, 85, -85]) {
    if (rayClear(boat.x, boat.z, desired + off, 15, COAST_MARGIN + 1.5)) return desired + off;
  }
  return desired;
}

export class Autopilot {
  constructor(route, start) {
    this.route = route; this.i = 0; this.leg0 = start.slice(); this.side = 0; this.lastTack = -99; this.t = 0;
    this.stuck = 0;
  }
  get target() { return this.route[this.i]; }
  update(boat, wind, dt) {
    this.t += dt;
    const wp = this.route[this.i];
    const last = this.i === this.route.length - 1;
    const dx = wp[0] - boat.x, dz = wp[1] - boat.z;
    const dist = Math.hypot(dx, dz);
    if (dist < (last ? ARRIVE_R : 12)) {
      if (last) return { done: true, steer: 0 };
      this.i++; this.leg0 = [boat.x, boat.z]; this.side = 0;
      return { steer: 0 };
    }
    const B = wrap360(Math.atan2(dx, -dz) / rad);
    if (boat.blocked) { this.stuck += dt; if (this.stuck > 1.2) { boat.motor = 6; this.stuck = 0; this.side *= -1; this.lastTack = this.t; } } else this.stuck = Math.max(0, this.stuck - dt * 0.5);
    const rel = wrap180(B - wind.from);
    const NOGO = 46;
    let desired = B;
    if (Math.abs(rel) < NOGO + 3 && !(boat.motor > 0)) {
      if (this.side === 0) this.side = wrap180(boat.heading - wind.from) >= 0 ? 1 : -1;
      const lx = wp[0] - this.leg0[0], lz = wp[1] - this.leg0[1];
      const ll = Math.hypot(lx, lz) || 1;
      const lateral = (lx * (boat.z - this.leg0[1]) - lz * (boat.x - this.leg0[0])) / ll;
      const h = dirOf(wind.from + this.side * NOGO);
      const crossH = (lx * h[1] - lz * h[0]) / ll;
      const maxLat = Math.min(32, 6 + ll * 0.13);
      if (this.t - this.lastTack > 6 && Math.sign(crossH) === Math.sign(lateral) && Math.abs(lateral) > maxLat) {
        this.side *= -1; this.lastTack = this.t;
      }
      // 靠近陸地時提前換舷
      const ah = dirOf(wind.from + this.side * NOGO);
      if (this.t - this.lastTack > 4 && isLand(boat.x + ah[0] * 16, boat.z + ah[1] * 16, COAST_MARGIN + 1.5)) { this.side *= -1; this.lastTack = this.t; }
      desired = wind.from + this.side * NOGO;
    } else this.side = 0;
    desired = avoid(boat, desired);
    const err = wrap180(desired - boat.heading);
    return { steer: Math.max(-1, Math.min(1, err / 16)) };
  }
}

// 快速抵達:在港口外海找一個起點,讓船約 3 秒後抵達港口
export function approachPoint(portIndex, windFrom, fromX, fromZ, dist = 46) {
  const P = PORT_DEFS[portIndex];
  const want = Math.atan2(fromX - P.x, -(fromZ - P.z)) / rad; // 從港口看向目前船位的方位
  let best = null, bestScore = -1e9;
  for (let a = 0; a < 360; a += 15) {
    const [dx, dz] = dirOf(a);
    const x = P.x + dx * dist, z = P.z + dz * dist;
    if (isLand(x, z, 7)) continue;
    if (!clear([P.x, P.z], [x, z], 3.5)) continue;
    const bearing = wrap360(a + 180); // 由接近點駛向港口的航向
    const rel = Math.abs(wrap180(bearing - windFrom));
    let score = -Math.abs(wrap180(a - want)) * 0.4;
    if (rel < 55) score -= 200;       // 避免最後一段正迎風
    if (rel > 100) score += 15;
    if (score > bestScore) { bestScore = score; best = [x, z, bearing]; }
  }
  if (!best) { const [dx, dz] = dirOf(want); best = [P.x + dx * 20, P.z + dz * 20, wrap360(want + 180)]; }
  return best;
}
