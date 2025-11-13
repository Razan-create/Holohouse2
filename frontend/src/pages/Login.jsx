import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { loginReq } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const nav = useNavigate();

  const onSubmit = async (e) => {
  e.preventDefault();
  setErr('');
  setLoading(true);

  try {
    const { token, user } = await loginReq(email, password);
    login(token, user);
    nav('/upload'); 
  } catch (e) {
    console.error(e);
    setErr('Inloggning misslyckades: ' + (e.message || 'okänt fel'));
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Logga in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="E-post" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Lösenord" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={loading}>{loading ? 'Loggar in…' : 'Logga in'}</button>
        {err && <small style={{ color:'#d93025' }}>{err}</small>}
      </form>
      <p>Ingen användare? <Link to="/register">Skapa konto</Link></p>
    </div>
  );
}
