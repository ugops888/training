import { APPS_SCRIPT_URL } from './config';

// 呼叫 Apps Script 後端。使用 text/plain 送出 JSON，可避開瀏覽器的 CORS 預檢請求。
export class ApiError extends Error {
  code: string;
  constructor(message: string, code = '') {
    super(message);
    this.code = code;
  }
}

let token = '';
let role = '';
let onUnauthorized: (() => void) | null = null;

export function setToken(t: string) {
  token = t;
}
export function setRole(r: string) {
  role = r;
}
export function getRole() {
  return role;
}
export function getToken() {
  return token;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export async function callApi<T extends object>(payload: Record<string, unknown>): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new ApiError('尚未設定後端網址（src/data/config.ts 的 APPS_SCRIPT_URL）', 'config');
  let res: Response;
  try {
    res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('無法連線到後端，請檢查網路連線', 'network');
  }
  if (!res.ok) throw new ApiError(`後端回應錯誤（HTTP ${res.status}）`, 'http');
  let data: { ok: boolean; error?: string; code?: string } & T;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('後端回傳格式不正確，請確認部署權限為「所有人」', 'format');
  }
  if (!data.ok) {
    if (data.code === 'auth') onUnauthorized?.();
    throw new ApiError(data.error || '後端發生錯誤', data.code || '');
  }
  return data;
}
