import { Info, Menu } from 'lucide-react';

interface HeaderProps {
  notice: string;
  onMenuClick: () => void;
}

// 手機與平板才顯示的頂部列（桌面版只有左側選單，不需要）
export default function Header({ notice, onMenuClick }: HeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-forest-100">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-forest-700 hover:bg-forest-50"
          aria-label="開啟選單"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-bold text-forest-900">教育訓練平台</span>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 text-xs text-forest-600">
        <Info className="w-4 h-4 text-mint-600 shrink-0" />
        <span>{notice}</span>
      </div>
    </header>
  );
}
