import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { uploadFile } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const { user, token } = useAuth();
  const nav = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (e) {
      console.error(e);
      setErr('Uppladdning misslyckades. Kontrollera backend eller nätverk.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || 'användare';

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background:
          'linear-gradient(135deg, #16a34a 0%, #22c55e 40%, #bbf7d0 100%)',
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
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>
            Hej, {displayName} !
          </h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Här kan du ladda upp <strong>Excel-filer</strong> med miljödata (t.ex. CO₂,
            energi, vatten). Systemet analyserar filen och skapar en
            <strong> PDF-rapport</strong> med resultatet.
            <br />
            Din <strong>historik</strong> med uppladdade filer och rapporter hittar du
            via länken <strong>Historik</strong> i menyn.
          </p>
        </header>

        <section
          style={{
            padding: 16,
            borderRadius: 12,
            background: '#1f7162ff',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Ladda upp ny fil</h2>
          <p style={{ color: '#154f28ff', fontSize: 14, marginTop: 0 }}>
            Endast Excel-filer accepteras (.xlsx, .xls). När filen laddats upp kommer
            backend göra analysen och skapa en PDF.
          </p>

          <form onSubmit={handleUpload} style={{ display: 'grid', gap: 12 }}>
            <div>
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
              <span style={{ marginLeft: 8, fontSize: 14, color: 'white' }}>
                {selectedFile ? selectedFile.name : 'Ingen fil vald ännu'}
              </span>
            </div>

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

            {err && <small style={{ color: '#fecaca' }}>{err}</small>}
            {msg && <small style={{ color: '#bbf7d0' }}>{msg}</small>}
          </form>
        </section>

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


