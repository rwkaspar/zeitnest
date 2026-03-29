import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function SearchPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const searchLabel = user?.role === 'parent' ? 'Leih-Gro\u00dfeltern' : 'Familien';

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (postalCode) params.postal_code = postalCode;
      const data = await api.search(params);
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [city, postalCode]);

  useEffect(() => {
    doSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  return (
    <div className="search-page">
      <div className="container">
        <h1>{searchLabel} in Ihrer N&auml;he finden</h1>

        <form onSubmit={handleSearch} className="search-filters">
          <input type="text" placeholder="Stadt eingeben..." value={city} onChange={(e) => setCity(e.target.value)} />
          <input type="text" placeholder="PLZ..." value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          <button type="submit" className="btn btn-primary">Suchen</button>
        </form>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#x1F50D;</div>
            <h3>Keine Ergebnisse gefunden</h3>
            <p>Versuchen Sie einen anderen Standort oder entfernen Sie die Filter.</p>
          </div>
        ) : (
          <div className="search-results">
            {results.map(person => (
              <div key={person.id} className="card user-card">
                <div className="user-avatar">
                  {person.first_name[0]}{person.last_name[0]}
                </div>
                <div className="user-info">
                  <h3>{person.first_name} {person.last_name}</h3>
                  <p className="location">&#x1F4CD; {person.city || 'Keine Angabe'} {person.postal_code && `(${person.postal_code})`}</p>
                  {person.bio && <p className="bio">{person.bio}</p>}
                  <div className="tags">
                    {person.offered_activities && person.offered_activities.split(',').slice(0, 3).map((act, i) => (
                      <span key={i} className="tag">{act.trim()}</span>
                    ))}
                    {person.preferred_activities && person.preferred_activities.split(',').slice(0, 3).map((act, i) => (
                      <span key={i} className="tag blue">{act.trim()}</span>
                    ))}
                    {person.has_fuehrungszeugnis === 1 && <span className="tag" style={{ background: '#eefaee', color: '#5cb85c' }}>F&uuml;hrungszeugnis &#x2713;</span>}
                  </div>
                  {person.avg_rating && (
                    <div className="rating">
                      &#x2B50; {Number(person.avg_rating).toFixed(1)} ({person.review_count} Bewertungen)
                    </div>
                  )}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Link to={`/profil/${person.id}`} className="btn btn-outline btn-sm">Profil ansehen</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
