import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '', password: '', role: '', first_name: '', last_name: '', city: '', postal_code: ''
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      setError('Bitte w\u00e4hlen Sie Ihre Rolle aus.');
      return;
    }
    if (!privacyAccepted) {
      setError('Bitte stimmen Sie der Datenschutzerkl\u00e4rung zu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(formData);
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
        <h1>Registrieren</h1>
        <p className="subtitle">Erstellen Sie Ihr kostenloses Konto</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <div className={`role-option ${formData.role === 'parent' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'parent' }))}>
              <span className="role-icon">&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;</span>
              <span className="role-label">Elternteil</span>
            </div>
            <div className={`role-option ${formData.role === 'grandparent' ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'grandparent' }))}>
              <span className="role-icon">&#x1F9D3;</span>
              <span className="role-label">Leih-Gro&szlig;elternteil</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vorname *</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="Vorname" />
            </div>
            <div className="form-group">
              <label>Nachname *</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Nachname" />
            </div>
          </div>

          <div className="form-group">
            <label>E-Mail-Adresse *</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="ihre@email.de" />
          </div>
          <div className="form-group">
            <label>Passwort *</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stadt</label>
              <input name="city" value={formData.city} onChange={handleChange} placeholder="z.B. Berlin" />
            </div>
            <div className="form-group">
              <label>Postleitzahl</label>
              <input name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="z.B. 10115" />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <input type="checkbox" id="privacy" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} style={{ marginTop: '4px' }} />
            <label htmlFor="privacy" style={{ fontSize: '0.85rem', color: '#6b7c93', fontWeight: 'normal' }}>
              Ich habe die <a href="/datenschutz" target="_blank">Datenschutzerkl&auml;rung</a> gelesen und stimme der Verarbeitung meiner Daten zu.
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registrieren...' : 'Kostenlos registrieren'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#6b7c93' }}>
          Bereits ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
