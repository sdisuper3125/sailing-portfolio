import { LANDS, PORT_DEFS } from './geo.js';

// 小地圖與全景地圖:同一份繪圖程式,依畫布大小縮放
const X0 = -176, X1 = 128, Z0 = -222, Z1 = 204;   // 世界座標範圍(公里)

function makeBase(w, h, dpr) {
  const c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const s = Math.min(w / (X1 - X0), h / (Z1 - Z0));
  const ox = (w - (X1 - X0) * s) / 2, oz = (h - (Z1 - Z0) * s) / 2;
  const tx = (x) => ox + (x - X0) * s, tz = (z) => oz + (z - Z0) * s;
  const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, '#1d3f78'); sea.addColorStop(1, '#14305f');
  g.fillStyle = sea; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
  for (let x = -150; x < 130; x += 50) { g.beginPath(); g.moveTo(tx(x), 0); g.lineTo(tx(x), h); g.stroke(); }
  for (let z = -200; z < 210; z += 50) { g.beginPath(); g.moveTo(0, tz(z)); g.lineTo(w, tz(z)); g.stroke(); }
  for (const L of LANDS) {
    g.beginPath(); L.poly.forEach(([x, z], i) => (i ? g.lineTo(tx(x), tz(z)) : g.moveTo(tx(x), tz(z)))); g.closePath();
    g.fillStyle = L.id === 'taiwan' ? '#5f8a4f' : '#6f9a58'; g.fill();
    g.strokeStyle = 'rgba(255,236,200,.85)'; g.lineWidth = w > 200 ? 1.6 : 1; g.stroke();
  }
  return { c, tx, tz, s };
}

export class Minimap {
  constructor(mini, big, ports, getState, onPick) {
    this.mini = mini; this.big = big; this.ports = ports; this.get = getState; this.onPick = onPick;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.open = false; this.t = 0;
    this.layout();
    window.addEventListener('resize', () => this.layout());
    mini.addEventListener('click', () => this.toggle(true));
    big.addEventListener('click', (e) => {
      if (e.target.closest('.bm-port') || e.target.closest('.bm-info')) return;
      this.toggle(false);
    });
  }
  layout() {
    const m = this.mini.querySelector('canvas'), b = this.big.querySelector('canvas');
    const mw = 84, mh = Math.round(mw * (Z1 - Z0) / (X1 - X0) * 0.62 + 20);
    m.style.width = mw + 'px'; m.style.height = mh + 'px'; m.width = mw * this.dpr; m.height = mh * this.dpr;
    this.mw = mw; this.mh = mh; this.mb = makeBase(mw, mh, this.dpr);
    const bw = Math.min(window.innerWidth - 32, 440), bh = Math.min(window.innerHeight * 0.58, bw * (Z1 - Z0) / (X1 - X0));
    b.style.width = bw + 'px'; b.style.height = bh + 'px'; b.width = bw * this.dpr; b.height = bh * this.dpr;
    this.bw = bw; this.bh = bh; this.bb = makeBase(bw, bh, this.dpr);
    this.buildPortButtons();
  }
  buildPortButtons() {
    const wrap = this.big.querySelector('.bm-ports'); wrap.innerHTML = '';
    wrap.style.width = this.bw + 'px'; wrap.style.height = this.bh + 'px';
    PORT_DEFS.forEach((p, i) => {
      const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'bm-port';
      bt.style.left = this.bb.tx(p.x) + 'px'; bt.style.top = this.bb.tz(p.z) + 'px';
      bt.style.setProperty('--c', this.ports[i].color);
      bt.innerHTML = `<i>${this.ports[i].emoji}</i><span>${this.ports[i].name}</span>`;
      bt.onclick = (e) => { e.stopPropagation(); this.select(i); };
      wrap.appendChild(bt);
    });
  }
  select(i) {
    const P = this.ports[i], info = this.big.querySelector('#bmInfo');
    this.big.querySelectorAll('.bm-port').forEach((b, k) => b.classList.toggle('sel', k === i));
    info.style.setProperty('--c', P.color);
    info.innerHTML = `<b>${P.emoji} ${P.name} · ${P.hook}</b><p>${P.vol}</p>`;
    const go = document.createElement('button'); go.type = 'button'; go.textContent = T.goBtn(P.name);
    go.onclick = (e) => { e.stopPropagation(); this.toggle(false); this.onPick(i); };
    info.appendChild(go);
  }
  toggle(v) {
    this.open = v; this.big.classList.toggle('open', v); document.body.classList.toggle('map-open', v);
    if (v) this.draw(true);
  }
  draw(force) {
    const S = this.get();
    const targets = [[this.mini.querySelector('canvas'), this.mb, this.mw, this.mh, false]];
    if (this.open) targets.push([this.big.querySelector('canvas'), this.bb, this.bw, this.bh, true]);
    for (const [cv, B, w, h, large] of targets) {
      const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(B.c, 0, 0);
      g.scale(this.dpr, this.dpr);
      // 航線
      if (S.route && S.route.length) {
        g.beginPath(); g.moveTo(B.tx(S.boat.x), B.tz(S.boat.z));
        for (let i = S.routeI; i < S.route.length; i++) g.lineTo(B.tx(S.route[i][0]), B.tz(S.route[i][1]));
        g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,214,150,.95)'; g.lineWidth = large ? 2 : 1.4; g.stroke(); g.setLineDash([]);
      }
      // 港口
      PORT_DEFS.forEach((p, i) => {
        const x = B.tx(p.x), z = B.tz(p.z);
        g.beginPath(); g.arc(x, z, large ? 6 : (i === S.port ? 3.6 : 2.6), 0, 7);
        g.fillStyle = this.ports[i].color; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#fff'; g.stroke();
      });
      // 船
      const bx = B.tx(S.boat.x), bz = B.tz(S.boat.z), a = S.boat.heading * Math.PI / 180, r = large ? 9 : 5.5;
      g.save(); g.translate(bx, bz); g.rotate(a);
      const pulse = 1 + 0.25 * Math.sin(performance.now() / 260);
      g.beginPath(); g.arc(0, 0, r * 1.3 * pulse, 0, 7); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill();
      g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.62, r * 0.8); g.lineTo(0, r * 0.35); g.lineTo(-r * 0.62, r * 0.8); g.closePath();
      g.fillStyle = '#ff7a59'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#fff'; g.stroke(); g.restore();
      // 風向箭頭(右上角)
      const wx = large ? 30 : w - 13, wz = large ? h - 44 : 13, wr = large ? 15 : 8;
      g.save(); g.translate(wx, wz); g.beginPath(); g.arc(0, 0, wr + 3, 0, 7); g.fillStyle = 'rgba(10,20,50,.55)'; g.fill();
      g.rotate((S.windFrom + 180) * Math.PI / 180);
      g.beginPath(); g.moveTo(0, -wr); g.lineTo(wr * 0.5, wr * 0.2); g.lineTo(0, -wr * 0.1); g.lineTo(-wr * 0.5, wr * 0.2); g.closePath(); g.fillStyle = '#bfe9ff'; g.fill(); g.restore();
      if (large) { g.fillStyle = '#fff'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.fillText(T.windLabel, wx, wz + 32); }
    }
  }
  update(dt) {
    this.t += dt; if (this.t < (this.open ? 0.05 : 0.12)) return; this.t = 0; this.draw();
  }
}
