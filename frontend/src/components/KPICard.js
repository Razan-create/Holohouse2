import React from 'react';

export default function KPICard({ label, value, trend }) {
  const trendPositive = trend > 0;
  const trendText = `${trendPositive ? '+' : ''}${trend}%`;
  const trendColor = trendPositive ? '#d93025' : '#188038';

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontSize: 14, color: '#667085' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
        {new Intl.NumberFormat('sv-SE').format(value)}
      </div>
      <div style={{ fontSize: 12, color: trendColor, marginTop: 6 }}>
        {trendText} senaste perioden
      </div>
    </div>
  );
}
