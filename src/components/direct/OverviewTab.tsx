import { useMemo, useState } from 'react';
import { Users, UserCheck, UserPlus, Store, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { sortByOpening, type DirectData, type EmployeeRow } from '../../data/directData';

interface Props {
  data: DirectData;
}

export default function OverviewTab({ data }: Props) {
  const { activeEmployees: active, employees, storeOrder } = data;

  // 總覽卡片
  const totalActive = active.length;
  const regularEmps = active.filter((e) => e.isRegular);
  const parttimeEmps = active.filter((e) => !e.isRegular);
  const regularCount = regularEmps.length;
  const parttimeCount = parttimeEmps.length;
  const managerCount = active.filter((e) => e.position === '店長').length;
  const leaderCount = active.filter((e) => e.position === '組長').length;
  const staffCount = active.filter((e) => e.position === '正職' || e.position === '正職人員' || e.position === '儲備幹部').length;

  // 各門市統計
  const storeStats = useMemo(() => {
    const map = new Map<string, { total: number; regular: number; parttime: number; manager: number; leader: number }>();
    for (const e of active) {
      const v = map.get(e.store) ?? { total: 0, regular: 0, parttime: 0, manager: 0, leader: 0 };
      v.total++;
      if (e.isRegular) v.regular++;
      else v.parttime++;
      if (e.position === '店長') v.manager++;
      if (e.position === '組長') v.leader++;
      map.set(e.store, v);
    }
    return sortByOpening(Array.from(map.keys()), storeOrder).map((store) => ({ store, ...(map.get(store) as NonNullable<ReturnType<typeof map.get>>) }));
  }, [active, storeOrder]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 總覽卡片列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 卡片 A：總在職人數 */}
        <OverviewCard
          icon={Users}
          label="總在職人數"
          value={totalActive}
          unit="人"
          color="mint"
        />
        {/* 卡片 B：正職總人數 + 明細 */}
        <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-forest-500">正職總人數</p>
              <p className="text-3xl font-bold text-forest-900">
                {regularCount}<span className="text-sm font-medium text-forest-500 ml-1">人</span>
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 pt-3 border-t border-forest-50">
            <DetailRow label="店長人數" value={managerCount} />
            <DetailRow label="組長人數" value={leaderCount} />
            <DetailRow label="正職人員人數" value={staffCount} />
          </ul>
        </div>
        {/* 卡片 C：兼職總人數 */}
        <OverviewCard
          icon={UserPlus}
          label="兼職總人數"
          value={parttimeCount}
          unit="人"
          color="forest"
        />
      </div>

      {/* 各門市人員統計表格 */}
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-forest-50 flex items-center gap-2">
          <Store className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">各門市人員統計</h3>
          <span className="text-xs text-forest-500 ml-auto">共 {storeStats.length} 間門市</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-forest-50/40 text-left text-xs text-forest-600">
                <th className="px-5 py-3 font-semibold">門市名稱</th>
                <th className="px-5 py-3 font-semibold text-right">總人數</th>
                <th className="px-5 py-3 font-semibold text-right">正職人數</th>
                <th className="px-5 py-3 font-semibold text-right">兼職人數</th>
                <th className="px-5 py-3 font-semibold">管理職</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {storeStats.map((s) => (
                <tr key={s.store} className="hover:bg-forest-50/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-forest-900">{s.store}</td>
                  <td className="px-5 py-3 text-right text-forest-800">{s.total}</td>
                  <td className="px-5 py-3 text-right text-forest-800">{s.regular}</td>
                  <td className="px-5 py-3 text-right text-forest-800">{s.parttime}</td>
                  <td className="px-5 py-3 text-forest-700">
                    {s.manager === 0 && s.leader === 0 ? '—' : `店長 ${s.manager} / 組長 ${s.leader}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 動態流動率 */}
      <TurnoverSection employees={employees} active={active} storeOrder={storeOrder} />
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  unit: string;
  color: 'mint' | 'forest';
}) {
  const bg = color === 'mint' ? 'bg-mint-50 text-mint-600' : 'bg-forest-50 text-forest-600';
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-forest-500">{label}</p>
          <p className="text-3xl font-bold text-forest-900">
            {value}
            <span className="text-sm font-medium text-forest-500 ml-1">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-forest-500">{label}</span>
      <span className="font-semibold text-forest-800">{value} 人</span>
    </li>
  );
}

/* ---------- 動態流動率 ---------- */

function monthKey(dateStr: string): string | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function TurnoverSection({ employees, active, storeOrder }: { employees: EmployeeRow[]; active: EmployeeRow[]; storeOrder: string[] }) {
  const stores = useMemo(() => sortByOpening(Array.from(new Set(active.map((e) => e.store))), storeOrder), [active, storeOrder]);
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      const hk = monthKey(e.hireDate);
      if (hk) set.add(hk);
      if (e.leaveDate) {
        const lk = monthKey(e.leaveDate);
        if (lk) set.add(lk);
      }
    }
    return Array.from(set).sort().reverse();
  }, [employees]);

  const [storeQuery, setStoreQuery] = useState('');
  const [monthQuery, setMonthQuery] = useState('');

  // 預設顯示最近月份
  const effectiveMonth = monthQuery || (months.length > 0 ? months[0] : '');
  const effectiveStore = storeQuery;

  // 計算流動率
  const turnoverRows = useMemo(() => {
    if (!effectiveMonth) return [];
    const scoped = effectiveStore ? employees.filter((e) => e.store === effectiveStore) : employees.filter((e) => e.dept.includes('UG'));
    const rows: { store: string; hired: number; left: number; headcount: number; hireRate: number; leaveRate: number }[] = [];
    if (effectiveStore) {
      const list = scoped.filter((e) => e.store === effectiveStore);
      rows.push(buildRow(effectiveStore, list, effectiveMonth));
    } else {
      for (const s of stores) {
        const list = scoped.filter((e) => e.store === s);
        rows.push(buildRow(s, list, effectiveMonth));
      }
    }
    return rows;
  }, [employees, stores, effectiveStore, effectiveMonth]);

  // 加總
  const totals = useMemo(() => {
    const hired = turnoverRows.reduce((s, r) => s + r.hired, 0);
    const left = turnoverRows.reduce((s, r) => s + r.left, 0);
    const headcount = turnoverRows.reduce((s, r) => s + r.headcount, 0);
    return {
      hired,
      left,
      headcount,
      hireRate: headcount > 0 ? Math.round((hired / headcount) * 1000) / 10 : 0,
      leaveRate: headcount > 0 ? Math.round((left / headcount) * 1000) / 10 : 0,
    };
  }, [turnoverRows]);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-50 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-mint-600" />
        <h3 className="font-semibold text-forest-900">門市異動統計</h3>
      </div>
      <div className="px-5 py-4 border-b border-forest-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-forest-500 mb-1 block">門市</label>
            <select
              value={storeQuery}
              onChange={(e) => setStoreQuery(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400 transition"
            >
              <option value="">全部門市</option>
              {stores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-forest-500 mb-1 block">月份</label>
            <select
              value={monthQuery}
              onChange={(e) => setMonthQuery(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400 transition"
            >
              <option value="">最近月份（預設）</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {(storeQuery || monthQuery) && (
            <button
              type="button"
              onClick={() => { setStoreQuery(''); setMonthQuery(''); }}
              className="self-end px-3 py-2.5 rounded-xl text-sm font-medium text-forest-600 bg-forest-50 hover:bg-forest-100 transition"
            >
              清除
            </button>
          )}
        </div>
        <p className="text-xs text-forest-400 mt-2">
          目前查詢：{effectiveStore || '全部門市'} · {effectiveMonth || '—'}
        </p>
      </div>

      {/* 加總數據 */}
      <div className="px-5 py-4 border-b border-forest-50 bg-forest-50/30">
        <p className="text-xs font-semibold text-forest-600 mb-3">全門市加總</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TurnoverStat label="當月入職人數" value={totals.hired} unit="人" />
          <TurnoverStat label="入職率" value={totals.hireRate} unit="%" />
          <TurnoverStat label="離職人數" value={totals.left} unit="人" />
          <TurnoverStat label="離職率" value={totals.leaveRate} unit="%" />
        </div>
      </div>

      {/* 各門市個別數據 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-forest-50/30 text-left text-xs text-forest-600">
              <th className="px-5 py-3 font-semibold">門市</th>
              <th className="px-5 py-3 font-semibold text-right">在職人數</th>
              <th className="px-5 py-3 font-semibold text-right">入職人數</th>
              <th className="px-5 py-3 font-semibold text-right">入職率</th>
              <th className="px-5 py-3 font-semibold text-right">離職人數</th>
              <th className="px-5 py-3 font-semibold text-right">離職率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-50">
            {turnoverRows.map((r) => (
              <tr key={r.store} className="hover:bg-forest-50/30 transition-colors">
                <td className="px-5 py-3 font-medium text-forest-900">{r.store}</td>
                <td className="px-5 py-3 text-right text-forest-800">{r.headcount}</td>
                <td className="px-5 py-3 text-right text-forest-800">{r.hired}</td>
                <td className="px-5 py-3 text-right text-forest-800">{r.hireRate}%</td>
                <td className="px-5 py-3 text-right text-forest-800">{r.left}</td>
                <td className="px-5 py-3 text-right text-forest-800">{r.leaveRate}%</td>
              </tr>
            ))}
            {turnoverRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-forest-500">尚無異動資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildRow(store: string, list: EmployeeRow[], month: string) {
  const hired = list.filter((e) => monthKey(e.hireDate) === month).length;
  const left = list.filter((e) => e.leaveDate && monthKey(e.leaveDate) === month).length;
  // 在職人數：入職日在該月底前且（未離職或離職日在該月之後）
  const [y, m] = month.split('-').map(Number);
  const monthEnd = new Date(y, m, 0); // 該月最後一天
  const headcount = list.filter((e) => {
    const hd = new Date(e.hireDate);
    if (hd > monthEnd) return false;
    if (e.leaveDate) {
      const ld = new Date(e.leaveDate);
      const monthStart = new Date(y, m - 1, 1);
      if (ld < monthStart) return false;
    }
    return true;
  }).length;
  return {
    store,
    hired,
    left,
    headcount,
    hireRate: headcount > 0 ? Math.round((hired / headcount) * 1000) / 10 : 0,
    leaveRate: headcount > 0 ? Math.round((left / headcount) * 1000) / 10 : 0,
  };
}

function TurnoverStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-forest-50">
      <p className="text-xs text-forest-500">{label}</p>
      <p className="text-xl font-bold text-forest-900 mt-0.5">
        {value}<span className="text-xs font-medium text-forest-500 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
