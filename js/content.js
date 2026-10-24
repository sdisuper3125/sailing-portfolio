// ============================================================
//  網站內容都在這個檔案。直接改文字、放照片路徑、貼影片 ID 即可。
//  區塊：p 段落、h 小標、photo 單張照片、gallery 照片牆、videos 影片。
//  照片放進 photos/ 資料夾，src 寫成 'photos/檔名.webp'。
//  影片：YouTube 填 id，Google Drive 填 drive（檔案網址 /d/ 後面那串）。
// ============================================================

const SITE = {
  name: '張皓哲',
  nick: 'Logan',
  en: 'Hao-Che Chang',
  title: 'Logan 的航海日誌',
  subtitle: 'Logan 的航海日誌',
  intro: '現在住在台灣，在研究所學永續與氣候，也在學開帆船。',
  what: '這個網站是一艘帆船，沿著台灣的海岸航行。每到一個港口，我會說說做過的事，以及在海上學到的東西。',
  portrait: 'photos/portrait.webp',
  contact: [
    { label: 'Email', value: 'sdisuper3125@gmail.com', href: 'mailto:sdisuper3125@gmail.com' },
  ],
};

// 每個港口：位置在 geo.js(PORT_DEFS,順序要相同）,這裡放名稱與內容
const PORTS = [
  {
    id: 'keelung', hook: '現在的我', vol: '我還在學，也樂意和大家一起把事情做完。', name: '基隆', en: 'Keelung', tag: '我是誰', color: '#ff7a59', emoji: '👋',
    title: '嗨，我是 Logan',
    lead: '朋友都叫我 Logan。',
    blocks: [
      { type: 'p', text: '我今年 24 歲，我的學生生涯圍繞著永續、能源，以及海洋。' },
      { type: 'p', text: '我喜歡動手試，遇到問題會想辦法解決，也很喜歡學新東西。我重視長期的關係，和價值觀相近的人相處最自在。' },
      { type: 'p', text: '高中的時候我加入台灣青年氣候聯盟，這是在台灣推動青年氣候行動的主要組織。這成為我關注氣候與永續的起點。' },
      { type: 'p', text: '這使得我前往不同產業實習，看不同背景的專家如何思考永續。' },
      { type: 'p', text: '現在我在台灣中山大學當碩士生，研究永續金融。在這之前，我曾就讀政治系，也曾在國立台灣大學研究氣候倡議與行動中的漂綠，期待未來以資本的力量為這個世界做到小小的改變。' },
      { type: 'p', text: '目前我也在社區的基金會當志工，教經濟弱勢的小朋友英文、數學、中文、歷史和地理，也常和他們分享課業以外的知識。' },
      { type: 'p', text: '我的體質不太會暈船。在船上生活的時候，我特別留意每個人的私人空間和隱私，大家在小地方生活，我想這是很重要的事情。' },
    ],
  },
  {
    id: 'hualien', hook: '為什麼想加入', vol: '海是我一直想靠近的地方。', name: '花蓮', en: 'Hualien', tag: '志工動機', color: '#ff8fa3', emoji: '⚓',
    title: '申請 ITSB 志工的動機',
    lead: '我想把學到的帆船和永續，放到真正需要的地方。',
    blocks: [
      { type: 'p', text: '我喜歡海。我持有 24 公尺以下的船舶駕駛執照，去年夏天，我和一群大學生開著三艘 J80 帆船橫渡台灣海峽到澎湖，我擔任其中一艘的船長。那趟航程之後，我更相信：親手認識海，是改變人和海之間關係的起點。' },
      { type: 'p', text: '在台灣，很多人和海的距離比想像中遠，有時候只是因為從來沒有真正靠近過。我自己也是在大學加入帆船社之後，才慢慢知道海上是什麼樣子。' },
      { type: 'p', text: '我也寫劇本，並且喜歡用空拍看海岸線。有一次為了替紀錄片到離島勘景，我親眼看到越界作業的抽砂船、非法捕魚，還有大量的海洋廢棄物落在當地的海岸和漁場。環境的破壞從那時候開始，不再只是遠方的數據。' },
      { type: 'p', text: '我的學習也一路往這個方向走。我從高中開始關注氣候，後來讀政治、全球治理，現在讀永續金融。我的碩士論文分析台灣與日本五千家企業在加入國際氣候倡議之後，碳排放是否有改善。我在意的是承諾有沒有變成可以衡量的行動。' },
      { type: 'p', text: '我也相信資金的流向會影響整個產業。所以我想走進永續金融，希望有一天資本能成為保護海洋的力量。要判斷什麼樣的資金真的有幫助，我想先親眼看見海上發生了什麼，也親手做過這些清理的工作。這是我想加入 In the Same Boat 的主要原因。' },
      { type: 'p', text: '至於船上的生活，我知道空間有限的時候，一個人的疏忽會影響全船：東西用完放回原位，輪值和雜務主動分擔，累的時候也讓別人好好睡。過去六年我在台北經營民宿，接待過一千五百多位旅人，早期從接待到打掃都是自己來，習慣把沒有人會注意的細節做好。' },
      { type: 'p', text: '我也在準備一個關於航海的 Instagram 帳號，想讓更多台灣的年輕人認識帆船和海洋。回到台灣之後，我希望能繼續推動海洋廢棄物與帆船的教育。我還有很多要學，也很樂意依照你們的方式，和大家建立默契。' },
    ],
  },
  {
    id: 'kaohsiung', hook: '我的興趣', vol: '氣候、永續和航海之外，我也有很多日常。', name: '高雄', en: 'Kaohsiung', tag: '我的興趣', color: '#ff6fa3', emoji: '🎻',
    title: '我的興趣',
    lead: '氣候、永續和航海之外，',
    blocks: [
      { type: 'pp', text: '我喜歡下廚，也做甜點。我有一輛電動輔助的單車，常騎著它探索台北。', pics: [{ src: 'photos/bike-bridge.webp', caption: '騎單車' }] },
      { type: 'p', text: '我喜歡古典樂，也會聽流行音樂。我也喜歡看展覽和逛美術館，有機會到一座城市，就會去找當地的美術館，常常會有有趣的發現。' },
      { type: 'p', text: '我曾經擔任兼職編劇，幫忙撰寫 4 部 VR 影片和 1 部紀錄片的腳本。那部紀錄片的主題是台灣的海洋島嶼生態，以及即將消失的文化。' },
      { type: 'link', text: '觀看紀錄片（YouTube）', href: 'https://youtu.be/HjLSHkGtFJY?si=ExcBXcH9bHnirvu0' },
      { type: 'p', text: '我也關注國際政治與能源政策議題，這也是我的學習主題之一。' },
    ],
  },
  {
    id: 'taitung', hook: '2027 春季，NHH 交換', vol: '明年一月，我會在挪威開始交換。', name: '台東', en: 'Taitung', tag: '挪威交換', color: '#8e6bd6', emoji: '🇳🇴',
    title: '挪威交換',
    lead: '2027 春季，挪威經濟學院（NHH）交換。',
    blocks: [
      { type: 'p', text: '我即將在 2027 年 1 月開始在 NHH 交換。除了希望更了解挪威政府的永續管理政策，我也想趁這個機會感受挪威的自然與人文風光。' },
      { type: 'p', text: '2027 春季學期預計在六月中結束，宿舍可以住到 7 月。我會取得 1 月到 7 月的學生學習許可與居留證。' },
      { type: 'p', text: '我會上學校的基礎挪威語課程，也想去健行。航海方面，我計畫回到克羅埃西亞的 NYS，完成 RYA Skipper 證照，也想參加 NHH 的帆船社。' },
    ],
  },
  {
    id: 'penghu', hook: '海教我的事', vol: '那是我第一次在船上住上一整個星期。', name: '澎湖', en: 'Penghu', tag: '航海', color: '#2fb7a3', emoji: '⛵',
    title: '海教我的事',
    lead: '我不是很專業的船長，但我很喜歡待在海上的感覺。',
    blocks: [
      { type: 'p', text: '我第一次接觸到帆船，是在大學的帆船社。在台灣，帆船是很小眾的休閒活動，大部分人也不太有機會接觸到帆船。' },
      { type: 'p', text: '我們一開始在出海口附近學習駕駛帆船，從 Hunter 17、RS Tera 開始，每個週末去練船。經過一年，我成為社團裡少數仍持續練習的成員，也逐漸體會到航海的樂趣。' },
      { type: 'pp', text: '後來，我開始在台灣近海參與 J80 帆船的沿岸航行，學習放球帆，和大家合作參加帆船賽，感受到帆船上團隊合作與溝通的重要性。', pics: [{ src: 'photos/spinnaker.webp', caption: '帆船賽' }] },
      { type: 'p', text: '2025 年的夏天，我們一群學生決定做些有趣的事情：開著 J80 橫渡台灣海峽。我們努力獲得學校的支持、對外募款、爭取新聞報導，順利出發了。那是我第一次擔任長距離航行的船長，航海帶來的未知與挑戰，讓我對大海更具敬畏之心。' },
      { type: 'link', text: '成大 SDG 網站：J80 橫渡台灣海峽的報導', href: 'https://sdg.ncku.edu.tw/product-944.html' },
      { type: 'p', text: '冬季，我當船員，從台灣北部航行到南部，感受到東北季風的強勁，也增加了夜間航行的經驗。' },
      { type: 'pp', text: '2026 年夏天，我很幸運被遴選參加台灣政府的培訓計畫，到克羅埃西亞參加航海訓練，也參觀了坎城遊艇展。在克羅埃西亞，我和五位學生與一位教練，一起在一艘 Salona 46 帆船上住了七天。我們從 Split 出發，前往 Hvar 島、Vis 島與 Šolta 島，全程大約 130 海里。', pics: [{ src: 'photos/fleet.webp', caption: '第一天出航' }, { src: 'photos/helm.webp', caption: '掌舵' }] },
      { type: 'p', text: '這是我第一次在帆船上和陌生人共同度過那麼多天，是很奇妙的體驗。船上的空間很有限，人們需要充分為彼此考量，並且尊重隱私與個人空間。' },
      { type: 'h', text: '一分鐘的短片' },
      { type: 'p', text: '我把這趟航行拍成四支一分鐘的短片，從台灣出發，到克羅埃西亞，再到坎城。' },
      { type: 'videos', vertical: true, items: [
        { drive: '1ODoEXDpCMOjpobtZ_sBbMADr0BU9FHHe', poster: 'photos/ep1.webp', title: 'EP1　台灣，我們的起點', desc: '台灣人為什麼離海這麼遠。' },
        { drive: '1rLsi-S7ldKGl4xb9QaryTbeQ-ef1o_P-', poster: 'photos/ep2.webp', title: 'EP2　克羅埃西亞，出航', desc: '帆船怎麼操作，船上的人怎麼分工。' },
        { drive: '14J9RgCdp6bd903ctdz0OyEm3rxw61Rgo', poster: 'photos/ep3.webp', title: 'EP3　他們怎麼把海變成生意', desc: '租一艘船一個禮拜要多少錢。' },
        { drive: '13eLNWCjzWpKJ8iEmima0l1BUA-85wjdU', poster: 'photos/ep4.webp', title: 'EP4　坎城遊艇展', desc: '歐洲最大的船展現場。' },
      ] },
    ],
  },
  {
    id: 'tamsui', hook: '學習、實習與永續', vol: '做過幾份不同的工作，也開過一間民宿。', name: '淡水', en: 'Tamsui', tag: '學習與實習', color: '#ffb347', emoji: '📚',
    title: '學習、實習與永續',
    lead: '我念書的同時，也到不同的地方實習，想看看大家怎麼思考永續。',
    blocks: [
      { type: 'p', text: '我大學念政治系，後來進入台灣大學國家發展研究所。論文研究企業加入跨國氣候倡議之後，碳排放強度有沒有跟著改變，資料來自彭博終端機，涵蓋台灣和日本的上市公司。現在我在中山大學念數位與永續金融，研究企業的永續金融與機構評分。' },
      { type: 'link', text: '台大學術典藏：我的論文', href: 'https://tdr.lib.ntu.edu.tw/handle/123456789/102207' },
      { type: 'p', text: '在台大期間，我很關心青年與世代永續，也曾和 B 型企業歐萊德的董事長對談。' },
      { type: 'link', text: '台大社科院活動紀錄：與歐萊德對談', href: 'https://rsprc.ntu.edu.tw/web/events/events_in.jsp?lang=tw&np_id=NP1734071833903' },
      { type: 'p', text: '最早的一份實習是光寶科技的 CSR 實習，主要是和非營利組織往來，維持各方的溝通。2022 年春天，我到新北市政府實習，整理電力需求和淨零路徑，最後向市長簡報。那年夏天，我到焚化廠兩個月，理解垃圾處理的流程，也讀台灣廢棄物政策一路的演變，並向總經理報告新的永續事業想法。' },
      { type: 'p', text: '2022 年秋天，我到 KPMG 做永續顧問實習，接觸到 ESG 如何在企業內部興起，以及全球的氣候行動與倡議。2024 年暑假，我到中國廣東省的深圳證券交易所，用量化方法研究台灣的證券市場。' },
      { type: 'pp', text: '2026 年春天，我在美國國務院下轄的美國在台協會，協助修訂戰時與災害情境的危機管理計畫。', pics: [{ src: 'photos/ait.webp', caption: '實習期間' }] },
      { type: 'h', text: '除了實習' },
      { type: 'p', text: '2019 年，我把家裡閒置的房子整修成民宿，和當地的茶產業放在一起。它後來入選 Airbnb 台北十大推薦民宿，累積了 21 次 Superhost 和超過 1,500 位旅客。訂房管理、打掃、接待、緊急事件，這些小事陪我度過六年的學生時光。2025 年 12 月，我搬到南台灣，結束了這段經營。' },
      { type: 'h', text: '技能與證照' },
      { type: 'p', text: '我比較熟悉的是 ESG、再生能源議題和公共政策。證照有 CFA ESG Investing、Bloomberg ESG、GRI 2021 Update、SGS ISO 14064-1 查證員，以及節能專業級證書。航海方面，我持有小型船舶駕駛執照。' },
    ],
  },
  {
    id: 'wuqi', hook: '照片裡的航行日常', vol: '把看到的海，用照片帶回來。', name: '梧棲', en: 'Wuqi', tag: '照片集', color: '#9bd45a', emoji: '📷',
    title: '鏡頭裡的海與日常',
    lead: '海、實習、旅行和日常。點一張照片可以放大，左右滑動看下一張。',
    blocks: [
      { type: 'gallery', items: [
        { src: 'photos/hvar.webp', caption: '從古堡看赫瓦爾島' },
        { src: 'photos/meal.webp', caption: '船上煮的晚餐' },
        { src: 'photos/dinghy.webp', caption: '橡皮艇' },
        { src: 'photos/night-watch.webp', caption: '夜間值班' },
        { src: 'photos/sunset-ship.webp', caption: '海上夕陽' },
        { src: 'photos/sunset-marina.webp', caption: '碼頭日落' },
        { src: 'photos/tunnel.webp', caption: '維斯島的軍事隧道' },
        { src: 'photos/wreck.webp', caption: '水深十公尺的戰機殘骸' },
        { src: 'photos/ferry.webp', caption: '斯普利特之門的渡輪' },
        { src: 'photos/cannes.webp', caption: '坎城遊艇展' },
        { src: 'photos/ifrs.webp', caption: '法蘭克福：IFRS 基金會' },
        { src: 'photos/kfw.webp', caption: '法蘭克福：KfW' },
        { src: 'photos/monaco.webp', caption: '摩納哥港' },
        { src: 'photos/antibes.webp', caption: '歐洲小鎮的街道' },
        { src: 'photos/cockpit.webp', caption: '雙體帆船的駕駛艙' },
        { src: 'photos/galley.webp', caption: '船上廚房' },
        { src: 'photos/spinnaker.webp', caption: '帆船賽的紅色大帆' },
        { src: 'photos/penghu-regatta.webp', caption: '2025 澎湖帆船賽' },
        { src: 'photos/sail-taiwan.webp', caption: '帆船上' },
        { src: 'photos/cat-helm.webp', caption: '雙體帆船掌舵' },
        { src: 'photos/race-red.webp', caption: '帆船賽' },
        { src: 'photos/plant-control.webp', caption: '焚化廠中控室實習' },
        { src: 'photos/kpmg.webp', caption: 'KPMG 實習' },
        { src: 'photos/szse.webp', caption: '深圳證券交易所' },
        { src: 'photos/karst.webp', caption: '桂林山水' },
        { src: 'photos/cormorant.webp', caption: '夜晚的魚鷹捕魚' },
        { src: 'photos/microlight.webp', caption: '空中看山水' },
        { src: 'photos/kyoto.webp', caption: '京都' },
        { src: 'photos/pumpkin.webp', caption: '直島的紅南瓜' },
        { src: 'photos/berlin.webp', caption: '柏林' },
        { src: 'photos/rome.webp', caption: '羅馬' },
        { src: 'photos/bike-riverside.webp', caption: '河邊騎單車' },
        { src: 'photos/bike-keelung.webp', caption: '基隆港邊' },
        { src: 'photos/hiking.webp', caption: '健行' },
        { src: 'photos/bodyboard.webp', caption: '海邊衝浪' },
        { src: 'photos/beach-tree.webp', caption: '安靜的海灘' },
        { src: 'photos/sunset-sail.webp', caption: '帆船上的夕陽' },
        { src: 'photos/j80.webp', caption: 'J80 帆船' },
      ] },
    ],
  },
];

window.CONTENT = { SITE, PORTS };
