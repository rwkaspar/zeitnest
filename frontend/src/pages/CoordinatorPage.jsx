import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ACTIVITIES, MOBILITY, labelOf } from '../constants/profileOptions';

const STATUS_LABELS = {
  new: { label: 'Neu', color: '#5a6878', bg: '#f1f3f5' },
  in_contact: { label: 'Im Erstkontakt', color: '#856404', bg: '#fff8db' },
  matched: { label: 'Vermittelt', color: '#1e7a3a', bg: '#e6f4ea' },
  paused: { label: 'Pausiert', color: '#6b7c93', bg: '#eceff4' },
};

const STATUS_OPTIONS = [
  { key: 'new', label: 'Neu' },
  { key: 'in_contact', label: 'Im Erstkontakt' },
  { key: 'matched', label: 'Vermittelt' },
  { key: 'paused', label: 'Pausiert' },
];

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.new;
  return (
    <span style={{ padding: '2px 10px', borderRadius: '10px', background: s.bg, color: s.color, fontSize: '0.8rem', fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function CoordinatorPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('families');
  const [office, setOffice] = useState(null);
  const [stats, setStats] = useState({ families: 0, grandparents: 0, fz_verified: 0, in_contact: 0, matched: 0 });
  const [families, setFamilies] = useState([]);
  const [grandparents, setGrandparents] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ status: 'new', note: '' });

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  async function reload() {
    const [o, s, f, g] = await Promise.all([
      fetch('/api/coordinator/me', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/stats', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/families', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/grandparents', { headers: auth() }).then(r => r.json()),
    ]);
    setOffice(o.office);
    setStats(s);
    setFamilies(f.families || []);
    setGrandparents(g.grandparents || []);
  }

  useEffect(() => {
    if (!user || user.role !== 'coordinator') return;
    reload();
  }, [user]);

  if (!user) return null;
  if (user.role !== 'coordinator') return <Navigate to="/dashboard" />;

  async function saveNote(targetType, targetId) {
    await fetch(`/api/coordinator/notes/${targetType}/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(noteDraft),
    });
    setEditingNote(null);
    reload();
  }

  function startEditNote(targetType, targetId, current) {
    setEditingNote(`${targetType}:${targetId}`);
    setNoteDraft({ status: current?.status || 'new', note: current?.note || '' });
  }

  function applyFilters(list, nameKey) {
    return list.filter((item) => {
      if (statusFilter) {
        const st = item._note?.status || 'new';
        if (st !== statusFilter) return false;
      }
      if (filter) {
        const haystack = nameKey(item).toLowerCase();
        if (!haystack.includes(filter.toLowerCase())) return false;
      }
      return true;
    });
  }

  const fFiltered = applyFilters(families, (f) =>
    `${(f.members || []).map((m) => `${m.first_name} ${m.last_name}`).join(' ')} ${f.city || ''} ${f.postal_code || ''}`
  );
  const gFiltered = applyFilters(grandparents, (g) =>
    `${g.first_name} ${g.last_name} ${g.city || ''} ${g.postal_code || ''}`
  );

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
              <> · PLZ-Bereiche: {office.postal_code_prefixes.join(', ')}xxx</>
            )}
          </p>
        )}

        {/* Statistik-Karten */}
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          {[
            { k: 'families', label: 'Familien sichtbar' },
            { k: 'grandparents', label: 'Wunschgroßeltern sichtbar' },
            { k: 'fz_verified', label: 'davon FZ-geprüft' },
            { k: 'in_contact', label: 'Im Erstkontakt' },
            { k: 'matched', label: 'Vermittelt' },
          ].map((s) => (
            <div key={s.k} className="card stat-card">
              <div className="stat-info">
                <h3>{stats[s.k] ?? 0}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          {[
            ['families', `Familien (${fFiltered.length}/${families.length})`],
            ['grandparents', `Wunschgroßeltern (${gFiltered.length}/${grandparents.length})`],
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter nach Name, Stadt oder PLZ..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: '1 1 240px', maxWidth: '400px' }}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Alle Status</option>
            {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {tab === 'families' && (
          <div>
            {families.length === 0 && (
              <p style={{ color: '#5a6878' }}>
                Noch keine Familien im Bereich, die die Sichtbarkeit für Koordinierungsstellen aktiviert haben.
              </p>
            )}
            {fFiltered.map(f => {
              const editKey = `family:${f.id}`;
              const isEditing = editingNote === editKey;
              return (
                <div key={f.id} className="card" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong>{(f.members || []).map(m => `${m.first_name} ${m.last_name}`).join(' & ') || 'Familie'}</strong>
                        <StatusBadge status={f._note?.status || 'new'} />
                      </div>
                      <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#5a6878' }}>
                        {f.city || '?'}{f.postal_code ? ` · ${f.postal_code}` : ''}
                        {f.number_of_children && ` · ${f.number_of_children} Kind${f.number_of_children > 1 ? 'er' : ''}`}
                        {f.children_ages && ` (${f.children_ages} J.)`}
                      </p>
                      {f._note?.note && !isEditing && (
                        <p style={{ marginTop: '8px', padding: '8px', background: 'var(--bg)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {f._note.note}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(f.members || []).slice(0, 2).map(m => (
                        <Link key={m.id} to={`/profil/${m.id}`} className="btn btn-sm btn-outline">
                          {m.first_name}
                        </Link>
                      ))}
                      <button className="btn btn-sm btn-secondary" onClick={() => startEditNote('family', f.id, f._note)}>
                        Notiz / Status
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '6px' }}>
                      <div className="form-group">
                        <label>Status</label>
                        <select value={noteDraft.status} onChange={(e) => setNoteDraft({ ...noteDraft, status: e.target.value })}>
                          {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Notiz</label>
                        <textarea
                          rows={3}
                          value={noteDraft.note}
                          onChange={(e) => setNoteDraft({ ...noteDraft, note: e.target.value })}
                          placeholder="z.B. Gespräch am 12.06., sucht für nachmittags …"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveNote('family', f.id)}>Speichern</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditingNote(null)}>Abbrechen</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'grandparents' && (
          <div>
            {grandparents.length === 0 && (
              <p style={{ color: '#5a6878' }}>
                Noch keine Wunschgroßeltern im Bereich, die die Sichtbarkeit für Koordinierungsstellen aktiviert haben.
              </p>
            )}
            {gFiltered.map(g => {
              const editKey = `grandparent:${g.id}`;
              const isEditing = editingNote === editKey;
              return (
                <div key={g.id} className="card" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong>{g.first_name} {g.last_name}</strong>
                        <StatusBadge status={g._note?.status || 'new'} />
                        {g.fz_verified && (
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#e6f4ea', color: '#1e7a3a', fontSize: '0.75rem', fontWeight: 600 }}>
                            ✓ FZ
                          </span>
                        )}
                      </div>
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
                      {g._note?.note && !isEditing && (
                        <p style={{ marginTop: '8px', padding: '8px', background: 'var(--bg)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {g._note.note}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Link to={`/profil/${g.id}`} className="btn btn-sm btn-outline">Profil</Link>
                      <button className="btn btn-sm btn-secondary" onClick={() => startEditNote('grandparent', g.id, g._note)}>
                        Notiz / Status
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '6px' }}>
                      <div className="form-group">
                        <label>Status</label>
                        <select value={noteDraft.status} onChange={(e) => setNoteDraft({ ...noteDraft, status: e.target.value })}>
                          {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Notiz</label>
                        <textarea
                          rows={3}
                          value={noteDraft.note}
                          onChange={(e) => setNoteDraft({ ...noteDraft, note: e.target.value })}
                          placeholder="z.B. Erstkennenlernen ok, würde wöchentlich …"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => saveNote('grandparent', g.id)}>Speichern</button>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditingNote(null)}>Abbrechen</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoordinatorPage;
