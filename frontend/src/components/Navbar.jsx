import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Sidor där vi INTE vill visa länkarna Dashboard/Filer
  const hideMainLinks =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/upload';   // ← lagt till

  return (
    <nav
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        borderBottom: '1px solid #eee',
        background: '#f8fafc',
      }}
    >
      {/* Visa INTE Dashboard/Filer på inloggning, registrering eller upload-sidan */}
      {!hideMainLinks && (
        <>
          <Link to="/">Dashboard</Link>
          <Link to="/upload">Filer</Link>
        </>
      )}

      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>{user.name}</span>
            <button onClick={logout}>Logga ut</button>
          </>
        ) : (
          <>
            <Link to="/login">Logga in</Link>
            {' · '}
            <Link to="/register">Registrera</Link>
          </>
        )}
      </div>
    </nav>
  );
}


