// true：使用內建虛擬資料（demoData.ts），不連線任何後端，適合預覽與調整畫面。
// false：透過 Google Apps Script 後端登入並讀取真實資料（見 apps-script/安裝說明.md）。
export const USE_DEMO_DATA = false;

// 部署 Apps Script 網頁應用程式後取得的網址（以 /exec 結尾）。USE_DEMO_DATA 為 false 時必填。
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOi1PciqTb59ndcHa870KuNPJSgTxr9Z8eH9rgR3LXjdPF_0zGUuTRxcAkP4WuCMceIw/exec';
