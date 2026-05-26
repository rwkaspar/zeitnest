const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeitnest',
  user: process.env.DB_USER || 'zeitnest',
  password: process.env.DB_PASSWORD || 'zeitnest',
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('parent', 'grandparent')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        city TEXT,
        postal_code TEXT,
        phone TEXT,
        bio TEXT,
        avatar_url TEXT,
        is_demo BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        number_of_children INTEGER,
        children_ages TEXT,
        needs_description TEXT,
        availability TEXT,
        preferred_activities TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS grandparent_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        experience TEXT,
        availability TEXT,
        preferred_age_range TEXT,
        offered_activities TEXT,
        has_fuehrungszeugnis BOOLEAN DEFAULT FALSE,
        mobility TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        grandparent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'completed')),
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS availability_slots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        recurring BOOLEAN DEFAULT TRUE,
        specific_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        slot_id TEXT NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
        grandparent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled')),
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Migrations
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`);
    await client.query(`UPDATE users SET is_demo = TRUE WHERE email LIKE '%@example.de' OR email LIKE '%@zeitnest.local'`);
    // Frühere Migration anonymisierte hier phone+postal_code für is_demo=TRUE-User,
    // weil der allererste Seed echte Adressen hatte. Inzwischen sind die Demo-Datensätze
    // bewusst regional gestaltet (z.B. Altmühlfranken-Beispiele für die Presse-Demo)
    // — wir lassen die Felder daher in Ruhe. Echte PII steckt nie hier drin.
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`);

    // Reports table for user reporting
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'reviewed', 'closed')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`);

    // 2FA columns
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE`);

    // Admin column (for /admin panel access)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);

    // Messages: Bearbeiten-Spur
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`);

    // desired_grandparent + contact_mode jetzt Multi-Select (TEXT[])
    // Idempotente Konvertierung: falls Spalte noch TEXT, nach TEXT[] umwandeln
    try {
      await client.query(`
        ALTER TABLE families ALTER COLUMN desired_grandparent TYPE TEXT[]
          USING CASE WHEN desired_grandparent IS NULL THEN NULL ELSE ARRAY[desired_grandparent] END
      `);
    } catch (e) { /* already converted */ }
    try {
      await client.query(`
        ALTER TABLE families ALTER COLUMN contact_mode TYPE TEXT[]
          USING CASE WHEN contact_mode IS NULL THEN NULL ELSE ARRAY[contact_mode] END
      `);
    } catch (e) { /* already converted */ }

    // B.1 Opt-In Sichtbarkeit für Koordinierungsstellen
    // Default FALSE — Datenschutz-Pflicht
    await client.query(`ALTER TABLE families ADD COLUMN IF NOT EXISTS visible_to_coordinators BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS visible_to_coordinators BOOLEAN DEFAULT FALSE`);

    // Stage C: Event-Kalender für Koordinierungsstellen
    await client.query(`
      CREATE TABLE IF NOT EXISTS coordinator_events (
        id TEXT PRIMARY KEY,
        office_id TEXT NOT NULL REFERENCES coordination_offices(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        capacity INTEGER,
        audience TEXT NOT NULL DEFAULT 'both' CHECK (audience IN ('parents', 'grandparents', 'both')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_office ON coordinator_events(office_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_start ON coordinator_events(start_at)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coordinator_event_attendances (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES coordinator_events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('interested', 'going', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (event_id, user_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_event ON coordinator_event_attendances(event_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_user ON coordinator_event_attendances(user_id)`);

    // B.2 Coordinator-Notes: Status + freie Notiz pro Eintrag, pro Stelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS coordinator_notes (
        id TEXT PRIMARY KEY,
        office_id TEXT NOT NULL REFERENCES coordination_offices(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL CHECK (target_type IN ('family', 'grandparent')),
        target_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_contact', 'matched', 'paused')),
        note TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (office_id, target_type, target_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_coord_notes_target ON coordinator_notes(target_type, target_id)`);

    // Koordinierungsstellen (Stage B) — Behörden/Wohlfahrt vermitteln Familien & Wunschgroßeltern in ihrem Bereich
    await client.query(`
      CREATE TABLE IF NOT EXISTS coordination_offices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_email TEXT,
        website TEXT,
        description TEXT,
        postal_code_prefixes TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS coordination_office_id TEXT REFERENCES coordination_offices(id) ON DELETE SET NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_office ON users(coordination_office_id)`);

    // role-CHECK um 'coordinator' erweitern (Postgres: erstmal Constraint droppen, dann neu setzen)
    try {
      await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
      await client.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('parent', 'grandparent', 'coordinator'))`);
    } catch (e) {
      // Bereits angepasst — ignorieren
    }

    // Families (Stage A.5) — Vater/Mutter unabhängig registrieren, gemeinsame Family-Daten
    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        city TEXT,
        postal_code TEXT,
        phone TEXT,
        number_of_children INTEGER,
        children_ages TEXT,
        needs_description TEXT,
        availability TEXT,
        preferred_activities TEXT,
        confidentiality_accepted BOOLEAN DEFAULT FALSE,
        has_liability_insurance BOOLEAN,
        children_in_liability BOOLEAN,
        activities TEXT[],
        desired_grandparent TEXT,
        allow_smoker_grandparent BOOLEAN,
        allow_pet_grandparent BOOLEAN,
        max_distance_km INTEGER,
        contact_mode TEXT,
        contact_location TEXT[],
        support_offered TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_id TEXT REFERENCES families(id) ON DELETE SET NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS family_invites (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        invited_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_email TEXT,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_family_invites_token ON family_invites(token)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_family_invites_family ON family_invites(family_id)`);

    // Daten-Migration: für jede bestehende parent_profiles-Zeile eine Family anlegen
    // und alle Family-Felder aus parent_profiles + users (für PLZ/Stadt) in die Family übernehmen.
    // Idempotent: nur User ohne family_id und Rolle 'parent'.
    const { rows: orphanParents } = await client.query(`
      SELECT u.id AS user_id, u.city, u.postal_code, u.phone,
             pp.number_of_children, pp.children_ages, pp.needs_description,
             pp.availability, pp.preferred_activities,
             pp.confidentiality_accepted, pp.has_liability_insurance, pp.children_in_liability,
             pp.activities, pp.desired_grandparent, pp.allow_smoker_grandparent,
             pp.allow_pet_grandparent, pp.max_distance_km, pp.contact_mode,
             pp.contact_location, pp.support_offered
      FROM users u
      JOIN parent_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'parent' AND u.family_id IS NULL
    `);
    if (orphanParents.length > 0) {
      const { v4: uuidv4 } = require('uuid');
      for (const p of orphanParents) {
        const familyId = uuidv4();
        await client.query(
          `INSERT INTO families (id, owner_user_id, city, postal_code, phone,
             number_of_children, children_ages, needs_description, availability, preferred_activities,
             confidentiality_accepted, has_liability_insurance, children_in_liability,
             activities, desired_grandparent, allow_smoker_grandparent, allow_pet_grandparent,
             max_distance_km, contact_mode, contact_location, support_offered)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [familyId, p.user_id, p.city, p.postal_code, p.phone,
           p.number_of_children, p.children_ages, p.needs_description, p.availability, p.preferred_activities,
           p.confidentiality_accepted || false, p.has_liability_insurance, p.children_in_liability,
           p.activities, p.desired_grandparent, p.allow_smoker_grandparent, p.allow_pet_grandparent,
           p.max_distance_km, p.contact_mode, p.contact_location, p.support_offered]
        );
        await client.query(`UPDATE users SET family_id = $1 WHERE id = $2`, [familyId, p.user_id]);
      }
      console.log(`Family-Migration: ${orphanParents.length} Familien aus parent_profiles erstellt.`);
    }

    // Strukturierte Profil-Felder (Stage A — Altmühlfranken-Kompat)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profession TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_hours INTEGER`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS smoker BOOLEAN`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pets TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mobility TEXT[]`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT`);

    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS has_liability_insurance BOOLEAN`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS children_in_liability BOOLEAN`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS confidentiality_accepted BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS activities TEXT[]`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS desired_grandparent TEXT`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS allow_smoker_grandparent BOOLEAN`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS allow_pet_grandparent BOOLEAN`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS max_distance_km INTEGER`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS contact_mode TEXT`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS contact_location TEXT[]`);
    await client.query(`ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS support_offered TEXT[]`);

    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS activities TEXT[]`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS has_liability_insurance BOOLEAN`);

    // Führungszeugnis (FZ) verification — Stage-1 (Upload + Admin-Approval)
    // Status: not_submitted | pending | verified | rejected | expired
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_status TEXT NOT NULL DEFAULT 'not_submitted'`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_submitted_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_verified_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_expires_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_admin_note TEXT`);
    await client.query(`ALTER TABLE grandparent_profiles ADD COLUMN IF NOT EXISTS fz_filename TEXT`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gp_fz_status ON grandparent_profiles(fz_status)`);
    // Mark existing/demo users as verified
    await client.query(`UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email LIKE '%@example.de'`);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_city ON users(role, city)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_parent ON matches(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_grandparent ON matches(grandparent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_slots_user ON availability_slots(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_grandparent ON bookings(grandparent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);

    // Seed demo data if empty
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(rows[0].count) === 0) {
      await seedDemoData(client);
    }

    console.log('Datenbank initialisiert.');
  } finally {
    client.release();
  }
}

async function seedDemoData(client) {
  const { v4: uuidv4 } = require('uuid');
  const hashedPassword = bcrypt.hashSync('demo1234', 10);

  const demoUsers = [
    { id: uuidv4(), email: 'demo-maria@zeitnest.local', role: 'grandparent', first_name: 'Maria (Demo)', last_name: 'Beispiel', city: 'Beispielstadt', postal_code: null, phone: null, bio: 'Beispielprofil — Pensionierte Grundschullehrerin mit viel Erfahrung im Umgang mit Kindern. Liebt es, Geschichten vorzulesen und zu basteln.' },
    { id: uuidv4(), email: 'demo-hans@zeitnest.local', role: 'grandparent', first_name: 'Hans (Demo)', last_name: 'Beispiel', city: 'Beispielstadt', postal_code: null, phone: null, bio: 'Beispielprofil — Aktiver Rentner, der gerne Zeit in der Natur verbringt. Wandern, Gärtnern und Fahrradfahren als Leidenschaft.' },
    { id: uuidv4(), email: 'demo-ingrid@zeitnest.local', role: 'grandparent', first_name: 'Ingrid (Demo)', last_name: 'Beispiel', city: 'Beispielstadt', postal_code: null, phone: null, bio: 'Beispielprofil — Ehemalige Krankenschwester, liebevoll und geduldig. Erste-Hilfe-Kenntnisse inklusive.' },
    { id: uuidv4(), email: 'demo-lisa@zeitnest.local', role: 'parent', first_name: 'Lisa (Demo)', last_name: 'Beispiel', city: 'Beispielstadt', postal_code: null, phone: null, bio: 'Beispielprofil — Alleinerziehende Mama von zwei aufgeweckten Kindern. Sucht liebevolle Unterstützung.' },
    { id: uuidv4(), email: 'demo-thomas@zeitnest.local', role: 'parent', first_name: 'Thomas (Demo)', last_name: 'Beispiel', city: 'Beispielstadt', postal_code: null, phone: null, bio: 'Beispielprofil — Berufstätiger Vater, Eltern arbeiten beide Vollzeit. Würde sich über eine Leih-Oma freuen.' },
  ];

  for (const u of demoUsers) {
    await client.query(
      `INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code, phone, bio, is_demo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
      [u.id, u.email, hashedPassword, u.role, u.first_name, u.last_name, u.city, u.postal_code, u.phone, u.bio]
    );

    if (u.role === 'grandparent') {
      await client.query(
        `INSERT INTO grandparent_profiles (user_id, experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis, mobility) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, 'Erfahrung mit eigenen Enkeln', 'Mo-Fr Vormittags, Sa Nachmittags', '2-8 Jahre', 'Vorlesen, Basteln, Spazieren, Spielplatz', true, 'Mobil mit ÖPNV']
      );
    } else {
      await client.query(
        `INSERT INTO parent_profiles (user_id, number_of_children, children_ages, needs_description, availability, preferred_activities) VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.id, 2, '3,6', 'Regelmäßige Betreuung 2x pro Woche', 'Mo-Fr Nachmittags', 'Vorlesen, Basteln, Spielplatz']
      );
    }
  }

  console.log('Demo-Daten wurden angelegt.');
}

// Helper functions
async function queryAll(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

async function runSql(sql, params = []) {
  await pool.query(sql, params);
}

module.exports = { initDatabase, pool, queryAll, queryOne, runSql };
