const { SITE, PORTS } = window.CONTENT;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pend = (p) => (p ? '<span class="pending">✎ 待補</span>' : '');

function block(b) {
  switch (b.type) {
    case 'p':
      return `<p class="${b.pending ? 'is-pending' : ''}">${pend(b.pending)}${esc(b.text)}</p>`;
    case 'facts':
      return `<dl class="facts">${b.items.map((f) => `<div class="${f.pending ? 'is-pending' : ''}"><dt>${esc(f.k)}</dt><dd>${esc(f.v)}${pend(f.pending)}</dd></div>`).join('')}</dl>`;
    case 'timeline':
      return `<ol class="timeline">${b.items.map((t) => `<li class="${t.pending ? 'is-pending' : ''}"><span class="when">${esc(t.when)}</span><strong>${esc(t.title)}</strong><p>${esc(t.desc)}</p>${pend(t.pending)}</li>`).join('')}</ol>`;
    case 'cards':
      return `<div class="cards">${b.items.map((c) => `<div class="card ${c.pending ? 'is-pending' : ''}"><strong>${esc(c.title)}</strong><p>${esc(c.desc)}</p>${pend(c.pending)}</div>`).join('')}</div>`;
    case 'link':
      return `<p class="linkline"><a href="${esc(b.href)}" target="_blank" rel="noopener">${esc(b.text)} ↗</a></p>`;
    case 'h':
      return `<h3 class="sub">${esc(b.text)}</h3>`;
    case 'pp': {
      const pics = (b.pics || []).map((it) => `<figure><button class="tile" data-src="${esc(it.src)}" data-cap="${esc(it.caption || '')}" aria-label="${esc(T.zoom)}"><img loading="lazy" decoding="async" src="${esc(it.src)}" alt="${esc(it.caption || '')}"></button>${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`).join('');
      return `<div class="pp ${b.left ? 'left' : ''}"><p>${esc(b.text)}</p><div class="pics">${pics}</div></div>`;
    }
    case 'photo':
      return `<figure class="photo ${esc(b.cls || '')}"><button class="tile" data-src="${esc(b.src)}" data-cap="${esc(b.caption || '')}" aria-label="${esc(T.zoom)}"><img loading="lazy" decoding="async" src="${esc(b.src)}" alt="${esc(b.caption || '')}"></button>${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    case 'gallery': {
      const real = b.items.map((it, i) => `<button class="tile" data-src="${esc(it.src)}" data-cap="${esc(it.caption || '')}" aria-label="${esc(it.caption || T.zoom)}"><img loading="lazy" decoding="async" src="${esc(it.src)}" alt="${esc(it.caption || '')}"></button>`);
      const ph = real.length ? [] : Array.from({ length: b.placeholders || 6 }, (_, i) => `<div class="tile ph" style="--h:${(i * 47) % 360}"><span>📷<br>照片待補</span></div>`);
      return `<div class="gallery">${[...real, ...ph].join('')}</div>`;
    }
    case 'videos': {
      const real = b.items.map((v) => `<figure class="video"><button class="vplay" ${v.drive ? `data-drive="${esc(v.drive)}"` : `data-id="${esc(v.id)}"`} style="background-image:url(${v.poster ? esc(v.poster) : `https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg`})" aria-label="播放 ${esc(v.title)}"><i></i></button><figcaption><strong>${esc(v.title)}</strong><span>${esc(v.desc || '')}</span></figcaption></figure>`);
      const ph = real.length ? [] : Array.from({ length: b.placeholders || 2 }, () => '<figure class="video"><div class="vplay ph"><span>🎬 影片待補</span></div><figcaption><strong>片名待補</strong><span>一句話介紹</span></figcaption></figure>');
      return `<div class="videos ${b.vertical ? 'vertical' : ''}">${[...real, ...ph].join('')}</div>`;
    }
    default: return '';
  }
}

const volCard = (p) => `<p class="vol-line">${esc(p.vol)}</p>`;
const socialFoot = () => `<div class="social-foot">${SITE.contact.map((c) => `<a href="${esc(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(c.label)}</a>`).join('')}</div>`;
export const renderPort = (p) => volCard(p) + p.blocks.map(block).join('') + socialFoot();

export function renderSimple() {
  const contact = SITE.contact.map((c) => `<a href="${esc(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(c.value)}</a>`).join(' · ');
  return `
    <header class="s-hero">
      <img class="s-portrait" src="${esc(SITE.portrait)}" alt="${esc(SITE.name)}">
      <p class="eyebrow">${esc(SITE.subtitle)}</p>
      <h1>${esc(SITE.name)} <em>${esc(SITE.nick)}</em></h1>
      <p>${esc(T.hello(SITE))}${esc(SITE.intro)}</p>
      <p class="s-contact">${contact}</p>
      <nav class="s-nav">${PORTS.map((p) => `<a href="#s-${p.id}">${p.emoji} ${esc(p.tag)}</a>`).join('')}</nav>
    </header>
    ${PORTS.map((p, i) => `
      <section id="s-${p.id}" style="--accent:${p.color}">
        <div class="s-tag"><span>${p.emoji}</span>${String(i + 1).padStart(2, '0')} · ${esc((p.name + ' ' + p.en).trim())} · ${esc(p.tag)}</div>
        <h2>${esc(p.title)}</h2>
        <p class="lead">${esc(p.lead)}</p>
        ${renderPort(p)}
      </section>`).join('')}
    <footer class="s-foot">${contact}</footer>`;
}

// 事件委派：相片放大、影片點擊才載入
export function bindMedia(root) {
  root.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile[data-src]');
    if (tile) { openLightbox(tile.dataset.src, tile.dataset.cap, tile); return; }
    const d = e.target.closest('.vplay[data-drive]');
    if (d) {
      const f = document.createElement('iframe');
      f.src = `https://drive.google.com/file/d/${d.dataset.drive}/preview`;
      f.allow = 'autoplay; fullscreen'; f.allowFullscreen = true; f.className = 'vplay';
      d.replaceWith(f); return;
    }
    const v = e.target.closest('.vplay[data-id]');
    if (v) {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${v.dataset.id}?autoplay=1&rel=0`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.className = 'vplay';
      v.replaceWith(f);
    }
  });
}

let LB = { list: [], i: 0 };
function showLB() {
  const lb = document.getElementById('lightbox');
  const it = LB.list[LB.i], img = lb.querySelector('img');
  img.classList.remove('swap'); void img.offsetWidth;
  img.src = it.src; img.alt = it.cap || ''; img.classList.add('swap');
  const n = LB.list.length;
  lb.querySelector('figcaption').textContent = (it.cap || '') + (n > 1 ? `  ·  ${LB.i + 1} / ${n}` : '');
  lb.classList.toggle('single', n < 2);
}
function openLightbox(src, cap, tile) {
  const lb = document.getElementById('lightbox');
  const box = tile && tile.closest('.gallery');
  LB.list = box ? [...box.querySelectorAll('.tile[data-src]')].map((t) => ({ src: t.dataset.src, cap: t.dataset.cap })) : [{ src, cap }];
  LB.i = Math.max(0, LB.list.findIndex((x) => x.src === src && (x.cap || '') === (cap || '')));
  lb.hidden = false; document.body.classList.add('lb-open'); showLB();
}
const stepLB = (d) => { const n = LB.list.length; if (n < 2) return; LB.i = (LB.i + d + n) % n; showLB(); };
const closeLB = () => { const lb = document.getElementById('lightbox'); lb.hidden = true; lb.querySelector('img').src = ''; document.body.classList.remove('lb-open'); };
export function initLightbox() {
  const lb = document.getElementById('lightbox');
  const mk = (cls, txt, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = txt; b.setAttribute('aria-label', label); b.onclick = (e) => { e.stopPropagation(); fn(); }; lb.appendChild(b); };
  mk('lb-prev', '‹', 'Previous', () => stepLB(-1));
  mk('lb-next', '›', 'Next', () => stepLB(1));
  mk('lb-close', '✕', 'Close', closeLB);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') closeLB(); });
  lb.querySelector('img').addEventListener('click', (e) => { e.stopPropagation(); stepLB(1); });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) stepLB(dx < 0 ? 1 : -1); }, { passive: true });
  addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'ArrowRight') stepLB(1); else if (e.key === 'ArrowLeft') stepLB(-1); else if (e.key === 'Escape') closeLB(); });
}
