import { Users, Star, CheckCircle2, Clock, BookOpen, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Kpi } from '../types';

const iconMap = {
  users: Users,
  star: Star,
  check: CheckCircle2,
  clock: Clock,
  book: BookOpen,
  award: Award,
};

export default function KpiCard({ kpi, delay = 0 }: { kpi: Kpi; delay?: number }) {
  const Icon = iconMap[kpi.icon];
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    kpi.trend === 'up' ? 'text-mint-600 bg-mint-50' : kpi.trend === 'down' ? 'text-red-600 bg-red-50' : 'text-forest-500 bg-forest-50';

  return (
    <div
      className="group bg-white rounded-2xl p-5 shadow-card hover:shadow-cardHover border border-forest-50 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center group-hover:bg-mint-500 group-hover:text-white transition-colors duration-300">
          <Icon className="w-5 h-5" strokeWidth={2.1} />
        </div>
        {kpi.delta && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {kpi.delta}
          </span>
        )}
      </div>
      <p className="text-sm text-forest-500 mb-1">{kpi.label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-forest-900 tracking-tight">{kpi.value}</span>
        {kpi.unit && <span className="text-sm font-medium text-forest-500">{kpi.unit}</span>}
      </div>
    </div>
  );
}
