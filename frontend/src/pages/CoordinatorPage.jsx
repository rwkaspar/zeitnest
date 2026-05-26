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
  const [eventCount, setEventCount] = useState(0);

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  async function reload() {
    const [o, s, f, g, e] = await Promise.all([
      fetch('/api/coordinator/me', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/stats', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/families', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/grandparents', { headers: auth() }).then(r => r.json()),
      fetch('/api/coordinator/events', { headers: auth() }).then(r => r.json()),
    ]);
    setOffice(o.office);
    setStats(s);
    setFamilies(f.families || []);
    setGrandparents(g.grandparents || []);
    setEventCount((e.events || []).length);
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

        {(() => {
          // Onboarding-Block für Koordinator:innen — erste Schritte. Verschwindet, sobald
          // Notiz UND Event mindestens einmal angelegt wurden; bei Demo-Account immer sichtbar.
          const hasFamilies = families.length > 0 || grandparents.length > 0;
          const hasNotes = (stats.in_contact || 0) + (stats.matched || 0) > 0;
          const hasEvents = eventCount > 0;
          const isDemoCoord = (user?.email || '').endsWith('@zeitnest.local');
          const onboardingDone = hasNotes && hasEvents;
          if (onboardingDone && !isDemoCoord) return null;
          const steps = [
            { done: hasFamilies, label: 'Familien und Wunschgroßeltern in Ihrem PLZ-Bereich sichten',
              hint: 'Wer hier auftaucht, hat die Sichtbarkeit für Koordinierungsstellen aktiviert.' },
            { done: hasNotes, label: 'Erste Notiz oder Status anlegen',
              hint: 'Klicken Sie bei einem Eintrag auf „Notiz / Status" — Status „Im Erstkontakt" oder „Vermittelt" hilft Ihnen, den Überblick zu behalten.' },
            { done: hasEvents, label: 'Optional: einen Termin anlegen',
              hint: 'Schulungen, Vorstellungstreffen, Erfahrungsaustausch — alle eingewilligten Nutzer:innen in Ihrer Region sehen das in ihrem Kalender.',
              link: 'events' },
          ];
          const doneCount = steps.filter(s => s.done).length;
          return (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}>Erste Schritte in der Koordination</h3>
                <span style={{ fontSize: '0.85rem', color: '#5a6878' }}>
                  {doneCount}/{steps.length} erledigt{isDemoCoord && onboardingDone ? ' (Demo-Vorschau)' : ''}
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {steps.map((s, i) => (
                  <li key={i} style={{ padding: '10px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '1.2rem', color: s.done ? 'var(--success)' : '#cdd5dc' }}>{s.done ? '✓' : '○'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: s.done ? 400 : 500, color: s.done ? '#5a6878' : 'var(--text)', textDecoration: s.done ? 'line-through' : 'none' }}>
                        {s.label}
                      </div>
                      {!s.done && s.hint && (
                        <div style={{ fontSize: '0.8rem', color: '#5a6878', marginTop: '2px' }}>{s.hint}</div>
                      )}
                    </div>
                    {!s.done && s.link && (
                      <button className="btn btn-sm btn-outline" onClick={() => setTab(s.link)}>Zu Termine</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

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
            ['events', `Termine`],
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

        {tab === 'events' && (
          <CoordinatorEvents auth={auth} />
        )}

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

const AUDIENCE_LABELS = { parents: 'Familien', grandparents: 'Wunschgroßeltern', both: 'Beide' };

function CoordinatorEvents({ auth }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(null);
  const [openAttendees, setOpenAttendees] = useState(null);

  async function reload() {
    const r = await fetch('/api/coordinator/events', { headers: auth() }).then(r => r.json());
    setEvents(r.events || []);
  }
  useEffect(() => { reload(); }, []);

  function startNew() {
    setForm({
      title: '',
      description: '',
      location: '',
      start_at: '',
      end_at: '',
      capacity: '',
      audience: 'both',
    });
  }

  function startEdit(e) {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || '',
      location: e.location || '',
      start_at: e.start_at?.slice(0, 16) || '',
      end_at: e.end_at?.slice(0, 16) || '',
      capacity: e.capacity ?? '',
      audience: e.audience,
    });
  }

  async function save() {
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/coordinator/events/${form.id}` : '/api/coordinator/events';
    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      start_at: form.start_at,
      end_at: form.end_at,
      capacity: form.capacity || null,
      audience: form.audience,
    };
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify(payload),
    });
    if (res.ok) { setForm(null); reload(); }
    else { const d = await res.json(); alert(d.error || 'Speichern fehlgeschlagen.'); }
  }

  async function removeEvent(id) {
    if (!confirm('Termin wirklich löschen?')) return;
    await fetch(`/api/coordinator/events/${id}`, { method: 'DELETE', headers: auth() });
    reload();
  }

  async function openAttendeesPanel(id) {
    const r = await fetch(`/api/coordinator/events/${id}`, { headers: auth() }).then(r => r.json());
    setOpenAttendees(r);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: '#5a6878' }}>
          Veranstaltungen Ihrer Stelle (Schulungen, Sommerfeste, Vorstellungs-Termine, …).
          Eltern und Wunschgroßeltern, die für Koordinierungsstellen sichtbar sind, sehen passende Termine in ihrem Kalender.
        </p>
        <button className="btn btn-sm btn-primary" onClick={startNew}>+ Termin anlegen</button>
      </div>

      {form && (
        <div className="card" style={{ marginBottom: '16px', background: 'var(--bg)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
            {form.id ? 'Termin bearbeiten' : 'Neuer Termin'}
          </h3>
          <div className="form-group">
            <label>Titel *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start *</label>
              <input type="datetime-local" value={form.start_at}
                onChange={e => {
                  const start = e.target.value;
                  // Default-Ende +4h am selben Tag setzen, wenn end leer ist oder noch
                  // dem zuletzt berechneten Default entspricht (= dann darf überschrieben werden).
                  const prevAutoEnd = form._autoEnd;
                  const update = { ...form, start_at: start };
                  if (start && (!form.end_at || form.end_at === prevAutoEnd)) {
                    const d = new Date(start);
                    if (!Number.isNaN(d.getTime())) {
                      d.setHours(d.getHours() + 4);
                      const pad = (n) => String(n).padStart(2, '0');
                      const auto = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      update.end_at = auto;
                      update._autoEnd = auto;
                    }
                  }
                  setForm(update);
                }}
              />
            </div>
            <div className="form-group">
              <label>Ende * <span style={{ fontSize: '0.8rem', color: '#5a6878', fontWeight: 'normal' }}>(Default: +4h)</span></label>
              <input type="datetime-local" value={form.end_at}
                onChange={e => setForm({ ...form, end_at: e.target.value, _autoEnd: undefined })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ort</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="z.B. Bürgersaal, Weißenburg" />
            </div>
            <div className="form-group">
              <label>Plätze (optional)</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Zielgruppe</label>
            <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}>
              <option value="both">Beide</option>
              <option value="parents">Nur Familien</option>
              <option value="grandparents">Nur Wunschgroßeltern</option>
            </select>
          </div>
          <div className="form-group">
            <label>Beschreibung</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-primary" onClick={save}>Speichern</button>
            <button className="btn btn-sm btn-outline" onClick={() => setForm(null)}>Abbrechen</button>
          </div>
        </div>
      )}

      {events.length === 0 && <p style={{ color: '#5a6878' }}>Noch keine Termine angelegt.</p>}

      {events.map(e => (
        <div key={e.id} className="card" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: '1 1 360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <strong>{e.title}</strong>
                <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {AUDIENCE_LABELS[e.audience]}
                </span>
              </div>
              <p style={{ margin: '6px 0', fontSize: '0.9rem', color: '#5a6878' }}>
                {new Date(e.start_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} – {new Date(e.end_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {e.location && ` · ${e.location}`}
                {e.capacity && ` · max. ${e.capacity}`}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#5a6878' }}>
                Zugesagt: <strong>{e.going_count}</strong>
                {e.interested_count > 0 && ` · Interessiert: ${e.interested_count}`}
              </p>
              {e.description && <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>{e.description}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button className="btn btn-sm btn-outline" onClick={() => openAttendeesPanel(e.id)}>Teilnehmer</button>
              <button className="btn btn-sm btn-outline" onClick={() => startEdit(e)}>Bearbeiten</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeEvent(e.id)}>Löschen</button>
            </div>
          </div>
        </div>
      ))}

      {openAttendees && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setOpenAttendees(null)}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>{openAttendees.title}</h3>
            {openAttendees.attendees?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {openAttendees.attendees.map(a => (
                  <li key={a.user_id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <strong>{a.first_name} {a.last_name}</strong>
                    <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#5a6878' }}>{a.role === 'parent' ? 'Familie' : 'Wunschoma/-opa'} · {a.status}</span>
                    <br /><span style={{ fontSize: '0.85rem', color: '#5a6878' }}>{a.email}</span>
                  </li>
                ))}
              </ul>
            ) : <p>Noch keine Teilnehmer.</p>}
            <button className="btn btn-sm btn-outline" style={{ marginTop: '12px' }} onClick={() => setOpenAttendees(null)}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorPage;
