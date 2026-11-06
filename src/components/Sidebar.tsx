import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { LOGO_FILE, BRAND_GREEN } from '../data/config';
import { assetUrl } from '../assets';
import { useSiteImages } from '../data/siteImages';
import { LayoutDashboard, Store, GraduationCap, UserSearch, PlayCircle, X, LogOut } from 'lucide-react';
import type { PageId } from '../types';

interface SidebarProps {
  current: PageId;
  onChange: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
  allowed: PageId[];
  role: string;
  onLogout: () => void;
  onRefresh: () => void;
}

const items: { id: PageId; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: 'training', label: '線上學習課程', icon: PlayCircle, desc: '線上課程教材瀏覽' },
  { id: 'direct', label: '直營訓練儀表板', icon: Store, desc: '直營門市培訓總覽' },
  { id: 'franchise', label: '加盟訓練儀表板', icon: LayoutDashboard, desc: '加盟體系培訓總覽' },
  { id: 'student', label: '學員歷史查詢', icon: UserSearch, desc: '依員編 / 姓名查詢夥伴' },
];

export default function Sidebar({ current, onChange, open, onClose, allowed, role, onLogout, onRefresh }: SidebarProps) {
  const site = useSiteImages();
  const logoSrc = site.logo ?? assetUrl(LOGO_FILE);
  const [failedLogo, setFailedLogo] = useState('');
  const logoFailed = failedLogo === logoSrc;
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
        style={{ backgroundColor: BRAND_GREEN }}
        className={`fixed z-40 inset-y-0 left-0 w-72 text-white flex flex-col transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen md:self-start md:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            {logoFailed ? (
              <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-900 flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
              </div>
            ) : (
              <img
                src={logoSrc}
                alt="品牌 LOGO"
                className="h-12 w-auto max-w-[7rem] object-contain shrink-0"
                onError={() => setFailedLogo(logoSrc)}
              />
            )}
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-wide">教育訓練平台</p>
              <p className="text-xs text-white/75">Training Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/80 hover:text-white"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.filter((i) => allowed.includes(i.id)).map((item) => {
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
                    ? 'bg-white text-forest-900 shadow-card'
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-forest-700' : 'text-white/80 group-hover:text-white'}`}
                  strokeWidth={2.1}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs mt-0.5 ${active ? 'text-forest-700/80' : 'text-white/60'}`}>
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-white/20">
          {role && (
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm text-white/90 truncate">目前身分：<span className="font-semibold text-white">{role}</span></p>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/15 text-white hover:bg-black/25"
              >
                <LogOut className="w-3.5 h-3.5" />
                登出
              </button>
            </div>
          )}
          {!role && (
            <button onClick={onLogout} className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/15 text-white hover:bg-black/25">
              <LogOut className="w-3.5 h-3.5" />登出
            </button>
          )}
          <div className="flex items-stretch gap-2">
            <button
              onClick={onRefresh}
              className="shrink-0 inline-flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white text-forest-800 text-xs font-semibold shadow-card hover:bg-white/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="whitespace-nowrap">更新數據</span>
            </button>
            <div className="flex-1 min-w-0 rounded-xl bg-black/15 px-2 flex items-center justify-center">
              <p className="text-[11px] text-white/90 whitespace-nowrap">如資料異常請通知管理員</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
