import { Users, UserCheck, UserPlus, Store, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { fetchDirectData, type DirectData, type EmployeeRow } from '../data/directData';
import { useCachedData } from '../data/swrCache';
import DirectOverviewTab from './direct/OverviewTab';
import TrainingOverviewTab from './direct/TrainingTab';

export default function DirectDashboardPage() {
  const [tab, setTab] = useState<'overview' | 'training'>('overview');
  const { data, loading, error } = useCachedData<DirectData>('direct-data', fetchDirectData);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-forest-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        正在從 Google 試算表載入直營訓練資料...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-6">
        <div className="flex items-start gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">直營資料載入失敗</p>
            <p className="text-sm text-forest-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 總覽 banner */}
      <div className="rounded-2xl p-5 md:p-6 bg-forest-50 border border-forest-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-forest-600">直營訓練儀表板</h2>
            <p className="text-sm text-forest-600 mt-1 max-w-2xl">
              追蹤直營門市在職人員概況與培訓進度，掌握各門市人力結構、流動率與正職人員培訓成效。
            </p>
          </div>
        </div>
      </div>

      {/* 分頁頁籤 */}
      <div className="flex items-center gap-1 bg-white rounded-2xl shadow-card border border-forest-50 p-1.5 w-fit">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          <Users className="w-4 h-4" /> 在職人員概況
        </TabButton>
        <TabButton active={tab === 'training'} onClick={() => setTab('training')}>
          <UserCheck className="w-4 h-4" /> 培訓概況
        </TabButton>
      </div>

      {tab === 'overview' && <DirectOverviewTab data={data} />}
      {tab === 'training' && <TrainingOverviewTab data={data} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-mint-500 text-white shadow-card'
          : 'text-forest-700 hover:bg-forest-50'
      }`}
    >
      {children}
    </button>
  );
}
