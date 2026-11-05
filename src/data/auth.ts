import { fetchSheet } from './sheetData';
import type { PageId } from '../types';

// 「使用者密碼」分頁（同一份 Google 試算表）
export const ACCOUNT_GID = '667663661';

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
  const rows = await fetchSheet(ACCOUNT_GID);
  if (rows.length < 2) return null;
  const head = rows[0].map((h) => h.trim());
  const pwCol = head.findIndex((h) => h === '密碼');
  const roleCol = head.findIndex((h) => h === '使用者');
  if (pwCol < 0) throw new Error('使用者密碼分頁缺少「密碼」欄位');
  const pageCols = head
    .map((h, i) => ({ i, id: PAGE_HEADERS[h] }))
    .filter((x): x is { i: number; id: PageId } => !!x.id);

  for (const r of rows.slice(1)) {
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
