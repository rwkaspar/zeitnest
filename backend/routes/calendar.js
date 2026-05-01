const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// === AVAILABILITY SLOTS ===

// Get slots for a user
router.get('/slots/:userId', authenticateToken, async (req, res) => {
  try {
    const slots = await queryAll(
      'SELECT * FROM availability_slots WHERE user_id = $1 ORDER BY day_of_week, start_time',
      [req.params.userId]
    );
    res.json(slots);
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Zeitfenster.' });
  }
});

// Create a slot (grandparents only)
router.post('/slots', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'grandparent') {
      return res.status(403).json({ error: 'Nur Leih-Großeltern können Zeitfenster anlegen.' });
    }

    const { day_of_week, start_time, end_time, recurring, specific_date } = req.body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'Wochentag, Start- und Endzeit sind erforderlich.' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: 'Startzeit muss vor Endzeit liegen.' });
    }

    const id = uuidv4();
    await runSql(
      `INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time, recurring, specific_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.user.id, day_of_week, start_time, end_time, recurring !== false, specific_date || null]
    );

    res.status(201).json({ id, day_of_week, start_time, end_time, recurring: recurring !== false });
  } catch (err) {
    console.error('Create slot error:', err);
    res.status(500).json({ error: 'Fehler beim Anlegen des Zeitfensters.' });
  }
});

// Delete a slot
router.delete('/slots/:id', authenticateToken, async (req, res) => {
  try {
    const slot = await queryOne('SELECT * FROM availability_slots WHERE id = $1', [req.params.id]);
    if (!slot) return res.status(404).json({ error: 'Zeitfenster nicht gefunden.' });
    if (slot.user_id !== req.user.id) return res.status(403).json({ error: 'Keine Berechtigung.' });

    await runSql('DELETE FROM availability_slots WHERE id = $1', [req.params.id]);
    res.json({ message: 'Zeitfenster gelöscht.' });
  } catch (err) {
    console.error('Delete slot error:', err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
});

// === BOOKINGS ===

// Book a slot (parents only)
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Nur Eltern können Zeitfenster buchen.' });
    }

    const { slot_id, booking_date, note } = req.body;
    if (!slot_id || !booking_date) {
      return res.status(400).json({ error: 'Zeitfenster und Datum sind erforderlich.' });
    }

    const slot = await queryOne('SELECT * FROM availability_slots WHERE id = $1', [slot_id]);
    if (!slot) return res.status(404).json({ error: 'Zeitfenster nicht gefunden.' });

    // Check the booking date matches the slot's day_of_week
    const date = new Date(booking_date);
    if (date.getDay() !== slot.day_of_week) {
      return res.status(400).json({ error: 'Das Datum passt nicht zum Wochentag des Zeitfensters.' });
    }

    // Check for double booking
    const existing = await queryOne(
      `SELECT id FROM bookings WHERE slot_id = $1 AND booking_date = $2 AND status = 'confirmed'`,
      [slot_id, booking_date]
    );
    if (existing) return res.status(409).json({ error: 'Dieses Zeitfenster ist an diesem Tag bereits gebucht.' });

    const id = uuidv4();
    await runSql(
      `INSERT INTO bookings (id, slot_id, grandparent_id, parent_id, booking_date, start_time, end_time, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8)`,
      [id, slot_id, slot.user_id, req.user.id, booking_date, slot.start_time, slot.end_time, note || null]
    );

    res.status(201).json({ id, booking_date, start_time: slot.start_time, end_time: slot.end_time, status: 'confirmed' });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Fehler beim Buchen.' });
  }
});

// Get bookings for current user
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await queryAll(`
      SELECT b.*,
        u_gp.first_name as grandparent_first_name, u_gp.last_name as grandparent_last_name,
        u_p.first_name as parent_first_name, u_p.last_name as parent_last_name
      FROM bookings b
      JOIN users u_gp ON b.grandparent_id = u_gp.id
      JOIN users u_p ON b.parent_id = u_p.id
      WHERE (b.grandparent_id = $1 OR b.parent_id = $1)
        AND b.status = 'confirmed'
        AND b.booking_date >= CURRENT_DATE
      ORDER BY b.booking_date, b.start_time
    `, [req.user.id]);

    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Buchungen.' });
  }
});

// Cancel a booking
router.put('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await queryOne('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Buchung nicht gefunden.' });
    if (booking.grandparent_id !== req.user.id && booking.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }

    await runSql('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    res.json({ message: 'Buchung storniert.' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Fehler beim Stornieren.' });
  }
});

// === ICS EXPORT ===

router.get('/bookings/:id/ics', authenticateToken, async (req, res) => {
  try {
    const booking = await queryOne(`
      SELECT b.*,
        u_gp.first_name as gp_first, u_gp.last_name as gp_last,
        u_p.first_name as p_first, u_p.last_name as p_last
      FROM bookings b
      JOIN users u_gp ON b.grandparent_id = u_gp.id
      JOIN users u_p ON b.parent_id = u_p.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Buchung nicht gefunden.' });
    if (booking.grandparent_id !== req.user.id && booking.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }

    const ics = generateICS(booking, req.user);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="zeitnest-${booking.booking_date}.ics"`
    });
    res.send(ics);
  } catch (err) {
    console.error('ICS export error:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kalenderdatei.' });
  }
});

// Export all upcoming bookings as single ICS
router.get('/bookings/export/all', authenticateToken, async (req, res) => {
  try {
    const bookings = await queryAll(`
      SELECT b.*,
        u_gp.first_name as gp_first, u_gp.last_name as gp_last,
        u_p.first_name as p_first, u_p.last_name as p_last
      FROM bookings b
      JOIN users u_gp ON b.grandparent_id = u_gp.id
      JOIN users u_p ON b.parent_id = u_p.id
      WHERE (b.grandparent_id = $1 OR b.parent_id = $1)
        AND b.status = 'confirmed'
        AND b.booking_date >= CURRENT_DATE
      ORDER BY b.booking_date
    `, [req.user.id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Keine anstehenden Buchungen.' });
    }

    const events = bookings.map(b => generateVEVENT(b, req.user)).join('\n');
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Zeitnest//Kalender//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Zeitnest Termine\r\n${events}\r\nEND:VCALENDAR`;

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="zeitnest-termine.ics"'
    });
    res.send(ics);
  } catch (err) {
    console.error('ICS export all error:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kalenderdatei.' });
  }
});

function generateICS(booking, user) {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Zeitnest//Kalender//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Zeitnest\r\n${generateVEVENT(booking, user)}\r\nEND:VCALENDAR`;
}

function generateVEVENT(booking, user) {
  const dateStr = booking.booking_date instanceof Date
    ? booking.booking_date.toISOString().split('T')[0].replace(/-/g, '')
    : String(booking.booking_date).split('T')[0].replace(/-/g, '');

  const startTime = String(booking.start_time).substring(0, 5).replace(':', '') + '00';
  const endTime = String(booking.end_time).substring(0, 5).replace(':', '') + '00';

  const isParent = user.id === booking.parent_id;
  const otherName = isParent
    ? `${booking.gp_first} ${booking.gp_last}`
    : `${booking.p_first} ${booking.p_last}`;

  const summary = isParent
    ? `Zeitnest: Betreuung mit ${otherName}`
    : `Zeitnest: Betreuung bei ${otherName}`;

  const description = booking.note
    ? `Notiz: ${booking.note}`
    : 'Zeitnest-Termin';

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VEVENT\r\nUID:${booking.id}@zeitnest.org\r\nDTSTAMP:${now}\r\nDTSTART;TZID=Europe/Berlin:${dateStr}T${startTime}\r\nDTEND;TZID=Europe/Berlin:${dateStr}T${endTime}\r\nSUMMARY:${summary}\r\nDESCRIPTION:${description}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT`;
}

module.exports = router;
