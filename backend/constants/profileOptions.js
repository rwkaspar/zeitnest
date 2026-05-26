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
  validateSubset,
  validateOne,
};
