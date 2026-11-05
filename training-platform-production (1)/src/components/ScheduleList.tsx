import { Calendar, MapPin, User, Users } from 'lucide-react';
import type { ScheduleItem } from '../types';

export default function ScheduleList({ items, accent = 'mint' }: { items: ScheduleItem[]; accent?: 'mint' | 'forest' }) {
  const accentBg = accent === 'mint' ? 'bg-mint-500' : 'bg-forest-600';
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-50 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-mint-600" />
        <h3 className="font-semibold text-forest-900">近期排程</h3>
      </div>
      <ul className="divide-y divide-forest-50">
        {items.map((item) => {
          const fillPct = Math.round((item.attendees / item.capacity) * 100);
          return (
            <li key={item.id} className="px-5 py-4 hover:bg-forest-50/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className={`shrink-0 w-14 h-14 rounded-xl ${accentBg} text-white flex flex-col items-center justify-center leading-none`}>
                  <span className="text-[10px] tracking-wide opacity-80">
                    {item.date.split(' ')[0].split('/')[0]}月
                  </span>
                  <span className="text-lg font-bold">{item.date.split(' ')[0].split('/')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-forest-900 truncate">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-forest-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {item.trainer}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {item.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {item.attendees}/{item.capacity}
                    </span>
                  </div>
                </div>
                <div className="sm:w-28 shrink-0">
                  <div className="flex items-center justify-between mb-1 text-xs text-forest-500">
                    <span>報名</span>
                    <span className="font-semibold text-forest-800">{fillPct}%</span>
                  </div>
                  <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${accentBg} rounded-full`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
