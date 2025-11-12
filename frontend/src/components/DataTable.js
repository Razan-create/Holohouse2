import React from 'react';

export default function DataTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 12 }}>Datum</th>
            <th style={{ textAlign: 'right', padding: 12 }}>Värde</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} style={{ borderTop: '1px solid #eef2f7' }}>
              <td style={{ padding: 12 }}>
                {new Date(r.timestamp).toLocaleDateString('sv-SE')}
              </td>
              <td style={{ padding: 12, textAlign: 'right' }}>
                {new Intl.NumberFormat('sv-SE').format(r.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
