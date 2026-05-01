import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/auth/me/export', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { setError('Export fehlgeschlagen.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zeitnest-datenexport.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (deleteConfirm !== 'LÖSCHEN') {
      setError('Bitte geben Sie LÖSCHEN ein, um zu bestätigen.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError('Löschung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="card">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '24px' }}>Kontoeinstellungen</h1>

          <div className="profile-section">
            <h3>Kontoinformationen</h3>
            <div className="profile-detail">
              <span className="label">E-Mail</span>
              <span>{user?.email}</span>
            </div>
            <div className="profile-detail">
              <span className="label">Rolle</span>
              <span>{user?.role === 'parent' ? 'Elternteil' : 'Leih-Gro\u00dfelternteil'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3>Datenschutz (DSGVO)</h3>
            <p style={{ color: '#6b7c93', fontSize: '0.9rem', marginBottom: '16px' }}>
              Gem&auml;&szlig; der DSGVO haben Sie das Recht, Ihre Daten zu exportieren oder Ihr Konto
              vollst&auml;ndig zu l&ouml;schen.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button onClick={handleExport} className="btn btn-secondary">
                Meine Daten exportieren (JSON)
              </button>
              <a href="/datenschutz" className="btn btn-outline">
                Datenschutzerkl&auml;rung lesen
              </a>
            </div>
          </div>

          <div className="profile-section">
            <h3 style={{ color: '#d9534f' }}>Konto l&ouml;schen</h3>
            <p style={{ color: '#6b7c93', fontSize: '0.9rem', marginBottom: '16px' }}>
              Wenn Sie Ihr Konto l&ouml;schen, werden <strong>alle Ihre Daten unwiderruflich entfernt</strong> &ndash;
              einschlie&szlig;lich Profil, Nachrichten, Buchungen und Bewertungen. Dies kann nicht r&uuml;ckg&auml;ngig
              gemacht werden.
            </p>

            {error && <div className="error-message">{error}</div>}

            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="btn btn-sm btn-danger">
                Konto unwiderruflich l&ouml;schen...
              </button>
            ) : (
              <div style={{ padding: '16px', background: '#fdf0ef', borderRadius: '8px', border: '1px solid #d9534f' }}>
                <p style={{ fontWeight: '600', marginBottom: '12px' }}>
                  Sind Sie sicher? Geben Sie <strong>L&Ouml;SCHEN</strong> ein, um zu best&auml;tigen:
                </p>
                <div className="form-group">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="LÖSCHEN"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleDelete} className="btn btn-danger" disabled={loading}>
                    {loading ? 'Wird gel\u00f6scht...' : 'Endg\u00fcltig l\u00f6schen'}
                  </button>
                  <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); setError(''); }} className="btn btn-outline">
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
