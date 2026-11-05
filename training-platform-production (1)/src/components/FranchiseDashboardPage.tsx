import { useMemo, useState } from 'react';
import { Search, Store, Calendar, Users, Award, CheckCircle2, XCircle, Loader2, AlertCircle, BookOpen, Hash, MapPin } from 'lucide-react';
import KpiCard from './KpiCard';
import type { FranchiseData, FranchiseExamRow } from '../data/sheetData';

interface Props {
  data: FranchiseData;
}

type SearchMode = 'store' | 'period';

export default function FranchiseDashboardPage({ data }: Props) {
  const [mode, setMode] = useState<SearchMode>('store');
  const [query, setQuery] = useState('');

  const { kpis, stores, periods, exams, enrolls, courseSessions } = data;
  const hasQuery = query.trim() !== '';

  // 依門市：該門市參與的課程場次
  const storeSessions = useMemo(() => {
    if (mode !== 'store' || !hasQuery) return [];
    const storePeriods = new Set(enrolls.filter((e) => e.store === query).map((e) => e.period));
    return courseSessions.filter((s) => storePeriods.has(s.period));
  }, [courseSessions, enrolls, mode, query, hasQuery]);

  // 依門市：該門市人員的測驗成績（按人員分組）
  const storeExamsByPerson = useMemo(() => {
    if (mode !== 'store' || !hasQuery) return [];
    const storeExamRows = exams.filter((e) => e.store === query);
    const byName = new Map<string, FranchiseExamRow[]>();
    for (const e of storeExamRows) {
      const arr = byName.get(e.name) ?? [];
      arr.push(e);
      byName.set(e.name, arr);
    }
    return Array.from(byName.entries()).map(([name, rows]) => ({
      name,
      rows: rows.slice().sort((a, b) => a.examDate.localeCompare(b.examDate)),
    }));
  }, [exams, mode, query, hasQuery]);

  // 依期數：參與該次課程的門市
  const periodStores = useMemo(() => {
    if (mode !== 'period' || !hasQuery) return [];
    return Array.from(new Set(enrolls.filter((e) => e.period === query).map((e) => e.store))).sort((a, b) => a.localeCompare(b, 'zh'));
  }, [enrolls, mode, query, hasQuery]);

  // 依期數：該期課程的場次資訊
  const periodSession = useMemo(() => {
    if (mode !== 'period' || !hasQuery) return null;
    return courseSessions.find((s) => s.period === query) ?? null;
  }, [courseSessions, mode, query, hasQuery]);

  // 依期數：參與該次課程人員的測驗成績，按門市分組，同門市放同一列
  const periodExamsByStore = useMemo(() => {
    if (mode !== 'period' || !hasQuery) return [];
    const periodNames = new Set(enrolls.filter((e) => e.period === query).map((e) => e.name));
    const periodExamRows = exams.filter((e) => periodNames.has(e.name));
    const byStore = new Map<string, { name: string; rows: FranchiseExamRow[] }[]>();
    for (const e of periodExamRows) {
      let storeArr = byStore.get(e.store);
      if (!storeArr) {
        storeArr = [];
        byStore.set(e.store, storeArr);
      }
      let person = storeArr.find((p) => p.name === e.name);
      if (!person) {
        person = { name: e.name, rows: [] };
        storeArr.push(person);
      }
      person.rows.push(e);
    }
    for (const arr of byStore.values()) {
      for (const p of arr) {
        p.rows.sort((a, b) => a.examDate.localeCompare(b.examDate));
      }
      arr.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    }
    return Array.from(byStore.entries())
      .map(([store, people]) => ({ store, people }))
      .sort((a, b) => a.store.localeCompare(b.store, 'zh'));
  }, [exams, enrolls, mode, query, hasQuery]);

  const options = mode === 'store' ? stores : periods;

  return (
    <div className="space-y-6">
      {/* 加盟體系培訓總覽 */}
      <div className="rounded-2xl p-5 md:p-6 bg-forest-50 border border-forest-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-forest-600">加盟體系培訓總覽</h2>
            <p className="text-sm text-forest-600 mt-1 max-w-2xl">
              追蹤加盟主與加盟店員工的標準化培訓進度，確保品牌服務品質一致並協助新進加盟者快速上手。
            </p>
          </div>
        </div>
      </div>

      {/* 搜尋選單 */}
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">搜尋篩選</h3>
        </div>
        <p className="text-sm text-forest-500 mb-4">可依門市或上課期數搜尋對應的測驗與課程紀錄。</p>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="inline-flex rounded-xl border border-forest-200 overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode('store'); setQuery(''); }}
              className={`px-4 py-2 text-sm font-semibold transition ${mode === 'store' ? 'bg-mint-500 text-white' : 'bg-white text-forest-700 hover:bg-forest-50'}`}
            >
              依門市
            </button>
            <button
              type="button"
              onClick={() => { setMode('period'); setQuery(''); }}
              className={`px-4 py-2 text-sm font-semibold transition ${mode === 'period' ? 'bg-mint-500 text-white' : 'bg-white text-forest-700 hover:bg-forest-50'}`}
            >
              依上課期數
            </button>
          </div>
          <div className="relative flex-1">
            <select
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400 focus:border-transparent transition"
            >
              <option value="">全部{mode === 'store' ? '門市' : '期數'}</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400 pointer-events-none" />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-3 py-2 rounded-xl text-sm font-medium text-forest-600 bg-forest-50 hover:bg-forest-100 transition"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 未搜尋時顯示 KPI 卡片 */}
      {!hasQuery && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-forest-700 mb-3 px-1">培訓概況</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpis.slice(0, 4).map((k, i) => (
                <KpiCard key={k.id} kpi={k} delay={i * 60} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-forest-700 mb-3 px-1">區域測驗平均分數</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpis.slice(4, 8).map((k, i) => (
                <KpiCard key={k.id} kpi={k} delay={i * 60} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* 搜尋結果 */}
      {hasQuery && mode === 'store' && (
        <StoreSearchResults
          store={query}
          sessions={storeSessions}
          examsByPerson={storeExamsByPerson}
        />
      )}

      {hasQuery && mode === 'period' && (
        <PeriodSearchResults
          period={query}
          session={periodSession}
          participatingStores={periodStores}
          examsByStore={periodExamsByStore}
        />
      )}
    </div>
  );
}

/* ---------- 依門市搜尋結果 ---------- */

function StoreSearchResults({
  store,
  sessions,
  examsByPerson,
}: {
  store: string;
  sessions: { courseName: string; period: string; courseDate: string; enrolled: number }[];
  examsByPerson: { name: string; rows: FranchiseExamRow[] }[];
}) {
  return (
    <div className="space-y-6">
      {/* 該門市參與的課程場次 */}
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-forest-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-mint-600" />
            <h3 className="font-semibold text-forest-900">{store} 參與的課程場次</h3>
          </div>
          <span className="text-xs text-forest-500">{sessions.length} 場</span>
        </div>
        <ul className="divide-y divide-forest-50">
          {sessions.map((s, i) => (
            <li key={`${s.courseName}-${s.period}-${i}`} className="px-5 py-4 hover:bg-forest-50/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-forest-900 truncate">{s.courseName}</p>
                  <p className="text-xs text-forest-500 mt-0.5 flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> 期數 {s.period} <span className="text-forest-300">·</span> 日期 {s.courseDate}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {sessions.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-forest-500">尚無課程場次</li>
          )}
        </ul>
      </div>

      {/* 測驗成績：按人員逐條列出 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">{store} 測驗成績</h3>
        </div>
        {examsByPerson.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-8 text-center text-sm text-forest-500">
            尚無測驗紀錄
          </div>
        )}
        {examsByPerson.map((person) => (
          <div key={person.name} className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-forest-50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-forest-900">{person.name}</h4>
              <span className="text-xs text-forest-500 ml-auto">
                {person.rows.filter((r) => r.passed).length}/{person.rows.length} 及格
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-forest-500 bg-forest-50/30">
                  <th className="px-5 py-2 font-medium">日期</th>
                  <th className="px-5 py-2 font-medium">區域</th>
                  <th className="px-5 py-2 font-medium text-right">分數</th>
                  <th className="px-5 py-2 font-medium text-center">是否及格</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {person.rows.map((r, idx) => (
                  <tr key={`${r.examDate}-${r.region}-${idx}`} className="hover:bg-forest-50/30 transition-colors">
                    <td className="px-5 py-3 text-forest-700">{r.examDate}</td>
                    <td className="px-5 py-3 text-forest-700">{r.region}</td>
                    <td className={`px-5 py-3 text-right font-bold ${r.passed ? 'text-mint-700' : 'text-red-600'}`}>{r.score}</td>
                    <td className="px-5 py-3 text-center">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-700 bg-mint-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 及格
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> 不及格
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 依上課期數搜尋結果 ---------- */

function PeriodSearchResults({
  period,
  session,
  participatingStores,
  examsByStore,
}: {
  period: string;
  session: { courseName: string; period: string; courseDate: string; enrolled: number } | null;
  participatingStores: string[];
  examsByStore: { store: string; people: { name: string; rows: FranchiseExamRow[] }[] }[];
}) {
  return (
    <div className="space-y-6">
      {/* 課程場次：顯示參與門市 */}
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-forest-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-mint-600" />
            <h3 className="font-semibold text-forest-900">
              {session ? session.courseName : `期數 ${period}`}
            </h3>
          </div>
          {session && (
            <span className="text-xs text-forest-500 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> 期數 {period} <span className="text-forest-300">·</span> 日期 {session.courseDate}
            </span>
          )}
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-forest-500 mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> 參與門市（{participatingStores.length} 間）
          </p>
          <div className="flex flex-wrap gap-2">
            {participatingStores.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 bg-forest-50 px-3 py-1.5 rounded-lg">
                <Store className="w-3.5 h-3.5 text-forest-500" /> {s}
              </span>
            ))}
            {participatingStores.length === 0 && (
              <span className="text-sm text-forest-500">尚無參與門市</span>
            )}
          </div>
        </div>
      </div>

      {/* 測驗成績：卡片排列，同門市同一列 */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">人員測驗成績</h3>
        </div>
        {examsByStore.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-8 text-center text-sm text-forest-500">
            尚無測驗紀錄
          </div>
        )}
        {examsByStore.map((group) => (
          <div key={group.store}>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Store className="w-4 h-4 text-forest-500" />
              <h4 className="text-sm font-semibold text-forest-700">{group.store}</h4>
              <span className="text-xs text-forest-400">· {group.people.length} 人</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.people.map((person) => (
                <PersonExamCard key={`${group.store}-${person.name}`} name={person.name} rows={person.rows} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonExamCard({ name, rows }: { name: string; rows: FranchiseExamRow[] }) {
  const passedCount = rows.filter((r) => r.passed).length;
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-forest-50 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
          <Users className="w-3.5 h-3.5" />
        </div>
        <h5 className="font-semibold text-forest-900 text-sm truncate">{name}</h5>
        <span className="text-xs text-forest-500 ml-auto">
          {passedCount}/{rows.length} 及格
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-forest-500 bg-forest-50/30">
            <th className="px-4 py-1.5 font-medium">日期</th>
            <th className="px-4 py-1.5 font-medium">區域</th>
            <th className="px-4 py-1.5 font-medium text-right">分數</th>
            <th className="px-4 py-1.5 font-medium text-center">及格</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-50">
          {rows.map((r, idx) => (
            <tr key={`${r.examDate}-${r.region}-${idx}`}>
              <td className="px-4 py-2 text-forest-700">{r.examDate}</td>
              <td className="px-4 py-2 text-forest-700">{r.region}</td>
              <td className={`px-4 py-2 text-right font-bold ${r.passed ? 'text-mint-700' : 'text-red-600'}`}>{r.score}</td>
              <td className="px-4 py-2 text-center">
                {r.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-mint-600 inline" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 inline" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FranchiseLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-forest-600">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      正在從 Google 試算表載入加盟體系資料...
    </div>
  );
}

export function FranchiseError({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-6">
      <div className="flex items-start gap-3 text-red-600">
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">加盟資料載入失敗</p>
          <p className="text-sm text-forest-600 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
