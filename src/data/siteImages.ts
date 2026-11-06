import { useSyncExternalStore } from 'react';
import { callApi } from './api';
import { APPS_SCRIPT_URL, USE_DEMO_DATA } from './config';

// LOGO 與登入底圖：由試算表「網站設定」分頁指定 Google 雲端硬碟圖片，經 Apps Script 後端取得。
// 流程：先用上次存在瀏覽器的圖（立刻顯示）→ 向後端確認有沒有換圖 → 有換才重新下載。
// 沒設定或失敗時，網站自動改用 public 資料夾的檔案，再不行就用預設圖示。
type Which = 'logo' | 'login';
interface Snapshot {
  logo: string | null;
  login: string | null;
}

let snapshot: Snapshot = { logo: null, login: null };
const listeners = new Set<() => void>();
let started = false;

function set(which: Which, value: string | null) {
  if (snapshot[which] === value) return;
  snapshot = { ...snapshot, [which]: value };
  listeners.forEach((fn) => fn());
}

const LS = (which: Which) => `tp-site-img-${which}`;

function readCache(which: Which): { key: string; data: string } | null {
  try {
    const raw = localStorage.getItem(LS(which));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeCache(which: Which, v: { key: string; data: string } | null) {
  try {
    if (v) localStorage.setItem(LS(which), JSON.stringify(v));
    else localStorage.removeItem(LS(which));
  } catch {
    /* 容量不足或無痕模式：略過，下次重新下載 */
  }
}

async function syncFromBackend() {
  let cfg: { logo: string | null; login: string | null };
  try {
    cfg = await callApi<{ logo: string | null; login: string | null }>({ action: 'siteConfig' });
  } catch {
    return; // 後端暫時連不上：維持目前畫面
  }
  for (const which of ['logo', 'login'] as Which[]) {
    const key = cfg[which];
    if (!key) {
      writeCache(which, null);
      set(which, null);
      continue;
    }
    const cached = readCache(which);
    if (cached?.key === key) {
      set(which, cached.data);
      continue;
    }
    try {
      const res = await callApi<{ mime: string; data: string }>({ action: 'siteImage', which });
      const data = `data:${res.mime};base64,${res.data}`;
      writeCache(which, { key, data });
      set(which, data);
    } catch {
      /* 這張圖取得失敗：維持目前畫面 */
    }
  }
}

export function initSiteImages() {
  if (started) return;
  started = true;
  if (USE_DEMO_DATA) {
    import('./demoImages').then((m) => {
      set('logo', m.DEMO_LOGO || null);
      set('login', m.DEMO_LOGIN || null);
    });
    return;
  }
  const l = readCache('logo');
  const g = readCache('login');
  if (l) set('logo', l.data);
  if (g) set('login', g.data);
  if (APPS_SCRIPT_URL) void syncFromBackend();
}

export function useSiteImages(): Snapshot {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => snapshot
  );
}
