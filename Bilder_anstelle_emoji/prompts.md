# Zeitnest Landing Page — Bild-Prompts

18 Bilder ersetzen die Emojis. Stand: **3 nutzbar, 3 zu überarbeiten, 12 fehlen.**

## Style Anchor (bei jedem Prompt mit anhängen)

Damit alle Bilder konsistent wirken — diesen Block an jeden Generations-Prompt anhängen:

```
Style: warm, intimate, photo-realistic close-up. Focus on hands, faces in 3/4 profile, or symbolic objects — avoid full-body shots with awkward anatomy. Natural soft daylight, warm beige / cream / soft orange color palette (matches the Zeitnest brand). Shallow depth of field. **Transparent background (RGBA PNG, alpha channel)** — if not possible, plain off-white #FAFBFC. No text, no logos, no watermarks. 1024x1024.
```

Diversity über das Set bewusst variieren (Hautfarbe, Alter innerhalb der Generation, Geschlecht), sonst wird's zufällig einseitig.

## Status-Legende
- ✅ vorhanden und nutzbar
- ⚠️ vorhanden, sollte aber überarbeitet werden
- ❌ fehlt noch

---

## Sektion 1: „Warum Zeitnest?" — 3 Feature-Cards (Render ~40 px)

### ⚠️ Entlastung für Eltern
**Aktuelle Datei:** `z-image-turbo_00022_.png`
**Problem:** Zeigt eine gestresste Mutter — zu negativ als Erster Eindruck. Dreht das Gefühl in „du bist überfordert", nicht „hier ist Hilfe".
**Neuer Prompt:**
```
A relaxed mother sitting on a sofa with a cup of coffee, eyes softly closed in relief, gentle smile. In the soft-blurred background, a senior woman is playfully reading a picture book to a small child on the floor. The mother is in focus, the background scene blurred but warm. Conveys: relief, "I have help now."
```

### ❌ Sinn & Freude für Senioren
**Hinweis:** Das aktuell vorhandene Bild `z-image-turbo_00016_.png` (Seniorin + rennender Junge) passt eher hier rein — kannst du verwenden falls dir der Stil zusagt. Markiert als ✅ unten.
**Prompt (für Neugenerierung):**
```
Close-up portrait of a senior person (gender-neutral, varied: try one with grey beard, one with silver hair in a bun) with bright eyes and a genuine wide smile, looking slightly down at a child whose hand is reaching up into frame. The senior's face shows joy and purpose. 3/4 profile, warm side-light.
```

### ✅ Sicheres Kennenlernen
**Datei:** `z-image-turbo_00030_.png`
Hände (alt + jung) übergeben eine Teetasse. **Top — Anker-Stil für alle anderen.**

---

## Sektion 2: Audience-Header — 3 große Icons (Render ~48 px)

### ✅ Für Kinder
**Datei:** `z-image-turbo_00025_.png`
Kind mit Rucksack schaut neugierig nach oben. Passt.

### ✅/❌ Für Senioren
**Falls du** `z-image-turbo_00016_.png` (Seniorin + rennender Junge) **hier verwenden willst**, ist's gesetzt.
**Sonst neuer Prompt:**
```
A senior person (slightly side-lit, 3/4 profile) with reading glasses pushed up on their head, holding a steaming mug, looking out a window with a calm smile. Wisdom and warmth, not loneliness. Vary: try male and female versions.
```

### ⚠️ Für Eltern
**Aktuelle Datei:** `z-image-turbo_00029_.png`
**Problem:** Das Kind sitzt anatomisch unmöglich klein zwischen den Beinen der Eltern → klassisches KI-Tell, fällt sofort auf.
**Neuer Prompt:**
```
Tight close-up of two adult hands clasped together (one wearing a simple wedding band, no engagement-ring-bling), held casually, slight contrast in skin tones. Out-of-focus in the background: silhouette of a small child running on grass. Warm late-afternoon light. Avoid showing the child clearly — symbolic only.
```

---

## Sektion 3: „Für Kinder" — 4 Cards (Render ~29 px)

### ❌ Neue Bezugspersonen
```
A small child's hand and a wrinkled senior hand together forming a heart shape with their thumbs and index fingers. Background blurred warm cream. Both hands visible, both relaxed. Avoid making the senior hand look claw-like (common AI failure).
```

### ❌ Lebenserfahrung & Geschichten
```
An open old hardcover book on a wooden table, slightly worn pages. Resting on the book: a small vintage photograph (sepia tone, family scene, deliberately fuzzy so no faces are identifiable) and a polished brass compass. Warm window light from the side. No people in frame.
```

### ❌ Soziale Kompetenz
```
A young sprout / seedling in dark earth, with two pairs of hands gently cupping the soil around it — one pair clearly older (some age spots, slight wrinkles), one pair young (smooth, smaller). Top-down 3/4 angle. Symbol of growth nurtured across generations.
```

### ❌ Neue Impulse & Hobbys
```
A flatlay on warm wood: colorful crayons fanned out, a small open watercolor set, a wooden cooking spoon, a folded paper origami crane, and a sheet of music — overlapping casually. Symbol of variety in hobbies. Soft warm light, no people.
```

---

## Sektion 4: „Für Senioren" — 4 Cards (Render ~29 px)

### ❌ Sinn & Erfüllung
```
A pair of older hands cupped together in the center of the frame, holding a small glowing warm light (like a candle flame or sun-flare), as if cradling something precious. Background soft warm out-of-focus. Symbol: purpose, having something meaningful to give.
```

### ❌ Auch ohne eigene Enkel
```
A senior hand gently holding a small child's wooden toy (e.g. a hand-carved animal figure) on an open palm. Just the hand from wrist down, well-lit. No biological-family imagery. Symbol: care without a blood-relation.
```

### ❌ Aktiv & verbunden bleiben
```
A senior person's hands playing an old accordion or holding a wooden recorder/flute, mid-music. Sheet music or a small dancing child silhouette out of focus in background. Joy, motion, music. Warm golden hour light.
```

### ❌ Wissen & Werte weitergeben
```
An open wooden chest seen from slightly above, filled with mixed objects symbolizing knowledge: a wooden spoon, hand-knitted yarn, an old leather-bound notebook, a small hammer, a single rose. Warm light from above. Like a treasure chest of life skills. No people.
```

---

## Sektion 5: „Für Eltern" — 4 Cards (Render ~29 px)

### ❌ Zurück zum Dorf-Prinzip
```
A small cluster of stylized warm-toned houses (illustrative, not photo, low-poly or watercolor) connected by glowing soft lines forming a network. Tiny figure silhouettes near the houses. Symbol of a village / community. Soft warm beige background.
```
*(Ausnahme vom Foto-Stil — das Symbol funktioniert besser illustrativ. Falls Stil-Konsistenz wichtiger: zwei Hände unterschiedlicher Generationen reichen sich über einen Gartenzaun ein Tablett mit Brot — gleicher Foto-Stil.)*

### ⚠️ Paarzeit schützen
**Aktuelle Datei:** `z-image-turbo_00019_.png`
**Problem:** Glamouröses Candle-Light-Dinner mit Stockfoto-Vibe — passt nicht zur warmen Zeitnest-Ästhetik.
**Neuer Prompt:**
```
A close-up of two adult hands holding wine glasses, clinking gently. In soft focus behind: two people on a sofa laughing, blanket on lap, casual home setting (no restaurant). Cozy lamp light, evening atmosphere. Intimacy through casualness, not luxury.
```

### ❌ Me-Time ohne schlechtes Gewissen
```
A single person from behind, sitting cross-legged on grass under a tree, holding a paperback book half-open. Sunlight filters through leaves. Peaceful, not lonely. The viewer feels: "this is allowed." No phone, no laptop.
```

### ❌ Vertrauen statt Fremde
```
A senior person reading a picture book aloud to a young child sitting next to them on a sofa, both fully engaged in the story. View from the side, warm living-room light. In very soft background: a parent in the kitchen, smiling, holding a mug — relaxed, present-but-not-watching. Conveys: layered trust.
```

---

## Übersicht / Checkliste

| # | Position | Status | Datei |
|---|---|---|---|
| 1 | Entlastung für Eltern | ⚠️ | `z-image-turbo_00022_.png` (überarbeiten) |
| 2 | Sinn & Freude für Senioren | ✅ oder ❌ | `z-image-turbo_00016_.png` (optional hier) |
| 3 | Sicheres Kennenlernen | ✅ | `z-image-turbo_00030_.png` |
| 4 | Für Kinder (Header) | ✅ | `z-image-turbo_00025_.png` |
| 5 | Für Senioren (Header) | ✅ oder ❌ | `z-image-turbo_00016_.png` (alternativ neu) |
| 6 | Für Eltern (Header) | ⚠️ | `z-image-turbo_00029_.png` (überarbeiten) |
| 7 | Neue Bezugspersonen | ❌ | — |
| 8 | Lebenserfahrung & Geschichten | ❌ | — |
| 9 | Soziale Kompetenz | ❌ | — |
| 10 | Neue Impulse & Hobbys | ❌ | — |
| 11 | Sinn & Erfüllung | ❌ | — |
| 12 | Auch ohne eigene Enkel | ❌ | — |
| 13 | Aktiv & verbunden bleiben | ❌ | — |
| 14 | Wissen & Werte weitergeben | ❌ | — |
| 15 | Zurück zum Dorf-Prinzip | ❌ | — |
| 16 | Paarzeit schützen | ⚠️ | `z-image-turbo_00019_.png` (überarbeiten) |
| 17 | Me-Time ohne schlechtes Gewissen | ❌ | — |
| 18 | Vertrauen statt Fremde | ❌ | — |

**Zusammenfassung:** 3 ✅ direkt verwendbar · 3 ⚠️ überarbeiten · 12 ❌ neu generieren.
