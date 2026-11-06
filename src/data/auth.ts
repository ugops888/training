import { callApi, setToken, ApiError } from './api';
import { USE_DEMO_DATA } from './config';
import { getDemoSheet } from './demoData';
import type { PageId } from '../types';

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

const KEY = 'tp-session-token';
const DEMO_PREFIX = 'demo:';

export function saveSession(t: string) {
  try { sessionStorage.setItem(KEY, t); } catch { /* ignore */ }
}
export function loadSession(): string {
  try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  setToken('');
}

// ---- 預覽模式：在瀏覽器內以虛擬資料驗證（僅供預覽畫面用，不連後端）----
const norm = (v: string) => (v ?? '').replace(/[﻿\s　]/g, '');
const isChecked = (v: string) => /^(true|是|v|y|yes|1|✓|✔|☑)$/i.test((v ?? '').trim());

function demoLogin(pw: string): Account | null {
  const rows = getDemoSheet('2138174619');
  const head = rows[0].map(norm);
  const pwCol = head.indexOf('密碼');
  const roleCol = head.indexOf('使用者');
  const cols = head.map((h, i) => ({ i, id: PAGE_HEADERS[h] })).filter((c) => c.id);
  const r = rows.slice(1).find((x) => (x[pwCol] ?? '').trim() === pw);
  if (!r) return null;
  return { role: r[roleCol], pages: cols.filter((c) => isChecked(r[c.i])).map((c) => c.id) };
}

/** 登入：成功回傳身分與可看頁面，密碼錯誤回傳 null，其他問題丟出錯誤。 */
export async function login(password: string): Promise<Account | null> {
  const pw = password.trim();
  if (!pw) return null;
  if (USE_DEMO_DATA) {
    await new Promise((r) => setTimeout(r, 300));
    const acc = demoLogin(pw);
    if (acc) saveSession(DEMO_PREFIX + pw);
    return acc;
  }
  try {
    const res = await callApi<{ token: string; role: string; pages: PageId[] }>({ action: 'login', password: pw });
    setToken(res.token);
    saveSession(res.token);
    return { role: res.role, pages: res.pages };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'badpw') return null;
    throw e;
  }
}

/** 重新整理頁面時，用已記住的憑證還原登入狀態。 */
export async function restoreSession(): Promise<Account | null> {
  const saved = loadSession();
  if (!saved) return null;
  if (USE_DEMO_DATA) return saved.startsWith(DEMO_PREFIX) ? demoLogin(saved.slice(DEMO_PREFIX.length)) : null;
  setToken(saved);
  const res = await callApi<{ role: string; pages: PageId[] }>({ action: 'me', token: saved });
  return { role: res.role, pages: res.pages };
}
