import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { listFiles, uploadFile, downloadFile } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const { user, token } = useAuth();
  const nav = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!token) return;
    try {
      setErr('');
      const files = await listFiles(token);
      setHistory(files);
    } catch (e) {
      console.error(e);
      setErr('Kunde inte hämta filhistorik (backend kanske inte är helt klar än).');
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setMsg('');
    setErr('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    if (!selectedFile) {
      setErr('Välj en Excel-fil först.');
      return;
    }

    const allowed =
      selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    if (!allowed) {
      setErr('Endast Excel-filer (.xlsx eller .xls) är tillåtna.');
      return;
    }

    try {
      setLoading(true);
      await uploadFile(token, selectedFile);
      setMsg('Filen har laddats upp! Analysen skapas (PDF) av systemet.');
      setSelectedFile(null);
      await loadHistory();
    } catch (e) {
      console.error(e);
      setErr('Uppladdning misslyckades. Kontrollera backend eller nätverk.');
    } finally {
      setLoading(false);
    }
  };

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
      setErr('Kunde inte ladda ner PDF-resultatet.');
    }
  };

  const displayName = user?.name || 'användare';

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background:
          'linear-gradient(135deg, #16a34a 0%, #22c55e 40%, #bbf7d0 100%)', // grön bakgrund
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'white',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        {/* Hälsning */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>
            Hej, {displayName} !
          </h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Här kan du ladda upp <strong>Excel-filer</strong> med miljödata (t.ex. CO₂,
            energi, vatten). Systemet analyserar filen och skapar en
            <strong> PDF-rapport</strong> med resultatet. Under sidan ser du också en
            historik över tidigare uppladdningar och genererade rapporter.
          </p>
        </header>

        {/* Uppladdningssektion */}
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            background: '#f9fafb',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Ladda upp ny fil</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
            Endast Excel-filer accepteras (.xlsx, .xls). När filen laddats upp kommer
            backend göra analysen och skapa en PDF.
          </p>

          <form onSubmit={handleUpload} style={{ display: 'grid', gap: 12 }}>
            <div>
              {/* “Välj fil”-knapp (grön) */}
              <label
                style={{
                  display: 'inline-block',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #15803d',
                  cursor: 'pointer',
                  background: '#22c55e',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Välj fil
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              <span style={{ marginLeft: 8, fontSize: 14 }}>
                {selectedFile ? selectedFile.name : 'Ingen fil vald ännu'}
              </span>
            </div>

            {/* Ladda upp-knapp (grön) */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#16a34a',
                color: 'white',
                fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
                width: 'fit-content',
              }}
            >
              {loading ? 'Laddar upp…' : 'Ladda upp fil'}
            </button>

            {err && <small style={{ color: '#dc2626' }}>{err}</small>}
            {msg && <small style={{ color: '#15803d' }}>{msg}</small>}
          </form>
        </section>

        {/* Historiksektion */}
        <section>
          <h2>Historik</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Här visas filer som du (eller teamet) har laddat upp, samt länkar för att
            hämta skapade PDF-rapporter.
          </p>

          {history.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>
              Inga filer har laddats upp ännu.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#ffffff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.filename}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Uppladdad:{' '}
                      {item.uploadedAt
                        ? new Date(item.uploadedAt).toLocaleString('sv-SE')
                        : 'okänt datum'}
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #16a34a',
                        background: '#bbf7d0',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Ladda ner PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Nästa-knapp längst ner – går till Dashboard */}
        <div style={{ marginTop: 32, textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => nav('/')}
            style={{
              padding: '10px 18px',
              borderRadius: 9999,
              border: 'none',
              background: '#16a34a',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Nästa →
          </button>
        </div>
      </div>
    </div>
  );
}


