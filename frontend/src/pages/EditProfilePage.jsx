import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  ACTIVITIES, MOBILITY, DESIRED_GRANDPARENT, CONTACT_MODE, CONTACT_LOCATION,
  SUPPORT_OFFERED, MARITAL_STATUS,
} from '../constants/profileOptions';

function ChipGroup({ name, options, selected, onChange }) {
  const sel = Array.isArray(selected) ? selected : [];
  function toggle(key) {
    const next = sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key];
    onChange(name, next);
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => toggle(o.key)}
          style={{
            padding: '6px 14px',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: sel.includes(o.key) ? 'var(--primary)' : 'var(--border)',
            background: sel.includes(o.key) ? 'var(--primary-light)' : 'var(--bg-white)',
            color: sel.includes(o.key) ? 'var(--primary)' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: sel.includes(o.key) ? 600 : 400,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({ name, options, value, onChange, allowNull = true }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {allowNull && (
        <button
          type="button"
          onClick={() => onChange(name, null)}
          style={radioStyle(value == null)}
        >
          Keine Angabe
        </button>
      )}
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(name, o.key)}
          style={radioStyle(value === o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function radioStyle(active) {
  return {
    padding: '6px 14px',
    borderRadius: '16px',
    border: '1px solid',
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'var(--primary-light)' : 'var(--bg-white)',
    color: active ? 'var(--primary)' : 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: active ? 600 : 400,
  };
}

function YesNoNull({ name, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button type="button" onClick={() => onChange(name, null)} style={radioStyle(value == null)}>Keine Angabe</button>
      <button type="button" onClick={() => onChange(name, true)} style={radioStyle(value === true)}>Ja</button>
      <button type="button" onClick={() => onChange(name, false)} style={radioStyle(value === false)}>Nein</button>
    </div>
  );
}

const FAMILY_KEYS = [
  'city', 'postal_code', 'phone',
  'number_of_children', 'children_ages', 'needs_description', 'availability', 'preferred_activities',
  'has_liability_insurance', 'children_in_liability', 'confidentiality_accepted',
  'activities', 'desired_grandparent', 'allow_smoker_grandparent', 'allow_pet_grandparent',
  'max_distance_km', 'contact_mode', 'contact_location', 'support_offered',
];

function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const me = await api.getMe();
        let fam = null;
        if (me.role === 'parent') {
          try { fam = await api.getMyFamily(); } catch { /* solo, falls keine Family */ }
        }
        setFamily(fam);
        setFormData({
          first_name: me.first_name || '',
          last_name: me.last_name || '',
          city: fam?.city ?? me.city ?? '',
          postal_code: fam?.postal_code ?? me.postal_code ?? '',
          phone: fam?.phone ?? me.phone ?? '',
          bio: me.bio || '',
          birth_date: me.birth_date ? me.birth_date.slice(0, 10) : '',
          profession: me.profession || '',
          working_hours: me.working_hours ?? '',
          marital_status: me.marital_status || '',
          smoker: me.smoker,
          pets: me.pets || '',
          mobility: me.mobility || [],
          hobbies: me.hobbies || '',
          avatar_url: me.avatar_url || '',
          // Family-Felder oder profile-Felder mischen (rückwärtskompatibel)
          ...(fam || me.profile || {}),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function setField(name, value) {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // User-Felder gehen an /profiles/me; Family-Felder an /families/me (nur für parents mit Family)
      const isParent = user?.role === 'parent';
      const familyPayload = {};
      const userPayload = { ...formData };
      if (isParent && family) {
        for (const k of FAMILY_KEYS) {
          if (k in userPayload) {
            familyPayload[k] = userPayload[k];
            // city/postal_code/phone werden auch im User belassen — sind in beiden Tabellen vorhanden
            if (!['city', 'postal_code', 'phone'].includes(k)) {
              delete userPayload[k];
            }
          }
        }
      }
      await api.updateProfile(userPayload);
      if (isParent && family) {
        await api.updateMyFamily(familyPayload);
      }
      updateUser({ first_name: formData.first_name, last_name: formData.last_name, city: formData.city });
      setMessage('Profil erfolgreich gespeichert!');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="card">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '24px' }}>Profil bearbeiten</h1>

          {message && <div className={message.includes('erfolgreich') ? 'success-message' : 'error-message'}>{message}</div>}

          {/* Avatar */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="profile-avatar" style={{ width: '80px', height: '80px', backgroundImage: formData.avatar_url ? `url(${formData.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!formData.avatar_url && (formData.first_name?.[0] || '') + (formData.last_name?.[0] || '')}
            </div>
            <div>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                Profilbild hochladen
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('avatar', file);
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/profiles/avatar', {
                      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setField('avatar_url', data.avatar_url);
                      updateUser({ avatar_url: data.avatar_url });
                      setMessage('Profilbild erfolgreich hochgeladen!');
                    } else {
                      setMessage(data.error);
                    }
                  }}
                />
              </label>
              <p style={{ fontSize: '0.8rem', color: '#5a6878', marginTop: '4px' }}>
                JPG, PNG oder WebP, max. 2 MB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* === Kontaktdaten === */}
            <h3 style={section}>Kontaktdaten</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Vorname</label>
                <input name="first_name" value={formData.first_name || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nachname</label>
                <input name="last_name" value={formData.last_name || ''} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stadt</label>
                <input name="city" value={formData.city || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Postleitzahl</label>
                <input name="postal_code" value={formData.postal_code || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Telefon</label>
              <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+49 ..." />
            </div>

            {/* === Über mich === */}
            <h3 style={section}>&Uuml;ber mich</h3>

            <div className="form-group">
              <label>Beschreibung</label>
              <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Erz&auml;hlen Sie etwas &uuml;ber sich..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Geburtsdatum</label>
                <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Familienstand</label>
                <select name="marital_status" value={formData.marital_status || ''} onChange={handleChange}>
                  <option value="">— keine Angabe —</option>
                  {MARITAL_STATUS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Beruf</label>
                <input name="profession" value={formData.profession || ''} onChange={handleChange} placeholder="z.B. Pensionierte Lehrerin" />
              </div>
              <div className="form-group">
                <label>Berufstätig (Std./Woche)</label>
                <input type="number" name="working_hours" value={formData.working_hours ?? ''} onChange={handleChange} min="0" max="80" placeholder="0 = nicht berufstätig" />
              </div>
            </div>

            <div className="form-group">
              <label>Hobbys &amp; Interessen</label>
              <textarea name="hobbies" value={formData.hobbies || ''} onChange={handleChange} placeholder="z.B. G&auml;rtnern, Lesen, Wandern" />
            </div>

            <div className="form-group">
              <label>Mobilit&auml;t</label>
              <ChipGroup name="mobility" options={MOBILITY} selected={formData.mobility} onChange={setField} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Raucher{user?.role === 'parent' ? 'haushalt' : ''}</label>
                <YesNoNull name="smoker" value={formData.smoker} onChange={setField} />
              </div>
              <div className="form-group">
                <label>Haustiere</label>
                <input name="pets" value={formData.pets || ''} onChange={handleChange} placeholder="z.B. Katze, Hund — leer = keine" />
              </div>
            </div>

            {/* === Rollen-spezifisch === */}
            {user?.role === 'parent' ? (
              <>
                <h3 style={section}>Unsere Familie</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Anzahl Kinder</label>
                    <input type="number" name="number_of_children" value={formData.number_of_children || ''} onChange={handleChange} min="1" />
                  </div>
                  <div className="form-group">
                    <label>Alter der Kinder</label>
                    <input name="children_ages" value={formData.children_ages || ''} onChange={handleChange} placeholder="z.B. 3, 6" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Betreuungsbedarf</label>
                  <textarea name="needs_description" value={formData.needs_description || ''} onChange={handleChange} placeholder="Was f&uuml;r Betreuung suchen Sie?" />
                </div>

                <div className="form-group">
                  <label>Verf&uuml;gbarkeit (Freitext)</label>
                  <input name="availability" value={formData.availability || ''} onChange={handleChange} placeholder="z.B. Mo-Fr Nachmittags" />
                </div>

                <h3 style={section}>Was wir suchen</h3>

                <div className="form-group">
                  <label>Wir w&uuml;nschen uns</label>
                  <RadioGroup name="desired_grandparent" options={DESIRED_GRANDPARENT} value={formData.desired_grandparent} onChange={setField} />
                </div>

                <div className="form-group">
                  <label>Gew&uuml;nschte Aktivit&auml;ten</label>
                  <ChipGroup name="activities" options={ACTIVITIES} selected={formData.activities} onChange={setField} />
                </div>

                <div className="form-group">
                  <label>Wer soll besucht werden?</label>
                  <RadioGroup name="contact_mode" options={CONTACT_MODE} value={formData.contact_mode} onChange={setField} />
                </div>

                <div className="form-group">
                  <label>Wo soll der Kontakt stattfinden?</label>
                  <ChipGroup name="contact_location" options={CONTACT_LOCATION} selected={formData.contact_location} onChange={setField} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Max. Entfernung (km)</label>
                    <input type="number" name="max_distance_km" value={formData.max_distance_km ?? ''} onChange={handleChange} min="1" max="200" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Wunschoma/-opa darf Raucher:in sein</label>
                    <YesNoNull name="allow_smoker_grandparent" value={formData.allow_smoker_grandparent} onChange={setField} />
                  </div>
                  <div className="form-group">
                    <label>Wunschoma/-opa darf Haustiere haben</label>
                    <YesNoNull name="allow_pet_grandparent" value={formData.allow_pet_grandparent} onChange={setField} />
                  </div>
                </div>

                <h3 style={section}>Was wir anbieten</h3>

                <div className="form-group">
                  <label>Unterst&uuml;tzung, die wir den Wunschgro&szlig;eltern anbieten</label>
                  <ChipGroup name="support_offered" options={SUPPORT_OFFERED} selected={formData.support_offered} onChange={setField} />
                </div>

                <h3 style={section}>Versicherung</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Eigene Haftpflichtversicherung</label>
                    <YesNoNull name="has_liability_insurance" value={formData.has_liability_insurance} onChange={setField} />
                  </div>
                  <div className="form-group">
                    <label>Kinder mit eingeschlossen</label>
                    <YesNoNull name="children_in_liability" value={formData.children_in_liability} onChange={setField} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={section}>Erfahrung &amp; Angebot</h3>

                <div className="form-group">
                  <label>Erfahrung mit Kindern</label>
                  <textarea name="experience" value={formData.experience || ''} onChange={handleChange} placeholder="Welche Erfahrung haben Sie?" />
                </div>

                <div className="form-group">
                  <label>Verf&uuml;gbarkeit (Freitext)</label>
                  <input name="availability" value={formData.availability || ''} onChange={handleChange} placeholder="z.B. Mo-Fr Vormittags" />
                </div>

                <div className="form-group">
                  <label>Bevorzugtes Alter der Kinder</label>
                  <input name="preferred_age_range" value={formData.preferred_age_range || ''} onChange={handleChange} placeholder="z.B. 2-8 Jahre" />
                </div>

                <div className="form-group">
                  <label>Aktivit&auml;ten, die ich anbiete</label>
                  <ChipGroup name="activities" options={ACTIVITIES} selected={formData.activities} onChange={setField} />
                </div>

                <div className="form-group">
                  <label>Zus&auml;tzliche Hinweise zu Aktivit&auml;ten</label>
                  <input name="offered_activities" value={formData.offered_activities || ''} onChange={handleChange} placeholder="z.B. Spezielle Vorlieben" />
                </div>

                <h3 style={section}>Versicherung &amp; F&uuml;hrungszeugnis</h3>

                <div className="form-group">
                  <label>Haftpflichtversicherung</label>
                  <YesNoNull name="has_liability_insurance" value={formData.has_liability_insurance} onChange={setField} />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" name="has_fuehrungszeugnis" checked={!!formData.has_fuehrungszeugnis} onChange={handleChange} style={{ width: 'auto' }} />
                  <label style={{ margin: 0 }}>F&uuml;hrungszeugnis vorhanden (Selbst-Erkl&auml;rung)</label>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#5a6878', marginTop: '-8px' }}>
                  Tipp: Ein verifiziertes F&uuml;hrungszeugnis hochladen k&ouml;nnen Sie unter <strong>Kontoeinstellungen</strong>.
                </p>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ marginTop: '24px' }}>
              {saving ? 'Speichern...' : 'Profil speichern'}
            </button>
          </form>

          {user?.role === 'parent' && family && (
            <FamilyMembersSection family={family} currentUserId={user.id} onChange={(f) => setFamily(f)} />
          )}
        </div>
      </div>
    </div>
  );
}

function FamilyMembersSection({ family, currentUserId, onChange }) {
  const [inviteLink, setInviteLink] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function reload() {
    try { onChange(await api.getMyFamily()); } catch {}
  }

  async function createInvite() {
    setLoading(true);
    setMsg('');
    try {
      const res = await api.inviteToFamily();
      const url = window.location.origin + res.invite_url;
      setInviteLink(url);
      setMsg('Einladungslink erzeugt. Sie können ihn kopieren und an Ihre:n Partner:in schicken — gültig 14 Tage.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(userId) {
    if (!confirm('Mitglied wirklich aus der Family entfernen?')) return;
    try { await api.removeMember(userId); reload(); } catch (err) { setMsg(err.message); }
  }

  async function leaveFamily() {
    if (!confirm('Family wirklich verlassen?')) return;
    try {
      await api.leaveFamily();
      window.location.reload();
    } catch (err) { setMsg(err.message); }
  }

  const isOwner = family.owner_user_id === currentUserId;

  return (
    <div className="profile-section" style={{ marginTop: '32px' }}>
      <h3 style={section}>Familien-Mitglieder</h3>

      <div style={{ marginBottom: '16px' }}>
        {family.members?.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg)', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="profile-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem', backgroundImage: m.avatar_url ? `url(${m.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!m.avatar_url && `${m.first_name?.[0] || ''}${m.last_name?.[0] || ''}`}
              </div>
              <div>
                <strong>{m.first_name} {m.last_name}</strong>
                {m.id === family.owner_user_id && <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)' }}>Owner</span>}
                {m.id === currentUserId && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#5a6878' }}>(Sie)</span>}
              </div>
            </div>
            {isOwner && m.id !== currentUserId && (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => removeMember(m.id)}>Entfernen</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm btn-primary" onClick={createInvite} disabled={loading}>
          Partner:in einladen
        </button>
        {(family.members?.length > 1 || !isOwner) && (
          <button type="button" className="btn btn-sm btn-outline" onClick={leaveFamily}>
            Family verlassen
          </button>
        )}
      </div>

      {inviteLink && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
          <p style={{ marginBottom: '6px', fontSize: '0.9rem' }}>Einladungslink:</p>
          <code style={{ display: 'block', padding: '8px', background: '#fff', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.85rem' }}>{inviteLink}</code>
          <button type="button" className="btn btn-sm btn-outline" style={{ marginTop: '8px' }}
            onClick={() => { navigator.clipboard.writeText(inviteLink); setMsg('Link kopiert.'); }}>
            In Zwischenablage kopieren
          </button>
        </div>
      )}

      {msg && <p style={{ marginTop: '10px', fontSize: '0.9rem', color: msg.includes('kopiert') || msg.includes('erzeugt') ? '#1e7a3a' : '#c0392b' }}>{msg}</p>}
    </div>
  );
}

const section = {
  fontFamily: 'var(--font-heading)',
  marginBottom: '16px',
  marginTop: '32px',
  fontSize: '1.1rem',
  color: 'var(--primary)',
};

export default EditProfilePage;
