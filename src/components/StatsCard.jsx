import React from 'react';

export default function StatsCard({ label, value, accent }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
