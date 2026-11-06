// true：使用內建虛擬資料（demoData.ts），不連線任何後端，適合預覽與調整畫面。
// false：透過 Google Apps Script 後端登入並讀取真實資料（見 apps-script/安裝說明.md）。
export const USE_DEMO_DATA = false;

// 部署 Apps Script 網頁應用程式後取得的網址（以 /exec 結尾）。USE_DEMO_DATA 為 false 時必填。
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOi1PciqTb59ndcHa870KuNPJSgTxr9Z8eH9rgR3LXjdPF_0zGUuTRxcAkP4WuCMceIw/exec';

// 品牌 LOGO 與登入畫面圖片：把檔案放進專案的 public 資料夾，檔名與下面一致即可。
// 找不到檔案時，會自動改用預設圖示與插圖。想用別的檔名或格式（例如 logo.svg、login-image.png）就改這裡。
export const LOGO_FILE = 'logo.png';
export const LOGIN_IMAGE_FILE = 'login-image.jpg';
