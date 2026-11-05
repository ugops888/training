import { Star, Users, Clock, Calendar } from 'lucide-react';
import type { Course } from '../types';
import ProgressBar from './ProgressBar';

const statusMap = {
  ongoing: { label: '進行中', cls: 'bg-mint-100 text-mint-700 border-mint-200' },
  upcoming: { label: '即將開課', cls: 'bg-forest-100 text-forest-700 border-forest-200' },
  done: { label: '已完成', cls: 'bg-forest-50 text-forest-600 border-forest-100' },
};

const channelMap = {
  direct: '直營',
  franchise: '加盟',
  both: '共用',
};

export default function CourseProgressCard({ course, delay = 0 }: { course: Course; delay?: number }) {
  const status = statusMap[course.status];
  const completionPct = Math.round((course.completed / course.enrolled) * 100);

  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-card hover:shadow-cardHover border border-forest-50 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-forest-50 text-forest-600">
              {course.category}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-mint-50 text-mint-700">
              {channelMap[course.channel]}
            </span>
          </div>
          <h4 className="font-semibold text-forest-900 leading-snug">{course.name}</h4>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
          {status.label}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5 text-xs text-forest-500">
          <span>完成進度</span>
          <span className="font-semibold text-forest-800">{course.completed}/{course.enrolled} 人</span>
        </div>
        <ProgressBar value={completionPct} showValue={false} />
      </div>

      <div className="flex items-center justify-between text-xs text-forest-500 pt-3 border-t border-forest-50">
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-mint-500 fill-mint-400" />
          <span className="font-semibold text-forest-800">{course.satisfaction}</span>
          <span className="text-forest-400">滿意度</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {course.enrolled} 報名
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {course.schedule}
        </span>
      </div>
    </div>
  );
}
