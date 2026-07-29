import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { HELPER_CATEGORIES, SKILLS, labelOf } from '../constants/profileOptions';

function SearchPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [helperCategory, setHelperCategory] = useState('');
  const [skillFilter, setSkillFilter] = useState([]);

  const searchesHelpers = user?.role === 'parent';
  const searchLabel = searchesHelpers ? 'Zeitschenker:innen' : 'Familien';

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (postalCode) {
        params.near_postal_code = postalCode;
        params.radius_km = radiusKm;
      }
      if (searchesHelpers && helperCategory) params.helper_category = helperCategory;
      if (searchesHelpers && skillFilter.length) params.skills = skillFilter.join(',');
      const data = await api.search(params);
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [city, postalCode, radiusKm, helperCategory, skillFilter, searchesHelpers]);

  function toggleSkill(key) {
    setSkillFilter((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

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
          <input type="text" placeholder="Stadt..." value={city} onChange={(e) => setCity(e.target.value)} />
          <input type="text" placeholder="PLZ..." value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={{ maxWidth: '120px' }} />
          <select value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} disabled={!postalCode} title="Umkreis um PLZ">
            <option value={1}>1 km (gleicher Ort)</option>
            <option value={10}>10 km</option>
            <option value={50}>50 km</option>
            <option value={150}>150 km</option>
          </select>
          {user?.postal_code && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPostalCode(user.postal_code)}>
              Meine PLZ
            </button>
          )}
          {searchesHelpers && (
            <select value={helperCategory} onChange={(e) => setHelperCategory(e.target.value)} title="Helfer-Kategorie">
              <option value="">Alle Kategorien</option>
              {HELPER_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          )}
          <button type="submit" className="btn btn-primary">Suchen</button>
        </form>

        {searchesHelpers && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '0 0 20px' }}>
            {SKILLS.map((s) => (
              <button key={s.key} type="button" onClick={() => toggleSkill(s.key)}
                style={{
                  padding: '4px 12px', borderRadius: '14px', border: '1px solid',
                  borderColor: skillFilter.includes(s.key) ? 'var(--primary)' : 'var(--border)',
                  background: skillFilter.includes(s.key) ? 'var(--primary-light)' : 'var(--bg-white)',
                  color: skillFilter.includes(s.key) ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer', fontSize: '0.82rem',
                  fontWeight: skillFilter.includes(s.key) ? 600 : 400,
                }}>
                {s.label}
              </button>
            ))}
          </div>
        )}

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
                  <h3>{person.first_name} {person.last_name} {person.is_demo && <span className="demo-badge">Beispielprofil</span>}</h3>
                  <p className="location">&#x1F4CD; {person.city || 'Keine Angabe'} {person.postal_code && `(${person.postal_code})`}</p>
                  {person.bio && <p className="bio">{person.bio}</p>}
                  <div className="tags">
                    {person.helper_category && person.helper_category !== 'grandparent' && (
                      <span className="tag" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                        {labelOf(HELPER_CATEGORIES, person.helper_category)}
                      </span>
                    )}
                    {Array.isArray(person.skills) && person.skills.slice(0, 3).map((sk) => (
                      <span key={sk} className="tag blue">{labelOf(SKILLS, sk)}</span>
                    ))}
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
