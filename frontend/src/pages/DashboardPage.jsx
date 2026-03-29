import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = matches.filter(m => m.status === 'pending').length;
  const acceptedCount = matches.filter(m => m.status === 'accepted').length;

  const roleLabel = user?.role === 'parent' ? 'Elternteil' : 'Leih-Gro\u00dfelternteil';
  const searchLabel = user?.role === 'parent' ? 'Leih-Gro\u00dfeltern' : 'Familien';

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Hallo, {user?.first_name}! &#x1F44B;</h1>
          <p>Willkommen bei Zeitnest &ndash; Ihr Dashboard als {roleLabel}</p>
        </div>

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

              return (
                <Link key={match.id} to={`/nachrichten/${match.id}`} className="card match-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="match-info">
                    <div className="user-avatar">{otherName[0]}</div>
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
