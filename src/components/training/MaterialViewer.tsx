import { useMemo, useState } from 'react';
import { AlertCircle, PlayCircle, FileText, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';
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

  const select = (i: number) => {
    setIdx(i);
    setLarge(items[i]?.kind === 'pdf'); // PDF 預設用大畫面，其餘用 16:9
  };

  const boxStyle = large ? { height: '80vh', minHeight: 420 } : { aspectRatio: '16 / 9' };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="relative bg-forest-900" style={boxStyle}>
        {current && (current.kind === 'youtube' || current.kind === 'gdrive') && (
          <>
            <iframe
              key={current.src}
              src={current.src}
              title={title}
              className="absolute inset-0 w-full h-full"
              sandbox={EMBED_SANDBOX}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            {/* 蓋住上方標題列與「在新視窗開啟」按鈕，避免點到外部連結 */}
            <div className="absolute top-0 left-0 right-0 z-10 h-14" aria-hidden="true" />
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

      {current && (
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap border-t border-forest-50">
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
    </div>
  );
}
