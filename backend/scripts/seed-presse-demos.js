/**
 * Idempotenter Seed der drei Demo-Accounts für die Presse-Vorstellung:
 *
 *  1) Beispiel-Familie (zwei Eltern, zwei Kinder) — angelehnt an Familie Schneider
 *     aus dem Interview-PDF (aber klar als „Beispiel" markiert).
 *  2) Beispiel-Wunschopa — angelehnt an Oskar Grimm.
 *  3) Beispiel-Koordinierungsstelle Altmühlfranken + ein Beispiel-Account
 *     für Karina M. (ebenfalls als Demo markiert).
 *
 * Credentials sind in DEMO_CREDENTIALS.md dokumentiert (.gitignored).
 * Mehrfaches Ausführen ist sicher — bestehende Demo-Accounts werden
 * erkannt und übersprungen.
 *
 * Aufruf:
 *   docker compose exec zeitnest node /app/backend/scripts/seed-presse-demos.js
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool, queryOne } = require('../database');

// Stabile UUIDs, damit ein erneuter Lauf nichts doppelt.
const IDS = {
  // Altmühlfranken-Demo
  familyOffice: '00000000-0000-4000-8000-000000000010',
  family: '00000000-0000-4000-8000-000000000020',
  parentA: '00000000-0000-4000-8000-000000000021',
  parentB: '00000000-0000-4000-8000-000000000022',
  grandparent: '00000000-0000-4000-8000-000000000023',
  coordinator: '00000000-0000-4000-8000-000000000024',
  // Berlin-Demo
  berlinOffice: '00000000-0000-4000-8000-000000000030',
  berlinFamily: '00000000-0000-4000-8000-000000000040',
  berlinParentA: '00000000-0000-4000-8000-000000000041',
  berlinParentB: '00000000-0000-4000-8000-000000000042',
  berlinGrandparent: '00000000-0000-4000-8000-000000000043',
  berlinCoordinator: '00000000-0000-4000-8000-000000000044',
};

const PASSWORDS = {
  parentA: 'PresseDemo!Familie1',
  parentB: 'PresseDemo!Familie2',
  grandparent: 'PresseDemo!Wunschopa',
  coordinator: 'PresseDemo!Koordi',
  berlinParentA: 'PresseDemo!Berlin1',
  berlinParentB: 'PresseDemo!Berlin2',
  berlinGrandparent: 'PresseDemo!BerlinOma',
  berlinCoordinator: 'PresseDemo!BerlinKoordi',
};

async function ensureUser({ id, email, password, role, first_name, last_name, city, postal_code, bio, profession, birth_date, hobbies, mobility, smoker, pets }) {
  const existing = await queryOne('SELECT id FROM users WHERE id = $1 OR email = $2', [id, email]);
  if (existing) {
    console.log(`  • User bereits vorhanden: ${email} (id=${existing.id})`);
    return existing.id;
  }
  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (id, email, password, role, first_name, last_name, city, postal_code, bio,
                       profession, birth_date, hobbies, mobility, smoker, pets,
                       email_verified, is_demo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE, TRUE)`,
    [id, email, hashed, role, first_name, last_name, city, postal_code, bio,
     profession, birth_date, hobbies, mobility, smoker, pets]
  );
  console.log(`  ✓ User angelegt: ${email}`);
  return id;
}

async function run() {
  console.log('Seede Presse-Demo-Accounts ...');

  // 1) Koordinierungsstelle Altmühlfranken (Beispiel)
  let officeExists = await queryOne('SELECT id FROM coordination_offices WHERE id = $1', [IDS.familyOffice]);
  if (!officeExists) {
    await pool.query(
      `INSERT INTO coordination_offices (id, name, contact_email, website, description, postal_code_prefixes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        IDS.familyOffice,
        'Koordinierungsstelle Altmühlfranken (Demo)',
        'demo-koordination@zeitnest.local',
        'https://www.landkreis-wug.de/jugend-und-familie/kinderschutzstelle/wunschgrosseltern/',
        'Beispiel-Eintrag für die Presse-Demo. Im Echtbetrieb wäre das die Kinderschutzstelle des Landratsamts Weißenburg-Gunzenhausen.',
        ['91', '90'],
      ]
    );
    console.log('  ✓ Koordinierungsstelle „Altmühlfranken (Demo)" angelegt');
  } else {
    console.log('  • Koordinierungsstelle bereits vorhanden');
  }

  // 2) Beispiel-Familie — Eltern + Family + Kinder
  // Parent A — Mutter, Karolin S. (Beispiel)
  await ensureUser({
    id: IDS.parentA, email: 'demo-familie@zeitnest.local', password: PASSWORDS.parentA,
    role: 'parent', first_name: 'Karolin (Demo)', last_name: 'Beispiel',
    city: 'Raitenbuch', postal_code: '91790',
    bio: 'Beispielprofil — Wir sind vor zwei Jahren hierhergezogen. Großeltern leben weiter weg, deshalb suchen wir Verbindung im Ort.',
    profession: 'Erzieherin & Kindheitspädagogin', birth_date: '1989-05-12',
    hobbies: 'Spazieren, Lesen, Garten',
    mobility: ['own_car', 'walking'], smoker: false, pets: null,
  });
  // Parent B — Vater (Beispiel)
  await ensureUser({
    id: IDS.parentB, email: 'demo-familie-partner@zeitnest.local', password: PASSWORDS.parentB,
    role: 'parent', first_name: 'Stefan (Demo)', last_name: 'Beispiel',
    city: 'Raitenbuch', postal_code: '91790',
    bio: 'Beispielprofil — Berufstätiger Vater, freue mich, wenn unsere Kinder ein erweitertes „Großeltern-Erlebnis" haben.',
    profession: 'IT-Administrator', birth_date: '1987-09-23',
    hobbies: 'Radfahren, Heimwerken',
    mobility: ['own_car', 'public_transport'], smoker: false, pets: null,
  });

  // Family (gemeinsame Daten beider Eltern)
  let familyExists = await queryOne('SELECT id FROM families WHERE id = $1', [IDS.family]);
  if (!familyExists) {
    await pool.query(
      `INSERT INTO families (id, owner_user_id, city, postal_code, phone,
         number_of_children, children_ages, needs_description, availability,
         confidentiality_accepted, has_liability_insurance, children_in_liability,
         activities, desired_grandparent, allow_smoker_grandparent, allow_pet_grandparent,
         max_distance_km, contact_mode, contact_location, support_offered)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, TRUE, TRUE, TRUE,
         $10, 'any', FALSE, TRUE, $11, 'family',
         ARRAY['own_household']::TEXT[], ARRAY['forms','technology']::TEXT[])`,
      [
        IDS.family, IDS.parentA, 'Raitenbuch', '91790', '+49 9148 0000000',
        2, '1, 4',
        'Wir freuen uns über regelmäßige Begleitung bei den Kindern — und über eine echte Verbindung zwischen den Generationen.',
        'Mo + Mi Vormittags oder nach Absprache',
        ['reading_crafts_play', 'nature', 'outings', 'celebrations', 'emergencies'],
        25,
      ]
    );
    await pool.query(`UPDATE users SET family_id = $1 WHERE id IN ($2, $3)`, [IDS.family, IDS.parentA, IDS.parentB]);
    console.log('  ✓ Family + 2 Mitglieder verknüpft');
  } else {
    console.log('  • Family bereits vorhanden');
  }
  // parent_profiles-Stub für beide Eltern (rückwärtskompatibel, leere Zeilen)
  for (const pid of [IDS.parentA, IDS.parentB]) {
    const has = await queryOne('SELECT user_id FROM parent_profiles WHERE user_id = $1', [pid]);
    if (!has) {
      await pool.query('INSERT INTO parent_profiles (user_id, confidentiality_accepted) VALUES ($1, TRUE)', [pid]);
    }
  }

  // 3) Beispiel-Wunschopa (Oskar B.)
  await ensureUser({
    id: IDS.grandparent, email: 'demo-wunschopa@zeitnest.local', password: PASSWORDS.grandparent,
    role: 'grandparent', first_name: 'Oskar (Demo)', last_name: 'Beispiel',
    city: 'Nennslingen', postal_code: '91790',
    bio: 'Beispielprofil — Pensioniert, vier eigene Enkelkinder, davon zwei weiter weg. Ich freue mich, wenn ich für Familien in der Nähe Zeit haben kann.',
    profession: 'Pensionierter Außendienstler', birth_date: '1958-03-04',
    hobbies: 'Vereinsleben, Wandern, Garten',
    mobility: ['own_car', 'walking'], smoker: false, pets: null,
  });
  const gpExists = await queryOne('SELECT user_id FROM grandparent_profiles WHERE user_id = $1', [IDS.grandparent]);
  if (!gpExists) {
    await pool.query(
      `INSERT INTO grandparent_profiles (user_id, experience, availability, preferred_age_range,
         offered_activities, has_fuehrungszeugnis, mobility,
         activities, has_liability_insurance,
         fz_status, fz_verified_at, fz_expires_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NULL, $6, TRUE, 'verified', NOW(), NOW() + INTERVAL '3 years')`,
      [
        IDS.grandparent,
        'Vier eigene Enkel, davor jahrzehntelang im Außendienst und sehr geübt im Umgang mit Menschen aller Altersstufen.',
        '1–2× pro Woche, flexibel; auch spontan möglich',
        '0–10 Jahre',
        'Vorlesen, Basteln, Spazieren, Spielplatz, gemeinsam kochen',
        ['reading_crafts_play', 'nature', 'outings', 'celebrations', 'emergencies', 'cooking', 'conversation_kids'],
      ]
    );
    console.log('  ✓ Wunschopa-Profil + verifiziertes Führungszeugnis (Demo)');
  }

  // 4) Beispiel-Koordinatorin (Karina B.)
  await ensureUser({
    id: IDS.coordinator, email: 'demo-koordination@zeitnest.local', password: PASSWORDS.coordinator,
    role: 'coordinator', first_name: 'Karina (Demo)', last_name: 'Beispiel',
    city: 'Weißenburg i. Bay.', postal_code: '91781',
    bio: 'Beispielprofil — Koordinatorin der Wunschgroßeltern Altmühlfranken (Demo-Account).',
    profession: 'Koordinatorin Wunschgroßeltern',
    birth_date: null, hobbies: null, mobility: null, smoker: null, pets: null,
  });
  await pool.query(`UPDATE users SET coordination_office_id = $1 WHERE id = $2`, [IDS.familyOffice, IDS.coordinator]);

  // 5) Demo-Verfügbarkeits-Slots für Oskar, damit Familien direkt buchen können.
  const slotPlan = [
    { dow: 1, start: '09:00:00', end: '12:00:00' }, // Montag Vormittag
    { dow: 3, start: '14:00:00', end: '17:00:00' }, // Mittwoch Nachmittag
    { dow: 6, start: '10:00:00', end: '13:00:00' }, // Samstag Vormittag
  ];
  for (const s of slotPlan) {
    const exists = await queryOne(
      `SELECT id FROM availability_slots WHERE user_id = $1 AND day_of_week = $2 AND start_time = $3`,
      [IDS.grandparent, s.dow, s.start]
    );
    if (!exists) {
      await pool.query(
        `INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time, recurring)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [uuidv4(), IDS.grandparent, s.dow, s.start, s.end]
      );
      console.log(`  ✓ Slot ${s.dow}/${s.start}-${s.end} für Oskar`);
    }
  }

  // ============================================================
  // BERLIN-DEMO (zweite Region, damit Pressepartner regionale Vielfalt sehen)
  // ============================================================
  console.log('');
  console.log('Seede Berlin-Demo-Accounts ...');

  // 1) Berliner Koordinierungsstelle
  const berlinOfficeExists = await queryOne('SELECT id FROM coordination_offices WHERE id = $1', [IDS.berlinOffice]);
  if (!berlinOfficeExists) {
    await pool.query(
      `INSERT INTO coordination_offices (id, name, contact_email, website, description, postal_code_prefixes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        IDS.berlinOffice,
        'Großeltern-Vermittlung Berlin (Demo)',
        'demo-berlin-koordination@zeitnest.local',
        'https://www.berlin.de/',
        'Beispiel-Eintrag für die Presse-Demo. Repräsentiert eine hypothetische Berliner Vermittlungsstelle (z.B. bei einem Familienzentrum oder Wohlfahrtsverband).',
        ['10', '12', '13'],
      ]
    );
    console.log('  ✓ Koordinierungsstelle „Berlin (Demo)" angelegt');
  } else {
    console.log('  • Berlin-Koordinierungsstelle bereits vorhanden');
  }

  // 2) Berliner Beispiel-Familie
  await ensureUser({
    id: IDS.berlinParentA, email: 'demo-berlin-familie@zeitnest.local', password: PASSWORDS.berlinParentA,
    role: 'parent', first_name: 'Nadia (Demo)', last_name: 'Beispiel',
    city: 'Berlin', postal_code: '10999',
    bio: 'Beispielprofil — Mutter von zwei Kindern in Kreuzberg. Wir leben hier ohne Familie in der Nähe und freuen uns über eine Verbindung über Generationen hinweg.',
    profession: 'Grafikdesignerin', birth_date: '1985-08-19',
    hobbies: 'Stadtteil-Initiative, Yoga, Fahrrad',
    mobility: ['public_transport', 'walking'], smoker: false, pets: 'Eine Katze',
  });
  await ensureUser({
    id: IDS.berlinParentB, email: 'demo-berlin-partner@zeitnest.local', password: PASSWORDS.berlinParentB,
    role: 'parent', first_name: 'Jonas (Demo)', last_name: 'Beispiel',
    city: 'Berlin', postal_code: '10999',
    bio: 'Beispielprofil — Programmierer im Homeoffice, vier Tage die Woche. Freue mich über zusätzliche Vertrauenspersonen für die Kinder.',
    profession: 'Softwareentwickler', birth_date: '1983-11-02',
    hobbies: 'Lesen, Kochen, Brettspiele',
    mobility: ['public_transport', 'walking'], smoker: false, pets: 'Eine Katze',
  });

  const berlinFamilyExists = await queryOne('SELECT id FROM families WHERE id = $1', [IDS.berlinFamily]);
  if (!berlinFamilyExists) {
    await pool.query(
      `INSERT INTO families (id, owner_user_id, city, postal_code, phone,
         number_of_children, children_ages, needs_description, availability,
         confidentiality_accepted, has_liability_insurance, children_in_liability,
         activities, desired_grandparent, allow_smoker_grandparent, allow_pet_grandparent,
         max_distance_km, contact_mode, contact_location, support_offered,
         visible_to_coordinators)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, TRUE, TRUE, TRUE,
         $10, $11, FALSE, TRUE, $12,
         ARRAY['family']::TEXT[],
         ARRAY['own_household','outside']::TEXT[],
         ARRAY['technology']::TEXT[], TRUE)`,
      [
        IDS.berlinFamily, IDS.berlinParentA, 'Berlin', '10999', '+49 30 12345678',
        2, '3, 7',
        'Wir suchen jemand, der uns regelmäßig im Alltag entlastet und mit den Kindern Zeit verbringt — gerne auch mit eigenen Ideen.',
        'Mi + Fr Nachmittag, gelegentlich Wochenende',
        ['reading_crafts_play', 'nature', 'outings', 'pickup_dropoff', 'homework'],
        ['any'],
        15,
      ]
    );
    await pool.query(`UPDATE users SET family_id = $1 WHERE id IN ($2, $3)`,
      [IDS.berlinFamily, IDS.berlinParentA, IDS.berlinParentB]);
    console.log('  ✓ Berlin-Family mit 2 Mitgliedern verknüpft');
  } else {
    console.log('  • Berlin-Family bereits vorhanden');
  }
  for (const pid of [IDS.berlinParentA, IDS.berlinParentB]) {
    const has = await queryOne('SELECT user_id FROM parent_profiles WHERE user_id = $1', [pid]);
    if (!has) {
      await pool.query('INSERT INTO parent_profiles (user_id, confidentiality_accepted) VALUES ($1, TRUE)', [pid]);
    }
  }

  // 3) Berliner Wunschoma (Helga B.)
  await ensureUser({
    id: IDS.berlinGrandparent, email: 'demo-berlin-wunschoma@zeitnest.local', password: PASSWORDS.berlinGrandparent,
    role: 'grandparent', first_name: 'Helga (Demo)', last_name: 'Beispiel',
    city: 'Berlin', postal_code: '13187',
    bio: 'Beispielprofil — Pensionierte Bibliothekarin in Pankow. Drei eigene Enkel im Süden Deutschlands, daher selten persönlich. Möchte gerne eine Berliner Familie bereichern.',
    profession: 'Pensionierte Bibliothekarin', birth_date: '1955-02-14',
    hobbies: 'Vorlesen, Spaziergänge im Park, Theater, Museen',
    mobility: ['public_transport', 'walking'], smoker: false, pets: null,
  });
  const berlinGpExists = await queryOne('SELECT user_id FROM grandparent_profiles WHERE user_id = $1', [IDS.berlinGrandparent]);
  if (!berlinGpExists) {
    await pool.query(
      `INSERT INTO grandparent_profiles (user_id, experience, availability, preferred_age_range,
         offered_activities, has_fuehrungszeugnis, mobility,
         activities, has_liability_insurance,
         fz_status, fz_verified_at, fz_expires_at, visible_to_coordinators)
       VALUES ($1, $2, $3, $4, $5, TRUE, NULL, $6, TRUE, 'verified', NOW(), NOW() + INTERVAL '3 years', TRUE)`,
      [
        IDS.berlinGrandparent,
        'Jahrzehntelang Kinderbuch-Veranstaltungen organisiert, drei eigene Enkel. Geduldig, ruhig, kreativ.',
        '2× pro Woche, vor allem Vormittag und Nachmittag',
        '3–10 Jahre',
        'Vorlesen, Museumsbesuche, Spielplatz, einfache Backaktionen',
        ['reading_crafts_play', 'nature', 'outings', 'conversation_kids', 'cooking', 'celebrations'],
      ]
    );
    console.log('  ✓ Wunschoma-Profil + verifiziertes Führungszeugnis (Berlin)');
  }

  // 4) Berliner Koordinatorin (Sabine B.)
  await ensureUser({
    id: IDS.berlinCoordinator, email: 'demo-berlin-koordination@zeitnest.local', password: PASSWORDS.berlinCoordinator,
    role: 'coordinator', first_name: 'Sabine (Demo)', last_name: 'Beispiel',
    city: 'Berlin', postal_code: '10115',
    bio: 'Beispielprofil — Koordinatorin der Berliner Großeltern-Vermittlung (Demo-Account).',
    profession: 'Koordinatorin Familienzentrum',
    birth_date: null, hobbies: null, mobility: null, smoker: null, pets: null,
  });
  await pool.query(`UPDATE users SET coordination_office_id = $1 WHERE id = $2`,
    [IDS.berlinOffice, IDS.berlinCoordinator]);

  // 5) Verfügbarkeits-Slots für die Berliner Wunschoma
  const berlinSlots = [
    { dow: 2, start: '10:00:00', end: '13:00:00' }, // Dienstag Vormittag
    { dow: 4, start: '15:00:00', end: '18:00:00' }, // Donnerstag Nachmittag
  ];
  for (const s of berlinSlots) {
    const exists = await queryOne(
      `SELECT id FROM availability_slots WHERE user_id = $1 AND day_of_week = $2 AND start_time = $3`,
      [IDS.berlinGrandparent, s.dow, s.start]
    );
    if (!exists) {
      await pool.query(
        `INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time, recurring)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [uuidv4(), IDS.berlinGrandparent, s.dow, s.start, s.end]
      );
      console.log(`  ✓ Slot ${s.dow}/${s.start}-${s.end} für Helga`);
    }
  }

  console.log('Fertig.');
  console.log('');
  console.log('Login-Daten siehe DEMO_CREDENTIALS.md im Repo-Root (.gitignored).');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed-Fehler:', err);
  process.exit(1);
});
