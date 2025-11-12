import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Chart({ data }) {
  const parsed = (data || []).map(d => ({
    x: new Date(d.timestamp).toLocaleDateString('sv-SE', { year: '2-digit', month: 'short' }),
    y: d.value
  }));

  return (
    <div style={{ height: 300, background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={parsed} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
