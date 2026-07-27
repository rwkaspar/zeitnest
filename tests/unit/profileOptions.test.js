// Unit-Tests für die Konstanten-Validierung (Quelle der Wahrheit).
// Läuft ohne Dependencies mit dem Node-Builtin-Runner:
//   docker run --rm -v "$PWD":/app -w /app node:20-alpine node --test tests/unit/

const test = require('node:test');
const assert = require('node:assert');
const {
  ACTIVITIES, MOBILITY, HELPER_CATEGORIES, SKILLS, MARITAL_STATUS,
  validateSubset, validateOne,
} = require('../../backend/constants/profileOptions');

test('validateSubset filtert unbekannte Werte heraus', () => {
  assert.deepStrictEqual(
    validateSubset(['first_aid', 'hacking', 'music'], SKILLS),
    ['first_aid', 'music']
  );
});

test('validateSubset: kein Array / null → null', () => {
  assert.strictEqual(validateSubset(null, SKILLS), null);
  assert.strictEqual(validateSubset(undefined, SKILLS), null);
  assert.strictEqual(validateSubset('first_aid', SKILLS), null);
  assert.strictEqual(validateSubset({ a: 1 }, SKILLS), null);
});

test('validateSubset: leeres Array bleibt leeres Array (bewusstes Löschen)', () => {
  assert.deepStrictEqual(validateSubset([], SKILLS), []);
});

test('validateOne akzeptiert nur bekannte Werte', () => {
  assert.strictEqual(validateOne('student', HELPER_CATEGORIES), 'student');
  assert.strictEqual(validateOne('grandparent', HELPER_CATEGORIES), 'grandparent');
  assert.strictEqual(validateOne('admin', HELPER_CATEGORIES), null);
  assert.strictEqual(validateOne('', HELPER_CATEGORIES), null);
  assert.strictEqual(validateOne(null, HELPER_CATEGORIES), null);
});

test('HELPER_CATEGORIES enthält den Bestands-Default grandparent', () => {
  assert.ok(HELPER_CATEGORIES.includes('grandparent'));
});

test('Konstanten sind eindeutig (keine Duplikate)', () => {
  for (const list of [ACTIVITIES, MOBILITY, HELPER_CATEGORIES, SKILLS, MARITAL_STATUS]) {
    assert.strictEqual(new Set(list).size, list.length);
  }
});

test('Konstanten-Werte sind snake_case-ASCII (DB-/URL-sicher)', () => {
  for (const v of [...HELPER_CATEGORIES, ...SKILLS]) {
    assert.match(v, /^[a-z][a-z0-9_]*$/);
  }
});
