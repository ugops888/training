# 企業教育訓練平台

直營與加盟訓練儀表板、學員歷史查詢、線上訓練平台。
使用 React + Vite + Tailwind CSS，資料由 Google Apps Script 後端驗證登入後，從 Google 試算表讀取。

## 虛擬資料預覽模式

目前預設使用內建虛擬資料（`src/data/demoData.ts`），不會連線後端，方便調整畫面。
切換方式：修改 `src/data/config.ts`

```ts
export const USE_DEMO_DATA = true;   // true：虛擬資料　false：登入後從 Apps Script 後端讀取真實資料
```

正式發布前請改成 `false`，並在同一個檔案填入 `APPS_SCRIPT_URL`。虛擬資料的姓名、成績都是隨機產生的範例。

## 登入與密碼管理

開啟網址會先看到登入頁，輸入密碼後才會出現側邊選單。密碼與可看頁面由 Google 試算表的「教育訓練管理權限」分頁管理：

| 使用者 | 密碼 | 線上訓練平台 | 直營訓練儀表板 | 加盟訓練儀表板 | 學員歷史查詢 |
|---|---|---|---|---|---|
| 管理員 | （自訂） | ☑ | ☑ | ☑ | ☑ |

- 新增或修改一列即可新增帳號或調整密碼，核取方塊打勾的頁面才會出現在該使用者的選單。
- 欄位名稱需與上表一致；密碼相同時以最上面一列為準。
- 驗證與資料讀取都由 Google Apps Script 後端處理，**試算表不需要、也不應該「發佈到網路」**。安裝步驟見 `apps-script/安裝說明.md`。
- 預覽模式（`USE_DEMO_DATA = true`）不連後端，測試密碼：admin、super、store、learn。

## 控制課程是否顯示（是否開課）

「課程與考試清單」分頁新增一欄 **是否開課**（核取方塊）。打勾（TRUE）的課程才會顯示在網頁上，未打勾的會隱藏；試算表沒有這一欄時，全部課程都會顯示。
個別學員的歷史紀錄不受這個欄位影響。

### 依登入身分決定看得到哪些課程

在同一個分頁再加幾欄，欄位名稱與「教育訓練管理權限」分頁的「使用者」名稱相同（例如 管理員、督導、店長、學員），每門課用核取方塊決定該身分看不看得到：

| 是否開課 | 課程名稱 | … | 管理員 | 督導 | 店長 | 學員 |
|---|---|---|---|---|---|---|
| ☑ | 10.店長領導力 | … | ☑ | ☑ | ☑ | ☐ |

- 沒打勾的課程，該身分在線上訓練平台與儀表板都看不到，教材連結也不會送到他的瀏覽器（由後端過濾）。
- 沒有某個身分的欄位時，該身分看得到全部課程。
- 「是否開課」仍是總開關，未打勾時所有身分都看不到。
- 新增身分時，在課程清單加一欄同名欄位即可。
- 學員歷史查詢的考試及格門檻會參考這份清單；某身分看不到的課程，其及格門檻會改用預設值（食安 80、其他 85）。

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

正式模式下，資料由 Apps Script 後端（`apps-script/Code.gs`）依登入身分從 Google 試算表讀取。各分頁的 gid 與可讀取的頁面權限，設定在 `Code.gs` 的 `SHEET_ACCESS`；網站端用到的 gid 在 `src/data/sheetData.ts` 與 `src/data/directData.ts`。
