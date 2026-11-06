/**
 * 企業教育訓練平台：後端驗證（Google Apps Script）
 *
 * 用途：
 *   1. 登入：比對「教育訓練管理權限」分頁的密碼，成功才發出有時效的登入憑證（token）。
 *   2. 讀資料：網站每次要資料都帶 token，這裡確認身分與權限後才回傳該分頁內容。
 *
 * 密碼與資料分頁不再「發佈到網路」，不知道密碼的人拿不到任何資料。
 * 安裝步驟請看專案內 apps-script/安裝說明.md
 */

// ===== 設定 =====
var ACCOUNT_GID = 2138174619;   // 「教育訓練管理權限」分頁的 gid（網址最後 gid= 的數字）
var SITE_GID = 266241929;       // 「網站設定」分頁的 gid（放 LOGO 與登入底圖的雲端硬碟連結）
var MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 單張圖片大小上限
var TOKEN_HOURS = 8;            // 登入有效時數
var MAX_FAILS_PER_10MIN = 40;   // 10 分鐘內密碼錯誤總次數上限（超過先暫停登入）

// 欄位名稱（第一列）對應的頁面
var PAGE_HEADERS = {
  '線上訓練平台': 'training',
  '線上學習課程': 'training',
  '直營訓練儀表板': 'direct',
  '加盟訓練儀表板': 'franchise',
  '學員歷史查詢': 'student'
};

var COURSE_LIST_GID = '2124489402'; // 「課程與考試清單」：依身分過濾課程

// 每個資料分頁（gid）可以被哪些頁面權限讀取；沒列在這裡的分頁（包含密碼分頁）一律不提供
var SHEET_ACCESS = {
  '2124489402': ['training', 'direct', 'franchise', 'student'], // 課程與考試清單
  '873785037':  ['direct', 'student'],                          // 員工
  '1715386265': ['direct', 'student'],                          // 考試全紀錄
  '22151113':   ['direct', 'student'],                          // 最新考試成績
  '552384353':  ['direct', 'student'],                          // 課程簽到總表
  '593792740':  ['direct', 'franchise', 'student'],             // 門市對照表
  '1513816467': ['direct', 'franchise', 'student'],             // 課程期對照表
  '1745615764': ['franchise'],                                  // 加盟考試
  '1051538313': ['franchise']                                   // 加盟報名
};

// ===== 進入點 =====
function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.action === 'login') return json_(login_(String(req.password || '')));
    if (req.action === 'siteConfig') return json_(siteConfig_());
    if (req.action === 'siteImage') return json_(siteImage_(String(req.which || '')));
    if (req.action === 'me') return json_(me_(String(req.token || '')));
    if (req.action === 'sheet') return json_(sheet_(String(req.token || ''), String(req.gid || '')));
    return json_({ ok: false, error: '不支援的操作' });
  } catch (err) {
    return json_({ ok: false, error: '伺服器錯誤：' + err });
  }
}

// 用瀏覽器直接開網址時只顯示狀態，不回傳任何資料
function doGet() {
  return json_({ ok: true, message: '教育訓練平台後端運作中' });
}

// ===== 動作 =====
function login_(password) {
  var pw = password.trim();
  if (!pw) return { ok: false, error: '請輸入密碼' };

  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fails') || 0);
  if (fails >= MAX_FAILS_PER_10MIN) {
    return { ok: false, error: '嘗試次數過多，請 10 分鐘後再試', code: 'locked' };
  }

  var accounts = readAccounts_();
  var hash = sha256Hex_(pw);
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].pwHash === hash) {
      return {
        ok: true,
        token: makeToken_(hash),
        role: accounts[i].role,
        pages: accounts[i].pages
      };
    }
  }
  cache.put('fails', String(fails + 1), 600);
  return { ok: false, error: '密碼錯誤，請再試一次', code: 'badpw' };
}

function me_(token) {
  var acc = authenticate_(token);
  if (!acc) return { ok: false, error: '登入已過期，請重新登入', code: 'auth' };
  return { ok: true, role: acc.role, pages: acc.pages };
}

function sheet_(token, gid) {
  var acc = authenticate_(token);
  if (!acc) return { ok: false, error: '登入已過期，請重新登入', code: 'auth' };

  var needed = SHEET_ACCESS[gid];
  if (!needed) return { ok: false, error: '不提供這個分頁', code: 'forbidden' };
  var allowed = needed.some(function (p) { return acc.pages.indexOf(p) >= 0; });
  if (!allowed) return { ok: false, error: '沒有權限讀取這份資料', code: 'forbidden' };

  var sh = findSheet_(Number(gid));
  if (!sh) return { ok: false, error: '找不到分頁 gid=' + gid };
  var rows = sh.getDataRange().getDisplayValues();
  if (gid === COURSE_LIST_GID) rows = filterCourses_(rows, acc.role);
  return { ok: true, rows: rows };
}

// 課程清單若有與「使用者」同名的欄位，只留下該欄打勾的課程；沒有該身分的欄位則全部保留
function filterCourses_(rows, role) {
  if (!role) return rows;
  var hi = -1;
  for (var r = 0; r < Math.min(rows.length, 6); r++) {
    if (rows[r].some(function (c) { return norm_(c) === '課程名稱'; })) { hi = r; break; }
  }
  if (hi < 0) return rows;
  var col = rows[hi].map(norm_).indexOf(norm_(role));
  if (col < 0) return rows;
  return rows.filter(function (row, i) { return i <= hi || isChecked_(row[col]); });
}

// ===== 網站圖片（登入前就要顯示，所以不需要 token；圖片來源只取自「網站設定」分頁） =====
// 分頁格式：A 欄放名稱（首頁畫面底圖 / logo），B 欄放 Google 雲端硬碟圖片連結。
function siteFiles_() {
  var out = { login: null, logo: null };
  var sh = findSheet_(SITE_GID);
  if (!sh) return out;
  var values = sh.getDataRange().getDisplayValues();
  for (var i = 0; i < values.length; i++) {
    var label = norm_(values[i][0]).toLowerCase();
    var id = driveId_(values[i][1]);
    if (!id) continue;
    if (label === '首頁畫面底圖' || label === '登入畫面底圖' || label === '登入圖片') out.login = id;
    else if (label === 'logo' || label === '品牌logo') out.logo = id;
  }
  return out;
}

function driveId_(url) {
  var m = String(url || '').match(/\/d\/([a-zA-Z0-9_-]{10,})/) || String(url || '').match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : '';
}

// 回傳每張圖的「版本代碼」（檔案 ID + 最後修改時間），網站用它判斷有沒有換圖，沒換就不重新下載
function siteConfig_() {
  var files = siteFiles_();
  var res = { ok: true, login: null, logo: null };
  ['login', 'logo'].forEach(function (k) {
    if (!files[k]) return;
    try {
      res[k] = files[k] + ':' + DriveApp.getFileById(files[k]).getLastUpdated().getTime();
    } catch (e) { /* 找不到檔案或沒有權限：當作沒設定 */ }
  });
  return res;
}

function siteImage_(which) {
  if (which !== 'login' && which !== 'logo') return { ok: false, error: '不支援的圖片' };
  var id = siteFiles_()[which];
  if (!id) return { ok: false, error: '尚未設定' };
  var file = DriveApp.getFileById(id);
  var blob = file.getBlob();
  var mime = blob.getContentType() || '';
  if (mime.indexOf('image/') !== 0) return { ok: false, error: '不是圖片檔' };
  if (blob.getBytes().length > MAX_IMAGE_BYTES) return { ok: false, error: '圖片超過 6MB，請縮小後再用' };
  return { ok: true, mime: mime, data: Utilities.base64Encode(blob.getBytes()) };
}

// 第一次部署時，在編輯器選這個函式按「執行」，授權後端讀取你的雲端硬碟圖片
function authorize() {
  DriveApp.getRootFolder();
}

// ===== 權限讀取 =====
function readAccounts_() {
  var sh = findSheet_(ACCOUNT_GID);
  if (!sh) throw new Error('找不到權限分頁（ACCOUNT_GID=' + ACCOUNT_GID + '）');
  var values = sh.getDataRange().getDisplayValues();

  var hi = -1;
  for (var r = 0; r < Math.min(values.length, 6); r++) {
    if (values[r].some(function (c) { return norm_(c) === '密碼'; })) { hi = r; break; }
  }
  if (hi < 0) throw new Error('權限分頁找不到「密碼」欄位');

  var head = values[hi].map(norm_);
  var pwCol = head.indexOf('密碼');
  var roleCol = head.indexOf('使用者');
  var pageCols = [];
  head.forEach(function (h, i) { if (PAGE_HEADERS[h]) pageCols.push({ i: i, id: PAGE_HEADERS[h] }); });

  var out = [];
  for (var k = hi + 1; k < values.length; k++) {
    var pw = String(values[k][pwCol] || '').trim();
    if (!pw) continue;
    out.push({
      role: roleCol >= 0 ? String(values[k][roleCol] || '').trim() : '',
      pwHash: sha256Hex_(pw),
      pages: pageCols.filter(function (c) { return isChecked_(values[k][c.i]); })
                     .map(function (c) { return c.id; })
    });
  }
  return out;
}

// ===== 憑證 =====
// token = base64(payload) + '.' + HMAC(payload)；payload 只放「密碼雜湊」與到期時間。
// 每次請求都會重新讀取權限分頁，所以改密碼或調整勾選會立刻生效，舊密碼的憑證也會失效。
function makeToken_(pwHash) {
  var payload = Utilities.base64EncodeWebSafe(
    JSON.stringify({ h: pwHash, e: Date.now() + TOKEN_HOURS * 3600 * 1000 }),
    Utilities.Charset.UTF_8
  );
  return payload + '.' + sign_(payload);
}

function authenticate_(token) {
  var parts = token.split('.');
  if (parts.length !== 2) return null;
  if (!safeEqual_(sign_(parts[0]), parts[1])) return null;
  var data;
  try {
    data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  } catch (e) { return null; }
  if (!data || !data.h || !data.e || Date.now() > data.e) return null;

  var accounts = readAccounts_();
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].pwHash === data.h) return accounts[i];
  }
  return null;
}

function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('TOKEN_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('TOKEN_SECRET', s);
  }
  return s;
}

function sign_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text, secret_()));
}

// ===== 小工具 =====
function findSheet_(gid) {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return null;
}

function sha256Hex_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function norm_(v) { return String(v == null ? '' : v).replace(/[﻿\s　]/g, ''); }
function isChecked_(v) { return /^(true|是|v|y|yes|1|✓|✔|☑)$/i.test(String(v == null ? '' : v).trim()); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
