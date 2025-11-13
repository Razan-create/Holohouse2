import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const hideMainLinks =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/upload';

  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
      {!hideMainLinks && (
        <>
          <Link to="/history">Historik</Link>
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
          !isAuthPage && (
            <>
              <Link to="/login">Logga in</Link>
              {' · '}
              <Link to="/register">Registrera</Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}




