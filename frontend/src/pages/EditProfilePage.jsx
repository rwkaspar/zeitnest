import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getMe()
      .then(data => {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          phone: data.phone || '',
          bio: data.bio || '',
          ...(data.profile || {}),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.updateProfile(formData);
      updateUser({ first_name: formData.first_name, last_name: formData.last_name, city: formData.city });
      setMessage('Profil erfolgreich gespeichert!');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="card">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '24px' }}>Profil bearbeiten</h1>

          {message && <div className={message.includes('erfolgreich') ? 'success-message' : 'error-message'}>{message}</div>}

          <form onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label>&Uuml;ber mich</label>
              <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Erz&auml;hlen Sie etwas &uuml;ber sich..." />
            </div>

            {user?.role === 'parent' ? (
              <>
                <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px', marginTop: '24px' }}>Familien-Details</h3>
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
                  <label>Verf&uuml;gbarkeit</label>
                  <input name="availability" value={formData.availability || ''} onChange={handleChange} placeholder="z.B. Mo-Fr Nachmittags" />
                </div>
                <div className="form-group">
                  <label>Gew&uuml;nschte Aktivit&auml;ten</label>
                  <input name="preferred_activities" value={formData.preferred_activities || ''} onChange={handleChange} placeholder="z.B. Vorlesen, Basteln" />
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px', marginTop: '24px' }}>Leih-Gro&szlig;eltern-Details</h3>
                <div className="form-group">
                  <label>Erfahrung mit Kindern</label>
                  <textarea name="experience" value={formData.experience || ''} onChange={handleChange} placeholder="Welche Erfahrung haben Sie?" />
                </div>
                <div className="form-group">
                  <label>Verf&uuml;gbarkeit</label>
                  <input name="availability" value={formData.availability || ''} onChange={handleChange} placeholder="z.B. Mo-Fr Vormittags" />
                </div>
                <div className="form-group">
                  <label>Bevorzugtes Alter der Kinder</label>
                  <input name="preferred_age_range" value={formData.preferred_age_range || ''} onChange={handleChange} placeholder="z.B. 2-8 Jahre" />
                </div>
                <div className="form-group">
                  <label>Angebotene Aktivit&auml;ten</label>
                  <input name="offered_activities" value={formData.offered_activities || ''} onChange={handleChange} placeholder="z.B. Vorlesen, Basteln, Spazieren" />
                </div>
                <div className="form-group">
                  <label>Mobilit&auml;t</label>
                  <input name="mobility" value={formData.mobility || ''} onChange={handleChange} placeholder="z.B. Mobil mit &Ouml;PNV, Auto" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" name="has_fuehrungszeugnis" checked={!!formData.has_fuehrungszeugnis} onChange={handleChange} style={{ width: 'auto' }} />
                  <label style={{ margin: 0 }}>F&uuml;hrungszeugnis vorhanden</label>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ marginTop: '24px' }}>
              {saving ? 'Speichern...' : 'Profil speichern'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;
