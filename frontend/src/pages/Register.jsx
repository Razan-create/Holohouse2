import React, { useState } from 'react';
import { registerReq } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');   // <-- DU SAKNADE DEN HÄR!
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    try {
      await registerReq(name, email, password);
      setMsg('Konto skapat! Du kan nu logga in.');
      // Du kan aktivera denna om du vill, så skickas de till login:
      // nav('/login');
    } catch (e) {
      console.error(e);
      setErr('Registrering misslyckades: ' + (e.message || 'okänt fel'));
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Registrera</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Namn" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="E-post" value={email} onChange={e => setEmail(e.target.value)} required />
        <input placeholder="Lösenord" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button>Skapa konto</button>
      </form>

      {err && <small style={{ color: '#d93025' }}>{err}</small>}
      {msg && <small style={{ color: '#188038' }}>{msg}</small>}

      <p>Har du konto? <Link to="/login">Logga in</Link></p>
    </div>
  );
}
