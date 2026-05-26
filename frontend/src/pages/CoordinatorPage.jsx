import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ACTIVITIES, MOBILITY, labelOf } from '../constants/profileOptions';

function CoordinatorPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('families');
  const [office, setOffice] = useState(null);
  const [families, setFamilies] = useState([]);
  const [grandparents, setGrandparents] = useState([]);
  const [filter, setFilter] = useState('');

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (!user || user.role !== 'coordinator') return;
    fetch('/api/coordinator/me', { headers: auth() }).then(r => r.json()).then(d => setOffice(d.office));
    fetch('/api/coordinator/families', { headers: auth() }).then(r => r.json()).then(d => setFamilies(d.families || []));
    fetch('/api/coordinator/grandparents', { headers: auth() }).then(r => r.json()).then(d => setGrandparents(d.grandparents || []));
  }, [user]);

  if (!user) return null;
  if (user.role !== 'coordinator') return <Navigate to="/dashboard" />;

  const fFiltered = families.filter(f => {
    if (!filter) return true;
    const haystack = `${f.city || ''} ${f.postal_code || ''} ${(f.members || []).map(m => `${m.first_name} ${m.last_name}`).join(' ')}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });
  const gFiltered = grandparents.filter(g => {
    if (!filter) return true;
    const haystack = `${g.first_name} ${g.last_name} ${g.city || ''} ${g.postal_code || ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  return (
    <div className="profile-page" style={{ maxWidth: '1100px' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '8px' }}>
          Koordinierung
        </h1>
        {office && (
          <p style={{ color: '#5a6878', marginBottom: '24px' }}>
            <strong>{office.name}</strong>
            {office.postal_code_prefixes?.length > 0 && (
              <> &middot; Zuständig für PLZ-Bereiche: {office.postal_code_prefixes.join(', ')}xxx</>
            )}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {[
            ['families', `Familien (${families.length})`],
            ['grandparents', `Wunschgroßeltern (${grandparents.length})`],
          ].map(([t, label]) => (
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
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter nach Name, Stadt oder PLZ..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginBottom: '16px', width: '100%', maxWidth: '400px' }}
        />

        {tab === 'families' && (
          <div>
            {fFiltered.length === 0 && <p>Keine Familien im Bereich gefunden.</p>}
            {fFiltered.map(f => (
              <div key={f.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong>
                      {(f.members || []).map(m => `${m.first_name} ${m.last_name}`).join(' & ') || 'Familie'}
                    </strong>
                    <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#5a6878' }}>
                      {f.city || '?'}{f.postal_code ? ` · ${f.postal_code}` : ''}
                      {f.number_of_children && ` · ${f.number_of_children} Kind${f.number_of_children > 1 ? 'er' : ''}`}
                      {f.children_ages && ` (${f.children_ages} J.)`}
                    </p>
                    {f.max_distance_km && <p style={{ fontSize: '0.85rem', color: '#5a6878' }}>Sucht in {f.max_distance_km} km Umkreis</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(f.members || []).map(m => (
                      <Link key={m.id} to={`/profil/${m.id}`} className="btn btn-sm btn-outline">
                        Profil {m.first_name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'grandparents' && (
          <div>
            {gFiltered.length === 0 && <p>Keine Wunschgroßeltern im Bereich gefunden.</p>}
            {gFiltered.map(g => (
              <div key={g.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: '1 1 360px' }}>
                    <strong>{g.first_name} {g.last_name}</strong>
                    {g.fz_verified && (
                      <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', background: '#e6f4ea', color: '#1e7a3a', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ FZ geprüft
                      </span>
                    )}
                    <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#5a6878' }}>
                      {g.city || '?'}{g.postal_code ? ` · ${g.postal_code}` : ''}
                      {g.preferred_age_range && ` · Bevorzugt ${g.preferred_age_range}`}
                    </p>
                    {g.activities?.length > 0 && (
                      <p style={{ fontSize: '0.85rem', color: '#5a6878' }}>
                        {g.activities.map(a => labelOf(ACTIVITIES, a)).join(' · ')}
                      </p>
                    )}
                    {g.mobility?.length > 0 && (
                      <p style={{ fontSize: '0.85rem', color: '#5a6878' }}>
                        Mobilität: {g.mobility.map(m => labelOf(MOBILITY, m)).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Link to={`/profil/${g.id}`} className="btn btn-sm btn-outline">Profil</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoordinatorPage;
