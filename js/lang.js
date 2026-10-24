// Language selection (default English) + UI strings + static text of index.html.
(() => {
  let L = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const s = localStorage.getItem('lang');
    if (q === 'zh' || q === 'en') { L = q; localStorage.setItem('lang', q); } else if (s === 'zh' || s === 'en') L = s;
  } catch (e) { const q = new URLSearchParams(location.search).get('lang'); if (q === 'zh') L = 'zh'; }
  window.LANG = L;
  const zhC = window.CONTENT;
  window.CONTENT = L === 'zh' ? zhC : window.CONTENT_EN;
  if (L === 'en') window.CONTENT.SITE.name = 'Hao-Che Chang';
  document.documentElement.lang = L === 'zh' ? 'zh-Hant' : 'en';

  const S = {
    zh: {
      hello: (s) => `我是${s.name}（${s.nick}）。`,
      anchorUp: '起錨', anchorDown: '下錨', anchored: '已下錨，船停在這裡', weighed: '起錨了！', needWeigh: '先起錨，才能升球帆',
      needDownwind: '球帆要順風才能升：把船轉到風從船尾後方吹來', spinUp: '球帆升起！順風跑得更快', spinDown: '球帆收起',
      cams: ['後方', '俯瞰', '船上'], cam: (n) => `視角：${n}`,
      goto: (n, d) => `前往 ${n} · ${d} 公里`, fadeGo: (n) => `前往 ${n}⋯`, next: (n) => `前往下一站：${n} ⛵`,
      anchoredHint: '已下錨。可以派小人上岸清垃圾，或按住 ◀ ▶ 起錨出發', startHint: '點上方港口快速抵達，或按住 ◀ ▶ 自己開',
      trash: ['寶特瓶', '塑膠袋', '廢棄漁網', '保麗龍'], picked: (n, c) => `撈起 ${n}，已清除 ${c} 件`,
      crewGo: '小人划小艇上岸清垃圾中⋯', crewStart: '小人出發了！', sorting: (a) => `小人整理中 ${a}/3`,
      beachDone: (n, kg) => `${n}的海灘清乾淨了！累計 ${kg} 公斤`, allDone: '全部清完了！這就是我想在 In the Same Boat 做的事',
      score: (c, t, kg) => `已清除 ${c}/${t} 件，約 ${kg} 公斤。海上漂浮物撈一撈，海灘要下錨後派小人上岸`,
      dolphin: '🐬 海豚！看看船的側邊', wind60: '風向轉了 60°，看看帆和船速怎麼變', spinCollapsed: '風太靠前方，球帆塌了，已收起',
      winds: ['北', '東北', '東', '東南', '南', '西南', '西', '西北'], windTxt: (d, k) => `${d}風 ${k} 節`, speedTxt: (v) => `船速 ${v} 節`,
      ready: '準備好了，出海吧！', noWebgl: 'WebGL 無法使用，已切換到文字版',
      goBtn: (n) => `前往 ${n} ⛵`, windLabel: '風向', zoom: '放大照片',
      langBtn: 'EN', langTitle: 'Switch to English',
    },
    en: {
      hello: (s) => s.hello,
      anchorUp: 'Weigh', anchorDown: 'Anchor', anchored: 'Anchored. The boat stays here.', weighed: 'Anchor up!', needWeigh: 'Weigh anchor before hoisting the spinnaker',
      needDownwind: 'The spinnaker needs a downwind course: turn the boat so the wind comes from behind', spinUp: 'Spinnaker up! Faster downwind', spinDown: 'Spinnaker down',
      cams: ['Behind', 'Above', 'On deck'], cam: (n) => `View: ${n}`,
      goto: (n, d) => `To ${n} · ${d} km`, fadeGo: (n) => `Heading to ${n}…`, next: (n) => `Next stop: ${n} ⛵`,
      anchoredHint: 'Anchored. Send the crew ashore to clean up, or hold ◀ ▶ to set off', startHint: 'Tap a port above to arrive quickly, or hold ◀ ▶ to sail yourself',
      trash: ['a plastic bottle', 'a plastic bag', 'a fishing net', 'a piece of foam'], picked: (n, c) => `Picked up ${n}. ${c} items cleared`,
      crewGo: 'The crew is rowing ashore to clean up…', crewStart: 'The crew is off!', sorting: (a) => `Crew sorting litter ${a}/3`,
      beachDone: (n, kg) => `${n} beach is clean! Total ${kg} kg`, allDone: 'All clean! This is what I would like to do with In the Same Boat',
      score: (c, t, kg) => `${c}/${t} items cleared, about ${kg} kg. Sail up to floating litter to pick it up. For beaches, anchor and send the crew ashore`,
      dolphin: '🐬 Dolphins! Look beside the boat', wind60: 'The wind turned 60°. Watch how the sails and boat speed change', spinCollapsed: 'The wind is too far forward. The spinnaker collapsed and was lowered',
      winds: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], windTxt: (d, k) => `${d} wind ${k} kn`, speedTxt: (v) => `Speed ${v} kn`,
      ready: 'Ready. Let us go to sea!', noWebgl: 'WebGL is not available. Switched to the text version',
      goBtn: (n) => `Go to ${n} ⛵`, windLabel: 'Wind', zoom: 'Enlarge photo',
      langBtn: '中文', langTitle: '切換為中文',
    },
  };
  window.T = S[L];

  const q = (s) => document.querySelector(s);
  const set = (s, v, attr) => { const e = q(s); if (!e) return; if (attr) e.setAttribute(attr, v); else e.innerHTML = v; };
  if (L === 'en') {
    document.title = "Logan's Sailing Log";
    set('meta[name=description]', 'Hao-Che Chang (Logan): an interactive self-introduction. Sail a boat along the coast of Taiwan and meet one side of me at each port.', 'content');
    set('meta[property="og:title"]', "Logan's Sailing Log", 'content');
    set('meta[property="og:description"]', 'Sail along the coast of Taiwan and meet one side of me at each port.', 'content');
    set('.brand span', 'Sailing Log');
    set('#btn-simple', 'Text version');
    set('#chips', '', null); q('#chips').setAttribute('aria-label', 'Ports');
    set('#mini', 'Open the full map', 'aria-label'); set('#mini b', 'Map');
    set('#bigmap', 'Full map', 'aria-label'); set('.bm-card > p', 'You are here · Full map');
    set('#bmInfo', '<b>Tap a port to see why I want to volunteer</b>'); set('.bm-card > small', 'Tap outside to close');
    set('#score', 'Litter cleared', 'aria-label');
    set('#btn-cam', 'Change view', 'aria-label'); set('#btn-cam b', 'Behind');
    set('#btn-anchor', 'Anchor or weigh', 'aria-label'); set('#btn-anchor b', 'Anchor');
    set('#btn-spin', 'Hoist or lower the spinnaker', 'aria-label'); set('#btn-spin b', 'Spinnaker');
    set('#btn-clean', 'Send the crew ashore to clean up', 'aria-label'); set('#btn-clean b', 'Ashore');
    set('#hud', 'Wind compass. Tap to change the wind', 'aria-label'); set('#hWind', 'Wind --'); set('#hSpeed', 'Speed --');
    set('#statusText', 'Sailing automatically'); set('#btn-skip', 'Arrive now'); set('#btn-stop', 'Cancel');
    set('#steerL', 'Steer left', 'aria-label'); set('#steerR', 'Steer right', 'aria-label'); set('#pClose', 'Close', 'aria-label');
    set('#btn-next-pg', 'Next →'); set('#btn-intro-simple', 'Read the text version');
    set('.tut-h', 'Quick start <span>Swipe to see 5 steps</span>');
    const li = document.querySelectorAll('.howto li');
    if (li[0]) li[0].innerHTML = '<b>◀ ▶</b> Hold to steer. Release to keep your heading';
    if (li[1]) li[1].innerHTML = '<b>Wind</b> You cannot sail straight into the wind. Zigzag instead';
    const caps = [
      ['Tap a port', '<b>1 · Quick start</b>Tap a port above and arrive in about 3 seconds. Tap a port label at sea to sail there for real.'],
      ['Anchor button', '<b>2 · Anchor</b>Tap ⚓ on the right to stop. Tap again, or steer, to weigh anchor.'],
      ['Broom button', '<b>3 · Clean the beach</b>Anchor near a beach and a 🧹 button appears. Tap it and the crew rows ashore.'],
      ['Crew on the beach', '<b>4 · Back on board</b>The crew picks up the piles one by one and returns. Floating litter is picked up by sailing close.'],
      ['Full map', '<b>5 · The map</b>Tap the small map on the left to open the full map. The orange arrow is you. Tap a port to go there.'],
    ];
    document.querySelectorAll('.tut figure').forEach((f, i) => { if (!caps[i]) return; const im = f.querySelector('img'); im.alt = caps[i][0]; im.src = im.getAttribute('src').replace('.jpg', '.en.jpg'); f.querySelector('figcaption').innerHTML = caps[i][1]; });
    set('.tut-nav.prev', 'Previous', 'aria-label'); set('.tut-nav.next', 'Next', 'aria-label');
    set('#btn-start', 'Set sail ⛵'); set('#btn-prev-pg', '← Back'); set('#loading', 'Preparing the sea…');
    set('#btn-back', '⛵ Back to sailing');
    set('noscript p', 'This website needs JavaScript. Hao-Che Chang (Logan), Email: sdisuper3125@gmail.com');
  }
  // language switch buttons (header + intro)
  const mk = (cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = window.T.langBtn; b.title = window.T.langTitle; b.setAttribute('data-lang-btn', ''); b.onclick = () => { const n = L === 'en' ? 'zh' : 'en'; try { localStorage.setItem('lang', n); } catch (e) {} const u = new URL(location.href); u.searchParams.set('lang', n); location.href = u.toString(); }; return b; };
  const bar = q('#top .bar'); if (bar) bar.insertBefore(mk('ghost lang'), q('#btn-simple'));
  const card = q('.intro-card'); if (card) card.insertBefore(mk('ghost dark lang intro-lang'), card.firstChild);
})();
