import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, FileText, AlertCircle, X } from 'lucide-react';
import { parseForm } from './materials';
import { USE_DEMO_DATA } from '../../data/config';

// 嵌入 sandbox：允許送出表單與執行腳本，但不給 allow-popups / allow-top-navigation，頁面不會被帶走
const FORM_SANDBOX = 'allow-scripts allow-same-origin allow-forms';

export type FormKind = 'signin' | 'exam';

const KIND_META: Record<FormKind, { label: string; none: string; Icon: typeof ClipboardList }> = {
  signin: { label: '簽到', none: '本課程無須簽到', Icon: ClipboardList },
  exam: { label: '考試', none: '本課程無須測驗', Icon: FileText },
};

/** 彈出視窗：在頁面內顯示 Google 表單，學員填寫並提交後，回覆由 Google 表單自動記錄 */
function FormModal({ kind, title, raw, onClose }: { kind: FormKind; title: string; raw: string; onClose: () => void }) {
  const { label } = KIND_META[kind];
  const info = parseForm(raw);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // 用 portal 掛到 body：上層頁面有轉場動畫（transform），fixed 定位會被限制在該區塊內
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} ${label}`}
    >
      <div className="w-full max-w-3xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-forest-100">
          <h3 className="flex-1 min-w-0 text-sm font-bold text-forest-900 truncate">
            {title}　·　{label}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-forest-600 hover:bg-forest-50"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-white">
          {!info ? null : 'error' in info ? (
            <div className="flex items-start gap-2 px-5 py-4 text-sm text-amber-700 bg-amber-50">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{info.error}</span>
            </div>
          ) : USE_DEMO_DATA ? (
            <div className="px-5 py-16 text-center text-sm text-forest-500">
              預覽模式不載入真實表單。正式版會在這裡顯示「{title}」的{label} Google 表單，學員填寫後可直接送出。
            </div>
          ) : (
            <iframe src={info.src} title={`${title} ${label}表單`} sandbox={FORM_SANDBOX} className="w-full h-full bg-white" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function FormCard({ kind, title, raw }: { kind: FormKind; title: string; raw: string }) {
  const { label, none, Icon } = KIND_META[kind];
  const [open, setOpen] = useState(false);
  const enabled = !!raw.trim();

  const body = (
    <>
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          enabled ? 'bg-mint-50 text-mint-600' : 'bg-forest-50 text-forest-300'
        }`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className={`block text-sm font-bold ${enabled ? 'text-forest-900' : 'text-forest-400'}`}>{label}</span>
        <span className={`block text-xs mt-0.5 ${enabled ? 'text-forest-500' : 'text-forest-400'}`}>
          {enabled ? `點擊開啟${label}表單` : none}
        </span>
      </span>
    </>
  );

  return (
    <>
      {enabled ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-card border border-forest-50 hover:border-mint-300 hover:bg-mint-50/30 transition-colors"
        >
          {body}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4 bg-white/70 rounded-2xl border border-forest-50" aria-disabled="true">
          {body}
        </div>
      )}
      {open && <FormModal kind={kind} title={title} raw={raw} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 簽到與考試：左右並排，點擊後彈出對應的 Google 表單；沒有表單的顯示「本課程無須簽到／測驗」 */
export default function SignExamBar({ title, signInRaw, examRaw }: { title: string; signInRaw: string; examRaw: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormCard kind="signin" title={title} raw={signInRaw} />
      <FormCard kind="exam" title={title} raw={examRaw} />
    </div>
  );
}
