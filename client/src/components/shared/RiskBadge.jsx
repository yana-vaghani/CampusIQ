import { getRiskColor, getRiskBg, getRiskBorder, getRiskLabel } from '../../utils/riskColors';

export default function RiskBadge({ level, score, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: getRiskBg(level),
        color: getRiskColor(level),
        border: `1px solid ${getRiskBorder(level)}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskColor(level) }} />
      {getRiskLabel(level)}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
