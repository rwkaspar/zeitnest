import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = '/api/calendar';
const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function CalendarPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Slot form (grandparent)
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: '09:00', end_time: '12:00' });

  useEffect(() => {
    loadBookings();
    if (user?.role === 'grandparent') loadMySlots();
  }, [user]);

  async function loadMySlots() {
    const res = await fetch(`${API}/slots/${user.id}`, { headers: authHeaders() });
    if (res.ok) setSlots(await res.json());
  }

  async function loadBookings() {
    const res = await fetch(`${API}/bookings`, { headers: authHeaders() });
    if (res.ok) setBookings(await res.json());
  }

  async function createSlot(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    const res = await fetch(`${API}/slots`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(newSlot)
    });
    if (res.ok) {
      setSuccess('Zeitfenster angelegt!');
      loadMySlots();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  async function deleteSlot(id) {
    await fetch(`${API}/slots/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadMySlots();
  }

  async function cancelBooking(id) {
    const res = await fetch(`${API}/bookings/${id}/cancel`, {
      method: 'PUT', headers: authHeaders()
    });
    if (res.ok) {
      setSuccess('Buchung storniert.');
      loadBookings();
    }
  }

  function downloadICS(bookingId) {
    window.open(`${API}/bookings/${bookingId}/ics?token=${getToken()}`, '_blank');
  }

  async function downloadAllICS() {
    const res = await fetch(`${API}/bookings/export/all`, { headers: authHeaders() });
    if (!res.ok) { setError('Keine anstehenden Buchungen.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zeitnest-termine.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="calendar-page">
      <div className="container">
        <h1>Kalender</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {user?.role === 'grandparent' && (
          <section className="calendar-section">
            <div className="card">
              <h2>Meine Verf&uuml;gbarkeit</h2>
              <p className="calendar-hint">Legen Sie Zeitfenster an, in denen Eltern Sie buchen k&ouml;nnen.</p>

              <form onSubmit={createSlot} className="slot-form">
                <div className="slot-form-row">
                  <div className="form-group">
                    <label>Wochentag</label>
                    <select value={newSlot.day_of_week} onChange={e => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}>
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Von</label>
                    <input type="time" value={newSlot.start_time} onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Bis</label>
                    <input type="time" value={newSlot.end_time} onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Hinzuf&uuml;gen</button>
                </div>
              </form>

              {slots.length > 0 && (
                <div className="slots-list">
                  {slots.map(slot => (
                    <div key={slot.id} className="slot-item">
                      <div className="slot-info">
                        <strong>{DAYS[slot.day_of_week]}</strong>
                        <span>{slot.start_time.substring(0, 5)} &ndash; {slot.end_time.substring(0, 5)} Uhr</span>
                      </div>
                      <button onClick={() => deleteSlot(slot.id)} className="btn btn-sm btn-danger">Entfernen</button>
                    </div>
                  ))}
                </div>
              )}

              {slots.length === 0 && (
                <p className="empty-hint">Noch keine Zeitfenster angelegt.</p>
              )}
            </div>
          </section>
        )}

        <section className="calendar-section">
          <div className="card">
            <div className="bookings-header">
              <h2>Anstehende Termine</h2>
              {bookings.length > 0 && (
                <button onClick={downloadAllICS} className="btn btn-sm btn-outline">
                  Alle exportieren (.ics)
                </button>
              )}
            </div>

            {bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map(b => {
                  const dateStr = new Date(b.booking_date).toLocaleDateString('de-DE', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  });
                  const otherName = user.role === 'parent'
                    ? `${b.grandparent_first_name} ${b.grandparent_last_name}`
                    : `${b.parent_first_name} ${b.parent_last_name}`;

                  return (
                    <div key={b.id} className="booking-item">
                      <div className="booking-date-badge">
                        <span className="booking-day">{new Date(b.booking_date).getDate()}</span>
                        <span className="booking-month">{new Date(b.booking_date).toLocaleDateString('de-DE', { month: 'short' })}</span>
                      </div>
                      <div className="booking-details">
                        <strong>{dateStr}</strong>
                        <span>{b.start_time.substring(0, 5)} &ndash; {b.end_time.substring(0, 5)} Uhr</span>
                        <span className="booking-with">mit {otherName}</span>
                        {b.note && <span className="booking-note">{b.note}</span>}
                      </div>
                      <div className="booking-actions">
                        <button onClick={() => downloadAllICS()} className="btn btn-sm btn-secondary">
                          .ics
                        </button>
                        <button onClick={() => cancelBooking(b.id)} className="btn btn-sm btn-danger">
                          Stornieren
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">&#x1F4C5;</div>
                <h3>Keine anstehenden Termine</h3>
                <p>
                  {user?.role === 'parent'
                    ? 'Besuchen Sie das Profil eines Leih-Großelternteils, um Zeitfenster zu buchen.'
                    : 'Legen Sie oben Verfügbarkeiten an, damit Eltern Sie buchen können.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CalendarPage;
