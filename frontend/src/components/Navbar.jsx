import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dölj navbar på login & register
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Vänster: emoji-logga + text */}
        <div className="navbar-left">
          <span className="navbar-logo">🌱</span>
          <span className="navbar-title">FRAMTIDENS MILJÖPORTAL</span>
        </div>

        {/* Höger: användarnamn + logout */}
        <div className="navbar-right">
          <span className="navbar-username">{user?.name || "Användare"}</span>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Logga ut
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
