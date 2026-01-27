import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function StatsCard({ label, value, accent, onClick, active, trend }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`card kpi glass ${onClick ? 'clickable' : ''} ${active ? 'active' : ''}`}
      style={{ '--accent-color': accent }}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: accent }}>
        {value}
        {trend && (
          <span className="kpi-trend" style={{ color: trend > 0 ? 'var(--success)' : 'var(--error)' }}>
            <TrendingUp size={14} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </Tag>
  );
}
