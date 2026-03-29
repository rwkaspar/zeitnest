import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    api.getProfile(id)
      .then(setProfile)
      .catch(() => navigate('/suche'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleContact = async () => {
    setSending(true);
    try {
      await api.createMatch({ target_id: id, message: contactMessage });
      setMessage('Anfrage erfolgreich gesendet!');
      setShowContact(false);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile) return null;

  const isOwn = user?.id === profile.id;
  const roleLabel = profile.role === 'parent' ? 'Elternteil' : 'Leih-Gro\u00dfelternteil';

  return (
    <div className="profile-page">
      <div className="container">
        <div className="card">
          <div className="profile-header">
            <div className="profile-avatar">{profile.first_name[0]}{profile.last_name[0]}</div>
            <h1>{profile.first_name} {profile.last_name}</h1>
            <p style={{ color: '#6b7c93' }}>&#x1F4CD; {profile.city || 'Keine Angabe'}</p>
            <span className={`role-badge ${profile.role}`}>{roleLabel}</span>
          </div>

          {profile.bio && (
            <div className="profile-section">
              <h3>&Uuml;ber mich</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.profile && profile.role === 'grandparent' && (
            <div className="profile-section">
              <h3>Details</h3>
              {profile.profile.experience && <div className="profile-detail"><span className="label">Erfahrung</span><span>{profile.profile.experience}</span></div>}
              {profile.profile.availability && <div className="profile-detail"><span className="label">Verf&uuml;gbarkeit</span><span>{profile.profile.availability}</span></div>}
              {profile.profile.preferred_age_range && <div className="profile-detail"><span className="label">Bevorzugtes Alter</span><span>{profile.profile.preferred_age_range}</span></div>}
              {profile.profile.offered_activities && <div className="profile-detail"><span className="label">Aktivit&auml;ten</span><span>{profile.profile.offered_activities}</span></div>}
              {profile.profile.mobility && <div className="profile-detail"><span className="label">Mobilit&auml;t</span><span>{profile.profile.mobility}</span></div>}
              <div className="profile-detail"><span className="label">F&uuml;hrungszeugnis</span><span>{profile.profile.has_fuehrungszeugnis ? '&#x2705; Vorhanden' : '&#x274C; Nicht hinterlegt'}</span></div>
            </div>
          )}

          {profile.profile && profile.role === 'parent' && (
            <div className="profile-section">
              <h3>Familie</h3>
              {profile.profile.number_of_children && <div className="profile-detail"><span className="label">Anzahl Kinder</span><span>{profile.profile.number_of_children}</span></div>}
              {profile.profile.children_ages && <div className="profile-detail"><span className="label">Alter der Kinder</span><span>{profile.profile.children_ages} Jahre</span></div>}
              {profile.profile.availability && <div className="profile-detail"><span className="label">Verf&uuml;gbarkeit</span><span>{profile.profile.availability}</span></div>}
              {profile.profile.needs_description && <div className="profile-detail"><span className="label">Betreuungsbedarf</span><span>{profile.profile.needs_description}</span></div>}
              {profile.profile.preferred_activities && <div className="profile-detail"><span className="label">Gew&uuml;nschte Aktivit&auml;ten</span><span>{profile.profile.preferred_activities}</span></div>}
            </div>
          )}

          {profile.rating && profile.rating.count > 0 && (
            <div className="profile-section">
              <h3>Bewertungen (&#x2B50; {Number(profile.rating.avg_rating).toFixed(1)})</h3>
              {profile.reviews.map(review => (
                <div key={review.id} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{review.first_name} {review.last_name}</strong>
                    <span>{'&#x2B50;'.repeat(review.rating)}</span>
                  </div>
                  {review.comment && <p style={{ fontSize: '0.9rem', color: '#6b7c93' }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {message && <div className={message.includes('erfolgreich') ? 'success-message' : 'error-message'}>{message}</div>}

          {!isOwn && user?.role !== profile.role && (
            <div style={{ marginTop: '24px' }}>
              {!showContact ? (
                <button className="btn btn-primary btn-block" onClick={() => setShowContact(true)}>
                  &#x1F4E9; Kontakt aufnehmen
                </button>
              ) : (
                <div>
                  <div className="form-group">
                    <label>Nachricht (optional)</label>
                    <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Stellen Sie sich kurz vor..." />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={handleContact} disabled={sending}>
                      {sending ? 'Senden...' : 'Anfrage senden'}
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowContact(false)}>Abbrechen</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
