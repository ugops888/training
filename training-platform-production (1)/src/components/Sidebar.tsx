import { LayoutDashboard, Store, GraduationCap, UserSearch, PlayCircle, X } from 'lucide-react';
import type { PageId } from '../types';

interface SidebarProps {
  current: PageId;
  onChange: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
}

const items: { id: PageId; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: 'training', label: '線上訓練平台', icon: PlayCircle, desc: '線上課程教材瀏覽' },
  { id: 'direct', label: '直營訓練儀表板', icon: Store, desc: '直營門市培訓總覽' },
  { id: 'franchise', label: '加盟訓練儀表板', icon: LayoutDashboard, desc: '加盟體系培訓總覽' },
  { id: 'student', label: '學員歷史查詢', icon: UserSearch, desc: '依員編 / 姓名查詢夥伴' },
];

export default function Sidebar({ current, onChange, open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-forest-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 bg-forest-800 text-forest-50 flex flex-col transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen md:self-start md:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-900 flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-wide">教育訓練平台</p>
              <p className="text-xs text-forest-200">Training Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-forest-100 hover:text-white"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  active
                    ? 'bg-mint-400 text-forest-900 shadow-card'
                    : 'text-forest-100 hover:bg-forest-700/60 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-forest-900' : 'text-mint-300 group-hover:text-mint-200'}`}
                  strokeWidth={2.1}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs mt-0.5 ${active ? 'text-forest-800/70' : 'text-forest-300/80'}`}>
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-forest-700/60">
          <div className="rounded-xl bg-forest-700/50 p-4">
            <p className="text-xs text-forest-200 leading-relaxed">如資料有異常請通知管理員</p>
          </div>
        </div>
      </aside>
    </>
  );
}
