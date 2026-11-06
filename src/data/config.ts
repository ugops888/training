// true：使用內建虛擬資料（demoData.ts），不連線任何後端，適合預覽與調整畫面。
// false：透過 Google Apps Script 後端登入並讀取真實資料（見 apps-script/安裝說明.md）。
export const USE_DEMO_DATA = false;

// 部署 Apps Script 網頁應用程式後取得的網址（以 /exec 結尾）。USE_DEMO_DATA 為 false 時必填。
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOi1PciqTb59ndcHa870KuNPJSgTxr9Z8eH9rgR3LXjdPF_0zGUuTRxcAkP4WuCMceIw/exec';

// 品牌 LOGO 與登入畫面圖片：把檔案放進專案的 public 資料夾，檔名與下面一致即可。
// 找不到檔案時，會自動改用預設圖示與插圖。想用別的檔名或格式（例如 logo.svg、login-image.png）就改這裡。
export const LOGO_FILE = 'logo.png';
export const LOGIN_IMAGE_FILE = 'login-image.jpg';
export const LOGIN_IMAGE_RIGHT_FILE = 'login-image-right.jpg'; // 登入畫面右側底圖（放 UG 標誌，表單顯示在標誌下方）

// 左側選單與登入右側的底色，請與 LOGO、右側底圖的綠色一致。
export const BRAND_GREEN = '#008000';

// YouTube 播放器上下各裁掉多少 px：YouTube 在畫面下緣的「稍後觀看」「分享」「更多影片」、上緣的標題列會因此被裁掉看不到。
// 影片本身不受影響；若實測仍看得到這些按鈕就調大，若進度條被裁掉就調小。
export const YT_CLIP_PX = 100;
