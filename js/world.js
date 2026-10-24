import * as THREE from 'three';
import { LANDS, inside, distEdge, mountainHeight, fbm, PORT_DEFS } from './geo.js';
import { ARRIVE_R } from './sim.js';
import { LH_N, LH_SCALE, LH_B64 } from './lighthouse-data.js';

// ---------- 色彩(顯示色,sRGB) ----------
export const HORIZON = '#ffab75';
export const FOG_DENSITY = 0.00095;

// ---------- 波浪參數(JS 與 GLSL 共用) ----------
export const WAVES = [
  { len: 78, amp: 0.55, off: 0.0 },
  { len: 42, amp: 0.30, off: 0.5 },
  { len: 19, amp: 0.13, off: -0.4 },
  { len: 11, amp: 0.07, off: 0.9 },
  { len: 6.5, amp: 0.035, off: -1.1 },
];
const omega = (len) => Math.sqrt(9.8 * ((Math.PI * 2) / len)) * 0.36;

// 長波(前兩道)在 (x,z) 的高度與斜率,供船隻浮動使用
export function waveAt(x, z, t, travelAngle, amp) {
  let h = 0, gx = 0, gz = 0;
  for (let i = 0; i < 2; i++) {
    const w = WAVES[i], k = (Math.PI * 2) / w.len;
    const a = travelAngle + w.off;
    const dx = Math.cos(a), dz = Math.sin(a);
    const ph = k * (dx * x + dz * z) - omega(w.len) * t;
    h += w.amp * amp * Math.sin(ph);
    const d = w.amp * amp * k * Math.cos(ph);
    gx += d * dx; gz += d * dz;
  }
  return { h, gx, gz };
}

const arr = (key) => `float[5](${WAVES.map((w) => (key === 'k' ? ((Math.PI * 2) / w.len) : key === 'w' ? omega(w.len) : w[key]).toFixed(5)).join(',')})`;

const SKY_GLSL = /* glsl */ `
vec3 skyGrad(vec3 d, vec3 sun){
  float h = max(d.y, 0.0);
  vec3 c0 = vec3(1.00,0.67,0.46);
  vec3 c1 = vec3(0.97,0.46,0.55);
  vec3 c2 = vec3(0.52,0.33,0.65);
  vec3 c3 = vec3(0.10,0.15,0.38);
  vec3 c = mix(c0,c1,smoothstep(0.0,0.14,h));
  c = mix(c,c2,smoothstep(0.10,0.40,h));
  c = mix(c,c3,smoothstep(0.32,0.9,h));
  float s = max(dot(normalize(vec3(d.x,0.001,d.z)), normalize(vec3(sun.x,0.001,sun.z))),0.0);
  c += vec3(0.55,0.22,0.04)*pow(s,3.0)*(1.0-smoothstep(0.0,0.5,h));
  return c;
}`;

export const SUN_DIR = (() => {
  const az = 255 * Math.PI / 180, el = 7 * Math.PI / 180;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
})();

// ---------- 天空 ----------
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: SUN_DIR }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun; uniform float uTime; varying vec3 vDir;
      ${SKY_GLSL}
      float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      float nz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*nz(p); p=p*2.03+7.1; a*=.5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        vec3 col = skyGrad(d,uSun);
        float sd = dot(d,uSun);
        col += vec3(1.0,0.55,0.25)*pow(max(sd,0.),40.)*0.7 + vec3(1.0,0.75,0.45)*pow(max(sd,0.),400.)*1.4;
        col += vec3(1.0,0.95,0.8)*smoothstep(0.99935,0.9997,sd)*2.0;
        if (d.y > 0.0) {
          vec2 p = d.xz/(d.y+0.18)*1.2 + vec2(uTime*0.012,0.0);
          float n = fbm(p*vec2(1.0,1.8));
          float cl = smoothstep(0.50,0.76,n) * smoothstep(0.0,0.09,d.y) * (1.0-smoothstep(0.5,0.9,d.y));
          vec3 cc = mix(vec3(1.0,0.60,0.50), vec3(0.58,0.36,0.66), clamp(d.y*2.2,0.,1.));
          cc += vec3(1.0,0.6,0.25)*pow(max(sd,0.),6.0)*0.6;
          col = mix(col, cc, cl*0.85);
          vec2 sp = d.xz/(d.y+1.0)*70.0;
          col += vec3(1.0,0.9,0.9)*step(0.9968,h21(floor(sp)))*smoothstep(0.5,0.85,d.y)*0.8;
        }
        gl_FragColor = vec4(col,1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 20), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return mesh;
}

// ---------- 海面 ----------
function makeMaskTexture() {
  const X0 = -190, Z0 = -235, W = 320, H = 445, S = 2;
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  g.lineJoin = 'round';
  const path = (poly) => { g.beginPath(); poly.forEach(([x, z], i) => { const px = (x - X0) * S, py = (z - Z0) * S; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
  for (const L of LANDS) {
    for (let w = 46; w >= 4; w -= 3) { path(L.poly); g.lineWidth = w; g.strokeStyle = 'rgba(255,255,255,0.05)'; g.stroke(); }
    path(L.poly); g.fillStyle = '#fff'; g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  return { tex, rect: new THREE.Vector4(X0, Z0, W, H) };
}

function makeWater() {
  const R = 2900, NR = 80, NS = 96;
  const pos = [], idx = [];
  for (let i = 0; i <= NR; i++) {
    const r = R * Math.pow(i / NR, 2.4);
    for (let j = 0; j <= NS; j++) { const a = (j / NS) * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = i * (NS + 1) + j, b = a + NS + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const { tex, rect } = makeMaskTexture();
  const ampSum = WAVES.reduce((s, w) => s + w.amp, 0);
  const waveGlsl = /* glsl */ `
    const float WLEN_K[5] = ${arr('k')};
    const float WLEN_W[5] = ${arr('w')};
    const float WAMP[5] = ${arr('amp')};
    const float WOFF[5] = ${arr('off')};
    uniform float uTime; uniform float uAngle; uniform float uAmp;
    vec3 wavesAt(vec2 p, int n){
      vec3 r = vec3(0.0);
      for (int i = 0; i < 5; i++) {
        if (i >= n) break;
        float a = uAngle + WOFF[i];
        vec2 dir = vec2(cos(a), sin(a));
        float ph = WLEN_K[i]*dot(dir,p) - WLEN_W[i]*uTime;
        float A = WAMP[i]*uAmp;
        r.x += A*sin(ph);
        float d = A*WLEN_K[i]*cos(ph);
        r.y += d*dir.x; r.z += d*dir.y;
      }
      return r;
    }`;
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uTime: { value: 0 }, uAngle: { value: 0 }, uAmp: { value: 1 },
      uSun: { value: SUN_DIR }, uFogDensity: { value: FOG_DENSITY },
      uMask: { value: tex }, uMaskRect: { value: rect }, uWind: { value: new THREE.Vector2(1, 0) }, uWindKn: { value: 12 },
    },
    vertexShader: /* glsl */ `
      ${waveGlsl}
      varying vec3 vWorld; varying float vH;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vec3 w = wavesAt(wp.xz, 2);
        wp.y += w.x; vH = w.x; vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      ${waveGlsl}
      ${SKY_GLSL}
      uniform vec3 uSun; uniform float uFogDensity; uniform sampler2D uMask; uniform vec4 uMaskRect;
      uniform vec2 uWind; uniform float uWindKn;
      varying vec3 vWorld; varying float vH;
      float hs(vec2 p){ p = fract(p*vec2(127.1,311.7)); p += dot(p,p+34.23); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hs(i),hs(i+vec2(1,0)),f.x), mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x), f.y); }
      float fb3(vec2 p){ return vn(p)*.55 + vn(p*2.1+3.7)*.3 + vn(p*4.3+9.1)*.15; }
      void main(){
        float dist = length(vWorld - cameraPosition);
        float lod = 1.0 - smoothstep(45.0, 190.0, dist);   // 遠處高頻細節淡出,避免閃爍
        vec3 w2 = wavesAt(vWorld.xz, 2);
        vec3 w = wavesAt(vWorld.xz, 5);
        w = w2 + (w - w2)*lod;
        vec2 P = vWorld.xz;
        vec2 wd = uWind, wp = vec2(-uWind.y, uWind.x);
        // 陣風斑塊:沿風向移動的低頻雜訊
        float gust = fb3(P*0.011 - wd*uWindKn*0.0018*uTime);
        gust = smoothstep(0.38, 0.7, gust);
        // 風吹出的細浪(順風向拉長、隨陣風增強)
        vec2 rp = vec2(dot(P,wd), dot(P,wp));
        vec2 rq = vec2(rp.x*0.9 - uTime*uWindKn*0.02, rp.y*1.6);
        float e = 0.12;
        float r0 = vn(rq), rx = vn(rq+vec2(e,0.)), ry = vn(rq+vec2(0.,e));
        vec2 rg = vec2(rx-r0, ry-r0)/e;
        float rippleAmp = (0.05 + 0.10*gust) * clamp(uWindKn/14.0, 0.4, 1.4) * lod;
        vec2 rgw = wd*rg.x + wp*rg.y;
        vec3 N = normalize(vec3(-(w.y*1.5 + rgw.x*rippleAmp), 1.0, -(w.z*1.5 + rgw.y*rippleAmp)));
        vec3 V = normalize(cameraPosition - vWorld);
        float ndv = max(dot(N,V),0.0);
        float fres = 0.02 + 0.62*pow(1.0-ndv, 4.6);
        vec3 R = reflect(-V,N); R.y = max(R.y, 0.03);
        vec3 refl = skyGrad(normalize(R), uSun);
        vec3 deep = vec3(0.028,0.085,0.200), mid = vec3(0.060,0.215,0.380);
        float hn = clamp(w.x/${(ampSum * 0.9).toFixed(3)}, -1.0, 1.0);
        vec3 body = mix(deep, mid, 0.12 + 0.4*(hn*0.5+0.5) + 0.2*(1.0-ndv));
        body = mix(body, body*vec3(0.62,0.74,0.95), gust*0.55);                 // 陣風處顏色更深
        body += vec3(0.02,0.10,0.10)*smoothstep(0.25,0.95,hn)*(1.0-ndv);       // 浪峰透光
        float m = texture2D(uMask, (P - uMaskRect.xy)/uMaskRect.zw).r;
        body = mix(body, vec3(0.16,0.58,0.62), smoothstep(0.03,0.42,m)*0.9);
        vec3 col = mix(body, refl, fres);
        vec3 Hh = normalize(uSun + V);
        float nh = max(dot(N,Hh),0.0);
        float sparkle = step(0.90, hs(floor(P*1.2 + floor(uTime*0.5)))) * pow(nh, 90.0) * 0.5 * lod;
        col += vec3(1.0,0.72,0.42)*(pow(nh,220.0)*2.8 + pow(nh,26.0)*0.2 + sparkle);
        // 白頭浪:浪峰高頻處,風越大越多
        float hf = w.x - wavesAt(P, 2).x;
        float foam = smoothstep(0.62,1.1, hf/(0.20*uAmp)) * smoothstep(0.1,0.45,hn) * (0.10 + 0.26*gust + 0.12*clamp((uWindKn-10.0)/8.0,0.0,1.0));
        // 風向條紋(順風泡沫線)
        vec2 sq = vec2(rp.x*0.012, rp.y*0.16);
        float streak = smoothstep(0.78, 0.92, vn(sq + vec2(-uTime*0.03,0.0))) * (0.10 + 0.22*gust) * smoothstep(0.0,0.4,1.0-m);
        float shoreRing = smoothstep(0.5,0.78,m)*(0.5+0.5*sin(m*46.0 - uTime*1.3))*0.5;
        col = mix(col, vec3(1.0,0.90,0.84), clamp(foam + shoreRing + streak, 0.0, 0.85));
        vec3 hd = normalize(vec3(-V.x, 0.0, -V.z));
        vec3 fogC = skyGrad(hd, uSun);
        float f = 1.0 - exp(-pow(dist*uFogDensity, 2.0));
        col = mix(col, fogC, f);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

// ---------- 陸地 ----------
const C = (hex) => new THREE.Color(hex);
const cSand = C('#e2cc98'), cGrass = C('#7fa857'), cGreen = C('#3f7b49'), cDeep = C('#2a5a40'), cRock = C('#85705f'), cPeak = C('#c2a79a');
function landColor(h, n) {
  const c = new THREE.Color();
  if (h < 1.0) c.copy(cSand).lerp(cGrass, THREE.MathUtils.smoothstep(h, 0.2, 1.0));
  else if (h < 3.5) c.copy(cGrass).lerp(cGreen, (h - 1) / 2.5);
  else if (h < 7) c.copy(cGreen).lerp(cDeep, (h - 3.5) / 3.5).lerp(cRock, THREE.MathUtils.smoothstep(h, 5.5, 7));
  else c.copy(cRock).lerp(cPeak, Math.min(1, (h - 7) / 4));
  c.offsetHSL(0, 0, (n - 0.5) * 0.08);
  return c;
}

function buildLand(L) {
  const big = L.id === 'taiwan';
  const sp = big ? 1.7 : 0.7;
  const { x0, x1, z0, z1 } = L.bbox;
  const nx = Math.ceil((x1 - x0) / sp) + 2, nz = Math.ceil((z1 - z0) / sp) + 2;
  const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), ins = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 - sp + i * sp + (((i * 7 + j * 13) % 5) - 2) * sp * 0.06, z = z0 - sp + j * sp + (((i * 11 + j * 3) % 5) - 2) * sp * 0.06;
    const k = j * nx + i;
    let h = 0, n = 0.5;
    if (inside(L.poly, x, z)) {
      ins[k] = 1;
      const d = distEdge(L.poly, x, z);
      n = fbm(x * 0.09 + 3.1, z * 0.09 + 7.7);
      const taper = THREE.MathUtils.smoothstep(d, 0, big ? 9 : 2.2);
      if (big) {
        const mh = mountainHeight(x, z) * (0.7 + 0.6 * fbm(x * 0.05, z * 0.05));
        h = 0.28 + taper * (mh + 1.4 * fbm(x * 0.14, z * 0.14));
      } else {
        h = 0.28 + taper * L.peak * (0.5 + fbm(x * 0.2, z * 0.2));
      }
    }
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const c = landColor(h, n);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    if (ins[a] && ins[b] && ins[c] && ins[d]) idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  // 沙灘底
  const shape = new THREE.Shape(L.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const sand = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color: '#e8d4a2' }));
  sand.rotation.x = -Math.PI / 2; sand.position.y = 0.12;
  const g = new THREE.Group(); g.add(sand, mesh);
  return g;
}

// ---------- 港口燈塔 ----------
const beamMat = (color) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 } },
  vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: 'uniform vec3 uColor; uniform float uTime; varying float vY; void main(){ float a = pow(1.0-vY,1.6)*0.5*(0.85+0.15*sin(uTime*2.0)); gl_FragColor = vec4(uColor*a, a); }',
});

let _lhGeo = null;
const lhMat = new THREE.MeshLambertMaterial({ vertexColors: true });
function lighthouseGeo() {
  if (_lhGeo) return _lhGeo;
  const bin = atob(LH_B64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const dv = new DataView(buf.buffer), n = LH_N;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n * 3; i++) pos[i] = dv.getInt16(i * 2, true) * LH_SCALE;
  const co = n * 6;
  for (let i = 0; i < n; i++) { c.setRGB(buf[co + i * 3] / 255, buf[co + i * 3 + 1] / 255, buf[co + i * 3 + 2] / 255, THREE.SRGBColorSpace); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals(); return (_lhGeo = g);
}

function makeBeacon(color) {
  const g = new THREE.Group();
  const acc = new THREE.MeshLambertMaterial({ color });
  const lh = new THREE.Mesh(lighthouseGeo(), lhMat); lh.scale.setScalar(1.7); lh.position.y = -0.1; g.add(lh);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.8 })); lamp.position.y = 8.75; g.add(lamp);
  const white = new THREE.MeshLambertMaterial({ color: '#fff4e6' });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), white); pole.position.set(0, 11.5, 0); g.add(pole);
  const flagGeo = new THREE.PlaneGeometry(2.0, 1.1, 10, 1); flagGeo.translate(1.0, 0, 0);
  const flag = new THREE.Mesh(flagGeo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  flag.position.set(0, 12.6, 0); g.add(flag);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(ARRIVE_R * 0.85, 0.16, 8, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, fog: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.6, 70, 20, 1, true), beamMat(color)); beam.position.y = 38; g.add(beam);
  g.userData = { flag, flagGeo, ring, beam, base: flagGeo.attributes.position.array.slice() };
  return g;
}

// ---------- 組裝世界 ----------
export class World {
  constructor(scene, portStyles) {
    this.scene = scene;
    this.sky = makeSky(); scene.add(this.sky);
    this.water = makeWater(); scene.add(this.water);
    this.lands = new THREE.Group();
    for (const L of LANDS) this.lands.add(buildLand(L));
    scene.add(this.lands);
    scene.fog = new THREE.FogExp2(new THREE.Color(HORIZON).lerp(new THREE.Color('#c88aa0'), 0.25), FOG_DENSITY);
    scene.add(new THREE.HemisphereLight('#ffb4cc', '#2a3a66', 1.35));
    const sun = new THREE.DirectionalLight('#ffb878', 2.4);
    sun.position.copy(SUN_DIR).multiplyScalar(100);
    scene.add(sun);
    this.beacons = PORT_DEFS.map((p, i) => {
      const b = makeBeacon(portStyles[i]?.color || '#ff7a59');
      b.position.set(p.x, 0, p.z);
      scene.add(b);
      return b;
    });
    this.windAngle = 0;
  }

  update(time, camera, wind, simplify) {
    this.sky.position.copy(camera.position);
    this.sky.material.uniforms.uTime.value = time;
    const u = this.water.material.uniforms;
    // 波浪傳播方向 = 風吹去的方向(來向 + 180°),以 xz 平面角度表示
    const toward = (wind.from + 180) * Math.PI / 180;
    const target = Math.atan2(-Math.cos(toward), Math.sin(toward));
    this.windAngle = target;
    u.uTime.value = time; u.uAngle.value = target;
    u.uAmp.value = 0.55 + wind.kn / 22;
    u.uWind.value.set(Math.sin(toward), -Math.cos(toward)); u.uWindKn.value = wind.kn;
    this.water.position.set(camera.position.x, 0, camera.position.z);
    for (const b of this.beacons) {
      const d = b.userData;
      d.beam.material.uniforms.uTime.value = time;
      const s = 1 + Math.sin(time * 2.4) * 0.03;
      d.ring.scale.set(s, s, 1);
      // 旗幟隨風飄
      const p = d.flagGeo.attributes.position, base = d.base;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        p.setZ(i, Math.sin(x * 2.3 - time * 5.0) * 0.28 * (x / 2.0));
      }
      p.needsUpdate = true;
      // 旗面朝向風去的方向
      d.flag.rotation.y = Math.PI / 2 - (wind.from + 180) * Math.PI / 180;
    }
  }
}
