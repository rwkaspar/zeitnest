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

          <TwoFactorSection />

          {user?.role === 'grandparent' && <FuehrungszeugnisSection />}

          <div className="profile-section">
            <h3>Datenschutz (DSGVO)</h3>
            <p style={{ color: '#6b7c93', fontSize: '0.9rem', marginBottom: '16px' }}>
              Gem&auml;&szlig; der DSGVO haben Sie das Recht, Ihre Daten zu exportieren oder Ihr Konto
              vollst&auml;ndig zu l&ouml;schen.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button onClick={handleExport} className="btn btn-outline">
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

function TwoFactorSection() {
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState(null); // { qr, secret }
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setEnabled(!!d.totp_enabled))
      .catch(() => {});
  }, []);

  async function startSetup() {
    setMsg('');
    const token = localStorage.getItem('token');
    const res = await fetch('/api/2fa/setup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok) setSetup(data);
    else setMsg(data.error);
  }

  async function confirmEnable() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: code }),
    });
    const data = await res.json();
    if (res.ok) { setEnabled(true); setSetup(null); setCode(''); setMsg('2FA aktiviert!'); }
    else setMsg(data.error);
  }

  async function disable() {
    const code = prompt('Bitte geben Sie Ihren aktuellen 2FA-Code ein:');
    if (!code) return;
    const token = localStorage.getItem('token');
    const res = await fetch('/api/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: code }),
    });
    const data = await res.json();
    if (res.ok) { setEnabled(false); setMsg('2FA deaktiviert.'); }
    else setMsg(data.error);
  }

  return (
    <div className="profile-section">
      <h3>Zwei-Faktor-Authentifizierung (2FA)</h3>
      <p style={{ color: '#5a6878', fontSize: '0.9rem', marginBottom: '12px' }}>
        Schützt Ihr Konto mit einem zusätzlichen 6-stelligen Code aus einer Authenticator-App
        (z.B. Google Authenticator, Authy, 1Password).
      </p>
      {msg && <div className={msg.includes('aktiviert') || msg.includes('deaktiviert') ? 'success-message' : 'error-message'}>{msg}</div>}

      {enabled ? (
        <button className="btn btn-sm btn-outline" onClick={disable}>2FA deaktivieren</button>
      ) : !setup ? (
        <button className="btn btn-sm btn-primary" onClick={startSetup}>2FA einrichten</button>
      ) : (
        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '8px' }}>
          <p style={{ marginBottom: '12px' }}>1. Scannen Sie diesen QR-Code mit Ihrer App:</p>
          <img src={setup.qr} alt="2FA QR-Code" style={{ maxWidth: '200px', display: 'block', marginBottom: '12px' }} />
          <p style={{ fontSize: '0.85rem', color: '#5a6878', marginBottom: '12px' }}>
            Oder geben Sie den Schlüssel manuell ein: <code>{setup.secret}</code>
          </p>
          <p style={{ marginBottom: '8px' }}>2. Geben Sie den 6-stelligen Code aus der App ein:</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} placeholder="123456" style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary" onClick={confirmEnable}>Aktivieren</button>
            <button className="btn btn-outline" onClick={() => setSetup(null)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FuehrungszeugnisSection() {
  const [info, setInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    const token = localStorage.getItem('token');
    fetch('/api/profiles/me/fz', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInfo(d))
      .catch(() => {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('fz', file);
      const res = await fetch('/api/profiles/me/fz', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Hochgeladen. Wir prüfen Ihr Dokument.');
        setFile(null);
        refresh();
      } else {
        setMsg(data.error || 'Upload fehlgeschlagen.');
      }
    } catch {
      setMsg('Upload fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  const status = info?.fz_status || 'not_submitted';
  const badges = {
    not_submitted: { text: 'Noch nicht eingereicht', color: '#6b7c93', bg: '#f1f3f5' },
    pending: { text: 'Wird geprüft', color: '#856404', bg: '#fff8db' },
    verified: { text: '✓ Geprüft', color: '#1e7a3a', bg: '#e6f4ea' },
    rejected: { text: 'Abgelehnt', color: '#c0392b', bg: '#fdecea' },
    expired: { text: 'Abgelaufen', color: '#6b7c93', bg: '#f1f3f5' },
  };
  const b = badges[status] || badges.not_submitted;

  return (
    <div className="profile-section">
      <h3>Erweitertes F&uuml;hrungszeugnis</h3>
      <p style={{ color: '#5a6878', fontSize: '0.9rem', marginBottom: '12px' }}>
        Das erweiterte F&uuml;hrungszeugnis nach &sect;30a BZRG ist ein wichtiges Vertrauenssignal
        f&uuml;r Eltern. Sie k&ouml;nnen es online beim Bundesamt f&uuml;r Justiz beantragen &ndash;
        f&uuml;r ehrenamtliche T&auml;tigkeiten oft geb&uuml;hrenfrei.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, color: b.color, background: b.bg }}>
          {b.text}
        </span>
        {status === 'verified' && info?.fz_expires_at && (
          <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: '#5a6878' }}>
            G&uuml;ltig bis {new Date(info.fz_expires_at).toLocaleDateString('de-DE')}
          </span>
        )}
        {status === 'rejected' && info?.fz_admin_note && (
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#c0392b' }}>
            Hinweis vom Admin: {info.fz_admin_note}
          </p>
        )}
      </div>

      {msg && <div className={msg.includes('Hochgeladen') ? 'success-message' : 'error-message'}>{msg}</div>}

      {(status === 'not_submitted' || status === 'rejected' || status === 'expired') && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
            Datei hochladen (PDF, JPG oder PNG, max. 5 MB):
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="submit" className="btn btn-sm btn-primary" disabled={!file || loading}>
              {loading ? 'L&auml;dt hoch...' : 'Hochladen'}
            </button>
          </div>
        </form>
      )}

      {status === 'pending' && (
        <p style={{ fontSize: '0.9rem', color: '#5a6878' }}>
          Ihr Dokument wurde am {info?.fz_submitted_at ? new Date(info.fz_submitted_at).toLocaleDateString('de-DE') : '?'} eingereicht
          und wird gepr&uuml;ft. Sie erhalten eine Nachricht, sobald die Pr&uuml;fung abgeschlossen ist.
        </p>
      )}

      <p style={{ fontSize: '0.85rem', color: '#5a6878', marginTop: '12px' }}>
        Antrag stellen:{' '}
        <a href="https://www.fuehrungszeugnis.bund.de/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
          fuehrungszeugnis.bund.de
        </a>
        . Nach erfolgreicher Pr&uuml;fung wird Ihr Dokument aus unserem Speicher gel&ouml;scht &ndash; nur der Verifizierungs-Status bleibt erhalten.
      </p>
    </div>
  );
}

export default AccountPage;
