const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'leihoma.db');
let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS parent_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      number_of_children INTEGER,
      children_ages TEXT,
      needs_description TEXT,
      availability TEXT,
      preferred_activities TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS grandparent_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      experience TEXT,
      availability TEXT,
      preferred_age_range TEXT,
      offered_activities TEXT,
      has_fuehrungszeugnis INTEGER DEFAULT 0,
      mobility TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL REFERENCES users(id),
      grandparent_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'completed')),
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id),
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      reviewed_id TEXT NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed demo data
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = result[0]?.values[0]?.[0] || 0;

  if (userCount === 0) {
    seedDemoData();
  }

  saveDb();
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() {
  return db;
}

// Helper: run query and return array of objects
function queryAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Query error:', sql, err.message);
    return [];
  }
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runSql(sql, params = []) {
  try {
    db.run(sql, params);
    saveDb();
  } catch (err) {
    console.error('Run error:', sql, err.message);
    throw err;
  }
}

function seedDemoData() {
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
    db.run(
      `INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, hashedPassword, u.role, u.first_name, u.last_name, u.city, u.postal_code, u.phone, u.bio]
    );

    if (u.role === 'grandparent') {
      db.run(
        `INSERT INTO grandparent_profiles (user_id, experience, availability, preferred_age_range, offered_activities, has_fuehrungszeugnis, mobility) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.id, 'Erfahrung mit eigenen Enkeln', 'Mo-Fr Vormittags, Sa Nachmittags', '2-8 Jahre', 'Vorlesen, Basteln, Spazieren, Spielplatz', 1, 'Mobil mit ÖPNV']
      );
    } else {
      db.run(
        `INSERT INTO parent_profiles (user_id, number_of_children, children_ages, needs_description, availability, preferred_activities) VALUES (?, ?, ?, ?, ?, ?)`,
        [u.id, 2, '3,6', 'Regelmäßige Betreuung 2x pro Woche', 'Mo-Fr Nachmittags', 'Vorlesen, Basteln, Spielplatz']
      );
    }
  }

  console.log('Demo-Daten wurden angelegt.');
}

module.exports = { initDatabase, getDb, queryAll, queryOne, runSql, saveDb };
