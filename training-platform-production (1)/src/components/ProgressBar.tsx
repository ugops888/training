interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, max = 100, label, showValue = true, size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const height = size === 'sm' ? 'h-2' : 'h-2.5';
  const barColor =
    pct >= 80 ? 'bg-mint-500' : pct >= 50 ? 'bg-mint-400' : pct >= 30 ? 'bg-forest-300' : 'bg-forest-200';

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-forest-600">{label}</span>
          {showValue && <span className="text-xs font-semibold text-forest-800">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-forest-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full origin-left animate-grow-bar transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!label && showValue && (
        <div className="mt-1 text-right text-xs font-semibold text-forest-800">{pct}%</div>
      )}
    </div>
  );
}
