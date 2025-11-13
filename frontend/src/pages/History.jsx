import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { listFiles, downloadFile } from '../services/api';

export default function History() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!token) return;
    try {
      setErr('');
      const files = await listFiles(token);
      setHistory(files);
    } catch (e) {
      setErr('Kunde inte hämta historik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPdf = async (item) => {
    try {
      const res = await downloadFile(token, item.id);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        (item.resultPdfName || item.filename.replace(/\.\w+$/, '')) +
        '_resultat.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Kunde inte ladda ner PDF.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Historik</h1>
      <p style={{ color: '#475569' }}>
        Här ser du alla filer du har laddat upp och deras analyserade PDF-resultat.
      </p>

      {loading && <p>Laddar historik...</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}

      {!loading && history.length === 0 && (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          Du har inte laddat upp några filer än.
        </p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{item.filename}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Uppladdad:{' '}
                {item.uploadedAt
                  ? new Date(item.uploadedAt).toLocaleString('sv-SE')
                  : 'okänt datum'}
              </div>
            </div>
            <button
              onClick={() => handleDownloadPdf(item)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#16a34a',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Ladda ner PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
