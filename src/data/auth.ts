import { fetchSheet, parseCSV } from './sheetData';
import { USE_DEMO_DATA } from './config';
import type { PageId } from '../types';

// 「教育訓練管理權限」分頁（同一份 Google 試算表）
export const ACCOUNT_GID = '2138174619';

// 權限試算表本身的檔案 ID（備援讀取用，需設為「知道連結的人可檢視」）
const ACCOUNT_DOC_ID = '1H1tFtfK8VIndpMZY0Lsnw4mycrpV91bePj2Anig4thw';

async function fetchAccountRows(): Promise<string[][]> {
  if (USE_DEMO_DATA) return fetchSheet(ACCOUNT_GID);
  try {
    return await fetchSheet(ACCOUNT_GID); // 先走原本已發佈的試算表
  } catch (first) {
    // 備援：直接以檔案 ID 讀取該分頁
    const url = `https://docs.google.com/spreadsheets/d/${ACCOUNT_DOC_ID}/gviz/tq?tqx=out:csv&gid=${ACCOUNT_GID}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseCSV(await res.text());
    } catch {
      throw first;
    }
  }
}

export interface Account {
  role: string;
  pages: PageId[];
}

const PAGE_HEADERS: Record<string, PageId> = {
  線上訓練平台: 'training',
  直營訓練儀表板: 'direct',
  加盟訓練儀表板: 'franchise',
  學員歷史查詢: 'student',
};

const isChecked = (v: string) => /^(true|是|v|y|yes|1|✓|✔|☑)$/i.test((v ?? '').trim());

/** 以密碼比對試算表，成功回傳身分與可看頁面，失敗回傳 null。 */
export async function login(password: string): Promise<Account | null> {
  const pw = password.trim();
  if (!pw) return null;
  const rows = await fetchAccountRows();
  // 標題列通常是第一列；若上方有空列或標題，往下找含「密碼」的那一列
  const hi = rows.findIndex((r, i) => i < 6 && r.some((c) => c.trim() === '密碼'));
  if (hi < 0) throw new Error('找不到「密碼」欄位，請確認分頁第一列的欄位名稱');
  const head = rows[hi].map((h) => h.trim());
  const pwCol = head.findIndex((h) => h === '密碼');
  const roleCol = head.findIndex((h) => h === '使用者');
    const pageCols = head
    .map((h, i) => ({ i, id: PAGE_HEADERS[h] }))
    .filter((x): x is { i: number; id: PageId } => !!x.id);

  for (const r of rows.slice(hi + 1)) {
    if ((r[pwCol] ?? '').trim() !== pw) continue;
    return {
      role: roleCol >= 0 ? (r[roleCol] ?? '').trim() : '',
      pages: pageCols.filter((c) => isChecked(r[c.i] ?? '')).map((c) => c.id),
    };
  }
  return null;
}

const KEY = 'tp-session-pw';
export function saveSession(pw: string) {
  try { sessionStorage.setItem(KEY, pw); } catch { /* ignore */ }
}
export function loadSession(): string {
  try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
