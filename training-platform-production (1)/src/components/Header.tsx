import { Info, ExternalLink, Menu, Bell, RefreshCw } from 'lucide-react';
import { GOOGLE_FORM_URL } from '../data/mockData';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  onRefresh: () => void;
}

export default function Header({ title, subtitle, onMenuClick, onRefresh }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-forest-100">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-forest-700 hover:bg-forest-50"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-forest-900 truncate">{title}</h1>
            <p className="text-xs md:text-sm text-forest-500 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-mint-50 border border-mint-100 text-xs text-forest-700"
            title="本平台數據由各區培訓負責人每週提供，僅供內部訓練管理使用"
          >
            <Info className="w-4 h-4 text-mint-600" />
            <span>數據提供說明</span>
          </div>

          <button
            className="relative p-2 rounded-lg text-forest-600 hover:bg-forest-50 hidden sm:inline-flex"
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mint-500" />
          </button>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-mint-500 text-white font-semibold text-sm shadow-card hover:bg-mint-600 hover:shadow-cardHover transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="whitespace-nowrap">更新數據</span>
          </button>

          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-forest-200 text-forest-700 font-semibold text-sm hover:bg-forest-50 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="whitespace-nowrap hidden md:inline">填寫表單</span>
          </a>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 px-4 md:px-8 pb-3 text-xs text-forest-600">
        <Info className="w-4 h-4 text-mint-600" />
        <span>數據由各區培訓負責人每週提供，僅供內部訓練管理使用</span>
      </div>
    </header>
  );
}
