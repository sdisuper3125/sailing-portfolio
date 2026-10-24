import * as THREE from 'three';
import { PORT_DEFS, project } from './geo.js';
import { Wind, Boat, Autopilot, planRoute, approachPoint, wrap180, wrap360, rad, ARRIVE_R, dirOf } from './sim.js';
import { World, waveAt } from './world.js';
import { BoatModel, BOAT_L } from './boat.js';
import { WindLines, Spray } from './fx.js';
import { Cleanup } from './trash.js';
import { Dolphins } from './life.js';
import { Minimap } from './minimap.js';
const { SITE, PORTS } = window.CONTENT;
import { renderPort, renderSimple, bindMedia, initLightbox } from './ui.js';

const $ = (id) => document.getElementById(id);
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
const qs = new URLSearchParams(location.search);

// ---------- 文字內容 ----------
$('iSub').textContent = SITE.subtitle;
$('iTitle').textContent = SITE.title;
$('iWhat').textContent = SITE.what;
$('iLead').textContent = `${T.hello(SITE)}${SITE.intro}`;
document.title = SITE.title;
$('simpleBody').innerHTML = renderSimple();
bindMedia($('simpleBody')); bindMedia($('pBody')); initLightbox();

// ---------- 開場教學:拖曳 / 按鈕 / 滑鼠滾輪 ----------
(() => {
  const tut = document.querySelector('.tut'), prev = document.querySelector('.tut-nav.prev'), next = document.querySelector('.tut-nav.next');
  if (!tut) return;
  const step = () => (tut.querySelector('figure')?.offsetWidth || 240) + 10;
  const sync = () => { prev.disabled = tut.scrollLeft < 8; next.disabled = tut.scrollLeft > tut.scrollWidth - tut.clientWidth - 8; };
  prev.onclick = () => tut.scrollBy({ left: -step(), behavior: 'smooth' });
  next.onclick = () => tut.scrollBy({ left: step(), behavior: 'smooth' });
  tut.addEventListener('scroll', sync, { passive: true }); setTimeout(sync, 300); addEventListener('resize', sync);
  let d = null;
  tut.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; d = { x: e.clientX, l: tut.scrollLeft, moved: false }; });
  addEventListener('pointermove', (e) => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 4) { d.moved = true; tut.classList.add('dragging'); } if (d.moved) tut.scrollLeft = d.l - dx; });
  addEventListener('pointerup', () => { if (!d) return; const was = d.moved; d = null; tut.classList.remove('dragging'); if (was) { const s = step(); tut.scrollTo({ left: Math.round(tut.scrollLeft / s) * s, behavior: 'smooth' }); } });
  tut.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; if (tut.scrollWidth > tut.clientWidth) { e.preventDefault(); tut.scrollLeft += e.deltaY; } }, { passive: false });
})();

// ---------- 文字版切換 ----------
let loopOn = false;
function showSimple(on) {
  $('simple').hidden = !on;
  if (on) { $('simple').scrollTop = 0; stopLoop(); } else if (ready) startLoop();
}
$('btn-simple').onclick = () => showSimple(true);
$('btn-intro-simple').onclick = () => showSimple(true);
const introPage = (n) => document.querySelectorAll('#intro .pg').forEach((el) => el.classList.toggle('on', el.dataset.pg === String(n)));
$('btn-next-pg').onclick = () => introPage(2);
$('btn-prev-pg').onclick = () => introPage(1);
$('btn-back').onclick = () => showSimple(false);

// ---------- 渲染器 ----------
let renderer, scene, camera, world, wind, boat, model, ready = false;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
} catch (e) {
  console.warn('WebGL 不可用，改用文字版', e);
  $('loading').textContent = T.noWebgl;
  $('btn-start').disabled = true;
  document.body.classList.remove('intro-open');
  showSimple(true);
  throw e;
}
let pixelRatio = Math.min(devicePixelRatio || 1, isMobile ? 2 : 2);
if (qs.has('dpr')) pixelRatio = parseFloat(qs.get('dpr'));
renderer.setPixelRatio(pixelRatio);
renderer.setClearColor('#ffab75');
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(62, 1, 0.4, 4600);

world = new World(scene, PORTS);
wind = new Wind();
const startPos = project(121.93, 25.31);
boat = new Boat(startPos[0], startPos[1], 120);
model = new BoatModel();
scene.add(model.root);
const windLines = new WindLines(scene, isMobile ? 110 : 190);
const spray = new Spray(scene, 90);
const cleanup = new Cleanup(scene, onCleanupEvent);
const dolphins = new Dolphins(scene, onDolphin);

// ---------- 尾跡 ----------
const wakeGeo = new THREE.PlaneGeometry(1, 1); wakeGeo.rotateX(-Math.PI / 2);
const wakeTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,244,236,1)'); gr.addColorStop(0.45, 'rgba(255,226,212,0.5)'); gr.addColorStop(1, 'rgba(255,220,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
})();
const wakes = Array.from({ length: 56 }, () => {
  const m = new THREE.Mesh(wakeGeo, new THREE.MeshBasicMaterial({ map: wakeTex, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, fog: false }));
  m.visible = false; m.userData = { age: 99 }; scene.add(m); return m;
});
let wakeIdx = 0, wakeTimer = 0;

// ---------- 狀態 ----------
let auto = null, targetPort = -1, currentPort = -1, introOn = true, started = false, fading = false;
const suppress = new Set();
let panelOpen = false, panelShift = 0, camHead = 250, yawOff = 0, pitchOff = 0, drag = null;
let signedSail = 0, heelS = 0, simTime = 0, idleOrbit = 0, playTime = 0;
let steerHold = 0, anchored = false, anchorT = 0, spinOn = false, spinHoist = 0, camMode = 0, baseFov = 62;
document.body.classList.add('intro-open');
boat.moored = true;

// ---------- 港口導覽與標籤 ----------
const chips = $('chips'), labels = $('labels');
PORTS.forEach((p, i) => {
  const b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.style.setProperty('--c', p.color); b.dataset.i = i; b.title = p.tag;
  b.innerHTML = `<i>${p.emoji}</i><span><small>${p.name}</small><b>${p.tag}</b></span>`;
  b.onclick = () => fastTo(i);
  chips.appendChild(b);
  const l = document.createElement('button');
  l.className = 'plabel'; l.type = 'button'; l.style.setProperty('--c', p.color); l.dataset.i = i;
  l.innerHTML = `${p.name}<small></small>`;
  l.onclick = () => sailTo(i);
  labels.appendChild(l);
});
const labelEls = [...labels.children], chipEls = [...chips.children];
function markChip(i) {
  chipEls.forEach((c, k) => c.classList.toggle('on', k === i));
  if (i >= 0) chipEls[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function toast(msg, ms = 2800) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms);
}
function setStatus(text, buttons = true) {
  $('status').hidden = !text; $('statusText').textContent = text || '';
  $('btn-skip').hidden = !buttons; $('btn-stop').hidden = !buttons;
}

// ---------- 錨、球帆、視角 ----------
function setAnchored(on, quiet) {
  if (anchored === on) return;
  anchored = on;
  if (on) { spinOn = false; boat.spin = false; }
  $('btn-anchor').classList.toggle('on', on);
  $('btn-anchor').querySelector('b').textContent = on ? T.anchorUp : T.anchorDown;
  if (!quiet) toast(on ? T.anchored : T.weighed);
}
$('btn-anchor').onclick = () => { if (!started) return; if (auto) { stopAuto(); markChip(-1); } setAnchored(!anchored); };
function toggleSpin() {
  if (!started) return;
  if (anchored) { toast(T.needWeigh); return; }
  if (!spinOn) {
    if (Math.abs(boat.twa) < 95) { toast(T.needDownwind, 3600); return; }
    spinOn = true; toast(T.spinUp);
  } else { spinOn = false; toast(T.spinDown); }
  boat.spin = spinOn;
  $('btn-spin').classList.toggle('on', spinOn);
}
$('btn-spin').onclick = toggleSpin;
const CAM_NAMES = T.cams;
function setCam(m) {
  camMode = m % 3; pitchOff = 0; yawOff = 0;
  $('btn-cam').querySelector('b').textContent = CAM_NAMES[camMode];
  toast(T.cam(CAM_NAMES[camMode]), 1400);
}
$('btn-cam').onclick = () => setCam(camMode + 1);
$('btn-clean').onclick = () => { const i = cleanup.nearestLanding(boat); if (i >= 0 && anchored) cleanup.start(i, boat, model); };

// ---------- 航行指令 ----------
function startAuto(i, ts) {
  const d = Math.hypot(PORT_DEFS[i].x - boat.x, PORT_DEFS[i].z - boat.z);
  const route = planRoute(boat.x, boat.z, i);
  auto = new Autopilot(route, [boat.x, boat.z]);
  targetPort = i; markChip(i);
  setStatus(T.goto(PORTS[i].name, Math.round(d)));
}
// 地圖標籤:完整航行
function sailTo(i) {
  if (!started) startGame();
  if (panelOpen) closePanel(false);
  if (cleanup.run) return;
  setAnchored(false, true); boat.motor = 0;
  const d = Math.hypot(PORT_DEFS[i].x - boat.x, PORT_DEFS[i].z - boat.z);
  if (d < ARRIVE_R * 1.3) { arrive(i); return; }
  startAuto(i);
}
// 上方導覽:快速抵達(傳送到港口外海,再航行約 3 秒進港)
function fastTo(i) {
  if (fading || cleanup.run) return;
  if (!started) startGame();
  if (panelOpen) closePanel(false);
  stopAuto(); setAnchored(false, true); boat.motor = 0; markChip(i);
  const P = PORT_DEFS[i];
  const d = Math.hypot(P.x - boat.x, P.z - boat.z);
  if (d < ARRIVE_R * 1.3) { arrive(i); return; }
  if (d < 70) { startAuto(i); return; }
  fading = true;
  $('fade').classList.add('on'); $('fadeText').textContent = T.fadeGo(PORTS[i].name);
  setTimeout(() => {
    const [ax, az, hd] = approachPoint(i, wind.from, boat.x, boat.z);
    boat.x = ax; boat.z = az; boat.heading = hd; boat.turnRate = 0;
    spinOn = false; boat.spin = false; spinHoist = 0; $('btn-spin').classList.remove('on');
    boat.speed = Math.max(4.5, wind.kn * 0.5);
    camHead = hd; yawOff = 0; updateCamera.init = false; signedSail = 0;
    for (const w of wakes) w.visible = false;
    targetPort = i;
    startAuto(i);
    setTimeout(() => { $('fade').classList.remove('on'); fading = false; }, 350);
  }, 380);
}
let headUp = false;
function stopAuto() { auto = null; targetPort = -1; if (!cleanup.run) setStatus(''); }
$('btn-stop').onclick = () => { stopAuto(); markChip(-1); };
$('btn-skip').onclick = () => {
  if (targetPort < 0) return;
  const i = targetPort, P = PORT_DEFS[i];
  const dx = boat.x - P.x, dz = boat.z - P.z, d = Math.hypot(dx, dz) || 1;
  boat.x = P.x + (dx / d) * (ARRIVE_R * 0.75); boat.z = P.z + (dz / d) * (ARRIVE_R * 0.75);
  boat.heading = wrap360(Math.atan2(-dx, dz) / rad);
  arrive(i);
};

function arrive(i) {
  stopAuto(); headUp = true;
  currentPort = i; setAnchored(true, true); boat.speed *= 0.12;
  openPanel(i);
}

function openPanel(i) {
  const p = PORTS[i];
  $('pTag').textContent = `${String(i + 1).padStart(2, '0')} · ${(p.name + ' ' + p.en).trim()} · ${p.tag}`;
  $('pTitle').textContent = p.title;
  $('pBody').innerHTML = `<p class="lead">${p.lead}</p>` + renderPort(p);
  $('pBody').scrollTop = 0;
  $('panel').style.setProperty('--accent', p.color);
  $('panel').hidden = false;
  $('panel').style.animation = 'none'; void $('panel').offsetWidth; $('panel').style.animation = '';
  panelOpen = true; document.body.classList.add('panel-open'); markChip(i);
  const nx = PORTS[(i + 1) % PORTS.length];
  $('pNext').querySelector('span').textContent = T.next(nx.name);
  $('pNext').querySelector('small').textContent = nx.hook;
}
function closePanel(msg = true) {
  if (!panelOpen) return;
  $('panel').hidden = true; panelOpen = false; document.body.classList.remove('panel-open');
  if (currentPort >= 0) suppress.add(currentPort);
  if (msg && anchored) toast(T.anchoredHint, 4200);
}
$('pClose').onclick = () => closePanel(true);
$('pNext').onclick = () => fastTo((currentPort + 1) % PORTS.length);

function startGame() {
  if (started) return;
  started = true; introOn = false;
  $('intro').classList.add('gone'); document.body.classList.remove('intro-open');
  boat.moored = false;
  setTimeout(() => toast(T.startHint, 4200), 700);
}
$('btn-start').onclick = startGame;

// ---------- 任務事件 ----------
function updateScore(flash) {
  $('score').textContent = `♻ ${cleanup.count}/${cleanup.total}`;
  if (flash) { $('score').classList.remove('pop'); void $('score').offsetWidth; $('score').classList.add('pop'); }
}
updateScore(false);
function onCleanupEvent(type, a) {
  if (type === 'float') { updateScore(true); const n = T.trash[a]; toast(T.picked(n, cleanup.count), 1600); }
  else if (type === 'start') { setStatus(T.crewGo, false); toast(T.crewStart); }
  else if (type === 'pile') { updateScore(true); setStatus(T.sorting(a), false); }
  else if (type === 'done') {
    setStatus(''); updateScore(true);
    toast(T.beachDone(PORTS[a].name, cleanup.kg.toFixed(1)), 4200);
    if (cleanup.count >= cleanup.total) setTimeout(() => toast(T.allDone, 6000), 4500);
  }
}
$('score').onclick = () => toast(T.score(cleanup.count, cleanup.total, cleanup.kg.toFixed(1)), 5200);
function onDolphin() { toast(T.dolphin, 4200); }

// ---------- 輸入 ----------
const keys = new Set();
function steerInput() { headUp = false; if (anchored && started && !cleanup.run) setAnchored(false); if (auto) { stopAuto(); markChip(-1); } if (!started) startGame(); }
addEventListener('keydown', (e) => {
  if (!$('simple').hidden) return;
  if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) { keys.add(e.key.toLowerCase()); steerInput(); e.preventDefault(); }
  if (e.key === 'Escape') closePanel(true);
  if (/^[1-7]$/.test(e.key)) fastTo(+e.key - 1);
  if (e.key === 'v' || e.key === 'V') setCam(camMode + 1);
  if (e.key === 'f' || e.key === 'F') $('btn-anchor').click();
  if (e.key === 's' || e.key === 'S') toggleSpin();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
for (const [id, dir] of [['steerL', -1], ['steerR', 1]]) {
  const b = $(id);
  const up = () => { if (steerHold === dir) steerHold = 0; b.classList.remove('down'); };
  b.addEventListener('pointerdown', (e) => { b.setPointerCapture(e.pointerId); steerHold = dir; b.classList.add('down'); steerInput(); });
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
$('hud').onclick = () => { wind.setBase(wind.baseTarget + 60); toast(T.wind60); };

const cv = $('c');
cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: yawOff, pitch: pitchOff }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  if (!drag) return;
  yawOff = THREE.MathUtils.clamp(drag.yaw - (e.clientX - drag.x) * 0.006, -2.6, 2.6);
  pitchOff = camMode === 1 ? THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.005, -0.85, 0.45) : THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.004, -0.15, 0.6);
});
const endDrag = () => { drag = null; };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

// ---------- 尺寸 ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  baseFov = w / h < 0.8 ? 76 : w / h < 1.3 ? 66 : 58;
  camera.fov = baseFov;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- 主迴圈 ----------
const clock = new THREE.Clock();
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3();
let hudT = 0, slow = 0, frames = 0;
const windName = T.winds;

function update(dt) {
  simTime += dt;
  wind.update(dt);
  if (started && !introOn) playTime += dt;
  boat.moored = anchored || introOn;
  // 轉舵輸入
  let steer = steerHold;
  if (keys.has('arrowleft') || keys.has('a')) steer -= 1;
  if (keys.has('arrowright') || keys.has('d')) steer += 1;
  let ts = 1;
  if (auto && !fading) {
    const r = auto.update(boat, wind, dt);
    if (r.done) arrive(targetPort); else steer = r.steer;
    ts = 1.6;
  } else if (boat.moored) {
    steer = THREE.MathUtils.clamp(wrap180(wind.from - boat.heading) / 60, -0.35, 0.35);
  }
  steer = THREE.MathUtils.clamp(steer, -1, 1);
  if (headUp && anchored && !fading) boat.heading = wrap360(boat.heading + wrap180(wind.from - boat.heading) * Math.min(1, dt * 1.6));
  if (!anchored) headUp = false;
  if (!fading) boat.update(dt, steer, wind, ts);
  // 球帆:風從前方來會塌
  if (spinOn && boat.spinWarn && Math.abs(boat.twa) < 80) { spinOn = false; boat.spin = false; $('btn-spin').classList.remove('on'); toast(T.spinCollapsed); }
  // 手動靠近港口自動停泊
  if (!auto && !boat.moored && started && !fading) {
    PORT_DEFS.forEach((P, i) => {
      const d = Math.hypot(P.x - boat.x, P.z - boat.z);
      if (d > ARRIVE_R * 2.2) suppress.delete(i);
      else if (d < ARRIVE_R * 0.9 && !suppress.has(i) && !panelOpen) arrive(i);
    });
  }

  // 船體姿態
  const t = simTime, amp = 0.55 + wind.kn / 22;
  const wv = waveAt(boat.x, boat.z, t, world.windAngle, amp);
  model.root.position.set(boat.x, wv.h * 0.9, boat.z);
  model.root.rotation.y = -boat.heading * rad;
  const [fx, fz] = dirOf(boat.heading);
  const sf = wv.gx * fx + wv.gz * fz;
  const sr = wv.gx * Math.cos(boat.heading * rad) + wv.gz * Math.sin(boat.heading * rad);
  heelS += (boat.side * (boat.moored ? 2 : boat.heel) - heelS) * Math.min(1, dt * 2.2);
  model.tilt.rotation.x = Math.atan(sf) * 0.7;
  model.tilt.rotation.z = heelS * rad + Math.atan(sr) * 0.5;
  model.wheel.rotation.z = -steer * 1.4;
  // 帆
  const absAwa = Math.abs(boat.awa);
  const luff = boat.moored ? 1 : THREE.MathUtils.clamp((34 - absAwa) / 10, 0, 1);
  const aT = boat.moored ? 14 : THREE.MathUtils.clamp(absAwa - 24, 5, 86);
  const sT = boat.side * aT * rad;
  signedSail += (sT - signedSail) * Math.min(1, dt * 3.2);
  spinHoist += ((spinOn ? 1 : 0) - spinHoist) * Math.min(1, dt * 0.9);
  if (!spinOn && spinHoist < 0.01) spinHoist = 0;
  model.setSails(Math.abs(signedSail), signedSail >= 0 ? 1 : -1, Math.max(luff, boat.moored ? 0.6 : 0), t, 1 - Math.min(1, spinHoist * 1.4));
  model.setSpin(spinHoist, boat.side, t);
  model.setVane(boat.awa * rad);
  // 錨
  const aTarget = anchored && !introOn ? 1 : 0;
  if (Math.abs(aTarget - anchorT) > 0.001) { anchorT += (aTarget - anchorT) * Math.min(1, dt * 2.2); model.setAnchor(anchorT); }

  // 尾跡與船首浪花
  wakeTimer -= dt;
  if (wakeTimer <= 0 && boat.speed > 1) {
    wakeTimer = 0.11;
    const w = wakes[wakeIdx++ % wakes.length];
    w.position.set(boat.x - fx * 1.9, 0.08, boat.z - fz * 1.9);
    w.userData.age = 0; w.visible = true; w.rotation.y = -boat.heading * rad; w.userData.s = 0.5 + boat.speed * 0.08;
  }
  for (const w of wakes) {
    if (!w.visible) continue;
    w.userData.age += dt;
    const a = w.userData.age, life = 3.2;
    if (a > life) { w.visible = false; continue; }
    const s = w.userData.s * (1 + a * 1.2);
    w.scale.set(s * 1.1, 1, s * 1.7);
    w.material.opacity = 0.55 * (1 - a / life);
    w.position.y = 0.06 + waveAt(w.position.x, w.position.z, t, world.windAngle, amp).h * 0.95;
  }
  const bowD = BOAT_L * 1.25 * 0.5;
  spray.update(dt, boat, boat.x + fx * bowD, boat.z + fz * bowD, Math.cos(boat.heading * rad), Math.sin(boat.heading * rad));
  windLines.update(dt, wind, boat);
  cleanup.update(dt, t, boat, (x, z) => waveAt(x, z, t, world.windAngle, 0.55 + wind.kn / 22).h * 0.9);
  dolphins.update(dt, boat, started && !introOn && !panelOpen);

  updateCamera(dt);
  world.update(t, camera, wind);
}

function updateCamera(dt) {
  if (window.__dbgCam) { camera.position.set(...window.__dbgCam.p); camera.lookAt(...window.__dbgCam.l); camera.clearViewOffset(); return; }
  const free = camMode === 1 && !introOn && !panelOpen;
  if (!drag && !free) yawOff += (0 - yawOff) * Math.min(1, dt * (panelOpen ? 0 : 0.9));
  if (!free) pitchOff += ((drag ? pitchOff : 0) - pitchOff) * Math.min(1, dt * 0.9);
  let dist = 12.5, height = 3.6, lookAhead = 5, look = 2.1;
  let headTarget = boat.heading, mode = camMode, rate = 1.6;
  if (introOn) { mode = 0; headTarget = 250; dist = 15; height = 2.6; lookAhead = 0; idleOrbit += dt * 0.05; headTarget += Math.sin(idleOrbit) * 30; rate = 0.8; }
  if (panelOpen) { mode = 0; idleOrbit += dt * 0.12; headTarget = boat.heading + Math.sin(idleOrbit) * 70 + 160; dist = innerWidth / innerHeight < 0.8 ? 15 : 10; height = innerWidth / innerHeight < 0.8 ? 4.4 : 3.2; lookAhead = 0; }
  if (mode === 1) { dist = 15; height = 30; lookAhead = 0; look = 0.5; }
  camHead += wrap180(headTarget - camHead) * Math.min(1, dt * rate);
  const ch = camHead + yawOff * (180 / Math.PI);
  const [dx, dz] = dirOf(ch);
  let k = Math.min(1, dt * 6);
  if (cleanup.run && cleanup.focus && !panelOpen) {
    // 上岸清理:從海側看向岸邊
    const f = cleanup.focus, sx = cleanup.run.B.L.dir[0], sz = cleanup.run.B.L.dir[1];
    camPos.set(f[0] - sx * 14 - sz * 10, 9.5, f[1] - sz * 14 + sx * 10);
    camLook.set(f[0] + sx * 1, 1.0, f[1] + sz * 1);
    k = Math.min(1, dt * 2.5);
  } else if (mode === 1) {
    // 俯瞰:可上下左右自由拖動
    const R = 36, el = THREE.MathUtils.clamp(1.05 + pitchOff, 0.2, 1.52);
    camPos.set(boat.x - dx * R * Math.cos(el), R * Math.sin(el), boat.z - dz * R * Math.cos(el));
    camLook.set(boat.x, 0.5, boat.z);
    k = Math.min(1, dt * 8);
  } else if (mode === 2) {
    // 船上視角:駕駛艙視點
    const [bx, bz] = dirOf(boat.heading + yawOff * (180 / Math.PI));
    camPos.set(boat.x - fxOf(boat) * 1.55, 1.42, boat.z - fzOf(boat) * 1.55);
    camPos.y += waveAt(boat.x, boat.z, simTime, world.windAngle, 0.55 + wind.kn / 22).h * 0.9;
    camLook.set(boat.x + bx * 40, 1.0, boat.z + bz * 40);
    k = 1;
  } else {
    const pitch = pitchOff;
    const cd = dist * Math.cos(pitch);
    camPos.set(boat.x - dx * cd, 0, boat.z - dz * cd);
    const gy = waveAt(camPos.x, camPos.z, simTime, world.windAngle, 0.55 + wind.kn / 22).h;
    camPos.y = Math.max(1.4, height + dist * Math.sin(pitch) * 1.2 + gy * 0.5);
    camLook.set(boat.x + dx * lookAhead, look, boat.z + dz * lookAhead);
  }
  if (!updateCamera.init) { camera.position.copy(camPos); updateCamera.init = true; }
  camera.position.lerp(camPos, k);
  camera.lookAt(camLook);
  const fovT = baseFov + (mode === 2 ? 8 : 0);
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 5); camera.updateProjectionMatrix(); }
  // 面板開啟時把畫面往上/往左推，讓船露出來
  panelShift += ((panelOpen ? 1 : 0) - panelShift) * Math.min(1, dt * 4);
  const W = innerWidth, H = innerHeight;
  if (panelShift > 0.001) {
    const wide = W >= 900 || (H < 520 && W > H);
    camera.setViewOffset(W, H, 0, wide ? 0 : panelShift * H * 0.3, W, H);
  } else camera.clearViewOffset();
}
const fxOf = (b) => dirOf(b.heading)[0], fzOf = (b) => dirOf(b.heading)[1];

function updateLabels() {
  const W = innerWidth, H = innerHeight;
  const hide = panelOpen || introOn || camMode === 1 && false;
  PORT_DEFS.forEach((P, i) => {
    const el = labelEls[i];
    tmp.set(P.x, 13.5, P.z).project(camera);
    const d = Math.hypot(P.x - boat.x, P.z - boat.z);
    const vis = !hide && tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < 1.15 && tmp.y > -1.1 && tmp.y < 1.05 && d > ARRIVE_R * 1.2;
    el.style.display = vis ? '' : 'none';
    if (!vis) return;
    const s = THREE.MathUtils.clamp(1.0 - d / 900, 0.7, 1);
    el.style.transform = `translate3d(${((tmp.x + 1) / 2 * W).toFixed(1)}px,${((1 - tmp.y) / 2 * H).toFixed(1)}px,0) translate(-50%,-100%) scale(${s.toFixed(3)})`;
    el.style.opacity = d > 260 && targetPort !== i ? '0.75' : '1';
    el.lastChild.textContent = `${Math.round(d)} km`;
  });
}

function updateHud() {
  $('dial').setAttribute('transform', `rotate(${-boat.heading.toFixed(1)})`);
  $('windGroup').setAttribute('transform', `rotate(${wind.from.toFixed(1)})`);
  $('hWind').textContent = T.windTxt(windName[Math.round(wind.from / 45) % 8], wind.kn.toFixed(0));
  $('hSpeed').textContent = T.speedTxt(boat.speed.toFixed(1));
  if (auto) {
    const d = Math.hypot(PORT_DEFS[targetPort].x - boat.x, PORT_DEFS[targetPort].z - boat.z);
    $('statusText').textContent = T.goto(PORTS[targetPort].name, Math.round(d));
  }
  // 工具列狀態
  const li = cleanup.nearestLanding(boat);
  $('btn-clean').hidden = !(anchored && started && li >= 0 && !cleanup.run);
  $('btn-spin').classList.toggle('ready', !spinOn && !anchored && Math.abs(boat.twa) > 100);
}

const minimap = new Minimap($('mini'), $('bigmap'), PORTS, () => ({ boat, windFrom: wind.from, route: auto ? auto.route : null, routeI: auto ? auto.i : 0, port: currentPort }), (i) => { if (started) fastTo(i); });

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
  updateLabels();
  hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
  minimap.update(dt);
  frames++;
  if (frames > 60) { slow += dt > 1 / 26 ? 1 : -0.5; slow = Math.max(0, slow); if (slow > 70 && pixelRatio > 0.85) { pixelRatio = Math.max(0.85, pixelRatio * 0.85); renderer.setPixelRatio(pixelRatio); resize(); slow = 0; } }
}
function startLoop() { if (loopOn) return; loopOn = true; clock.getDelta(); renderer.setAnimationLoop(frame); }
function stopLoop() { loopOn = false; renderer.setAnimationLoop(null); }
document.addEventListener('visibilitychange', () => { if (document.hidden) stopLoop(); else if ($('simple').hidden && ready) startLoop(); });

// ---------- 啟動 ----------
requestAnimationFrame(() => {
  ready = true;
  $('loading').textContent = T.ready;
  if (!qs.has('simple')) startLoop(); else showSimple(true);
});

// 除錯/測試用
window.__sail = { boat, wind, world, camera, scene, renderer, cleanup, dolphins, model, sailTo, fastTo, arrive, closePanel, startGame, PORT_DEFS,
  toggleSpin, setCam, anchor: () => $('btn-anchor').click(), state: () => ({ anchored, spinOn, camMode, auto: !!auto }) };
