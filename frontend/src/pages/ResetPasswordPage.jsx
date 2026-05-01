import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passw\u00f6rter stimmen nicht \u00fcberein.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Zur\u00fccksetzen fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>&#x2705;</div>
          <h1>Passwort ge&auml;ndert</h1>
          <p style={{ color: '#6b7c93', margin: '12px 0 24px' }}>
            Ihr Passwort wurde erfolgreich ge&auml;ndert. Sie k&ouml;nnen sich jetzt anmelden.
          </p>
          <Link to="/login" className="btn btn-primary">Jetzt anmelden</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Neues Passwort setzen</h1>
        <p className="subtitle">W&auml;hlen Sie ein neues, sicheres Passwort.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Neues Passwort</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min. 8 Zeichen, Gro\u00df-/Kleinbuchstaben, Zahl" />
          </div>
          <div className="form-group">
            <label>Passwort best&auml;tigen</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Passwort wiederholen" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Wird gespeichert...' : 'Passwort \u00e4ndern'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
