# Logan 的航海日誌

互動式自我介紹網站。駕駛帆船沿台灣海岸航行,每個港口是一個內容區塊。純靜態網站,不需要打包,可直接放 GitHub Pages。

## 如何修改內容
- 所有文字、照片、影片都在 `js/content.js`。標記 `pending: true` 的段落會顯示「待補」,填好後改成 `false`。
- 照片放進 `photos/`(建議先壓成 WebP,寬 1600px 以內,每張 300KB 以下),在 `content.js` 的 `gallery.items` 填 `{ src: 'photos/檔名.webp', caption: '說明' }`。
- 影片先上傳 YouTube,在 `videos.items` 填 `{ id: '影片ID', title: '片名', desc: '一句話' }`。

## 本機預覽
直接雙擊 `index.html` 即可(已打包成一般腳本,不需要伺服器)。

## 發布到 GitHub Pages(免費)
1. 在 GitHub 建立新的 repository(例如 `sailing-portfolio`),把這個資料夾的所有檔案推上去。
2. Repository 的 Settings → Pages → Source 選 `Deploy from a branch`,Branch 選 `main`,資料夾選 `/ (root)`。
3. 約一分鐘後網址是 `https://你的帳號.github.io/sailing-portfolio/`。

## 操作
- 電腦:← → 或 A D 轉舵,數字鍵 1 到 7 前往港口,Esc 關閉面板。
- 手機:按住左右按鈕轉舵,點上方港口或畫面上的標籤自動航行,拖曳畫面轉動視角,點羅盤改變風向。
- 右上角「文字版」是純文字瀏覽模式,載入快,也方便無法使用 3D 的裝置。

## 技術
Three.js r170 已打包進 `js/app.js`。網站載入的只有 `js/content.js`(你要改的內容)和 `js/app.js`(程式)。
`js/` 裡的 `main.js`、`world.js`、`boat.js`、`sim.js`、`geo.js`、`ui.js` 是 `app.js` 的原始碼,瀏覽器不會直接載入。修改 3D 程式後需要重新打包:
```
npm i three esbuild
npx esbuild js/main.js --bundle --minify --format=iife --outfile=js/app.js
```
(`js/vendor/` 目前沒有用到,可刪除。)

## 操作說明（新版）
- 上方港口按鈕：快速抵達（約 3 秒航行後進入港口）；地圖上的港口標籤：完整航行過去。
- V：切換視角（後方追隨／後方俯瞰／船上）。F：下錨／起錨。S：施放球帆（順風時可用）。
- ♻ 任務：靠近海灘，小艇載小人上岸撿垃圾；偶爾會有海豚出現。
- 左側小地圖：點一下開全景地圖，可直接點港口前往。
- 燈塔使用 GLB 燈塔模型烘焙成的資料（js/lighthouse-data.js），不需要在網頁上載入 GLB，直接開檔或 GitHub Pages 都能用。
- 開場教學圖在 img/，若介面改版，可重新截圖覆蓋同名檔案。
