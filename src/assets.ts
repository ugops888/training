// public 資料夾內檔案的網址（相對於網站根目錄，GitHub Pages 子路徑也適用）
export function assetUrl(name: string): string {
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';
  return `${base.endsWith('/') ? base : base + '/'}${name}`;
}
