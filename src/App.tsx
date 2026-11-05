import { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DirectDashboardPage from './components/DirectDashboardPage';
import StudentHistoryPage from './components/StudentHistoryPage';
import FranchiseDashboardPage, { FranchiseLoading, FranchiseError } from './components/FranchiseDashboardPage';
import TrainingPlatformPage from './components/TrainingPlatformPage';
import { fetchFranchiseData, type FranchiseData } from './data/sheetData';
import { useCachedData, invalidateAll } from './data/swrCache';
import type { PageId } from './types';

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  direct: {
    title: '直營訓練儀表板',
    subtitle: '直營門市教育訓練績效與排程總覽',
  },
  franchise: {
    title: '加盟訓練儀表板',
    subtitle: '加盟體系教育訓練績效與排程總覽',
  },
  student: {
    title: '學員歷史查詢',
    subtitle: '依員工編號或姓名查詢夥伴的完整培訓歷程',
  },
  training: {
    title: '線上訓練平台',
    subtitle: '瀏覽課程清單，線上觀看教學影片、圖片與 PDF',
  },
};

type ToastState =
  | { visible: false }
  | { visible: true; type: 'loading'; message: string }
  | { visible: true; type: 'success'; message: string }
  | { visible: true; type: 'error'; message: string };

export default function App() {
  const [page, setPage] = useState<PageId>('training');
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

  return (
    <div className="min-h-screen bg-[#f5f8f6] flex">
      <Sidebar
        current={page}
        onChange={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div key={page} className="animate-fade-in">
            {page === 'direct' && (
              <DirectDashboardPage />
            )}
            {page === 'franchise' && (
              franchiseLoading && !franchise ? (
                <FranchiseLoading />
              ) : franchiseError && !franchise ? (
                <FranchiseError message={franchiseError} />
              ) : franchise ? (
                <FranchiseDashboardPage data={franchise} />
              ) : null
            )}
            {page === 'training' && <TrainingPlatformPage />}
            {page === 'student' && <StudentHistoryPage />}
          </div>
        </main>
        <footer className="px-4 md:px-8 py-4 text-center text-xs text-forest-400 border-t border-forest-50 bg-white/60">
          企業教育訓練平台 · 內部訓練管理使用 · 數據由各區培訓負責人每週提供
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
