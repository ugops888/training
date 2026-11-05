import { useState, type FormEvent } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { USE_DEMO_DATA } from '../data/config';

interface LoginPageProps {
  onSubmit: (password: string) => Promise<string | null>; // 回傳錯誤訊息，成功回傳 null
}

function Hero() {
  return (
    <svg viewBox="0 0 640 520" className="w-full max-w-xl" role="img" aria-label="餐飲教育訓練示意圖">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ddc97" />
          <stop offset="1" stopColor="#1f7a54" />
        </linearGradient>
      </defs>
      <circle cx="320" cy="270" r="210" fill="#ffffff" opacity=".07" />
      <circle cx="320" cy="270" r="150" fill="#ffffff" opacity=".07" />
      {/* 店面 */}
      <rect x="150" y="210" width="340" height="190" rx="14" fill="#f5f8f6" />
      <path d="M130 215 L150 160 H490 L510 215 Z" fill="url(#g1)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${150 + i * 56.7} 160 h28.3 l-4 55 h-28.3 z`} fill="#ffffff" opacity=".35" />
      ))}
      <rect x="180" y="245" width="130" height="95" rx="8" fill="#d9efe4" />
      <rect x="335" y="245" width="130" height="155" rx="8" fill="#1f7a54" />
      <circle cx="450" cy="325" r="5" fill="#f5f8f6" />
      <rect x="180" y="352" width="130" height="48" rx="6" fill="#163024" opacity=".12" />
      {/* 畢業帽 */}
      <g transform="translate(320 92)">
        <path d="M0 -42 L96 -6 L0 30 L-96 -6 Z" fill="#163024" />
        <path d="M-58 14 v34 q58 34 116 0 v-34 L0 38 Z" fill="#0f2419" />
        <path d="M96 -6 v52" stroke="#3ddc97" strokeWidth="5" strokeLinecap="round" />
        <circle cx="96" cy="52" r="8" fill="#3ddc97" />
      </g>
      {/* 書本與星星 */}
      <g transform="translate(70 380)">
        <rect width="86" height="14" rx="4" fill="#3ddc97" />
        <rect y="-16" width="76" height="14" rx="4" fill="#ffffff" opacity=".9" />
        <rect y="-32" width="66" height="14" rx="4" fill="#d9efe4" />
      </g>
      {[[540, 150, 14], [575, 260, 9], [90, 200, 10], [560, 380, 7]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r} l${r * 0.3} ${r * 0.7} l${r * 0.7} ${r * 0.3} l-${r * 0.7} ${r * 0.3} l-${r * 0.3} ${r * 0.7} l-${r * 0.3} -${r * 0.7} l-${r * 0.7} -${r * 0.3} l${r * 0.7} -${r * 0.3} z`} fill="#3ddc97" />
      ))}
    </svg>
  );
}

export default function LoginPage({ onSubmit }: LoginPageProps) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!pw.trim()) {
      setErr('請輸入密碼');
      return;
    }
    setBusy(true);
    setErr(null);
    const msg = await onSubmit(pw);
    if (msg) {
      setErr(msg);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f5f8f6]">
      <section className="relative lg:w-1/2 bg-forest-800 text-white flex flex-col items-center justify-center px-8 py-10 lg:py-0 overflow-hidden">
        <div className="hidden sm:block w-full max-w-xl"><Hero /></div>
        <div className="sm:hidden mb-2 w-16 h-16 rounded-2xl bg-mint-400 text-forest-900 flex items-center justify-center">
          <GraduationCap className="w-9 h-9" />
        </div>
        <p className="mt-2 lg:mt-0 text-sm text-forest-200 tracking-widest">Training Dashboard</p>
      </section>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-mint-400 text-forest-900 flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold text-forest-900">企業教育訓練平台</h1>
          </div>

          <label htmlFor="pw" className="block text-sm font-semibold text-forest-800 mb-2">
            請輸入密碼
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
            <input
              id="pw"
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr(null);
              }}
              autoFocus
              autoComplete="current-password"
              className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white border text-forest-900 outline-none focus:ring-2 focus:ring-mint-400 ${
                err ? 'border-red-300' : 'border-forest-100'
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-forest-400 hover:text-forest-700"
              aria-label={show ? '隱藏密碼' : '顯示密碼'}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err && <p className="mt-2 text-sm text-red-600" role="alert">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-mint-500 text-white font-semibold shadow-card hover:bg-mint-600 disabled:opacity-70 transition-colors"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? '驗證中…' : '登入'}
          </button>

          {USE_DEMO_DATA && (
            <p className="mt-6 text-xs text-forest-500 leading-relaxed bg-forest-50 rounded-lg px-3 py-2">
              預覽模式測試密碼：admin（管理員）、super（督導）、store（店長）、learn（學員）
            </p>
          )}
        </form>
        <p className="mt-10 text-xs text-forest-400 text-center max-w-sm">
          《聯發國際餐飲事業股份有限公司著作權所有，侵害必究，機密資料禁止外流》
        </p>
      </section>
    </div>
  );
}
