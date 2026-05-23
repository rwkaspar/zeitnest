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
    // Anonymize legacy demo users (PII in old seed data)
    await client.query(`UPDATE users SET phone = NULL, postal_code = NULL WHERE is_demo = TRUE`);
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
