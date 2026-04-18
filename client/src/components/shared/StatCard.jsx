import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, color = '#1B263B', suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const steps = 30;
    const increment = numericValue / steps;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(start * 10) / 10);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericValue]);

  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? '#354F52' : trend < 0 ? '#A4161A' : '#6b7280';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 font-[DM_Sans] animate-count" style={{ color }}>
            {prefix}{typeof value === 'number' ? (Number.isInteger(numericValue) ? displayValue.toFixed(0) : displayValue.toFixed(1)) : value}{suffix}
          </p>
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1 mt-2">
              {(() => { const TIcon = trendIcon; return <TIcon size={14} style={{ color: trendColor }} />; })()}
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {Math.abs(trend)}% from last week
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}12` }}>
            <Icon size={22} style={{ color }} />
          </div>
        )}
      </div>
    </div>
  );
}
