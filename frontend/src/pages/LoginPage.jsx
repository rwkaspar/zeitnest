import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const location = useLocation();
  const justRegistered = location.state?.justRegistered;
  const registeredEmail = location.state?.email;
  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needTotp, setNeedTotp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(needTotp ? { totp } : {}) }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        // Falls eine Family-Einladung wartet, geht's dorthin — sonst nach Rolle.
        const pendingToken = sessionStorage.getItem('pendingFamilyInviteToken');
        const target = pendingToken
          ? `/family/join/${pendingToken}`
          : (data.user?.role === 'coordinator' ? '/koordination' : '/dashboard');
        window.location.href = target;
      } else if (data.totp_required) {
        setNeedTotp(true);
        setError(needTotp ? data.error : '');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Willkommen zur&uuml;ck</h1>
        <p className="subtitle">Melden Sie sich bei Zeitnest an</p>

        {justRegistered && (
          <div className="success-message" style={{ textAlign: 'left' }}>
            <strong>Fast geschafft!</strong><br />
            Wir haben Ihnen einen Bestätigungslink an <strong>{registeredEmail}</strong> geschickt.
            Bitte klicken Sie ihn an, danach können Sie sich hier anmelden.
          </div>
        )}

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
          {needTotp && (
            <div className="form-group">
              <label htmlFor="totp">2FA-Code aus Ihrer Authenticator-App</label>
              <input id="totp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="123456" required autoFocus />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
          <Link to="/passwort-vergessen">Passwort vergessen?</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#6b7c93' }}>
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
