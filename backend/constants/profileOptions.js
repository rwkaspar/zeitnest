// Strukturierte Multi-Select-Optionen für Profile.
// Quelle: Aufnahmebogen "Wunschgroßeltern in Altmühlfranken".
// Wenn Werte erweitert werden, auch Frontend-Mirror in src/constants/profileOptions.js aktualisieren.

const ACTIVITIES = [
  'pickup_dropoff',          // Hol- und Bringdienste
  'bedtime',                 // Kinder ins Bett bringen
  'cooking',                 // Gemeinsame Mahlzeiten zubereiten
  'doctor_visits',           // Begleitung bei Arztterminen
  'nature',                  // Natur gemeinsam erleben
  'outings',                 // Ausflüge gemeinsam gestalten
  'reading_crafts_play',     // Lesen, Basteln, Spielen
  'emergencies',             // In Notfällen spontan aushelfen
  'homework',                // Bei den Hausaufgaben helfen
  'conversation_kids',       // Gesprächspartner für Kinder sein
  'celebrations',            // Feste gemeinsam feiern
  'conversation_parents',    // Gesprächspartner für Eltern/-teile sein
];

const MOBILITY = [
  'own_car',          // eigenes Auto
  'license_no_car',   // Fahrerlaubnis ohne Fahrzeug
  'walking',          // zu Fuß
  'public_transport', // öffentliche Verkehrsmittel
];

const DESIRED_GRANDPARENT = ['oma', 'opa', 'both', 'any'];

const CONTACT_MODE = [
  'children_only', // mit den Kindern Zeit verbringen
  'family',        // mit der Familie Zeit verbringen
];

const CONTACT_LOCATION = [
  'own_household',
  'grandparent_household',
  'outside',
];

const SUPPORT_OFFERED = [
  'forms',          // Formulare ausfüllen
  'heavy_lifting',  // bei schweren Lasten helfen
  'technology',     // moderne Technik erklären
];

const MARITAL_STATUS = ['single', 'partnered', 'married', 'separated', 'divorced', 'widowed'];

// Phase 2 (Rollen öffnen): Helfer-Kategorien. 'grandparent' ist die Bestands-
// Kategorie (Default in der DB) — Wunschgroßeltern bleiben hervorgehoben.
const HELPER_CATEGORIES = [
  'grandparent',       // Wunschgroßeltern (heutiger Kern)
  'student',           // Studierende & junge Erwachsene
  'neighbor',          // Nachbarschaftshilfe
  'family_mentor',     // Patenfamilien / Familien helfen Familien
  'parent_tandem',     // Alleinerziehende im Tandem
  'skilled_volunteer', // Ehrenamtliche mit Fachkompetenz (Vorlese-, Lern-, Musikpaten)
];

// Phase 2: Skill-/Qualifikations-Tags für Helfer-Profile.
const SKILLS = [
  'first_aid',           // Erste Hilfe (am Kind)
  'pedagogy',            // pädagogische Aus-/Weiterbildung
  'childcare_experience',// eigene Betreuungserfahrung
  'languages',           // Fremdsprachen
  'music',               // Instrument / Singen
  'sports',              // Sport / Übungsleiter-Erfahrung
  'crafts',              // Handwerk & Basteln
  'tutoring',            // Nachhilfe / Lernbegleitung
  'reading',             // Vorlesen / Leseförderung
  'cooking_baking',      // Kochen & Backen
  'nature_gardening',    // Natur & Garten
  'special_needs',       // Erfahrung mit besonderem Förderbedarf
];

function validateSubset(input, allowed) {
  if (input == null) return null;
  if (!Array.isArray(input)) return null;
  return input.filter((v) => allowed.includes(v));
}

function validateOne(input, allowed) {
  if (input == null) return null;
  return allowed.includes(input) ? input : null;
}

module.exports = {
  ACTIVITIES,
  MOBILITY,
  DESIRED_GRANDPARENT,
  CONTACT_MODE,
  CONTACT_LOCATION,
  SUPPORT_OFFERED,
  MARITAL_STATUS,
  HELPER_CATEGORIES,
  SKILLS,
  validateSubset,
  validateOne,
};
