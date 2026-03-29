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

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_city ON users(role, city)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_parent ON matches(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_grandparent ON matches(grandparent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id)`);

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
    { id: uuidv4(), email: 'maria.schmidt@example.de', role: 'grandparent', first_name: 'Maria', last_name: 'Schmidt', city: 'München', postal_code: '80331', phone: '+49 170 1234567', bio: 'Pensionierte Grundschullehrerin mit viel Erfahrung im Umgang mit Kindern. Ich liebe es, Geschichten vorzulesen und zu basteln.' },
    { id: uuidv4(), email: 'hans.mueller@example.de', role: 'grandparent', first_name: 'Hans', last_name: 'Müller', city: 'München', postal_code: '80333', phone: '+49 171 2345678', bio: 'Aktiver Rentner, der gerne Zeit in der Natur verbringt. Wandern, Gärtnern und Fahrradfahren sind meine Leidenschaft.' },
    { id: uuidv4(), email: 'ingrid.weber@example.de', role: 'grandparent', first_name: 'Ingrid', last_name: 'Weber', city: 'Berlin', postal_code: '10115', phone: '+49 172 3456789', bio: 'Ehemalige Krankenschwester, liebevoll und geduldig. Erste-Hilfe-Kenntnisse inklusive!' },
    { id: uuidv4(), email: 'lisa.braun@example.de', role: 'parent', first_name: 'Lisa', last_name: 'Braun', city: 'München', postal_code: '80335', phone: '+49 173 4567890', bio: 'Alleinerziehende Mama von zwei aufgeweckten Kindern (3 und 6 Jahre). Suche liebevolle Unterstützung.' },
    { id: uuidv4(), email: 'thomas.wagner@example.de', role: 'parent', first_name: 'Thomas', last_name: 'Wagner', city: 'Berlin', postal_code: '10117', phone: '+49 174 5678901', bio: 'Berufstätiger Vater, Frau und ich arbeiten beide Vollzeit. Unsere Tochter (4) würde sich über eine Leih-Oma freuen!' },
  ];

  for (const u of demoUsers) {
    await client.query(
      `INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code, phone, bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
