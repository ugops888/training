import { useMemo, useState } from 'react';
import { AlertCircle, Play, PlayCircle, FileText, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';
import { parseMaterials, EMBED_SANDBOX, type Material } from './materials';

function KindIcon({ kind, className }: { kind: Material['kind']; className?: string }) {
  if (kind === 'pdf') return <FileText className={className} />;
  if (kind === 'image') return <ImageIcon className={className} />;
  return <PlayCircle className={className} />;
}

/** 教材檢視器：影片、圖片、PDF 都在頁面內顯示，點擊不會跳到 YouTube 或 Google 雲端 */
export default function MaterialViewer({ title, raw }: { title: string; raw: string }) {
  const items = useMemo(() => parseMaterials(raw), [raw]);
  const [idx, setIdx] = useState(0);
  const current: Material | undefined = items[Math.min(idx, items.length - 1)];
  const [large, setLarge] = useState(current?.kind === 'pdf');
  const [started, setStarted] = useState<string>(''); // 已按下播放的 YouTube 影片（用 src 當識別）
  const [thumbFailed, setThumbFailed] = useState(false);

  const select = (i: number) => {
    setIdx(i);
    setLarge(items[i]?.kind === 'pdf'); // PDF 預設用大畫面，其餘用 16:9
  };

  const boxStyle = large ? { height: '80vh', minHeight: 420 } : { aspectRatio: '16 / 9' };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      {/* 教材切換與放大畫面：放在影片上方 */}
      {current && (
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap border-b border-forest-50">
          <div className="flex items-center gap-1.5 flex-wrap">
            {items.length > 1 ? (
              items.map((m, i) => (
                <button
                  key={`${m.url.slice(0, 80)}-${i}`}
                  type="button"
                  onClick={() => select(i)}
                  aria-pressed={i === idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    i === idx ? 'bg-mint-500 text-white' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                  }`}
                >
                  <KindIcon kind={m.kind} className="w-3.5 h-3.5" />
                  教材 {i + 1} · {m.label}
                </button>
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-forest-500">
                <KindIcon kind={current.kind} className="w-3.5 h-3.5" />
                {current.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLarge((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 transition-colors"
          >
            {large ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {large ? '縮小畫面' : '放大畫面'}
          </button>
        </div>
      )}
      <div className="relative bg-forest-900 overflow-hidden" style={boxStyle}>
        {current?.kind === 'youtube' && started !== current.src && (
          // 自訂封面：先不載入 YouTube 播放器，避免出現「稍後觀看」「分享」按鈕；按下播放才載入並自動播放
          <button
            type="button"
            onClick={() => {
              setThumbFailed(false);
              setStarted(current.src);
            }}
            className="absolute inset-0 w-full h-full group"
            aria-label={`播放：${title}`}
          >
            {current.ytId && !thumbFailed && (
              <img
                src={`https://i.ytimg.com/vi/${current.ytId}/hqdefault.jpg`}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setThumbFailed(true)}
              />
            )}
            <span className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-9 h-9 text-forest-800 ml-1" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
        {current && ((current.kind === 'youtube' && started === current.src) || current.kind === 'gdrive') && (
          <>
            <iframe
              key={current.src}
              src={current.kind === 'youtube' ? `${current.src}&autoplay=1` : current.src}
              title={title}
              className="absolute inset-0 w-full h-full"
              sandbox={EMBED_SANDBOX}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            {/* 透明遮罩：蓋住上方標題列與右上角按鈕（在新視窗開啟等），點了沒有反應 */}
            <div className="absolute top-0 left-0 right-0 z-10 h-16" aria-hidden="true" />
            {/* 透明遮罩：蓋住下緣的「稍後觀看」「分享」「更多影片」；高度隨畫面縮放，留出上方的進度條 */}
            {current.kind === 'youtube' && (
              <div
                className="absolute bottom-0 left-0 right-0 z-10"
                style={{ height: 'clamp(44px, 14%, 112px)' }}
                aria-hidden="true"
              />
            )}
          </>
        )}
        {current?.kind === 'video' && (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            controlsList="nodownload"
            className="absolute inset-0 w-full h-full"
          />
        )}
        {current?.kind === 'image' && (
          <img
            key={current.src}
            src={current.src}
            alt={title}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain bg-white"
          />
        )}
        {current?.kind === 'pdf' && (
          <iframe
            key={current.src}
            src={current.src.startsWith('data:') ? current.src : `${current.src}#toolbar=1&navpanes=0`}
            title={title}
            className="absolute inset-0 w-full h-full bg-white"
          />
        )}
        {current?.kind === 'unknown' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-forest-200">
            <AlertCircle className="w-12 h-12 mb-3 text-amber-400" />
            <p className="text-base font-semibold text-white">無法辨識此教材連結的格式</p>
            <p className="text-sm text-forest-300 mt-1">支援 YouTube、Google 雲端硬碟、圖片（JPG／PNG 等）與 PDF 連結</p>
          </div>
        )}
        {!current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-forest-200">
            <PlayCircle className="w-14 h-14 mb-3 text-forest-300" />
            <p className="text-base font-semibold text-white">此課程尚無教材連結</p>
            <p className="text-sm text-forest-300 mt-1">請洽總公司</p>
          </div>
        )}
      </div>

    </div>
  );
}
