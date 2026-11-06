# 企業教育訓練平台

直營與加盟訓練儀表板、學員歷史查詢、線上訓練平台。
使用 React + Vite + Tailwind CSS，資料即時讀取自 Google 試算表（已發佈為 CSV）。

## 虛擬資料預覽模式

目前預設使用內建虛擬資料（`src/data/demoData.ts`），不會連線 Google 試算表，方便調整畫面。
切換方式：修改 `src/data/config.ts`

```ts
export const USE_DEMO_DATA = true;   // true：虛擬資料　false：讀取真實 Google 試算表
```

正式發布前請改成 `false`。虛擬資料的姓名、成績都是隨機產生的範例。

## 登入與密碼管理

開啟網址會先看到登入頁，輸入密碼後才會出現側邊選單。密碼與可看頁面由 Google 試算表的「教育訓練管理權限」分頁管理（`src/data/auth.ts` 的 `ACCOUNT_GID`）：

| 使用者 | 密碼 | 線上訓練平台 | 直營訓練儀表板 | 加盟訓練儀表板 | 學員歷史查詢 |
|---|---|---|---|---|---|
| 管理員 | （自訂） | ☑ | ☑ | ☑ | ☑ |

- 新增或修改一列即可新增帳號或調整密碼，核取方塊打勾的頁面才會出現在該使用者的選單。
- 欄位名稱需與上表一致；密碼相同時以最上面一列為準。
- 重新整理頁面後，系統會用試算表最新內容重新驗證；關閉瀏覽器分頁後需重新登入。
- 預覽模式（`USE_DEMO_DATA = true`）測試密碼：admin、super、store、learn。

> 注意：這是前端驗證。試算表為「發佈到網路」，密碼欄位技術上任何知道連結的人都讀得到，適合擋一般瀏覽，不適合保護高機密資料。

## 控制課程是否顯示（是否開課）

「課程與考試清單」分頁新增一欄 **是否開課**（核取方塊）。打勾（TRUE）的課程才會顯示在網頁上，未打勾的會隱藏；試算表沒有這一欄時，全部課程都會顯示。
個別學員的歷史紀錄不受這個欄位影響。

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
