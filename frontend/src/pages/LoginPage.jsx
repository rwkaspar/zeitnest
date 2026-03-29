import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Willkommen zur&uuml;ck</h1>
        <p className="subtitle">Melden Sie sich bei Zeitnest an</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail-Adresse</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre@email.de" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ihr Passwort" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#6b7c93' }}>
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: '#999' }}>
          Demo-Login: maria.schmidt@example.de / demo1234
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
