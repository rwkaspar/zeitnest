import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (matchId, status) => {
    try {
      await api.updateMatch(matchId, { status });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const pending = matches.filter(m => m.status === 'pending');
  const accepted = matches.filter(m => m.status === 'accepted');
  const declined = matches.filter(m => m.status === 'declined');

  const getOtherPerson = (match) => {
    const isParent = user?.role === 'parent';
    return {
      name: isParent
        ? `${match.grandparent_first_name} ${match.grandparent_last_name}`
        : `${match.parent_first_name} ${match.parent_last_name}`,
      city: isParent ? match.grandparent_city : match.parent_city,
      id: isParent ? match.grandparent_id : match.parent_id,
    };
  };

  const isReceived = (match) => {
    if (user?.role === 'parent') return match.grandparent_id !== user.id;
    return match.parent_id !== user.id;
  };

  return (
    <div className="matches-page">
      <div className="container">
        <h1>Meine Anfragen</h1>

        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#x1F4EC;</div>
            <h3>Noch keine Anfragen</h3>
            <p>Suchen Sie nach passenden {user?.role === 'parent' ? 'Leih-Gro\u00dfeltern' : 'Familien'} und senden Sie eine Anfrage.</p>
            <Link to="/suche" className="btn btn-primary">Jetzt suchen</Link>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '12px' }}>&#x23F3; Offene Anfragen ({pending.length})</h2>
                {pending.map(match => {
                  const other = getOtherPerson(match);
                  const received = isReceived(match);
                  return (
                    <div key={match.id} className="card match-card">
                      <div className="match-info">
                        <div className="user-avatar" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{other.name[0]}</div>
                        <div>
                          <Link to={`/profil/${other.id}`} style={{ fontWeight: '600' }}>{other.name}</Link>
                          <p style={{ fontSize: '0.85rem', color: '#6b7c93' }}>{other.city} &middot; {received ? 'Empfangen' : 'Gesendet'}</p>
                        </div>
                      </div>
                      <div className="match-actions">
                        {received && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleAction(match.id, 'accepted')}>Annehmen</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleAction(match.id, 'declined')}>Ablehnen</button>
                          </>
                        )}
                        <span className="match-status pending">Ausstehend</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {accepted.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '12px' }}>&#x2705; Aktive Verbindungen ({accepted.length})</h2>
                {accepted.map(match => {
                  const other = getOtherPerson(match);
                  return (
                    <div key={match.id} className="card match-card">
                      <div className="match-info">
                        <div className="user-avatar" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{other.name[0]}</div>
                        <div>
                          <Link to={`/profil/${other.id}`} style={{ fontWeight: '600' }}>{other.name}</Link>
                          <p style={{ fontSize: '0.85rem', color: '#6b7c93' }}>{other.city}</p>
                        </div>
                      </div>
                      <div className="match-actions">
                        <Link to={`/nachrichten/${match.id}`} className="btn btn-secondary btn-sm">Nachricht</Link>
                        <span className="match-status accepted">Verbunden</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {declined.length > 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '12px', color: '#999' }}>Abgelehnt ({declined.length})</h2>
                {declined.map(match => {
                  const other = getOtherPerson(match);
                  return (
                    <div key={match.id} className="card match-card" style={{ opacity: 0.6 }}>
                      <div className="match-info">
                        <div className="user-avatar" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{other.name[0]}</div>
                        <div>
                          <span style={{ fontWeight: '600' }}>{other.name}</span>
                          <p style={{ fontSize: '0.85rem', color: '#6b7c93' }}>{other.city}</p>
                        </div>
                      </div>
                      <span className="match-status declined">Abgelehnt</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MatchesPage;
