// src/pages/Upload.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../services/api";
import { useAuth } from "../AuthContext";
import "./Upload.css";

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" eller "error"

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setMessage("");
    setMessageType("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Välj en fil först.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const token = localStorage.getItem('token');
      await uploadFile(token, file);

      setMessage("Filen laddades upp! Du kan nu se resultat i dashboard eller historik.");
      setMessageType("success");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("Något gick fel vid uppladdningen. Försök igen.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "vän";

  return (
    <div className="upload-page">
      <div className="upload-card">
        {/* ÖVERSTA RADEN: hälsning + knapp till dashboard */}
        <div className="upload-header-row">
          <div>
            <p className="upload-eyebrow">FILCENTER</p>
            <h2 className="upload-title">Hej, {displayName}!</h2>
            <p className="upload-description">
              Här kan du ladda upp Excel-filer med miljödata (t.ex. CO₂, energi, vatten).
              Systemet analyserar filen senare och skapar rapporter.
            </p>
          </div>
          <button
            type="button"
            className="upload-outline-btn"
            onClick={() => navigate("/dashboard")}
          >
            Visa dashboard
          </button>
        </div>

        {/* STEG 1 – LADDA UPP FIL */}
        <section className="upload-section primary">
          <div className="section-header">
            <span className="step-pill">Steg 1</span>
            <div>
              <h3 className="section-title">Ladda upp ny fil</h3>
              <p className="section-subtitle">
                Endast Excel-filer accepteras (<code>.xlsx</code>, <code>.xls</code>).
              </p>
            </div>
          </div>

          <div className="upload-controls">
            <label className="file-input-label">
              <span>Välj fil</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                hidden
              />
            </label>

            <span className="selected-file">
              {file ? file.name : "Ingen fil vald ännu"}
            </span>

            <button
              type="button"
              className="upload-btn"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? "Laddar upp..." : "Ladda upp fil"}
            </button>
          </div>

          {message && (
            <p
              className={
                messageType === "success"
                  ? "upload-message success"
                  : "upload-message error"
              }
            >
              {message}
            </p>
          )}
        </section>

        {/* STEG 2 – HISTORIK */}
        <section className="upload-section secondary">
          <div>
            <span className="step-pill subtle">Steg 2</span>
            <h3 className="section-title">Se tidigare uppladdningar</h3>
            <p className="section-subtitle">
              På historiksidan hittar du alla filer du (eller teamet) laddat upp,
              samt länkar till PDF-rapporter.
            </p>
          </div>

          <button
            type="button"
            className="history-btn"
            onClick={() => navigate("/history")}
          >
            Gå till historik
          </button>
        </section>
      </div>
    </div>
  );
};

export default Upload;
