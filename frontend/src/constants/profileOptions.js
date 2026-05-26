// Spiegelt backend/constants/profileOptions.js + deutsche Labels für UI.
// Bei Änderungen beide Dateien synchron halten.

export const ACTIVITIES = [
  { key: 'pickup_dropoff', label: 'Hol- und Bringdienste' },
  { key: 'bedtime', label: 'Kinder ins Bett bringen' },
  { key: 'cooking', label: 'Gemeinsame Mahlzeiten zubereiten' },
  { key: 'doctor_visits', label: 'Begleitung bei Arztterminen' },
  { key: 'nature', label: 'Natur gemeinsam erleben' },
  { key: 'outings', label: 'Ausflüge gestalten' },
  { key: 'reading_crafts_play', label: 'Lesen, Basteln, Spielen' },
  { key: 'emergencies', label: 'In Notfällen spontan aushelfen' },
  { key: 'homework', label: 'Bei den Hausaufgaben helfen' },
  { key: 'conversation_kids', label: 'Gesprächspartner für Kinder' },
  { key: 'celebrations', label: 'Feste gemeinsam feiern' },
  { key: 'conversation_parents', label: 'Gesprächspartner für Eltern' },
];

export const MOBILITY = [
  { key: 'own_car', label: 'Eigenes Auto' },
  { key: 'license_no_car', label: 'Fahrerlaubnis (kein Auto)' },
  { key: 'walking', label: 'Zu Fuß' },
  { key: 'public_transport', label: 'Öffentliche Verkehrsmittel' },
];

export const DESIRED_GRANDPARENT = [
  { key: 'oma', label: 'Eine Wunschoma' },
  { key: 'opa', label: 'Einen Wunschopa' },
  { key: 'both', label: 'Beide / Wunschgroßeltern' },
  { key: 'any', label: 'Egal' },
];

export const CONTACT_MODE = [
  { key: 'children_only', label: 'Mit den Kindern' },
  { key: 'family', label: 'Mit der Familie' },
];

export const CONTACT_LOCATION = [
  { key: 'own_household', label: 'In unserem Haushalt' },
  { key: 'grandparent_household', label: 'Im Haushalt der Wunschgroßeltern' },
  { key: 'outside', label: 'Außer Haus' },
];

export const SUPPORT_OFFERED = [
  { key: 'forms', label: 'Formulare ausfüllen' },
  { key: 'heavy_lifting', label: 'Bei schweren Lasten helfen' },
  { key: 'technology', label: 'Moderne Technik erklären' },
];

export const MARITAL_STATUS = [
  { key: 'single', label: 'Ledig' },
  { key: 'partnered', label: 'In Partnerschaft' },
  { key: 'married', label: 'Verheiratet' },
  { key: 'separated', label: 'Getrennt lebend' },
  { key: 'divorced', label: 'Geschieden' },
  { key: 'widowed', label: 'Verwitwet' },
];

export function labelOf(list, key) {
  const item = list.find((x) => x.key === key);
  return item ? item.label : key;
}
