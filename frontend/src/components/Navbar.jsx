import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav style={{ display:'flex', gap:12, padding:12, borderBottom:'1px solid #eee' }}>
      <Link to="/">Dashboard</Link>
      <Link to="/upload">Filer</Link>
      <div style={{ marginLeft:'auto' }}>
        {user ? (<>
          <span style={{ marginRight: 8 }}>{user.name}</span>
          <button onClick={logout}>Logga ut</button>
        </>) : (
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
