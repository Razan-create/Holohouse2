// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerReq } from "../services/api";
import "./Login.css"; // återanvänd lyxiga stilen

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      // Skapa konto i backend
      await registerReq(name, email, password);

      // Visa liten bekräftelse (valfritt)
      setSuccessMsg("Konto skapat! Logga nu in med dina uppgifter.");

      // Skicka användaren till inloggningssidan
      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (err) {
      console.error(err);
      setError("Registrering misslyckades – försök igen.");
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo-row">
          <div className="login-logo-circle">🌱</div>
          <div>
            <div className="login-logo-text-small">Framtidens</div>
            <div className="login-logo-text-main">Miljöportal</div>
          </div>
        </div>

        <h1 className="login-title">Registrera</h1>
        <p className="login-subtitle">
          Skapa ett konto för att komma åt dina hållbarhetsdata och rapporter.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <div className="login-label">Namn</div>
            <input
              className="login-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="login-label">E-post</div>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="login-label">Lösenord</div>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}
          {successMsg && (
            <div className="login-error" style={{ color: "#15803d" }}>
              {successMsg}
            </div>
          )}

          <button type="submit" className="login-button">
            Skapa konto
          </button>
        </form>

        <div className="login-footer">
          Har du konto? <Link to="/login">Logga in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
