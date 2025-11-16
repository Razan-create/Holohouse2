// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginReq, registerReq } from "../services/api";
import { useAuth } from "../AuthContext";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // mode: "login" eller "register"
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const toggleMode = () => {
    setError("");
    setSuccessMsg("");
    setMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (mode === "login") {
      // LOGGA IN
      try {
        const userData = await loginReq(email, password);
        const apiUser = userData?.user || userData || {};
        const authUser = {
          name: apiUser.name || apiUser.fullName || name || "",
          email: apiUser.email || email,
        };
        login(authUser);
        navigate("/upload");
      } catch (err) {
        console.error(err);
        setError("Inloggning misslyckades – kontrollera e-post och lösenord.");
      }
    } else {
      // REGISTRERA
      try {
        await registerReq(name, email, password);
        setSuccessMsg("Konto skapat! Logga in med dina uppgifter.");
        // växla tillbaka till login-läge
        setMode("login");
      } catch (err) {
        console.error(err);
        setError("Registrering misslyckades – försök igen.");
      }
    }
  };

  const isLogin = mode === "login";

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

        <h1 className="login-title">{isLogin ? "Logga in" : "Registrera"}</h1>
        <p className="login-subtitle">
          {isLogin
            ? "Logga in för att se dina hållbarhetsdata, rapporter och analyser."
            : "Skapa ett konto för att komma åt dina hållbarhetsdata och rapporter."}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
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
          )}

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
          {successMsg && !error && (
            <div className="login-error" style={{ color: "#15803d" }}>
              {successMsg}
            </div>
          )}

          <button type="submit" className="login-button">
            {isLogin ? "Logga in" : "Skapa konto"}
          </button>
        </form>

        <div className="login-footer">
          {isLogin ? (
            <>
              Ingen användare?{" "}
              <button
                type="button"
                className="login-link-button"
                onClick={toggleMode}
              >
                Skapa konto
              </button>
            </>
          ) : (
            <>
              Har du konto?{" "}
              <button
                type="button"
                className="login-link-button"
                onClick={toggleMode}
              >
                Logga in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
