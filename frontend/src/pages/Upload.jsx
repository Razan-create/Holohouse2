import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { listFiles, uploadFile, downloadFile } from '../services/api';

export default function Upload() {
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const refresh = async () => {
    setErr('');
    try {
      setFiles(await listFiles(token));
    } catch (e) {
      setErr('Kunde inte hämta filer');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refresh();
  }, []);

  const onUpload = async (e) => {
    e.preventDefault();
    if (!chosen) return;

    setMsg('');
    setErr('');

    try {
      await uploadFile(token, chosen);
      setMsg('Uppladdad!');
      setChosen(null);
      await refresh();
    } catch (e) {
      setErr('Uppladdning misslyckades');
    }
  };

  const onDownload = async (id, filename) => {
    const res = await downloadFile(token, id);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Filer</h1>

      <form onSubmit={onUpload} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="file" onChange={e => setChosen(e.target.files?.[0] || null)} />
        <button type="submit">Ladda upp</button>
      </form>

      {msg && <small style={{ color: '#188038' }}>{msg}</small>}
      {err && <small style={{ color: '#d93025' }}>{err}</small>}

      <ul>
        {files.map(f => (
          <li key={f.id} style={{ marginBottom: 8 }}>
            {f.filename} ({Math.round(f.size / 1024)} kB) – {new Date(f.uploadedAt).toLocaleString('sv-SE')}
            {' '}
            <button onClick={() => onDownload(f.id, f.filename)}>Ladda ner</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
