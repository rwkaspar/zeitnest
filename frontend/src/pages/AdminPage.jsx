import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REASONS = {
  spam: 'Spam',
  fake_profile: 'Fake-Profil',
  inappropriate_content: 'Unangemessen',
  harassment: 'Belästigung',
  safety_concern: 'Sicherheit',
  other: 'Sonstiges',
};

function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [fzPending, setFzPending] = useState([]);
  const [fzNote, setFzNote] = useState({});

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { if (!user?.is_admin) return; load(); }, [tab, user]);

  async function load() {
    if (tab === 'stats') {
      const r = await fetch('/api/admin/stats', { headers: auth() });
      if (r.ok) setStats(await r.json());
    } else if (tab === 'reports') {
      const r = await fetch('/api/admin/reports', { headers: auth() });
      if (r.ok) setReports(await r.json());
    } else if (tab === 'users') {
      const r = await fetch('/api/admin/users', { headers: auth() });
      if (r.ok) setUsers(await r.json());
    } else if (tab === 'fz') {
      const r = await fetch('/api/admin/fz/pending', { headers: auth() });
      if (r.ok) setFzPending(await r.json());
    }
  }

  async function fzDecide(userId, action) {
    const note = fzNote[userId] || '';
    if (action === 'reject' && !note.trim()) {
      alert('Bitte einen Hinweis für die Ablehnung eintragen.');
      return;
    }
    await fetch(`/api/admin/fz/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ action, note }),
    });
    setFzNote({ ...fzNote, [userId]: '' });
    load();
  }

  function downloadFz(userId, name) {
    const token = localStorage.getItem('token');
    fetch(`/api/admin/fz/${userId}/file`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(b => {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fz-${name.replace(/\s+/g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  async function updateReport(id, status) {
    await fetch(`/api/admin/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteUser(id, email) {
    if (!confirm(`Benutzer ${email} wirklich löschen? Alle Daten gehen verloren.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: auth() });
    load();
  }

  if (!user?.is_admin) return <Navigate to="/dashboard" />;

  return (
    <div className="profile-page" style={{ maxWidth: '1100px' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '24px' }}>
          Admin-Panel
        </h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {['stats', 'reports', 'users', 'fz'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-light)',
                fontWeight: tab === t ? 600 : 400, fontSize: '0.95rem',
              }}
            >
              {t === 'stats' ? 'Statistik' : t === 'reports' ? 'Meldungen' : t === 'users' ? 'Benutzer' : 'Führungszeugnisse'}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats && (
          <div className="dashboard-grid">
            {Object.entries({
              users: 'Benutzer (echt)',
              parents: 'Eltern',
              grandparents: 'Großeltern',
              unverified: 'Unbestätigt',
              matches: 'Anfragen',
              bookings: 'Buchungen',
              open_reports: 'Offene Meldungen',
            }).map(([k, label]) => (
              <div key={k} className="card stat-card">
                <div className="stat-info">
                  <h3>{stats[k] || 0}</h3>
                  <p>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div>
            {reports.length === 0 && <p>Keine Meldungen.</p>}
            {reports.map(r => (
              <div key={r.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong>{REASONS[r.reason]}</strong>
                    <span className={`match-status ${r.status === 'open' ? 'pending' : 'accepted'}`} style={{ marginLeft: '8px' }}>
                      {r.status}
                    </span>
                    <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                      <span style={{ color: '#5a6878' }}>Von:</span> {r.reporter_first_name} {r.reporter_last_name} ({r.reporter_email})<br />
                      <span style={{ color: '#5a6878' }}>Gegen:</span> {r.reported_first_name} {r.reported_last_name} ({r.reported_email})
                    </p>
                    {r.details && <p style={{ background: 'var(--bg)', padding: '8px', borderRadius: '6px', fontSize: '0.9rem' }}>{r.details}</p>}
                    <p style={{ fontSize: '0.8rem', color: '#5a6878' }}>{new Date(r.created_at).toLocaleString('de-DE')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {r.status === 'open' && <button className="btn btn-sm btn-outline" onClick={() => updateReport(r.id, 'reviewed')}>Geprüft</button>}
                    {r.status !== 'closed' && <button className="btn btn-sm btn-success" onClick={() => updateReport(r.id, 'closed')}>Schließen</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'fz' && (
          <div>
            {fzPending.length === 0 && <p>Keine offenen F&uuml;hrungszeugnis-Pr&uuml;fungen.</p>}
            {fzPending.map(u => (
              <div key={u.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: '1 1 320px' }}>
                    <strong>{u.first_name} {u.last_name}</strong>
                    <span className={`match-status ${u.fz_status === 'pending' ? 'pending' : 'declined'}`} style={{ marginLeft: '8px' }}>
                      {u.fz_status === 'pending' ? 'Zur Prüfung' : 'Abgelehnt'}
                    </span>
                    <p style={{ margin: '8px 0', fontSize: '0.9rem', color: '#5a6878' }}>
                      {u.email} {u.city && `· ${u.city}`}
                    </p>
                    {u.fz_submitted_at && (
                      <p style={{ fontSize: '0.85rem', color: '#5a6878' }}>
                        Eingereicht am {new Date(u.fz_submitted_at).toLocaleString('de-DE')}
                      </p>
                    )}
                    {u.fz_admin_note && (
                      <p style={{ fontSize: '0.85rem', color: '#c0392b' }}>
                        Vorheriger Ablehnungs-Hinweis: {u.fz_admin_note}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px' }}>
                    {u.fz_status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-outline" onClick={() => downloadFz(u.id, `${u.first_name}-${u.last_name}`)}>
                          Dokument herunterladen
                        </button>
                        <input
                          type="text"
                          placeholder="Hinweis (bei Ablehnung erforderlich)"
                          value={fzNote[u.id] || ''}
                          onChange={(e) => setFzNote({ ...fzNote, [u.id]: e.target.value })}
                          style={{ fontSize: '0.9rem' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-sm btn-success" onClick={() => fzDecide(u.id, 'approve')}>
                            Genehmigen
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => fzDecide(u.id, 'reject')}>
                            Ablehnen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>E-Mail</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Rolle</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Erstellt</th>
                  <th style={{ padding: '8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px' }}>{u.email}</td>
                    <td style={{ padding: '8px' }}>{u.first_name} {u.last_name}</td>
                    <td style={{ padding: '8px' }}>{u.role}</td>
                    <td style={{ padding: '8px' }}>
                      {u.email_verified ? '✓' : '✗'}
                      {u.totp_enabled && ' 🔐'}
                      {u.is_demo && ' (Demo)'}
                      {u.is_admin && ' 👑'}
                    </td>
                    <td style={{ padding: '8px' }}>{new Date(u.created_at).toLocaleDateString('de-DE')}</td>
                    <td style={{ padding: '8px' }}>
                      {u.id !== user.id && (
                        <button onClick={() => deleteUser(u.id, u.email)} className="btn btn-sm btn-danger">Löschen</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
