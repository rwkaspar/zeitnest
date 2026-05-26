import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [family, setFamily] = useState(null);
  const [fz, setFz] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    api.getMatches().then(setMatches).catch(console.error).finally(() => setLoading(false));
    api.getMe().then(setMe).catch(() => {});
    if (user?.role === 'parent') {
      api.getMyFamily().then(setFamily).catch(() => {});
    }
    if (user?.role === 'grandparent') {
      const token = localStorage.getItem('token');
      fetch('/api/profiles/me/fz', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setFz).catch(() => {});
    }
  }, [user]);

  async function resendVerification() {
    setResending(true);
    setResendMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResendMsg(data.message || data.error || 'Mail gesendet.');
    } catch {
      setResendMsg('Fehler beim Senden.');
    } finally {
      setResending(false);
    }
  }

  const pendingCount = matches.filter(m => m.status === 'pending').length;
  const acceptedCount = matches.filter(m => m.status === 'accepted').length;

  const roleLabel = user?.role === 'parent' ? 'Elternteil' : 'Leih-Großelternteil';
  const searchLabel = user?.role === 'parent' ? 'Leih-Großeltern' : 'Familien';

  // === Onboarding-Checkliste ableiten ===
  const isVerified = me?.email_verified ?? user?.email_verified ?? false;
  const hasBio = !!me?.bio;
  const hasBirthOrProfession = !!(me?.birth_date || me?.profession);
  const hasFamilyFields = user?.role === 'parent' && family
    ? !!(family.number_of_children && family.postal_code)
    : null;
  const hasFzUpload = user?.role === 'grandparent'
    ? (fz?.fz_status === 'verified' || fz?.fz_status === 'pending')
    : null;

  const steps = [
    { key: 'verify', label: 'E-Mail bestätigen', done: isVerified, link: null,
      hint: 'Klicken Sie auf den Link in der Bestätigungsmail.' },
    { key: 'bio', label: 'Über mich ausfüllen', done: hasBio, link: '/profil/bearbeiten',
      hint: 'Eine kurze Beschreibung hilft beim ersten Match.' },
    { key: 'personal', label: 'Persönliches ergänzen (Beruf / Geburtsdatum)', done: hasBirthOrProfession, link: '/profil/bearbeiten' },
    ...(user?.role === 'parent' ? [
      { key: 'family', label: 'Familien-Angaben (PLZ + Kinder)', done: !!hasFamilyFields, link: '/profil/bearbeiten' },
    ] : []),
    ...(user?.role === 'grandparent' ? [
      { key: 'fz', label: 'Führungszeugnis hochladen', done: !!hasFzUpload, link: '/konto',
        hint: 'Stärkstes Vertrauenssignal für Familien.' },
    ] : []),
  ];
  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;
  // Demo-Accounts (Presse-Demo) zeigen die Checkliste immer, auch wenn alles erledigt ist —
  // damit Pressepartner:innen den Onboarding-Charakter der Plattform live sehen können.
  const isDemoUser = (me?.email || user?.email || '').endsWith('@zeitnest.local');
  const showChecklist = !allDone || isDemoUser;

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Hallo, {user?.first_name}! &#x1F44B;</h1>
          <p>Willkommen bei Zeitnest &ndash; Ihr Dashboard als {roleLabel}</p>
        </div>

        {/* Verification-Banner — prominent und nicht-schließbar wenn nicht bestätigt */}
        {!isVerified && (
          <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--warning)', background: '#fff8db' }}>
            <h3 style={{ marginBottom: '8px', color: '#856404' }}>✉️ Bitte bestätigen Sie Ihre E-Mail-Adresse</h3>
            <p style={{ fontSize: '0.95rem', color: '#5a6878', marginBottom: '12px' }}>
              Wir haben einen Bestätigungslink an <strong>{me?.email || user?.email}</strong> geschickt.
              Bitte klicken Sie ihn an, um Ihr Konto freizuschalten. Solange nicht bestätigt, können Sie keine Anfragen senden oder empfangen.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-primary" onClick={resendVerification} disabled={resending}>
                {resending ? 'Sende…' : 'Bestätigungsmail erneut schicken'}
              </button>
              {resendMsg && <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#5a6878' }}>{resendMsg}</span>}
            </div>
          </div>
        )}

        {/* Onboarding-Checkliste — verschwindet wenn alles erledigt (außer bei Demo-Accounts) */}
        {showChecklist && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>So legen Sie los</h3>
              <span style={{ fontSize: '0.85rem', color: '#5a6878' }}>{doneCount}/{steps.length} erledigt{isDemoUser && allDone ? ' (Demo-Vorschau)' : ''}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {steps.map(s => (
                <li key={s.key} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
                    <span style={{ fontSize: '1.2rem', color: s.done ? 'var(--success)' : '#cdd5dc' }}>
                      {s.done ? '✓' : '○'}
                    </span>
                    <div>
                      <div style={{ fontWeight: s.done ? 400 : 500, color: s.done ? '#5a6878' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>
                        {s.label}
                      </div>
                      {!s.done && s.hint && (
                        <div style={{ fontSize: '0.8rem', color: '#5a6878', marginTop: '2px' }}>{s.hint}</div>
                      )}
                    </div>
                  </div>
                  {!s.done && s.link && (
                    <Link to={s.link} className="btn btn-sm btn-outline">Jetzt eintragen</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="card stat-card">
            <div className="stat-icon blue">&#x1F4E9;</div>
            <div className="stat-info">
              <h3>{pendingCount}</h3>
              <p>Offene Anfragen</p>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon green">&#x2705;</div>
            <div className="stat-info">
              <h3>{acceptedCount}</h3>
              <p>Aktive Verbindungen</p>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon orange">&#x1F4CD;</div>
            <div className="stat-info">
              <h3>{user?.city || '–'}</h3>
              <p>Ihr Standort</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Schnellaktionen</h2>
          <div className="actions-grid">
            <Link to="/suche" className="card action-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="action-icon">&#x1F50D;</div>
              <div>
                <h4>{searchLabel} finden</h4>
                <p>Durchsuchen Sie Profile in Ihrer N&auml;he</p>
              </div>
            </Link>
            <Link to="/anfragen" className="card action-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="action-icon">&#x1F4EC;</div>
              <div>
                <h4>Anfragen verwalten</h4>
                <p>{pendingCount} offene Anfragen</p>
              </div>
            </Link>
            <Link to="/profil/bearbeiten" className="card action-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="action-icon">&#x270F;&#xFE0F;</div>
              <div>
                <h4>Profil bearbeiten</h4>
                <p>Aktualisieren Sie Ihre Informationen</p>
              </div>
            </Link>
            <Link to="/leitfaden" className="card action-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="action-icon">&#x1F4D6;</div>
              <div>
                <h4>Kennenlern-Leitfaden</h4>
                <p>Tipps f&uuml;r das erste Treffen</p>
              </div>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : acceptedCount > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '16px' }}>Ihre Verbindungen</h2>
            {matches.filter(m => m.status === 'accepted').map(match => {
              const isParent = user?.role === 'parent';
              const otherName = isParent
                ? `${match.grandparent_first_name} ${match.grandparent_last_name}`
                : `${match.parent_first_name} ${match.parent_last_name}`;
              const otherCity = isParent ? match.grandparent_city : match.parent_city;
              const otherAvatar = isParent ? match.grandparent_avatar : match.parent_avatar;

              return (
                <Link key={match.id} to={`/nachrichten/${match.id}`} className="card match-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="match-info">
                    <div className="user-avatar" style={otherAvatar ? { backgroundImage: `url(${otherAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                      {!otherAvatar && otherName[0]}
                    </div>
                    <div>
                      <h4>{otherName}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#6b7c93' }}>{otherCity}</p>
                    </div>
                  </div>
                  <span className="btn btn-sm btn-secondary">Nachricht senden</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
