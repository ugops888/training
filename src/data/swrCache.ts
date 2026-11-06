import { useEffect, useReducer } from 'react';

const REVALIDATE_MS = 30_000;

interface Entry<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  timestamp: number;
  fetcher: (() => Promise<T>) | null;
  promise: Promise<T> | null;
}

const store = new Map<string, Entry<unknown>>();
const listeners = new Map<string, Set<() => void>>();

function emit(key: string): void {
  listeners.get(key)?.forEach((fn) => fn());
}

function doFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const prev = store.get(key) as Entry<T> | undefined;
  if (prev?.loading && prev?.promise) {
    return prev.promise;
  }

  const promise = fetcher()
    .then((data) => {
      store.set(key, {
        data,
        error: undefined,
        loading: false,
        timestamp: Date.now(),
        fetcher,
        promise: null,
      } as Entry<unknown>);
      emit(key);
      return data;
    })
    .catch((e) => {
      store.set(key, {
        data: prev?.data,
        error: e instanceof Error ? e.message : '資料載入失敗',
        loading: false,
        timestamp: prev?.timestamp ?? 0,
        fetcher,
        promise: null,
      } as Entry<unknown>);
      emit(key);
      throw e;
    });

  store.set(key, {
    data: prev?.data,
    error: undefined,
    loading: true,
    timestamp: prev?.timestamp ?? 0,
    fetcher,
    promise,
  } as Entry<unknown>);
  emit(key);

  return promise;
}

// 登出時清掉所有已載入的資料，避免下一位登入者在同一個瀏覽器分頁看到前一位的內容
export function clearStore(): void {
  store.clear();
}

export function invalidateAll(): Promise<boolean> {
  const keys = Array.from(store.keys());
  if (keys.length === 0) return Promise.resolve(true);
  const promises = keys.map((key) => {
    const entry = store.get(key) as Entry<unknown> | undefined;
    if (entry?.fetcher) {
      return doFetch(key, entry.fetcher).then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
  });
  return Promise.all(promises).then((results) => results.every(Boolean));
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): { data: T | null; loading: boolean; error: string | null } {
  const [, forceRender] = useReducer((c) => c + 1, 0);

  useEffect(() => {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(forceRender);
    return () => {
      set!.delete(forceRender);
    };
  }, [key]);

  const entry = store.get(key) as Entry<T> | undefined;

  useEffect(() => {
    const current = store.get(key) as Entry<T> | undefined;
    if (!current || (!current.data && !current.loading && !current.error && !current.promise)) {
      doFetch(key, fetcher);
    } else if (current.data && !current.loading && !current.promise) {
      const age = Date.now() - current.timestamp;
      if (age > REVALIDATE_MS) {
        doFetch(key, fetcher);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (entry?.error && !entry.data) {
    return { data: null, loading: false, error: entry.error };
  }
  if (entry?.data) {
    return { data: entry.data, loading: false, error: null };
  }
  return { data: null, loading: true, error: null };
}
