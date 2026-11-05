import { TrendingUp, Users, Award, BookOpen } from 'lucide-react';
import type { Course, Kpi, ScheduleItem } from '../types';
import KpiCard from './KpiCard';
import ScheduleList from './ScheduleList';

interface DashboardPageProps {
  title: string;
  kpis: Kpi[];
  schedule: ScheduleItem[];
  courses: Course[];
  accent: 'mint' | 'forest';
  summary: string;
}

export default function DashboardPage({ title, kpis, schedule, courses, accent, summary }: DashboardPageProps) {
  const accentText = accent === 'mint' ? 'text-mint-600' : 'text-forest-600';
  const accentBg = accent === 'mint' ? 'bg-mint-500' : 'bg-forest-600';
  const accentSoft = accent === 'mint' ? 'bg-mint-50' : 'bg-forest-50';

  const ongoing = courses.filter((c) => c.status === 'ongoing' || c.status === 'upcoming').slice(0, 4);

  const stats = [
    { label: '進行中', value: courses.filter((c) => c.status === 'ongoing').length, icon: TrendingUp },
    { label: '即將開課', value: courses.filter((c) => c.status === 'upcoming').length, icon: BookOpen },
    { label: '已完成', value: courses.filter((c) => c.status === 'done').length, icon: Award },
    { label: '總報名人次', value: courses.reduce((s, c) => s + c.enrolled, 0), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-5 md:p-6 ${accentSoft} border border-forest-100`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${accentBg} text-white flex items-center justify-center shrink-0`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${accentText}`}>{title}</h2>
            <p className="text-sm text-forest-600 mt-1 max-w-2xl">{summary}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/70 rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${accentText}`} />
                <div>
                  <p className="text-xs text-forest-500">{s.label}</p>
                  <p className="text-base font-bold text-forest-900">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.id} kpi={k} delay={i * 60} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ScheduleList items={schedule} accent={accent} />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5">
            <h3 className="font-semibold text-forest-900 mb-1">近期課程進度</h3>
            <p className="text-xs text-forest-500 mb-4">本區近期重點課程完成狀況</p>
            <div className="space-y-4">
              {ongoing.map((c) => {
                const pct = Math.round((c.completed / c.enrolled) * 100);
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-forest-800 truncate pr-2">{c.name}</p>
                      <span className="text-xs font-semibold text-forest-900 shrink-0">{pct}%</span>
                    </div>
                    <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${accentBg} rounded-full origin-left animate-grow-bar`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-forest-500 mt-1">{c.completed}/{c.enrolled} 人 · 滿意度 {c.satisfaction}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
