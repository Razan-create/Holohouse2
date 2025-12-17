import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listFiles, downloadFile } from "../services/api";
import { Link } from "react-router-dom";
import "./History.css";

export default function History() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const data = await listFiles(token);
        setFiles(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Kunde inte hämta historik just nu.");
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  const handleDownload = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      await downloadFile(token, fileId);
    } catch (err) {
      console.error(err);
      alert("Kunde inte ladda ned filen.");
    }
  };

  return (
    <>
      
      <div className="history-page">
        <div className="history-card">
          <div className="history-header">
            <div>
              <h2>Historik</h2>
              <p className="history-intro">
                Här ser du filer som du eller ditt team har laddat upp,
                samt länkar för att ladda ned rapporter.
              </p>
            </div>
            <Link to="/upload" className="pill-button pill-button--secondary">
              Tillbaka till filer
            </Link>
          </div>

          {error && (
            <div className="history-status history-status--error">
              {error}
            </div>
          )}

          {loading ? (
            <p className="history-loading">Laddar historik…</p>
          ) : files.length === 0 ? (
            <p className="history-empty">
              Inga filer har laddats upp ännu. Ladda upp din första fil
              från sidan <strong>Filer</strong>.
            </p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Filnamn</th>
                  <th>Uppladdad</th>
                  <th>Rapport</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td>{f.filename}</td>
                    <td>{new Date(f.uploadedAt).toLocaleString('sv-SE')}</td>
                    <td>
                      {f.id ? (
                        <button
                          className="pill-button pill-button--ghost history-download-btn"
                          onClick={() => handleDownload(f.id)}
                        >
                          Ladda ned
                        </button>
                      ) : (
                        <span className="history-no-report">
                          Ingen rapport ännu
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
