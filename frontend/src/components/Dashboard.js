import React, { useEffect, useState } from 'react';
import { getMetrics } from '../services/api';
import KPICard from './KPICard';
import Chart from './Chart';
import DataTable from './DataTable';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await getMetrics();
      setData(res);
    } catch (e) {
      setErr(e.message || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p style={{ padding: 24 }}>Laddar…</p>;
  if (err) return (
    <div style={{ padding: 24, color: '#d93025' }}>
      Fel: {err}
      <div>
        <button onClick={load} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8 }}>
          Försök igen
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, display: 'grid', gap: 20, background: '#f6f7fb', minHeight: '100vh' }}>
      <header>
        <h1 style={{ margin: 0 }}>Holohouse2 – Dashboard</h1>
        <small style={{ color: '#64748b' }}>
          Senast uppdaterad: {new Date(data.lastUpdated).toLocaleString('sv-SE')}
        </small>
      </header>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {data.kpis?.map(k => <KPICard key={k.key} {...k} />)}
      </section>

      <section>
        <h2 style={{ margin: '8px 0' }}>Tidsserie</h2>
        <Chart data={data.series} />
      </section>

      <section>
        <h2 style={{ margin: '8px 0' }}>Detaljer (tabell)</h2>
        <DataTable rows={data.series} />
      </section>
    </div>
  );
}
