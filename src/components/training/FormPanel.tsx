import { useState } from 'react';
import { ClipboardList, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { parseForm } from './materials';
import { USE_DEMO_DATA } from '../../data/config';

// 嵌入 sandbox：允許送出表單與執行腳本，但不給 allow-popups / allow-top-navigation，頁面不會被帶走
const FORM_SANDBOX = 'allow-scripts allow-same-origin allow-forms';

export type FormKind = 'signin' | 'exam';

const KIND_META: Record<FormKind, { label: string; hint: string; Icon: typeof ClipboardList }> = {
  signin: { label: '簽到', hint: '填寫完成後按「提交」，系統會自動記錄你的簽到', Icon: ClipboardList },
  exam: { label: '考試', hint: '填寫完成後按「提交」，系統會自動記錄你的作答', Icon: FileText },
};

/** 簽到／考試表單：學員在頁面內填寫並送出，回覆由 Google 表單自動記錄在表單的回覆試算表 */
export default function FormPanel({ kind, title, raw }: { kind: FormKind; title: string; raw: string }) {
  const { label, hint, Icon } = KIND_META[kind];
  const info = parseForm(raw);
  const [open, setOpen] = useState(false);
  if (!info) return null;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-forest-50/40 transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-forest-900">{label}</span>
          <span className="block text-xs text-forest-500 mt-0.5">{hint}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
          {open ? '收合' : `填寫${label}`}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-forest-50">
          {'error' in info ? (
            <div className="flex items-start gap-2 px-5 py-4 text-sm text-amber-700 bg-amber-50">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{info.error}</span>
            </div>
          ) : USE_DEMO_DATA ? (
            <div className="px-5 py-10 text-center text-sm text-forest-500">
              預覽模式不載入真實表單。正式版會在這裡顯示「{title}」的{label} Google 表單，學員填寫後可直接送出。
            </div>
          ) : (
            <iframe
              src={info.src}
              title={`${title} ${label}表單`}
              sandbox={FORM_SANDBOX}
              className="w-full bg-white"
              style={{ height: '80vh', minHeight: 560 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
