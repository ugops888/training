import { Info, Menu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  notice: string;
  onMenuClick: () => void;
  onRefresh: () => void;
}

export default function Header({ title, notice, onMenuClick, onRefresh }: HeaderProps) {
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
          <h1 className="text-lg md:text-2xl font-bold text-forest-900 truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-mint-500 text-white font-semibold text-sm shadow-card hover:bg-mint-600 hover:shadow-cardHover transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="whitespace-nowrap">更新數據</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 px-4 md:px-8 pb-3 text-xs text-forest-600">
        <Info className="w-4 h-4 text-mint-600 shrink-0" />
        <span>{notice}</span>
      </div>
    </header>
  );
}
