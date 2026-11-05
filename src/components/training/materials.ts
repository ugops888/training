/**
 * 教材連結解析：試算表的「教材網址」欄位可放一個或多個連結（用換行、空白或分號隔開）。
 * 支援 YouTube、Google 雲端硬碟檔案（影片 / PDF / 圖片皆可）、影片檔、圖片、PDF。
 */

export type MaterialKind = 'youtube' | 'gdrive' | 'video' | 'image' | 'pdf' | 'unknown';

export interface Material {
  url: string;
  kind: MaterialKind;
  /** 實際嵌入用的網址（YouTube / Google 雲端硬碟會轉成預覽網址） */
  src: string;
  /** 顯示在分頁籤上的類型名稱 */
  label: string;
}

export const KIND_LABEL: Record<MaterialKind, string> = {
  youtube: '影片',
  gdrive: '雲端檔案',
  video: '影片',
  image: '圖片',
  pdf: 'PDF',
  unknown: '未知格式',
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/v\/([\w-]{11})/,
    /youtube\.com\/watch\?.*?[?&]v=([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/watch\/([\w-]{11})/,
    /m\.youtube\.com\/.*?v=([\w-]{11})/,
    /youtube-nocookie\.com\/embed\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  try {
    const v = new URL(url).searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
  } catch {
    // 網址無效，忽略
  }
  return null;
}

function extractGDriveFileId(url: string): string | null {
  const patterns = [/\/file\/d\/([-\w]{25,})/, /[?&]id=([-\w]{25,})/, /\/d\/([-\w]{25,})(?:\/|$)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function detect(url: string): Material {
  const make = (kind: MaterialKind, src = url): Material => ({ url, kind, src, label: KIND_LABEL[kind] });

  // data: 網址（內嵌檔案）
  if (/^data:image\//i.test(url)) return make('image');
  if (/^data:application\/pdf/i.test(url)) return make('pdf');
  if (/^data:video\//i.test(url)) return make('video');

  const ytId = extractYouTubeId(url);
  if (ytId) return make('youtube', `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`);

  if (/drive\.google\.com/i.test(url)) {
    const id = extractGDriveFileId(url);
    if (id) return make('gdrive', `https://drive.google.com/file/d/${id}/preview`);
  }

  const path = url.split(/[?#]/)[0];
  if (/\.pdf$/i.test(path)) return make('pdf');
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path)) return make('image');
  if (/\.(mp4|mov|webm|m4v)$/i.test(path)) return make('video');

  return make('unknown');
}

export function parseMaterials(raw: string | undefined): Material[] {
  if (!raw) return [];
  return raw
    // 以空白、換行、全形分號／逗號分隔；半形分號只在後面接著新網址時才算分隔（內嵌檔案網址本身含有分號）
    .split(/[\s；，]+|;(?=\s*(?:https?:|data:))/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(detect);
}

/** 嵌入時使用的 sandbox：不給 allow-popups，使影片內的任何連結都無法開新分頁或跳走 */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-presentation';
