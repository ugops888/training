# 企業教育訓練平台

直營與加盟訓練儀表板、學員歷史查詢、線上訓練平台。
使用 React + Vite + Tailwind CSS，資料即時讀取自 Google 試算表（已發佈為 CSV）。

## 資料來源設定（正式版）

此版本已設為讀取真實 Google 試算表。設定檔是 `src/data/config.ts`：

```ts
export const USE_DEMO_DATA = false;   // false：讀取真實 Google 試算表　true：改用內建虛擬資料
```

要暫時改用虛擬資料預覽畫面，把它改成 `true` 即可。虛擬資料（`src/data/demoData.ts`）的姓名、成績都是隨機產生的範例。

## 線上訓練平台的教材填法

在「課程與考試清單」分頁新增一欄 **教材網址**（原本的「影片網址」欄位也可以繼續用），每門課可放一個或多個連結，多個連結用換行或空白隔開。系統會依網址自動判斷類型：

| 類型 | 網址範例 |
|---|---|
| YouTube 影片 | `https://www.youtube.com/watch?v=...`、`https://youtu.be/...` |
| Google 雲端硬碟檔案（影片、PDF、圖片都可以） | `https://drive.google.com/file/d/檔案ID/view`，檔案需設為「知道連結的人可檢視」 |
| 圖片 | 網址結尾為 `.jpg` `.png` `.gif` `.webp` 等 |
| PDF | 網址結尾為 `.pdf` |
| 影片檔 | 網址結尾為 `.mp4` `.mov` `.webm` |

所有教材都在頁面內顯示，點擊不會跳到 YouTube 或 Google 雲端硬碟。

## 發布成正式網站（GitHub Pages）

1. 在 GitHub 建立新的倉庫（Repository），例如 `training-platform`。
2. 把這個資料夾的所有檔案上傳到倉庫的 `main` 分支。
   - 網頁上傳：倉庫頁面 → Add file → Upload files，拖入全部檔案（含隱藏的 `.github` 資料夾）。
   - 或用指令：
     ```bash
     git init
     git add .
     git commit -m "first commit"
     git branch -M main
     git remote add origin https://github.com/<帳號>/<倉庫名稱>.git
     git push -u origin main
     ```
3. 到倉庫的 **Settings → Pages**，在 **Source** 選擇 **GitHub Actions**（只需設定一次）。
4. 到 **Actions** 分頁，等「發布到 GitHub Pages」跑完（約 1–2 分鐘）。
5. 網址會是 `https://<帳號>.github.io/<倉庫名稱>/`，也會顯示在 Actions 的部署結果裡。

之後每次推送到 `main`，網站會自動重新發布。

## 自訂網域（選用）

Settings → Pages → Custom domain 填入網域，並在網域商設定 CNAME 指向 `<帳號>.github.io`。

## 在自己電腦執行

```bash
npm install
npm run dev      # 開發預覽
npm run build    # 產生 dist 資料夾
```

## 資料來源

資料來自 `src/data/sheetData.ts` 中的 Google 試算表發佈連結（`PUB_BASE` 與各分頁 `GID`）。
更換試算表時，請在 Google 試算表「檔案 → 分享 → 發佈到網路」發佈為 CSV，再修改這兩處。
發佈後的試算表任何人都能用連結讀取，請勿放入不能公開的個資。
