import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

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
            {profile.is_demo && <span className="demo-badge">Beispielprofil</span>}
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

          {!isOwn && profile.role === 'grandparent' && user?.role === 'parent' && (
            <BookingSection grandparentId={profile.id} grandparentName={`${profile.first_name} ${profile.last_name}`} />
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

function BookingSection({ grandparentId, grandparentName }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [note, setNote] = useState('');
  const [bookMsg, setBookMsg] = useState('');
  const [bookErr, setBookErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/calendar/slots/${grandparentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setSlots)
      .catch(() => {});
  }, [grandparentId]);

  if (slots.length === 0) return null;

  function getNextDateForDay(dayOfWeek) {
    const today = new Date();
    const diff = (dayOfWeek - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().split('T')[0];
  }

  async function handleBook(e) {
    e.preventDefault();
    setBookMsg(''); setBookErr('');
    const token = localStorage.getItem('token');
    const res = await fetch('/api/calendar/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slot_id: selectedSlot.id, booking_date: bookingDate, note })
    });
    const data = await res.json();
    if (res.ok) {
      setBookMsg(`Termin am ${new Date(bookingDate).toLocaleDateString('de-DE')} gebucht!`);
      setSelectedSlot(null);
      setBookingDate('');
      setNote('');
    } else {
      setBookErr(data.error);
    }
  }

  return (
    <div className="profile-section">
      <h3>Verf&uuml;gbare Zeitfenster</h3>
      {bookMsg && <div className="success-message">{bookMsg}</div>}
      {bookErr && <div className="error-message">{bookErr}</div>}

      <div className="slots-list">
        {slots.map(slot => (
          <div key={slot.id} className={`slot-item ${selectedSlot?.id === slot.id ? 'slot-selected' : ''}`}>
            <div className="slot-info" onClick={() => {
              setSelectedSlot(slot);
              setBookingDate(getNextDateForDay(slot.day_of_week));
              setBookErr('');
            }} style={{ cursor: 'pointer' }}>
              <strong>{DAYS[slot.day_of_week]}</strong>
              <span>{slot.start_time.substring(0, 5)} &ndash; {slot.end_time.substring(0, 5)} Uhr</span>
            </div>
          </div>
        ))}
      </div>

      {selectedSlot && (
        <form onSubmit={handleBook} className="booking-form">
          <p className="calendar-hint">
            Termin buchen: <strong>{DAYS[selectedSlot.day_of_week]}, {selectedSlot.start_time.substring(0, 5)}&ndash;{selectedSlot.end_time.substring(0, 5)} Uhr</strong>
          </p>
          <div className="form-group">
            <label>Datum</label>
            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Nachricht (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="z.B. Bitte Sonnencreme einpacken..." />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary">Termin buchen</button>
            <button type="button" className="btn btn-outline" onClick={() => setSelectedSlot(null)}>Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
