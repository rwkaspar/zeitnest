import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Anfrage fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>&#x1F4E7;</div>
          <h1>E-Mail gesendet</h1>
          <p style={{ color: '#6b7c93', margin: '12px 0 24px' }}>
            Wenn ein Konto mit der Adresse <strong>{email}</strong> existiert,
            haben wir Ihnen einen Link zum Zur&uuml;cksetzen Ihres Passworts gesendet.
            Bitte pr&uuml;fen Sie auch Ihren Spam-Ordner.
          </p>
          <Link to="/login" className="btn btn-outline">Zur&uuml;ck zur Anmeldung</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Passwort vergessen</h1>
        <p className="subtitle">Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zur&uuml;cksetzen.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-Mail-Adresse</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ihre@email.de" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Wird gesendet...' : 'Link senden'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#6b7c93' }}>
          <Link to="/login">Zur&uuml;ck zur Anmeldung</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
