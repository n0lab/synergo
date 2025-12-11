import React from 'react';

export default function StatsCard({ label, value, accent, onClick, active }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`card kpi ${onClick ? 'clickable' : ''} ${active ? 'active' : ''}`}
      style={{ '--accent-color': accent }}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: accent }}>
        {value}
      </div>
    </Tag>
  );
}
