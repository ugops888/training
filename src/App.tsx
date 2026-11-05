import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import LoginPage from './components/LoginPage';
import { login, saveSession, loadSession, clearSession, type Account } from './data/auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DirectDashboardPage from './components/DirectDashboardPage';
import StudentHistoryPage from './components/StudentHistoryPage';
import FranchiseDashboardPage, { FranchiseLoading, FranchiseError } from './components/FranchiseDashboardPage';
import TrainingPlatformPage from './components/TrainingPlatformPage';
import { fetchFranchiseData, type FranchiseData } from './data/sheetData';
import { useCachedData, invalidateAll } from './data/swrCache';
import type { PageId } from './types';

const COPYRIGHT_NOTICE = '《聯發國際餐飲事業股份有限公司著作權所有，侵害必究，機密資料禁止外流》';
const INTERNAL_NOTICE = '數據供內部訓練管理使用';

const pageMeta: Record<PageId, { title: string }> = {
  direct: {
    title: '直營訓練儀表板',
  },
  franchise: {
    title: '加盟訓練儀表板',
  },
  student: {
    title: '學員歷史查詢',
  },
  training: {
    title: '線上訓練平台',
  },
};

type ToastState =
  | { visible: false }
  | { visible: true; type: 'loading'; message: string }
  | { visible: true; type: 'success'; message: string }
  | { visible: true; type: 'error'; message: string };

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(() => !!loadSession());

  // 同一個瀏覽分頁內重新整理時，用已記住的密碼重新驗證（權限以試算表最新內容為準）
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;
    login(saved)
      .then((acc) => {
        if (acc) setAccount(acc);
        else clearSession();
      })
      .catch(() => clearSession())
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = useCallback(async (pw: string): Promise<string | null> => {
    try {
      const acc = await login(pw);
      if (!acc) return '密碼錯誤，請再試一次';
      saveSession(pw.trim());
      setAccount(acc);
      return null;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/^HTTP \d+/.test(m)) return `讀取「使用者密碼」分頁失敗（${m}）：該分頁可能尚未「發佈到網路」`;
      if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return '無法連線到 Google 試算表，請檢查網路，或確認該分頁已「發佈到網路」';
      return `無法驗證密碼：${m}`;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    setAccount(null);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f6] text-forest-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!account) return <LoginPage onSubmit={handleLogin} />;
  return <Main account={account} onLogout={handleLogout} />;
}

function Main({ account, onLogout }: { account: Account; onLogout: () => void }) {
  const allPages: PageId[] = ['training', 'direct', 'franchise', 'student'];
  const allowed = allPages.filter((p) => account.pages.includes(p));
  const [pageState, setPage] = useState<PageId>(allowed[0] ?? 'training');
  const page: PageId = allowed.includes(pageState) ? pageState : allowed[0] ?? 'training';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false });

  const {
    data: franchise,
    loading: franchiseLoading,
    error: franchiseError,
  } = useCachedData<FranchiseData>('franchise-data', fetchFranchiseData);

  const handleRefresh = useCallback(() => {
    setToast({ visible: true, type: 'loading', message: '正在重新抓取所有分頁最新資料...' });
    invalidateAll()
      .then((ok) => {
        if (ok) {
          setToast({ visible: true, type: 'success', message: '數據已更新完成，所有分頁皆已同步最新資料' });
        } else {
          setToast({ visible: true, type: 'error', message: '部分分頁更新失敗，請稍後再試' });
        }
        setTimeout(() => setToast({ visible: false }), 3500);
      })
      .catch(() => {
        setToast({ visible: true, type: 'error', message: '資料更新失敗，請檢查網路連線後再試' });
        setTimeout(() => setToast({ visible: false }), 3500);
      });
  }, []);

  const meta = pageMeta[page];
  const notice = page === 'training' ? COPYRIGHT_NOTICE : INTERNAL_NOTICE;

  return (
    <div className="min-h-screen bg-[#f5f8f6] flex">
      <Sidebar
        current={page}
        onChange={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        allowed={allowed}
        role={account.role}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={meta.title}
          notice={notice}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div key={page} className="animate-fade-in">
            {allowed.length === 0 && (
              <p className="text-center text-forest-600 py-20">此帳號尚未開放任何頁面，請聯絡管理員。</p>
            )}
            {allowed.includes('direct') && page === 'direct' && (
              <DirectDashboardPage />
            )}
            {allowed.includes('franchise') && page === 'franchise' && (
              franchiseLoading && !franchise ? (
                <FranchiseLoading />
              ) : franchiseError && !franchise ? (
                <FranchiseError message={franchiseError} />
              ) : franchise ? (
                <FranchiseDashboardPage data={franchise} />
              ) : null
            )}
            {allowed.includes('training') && page === 'training' && <TrainingPlatformPage />}
            {allowed.includes('student') && page === 'student' && <StudentHistoryPage />}
          </div>
        </main>
        <footer className="px-4 md:px-8 py-4 text-center text-xs text-forest-400 border-t border-forest-50 bg-white/60">
          {notice}
        </footer>
      </div>

      {/* Toast 通知 */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-cardHover border ${
              toast.type === 'loading'
                ? 'bg-white border-forest-100'
                : toast.type === 'success'
                ? 'bg-white border-mint-200'
                : 'bg-white border-red-200'
            }`}
          >
            {toast.type === 'loading' && (
              <RefreshCw className="w-5 h-5 text-forest-500 animate-spin" />
            )}
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-mint-500" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                toast.type === 'error' ? 'text-red-600' : 'text-forest-700'
              }`}
            >
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// (removed unused import guard)
