# Zeitnest Landing-Page Bild-Batch — ComfyUI Workflow

Generiert 18 Bilder mit konsistentem Stil und transparentem Hintergrund.

## Dateien in diesem Ordner

| Datei | Zweck |
|---|---|
| `prompts.json` | Master-Quelle: alle 18 Bilder mit Prompts, Stil-Block, Status. Bei Änderungen hier, dann `prompts.txt` neu generieren. |
| `prompts.txt` | Pro Zeile ein vollständiger Prompt (inkl. Style-Suffix). Wird vom Workflow gelesen. |
| `mapping.txt` | `001..018` → semantischer Dateiname. Brauchst du zum Umbenennen nach dem Run. |
| `comfyui_workflow.json` | Der ComfyUI-Workflow (UI-Format, per Drag-Drop ins ComfyUI-Browser-Fenster ziehen). |

## Setup

### Custom-Nodes installieren

In ComfyUI Manager → Install Custom Nodes:

- **ComfyUI-Inspire-Pack** (`ltdrdata/ComfyUI-Inspire-Pack`) — liefert die Node `Load Prompts From File //Inspire`
- **ComfyUI-RMBG** (`1038lab/ComfyUI-RMBG`) — liefert die Node `RMBG` mit BiRefNet-Backend

Beim ersten Lauf lädt RMBG das BiRefNet-Modell automatisch (~250 MB).

### prompts.txt verfügbar machen

Inspire's `Load Prompts From File` sucht standardmäßig relativ zum ComfyUI-Verzeichnis. Zwei Optionen:

1. **Kopieren** in `<ComfyUI>/input/prompts.txt` und im Workflow-Node die Path-Property auf `prompts.txt` lassen.
2. **Symlink** anlegen:
   ```bash
   ln -s "$(realpath prompts.txt)" /pfad/zu/ComfyUI/input/prompts.txt
   ```
3. **Absoluter Pfad** im Workflow-Node eintragen — am robustesten.

## Workflow nutzen

1. ComfyUI starten.
2. `comfyui_workflow.json` per Drag-Drop in den Browser ziehen.
3. **`CheckpointLoaderSimple`** auf dein z-image-turbo-Checkpoint setzen (im Workflow steht `z-image-turbo.safetensors` als Platzhalter).
4. **`Load Prompts From File //Inspire`**: Pfad zur `prompts.txt` prüfen (Default: `prompts.txt`, also relativ zu `ComfyUI/input/`).
5. **`KSampler`** Einstellungen anpassen — Default-Settings im Workflow sind für SDXL-Turbo-artige Modelle (8 Steps, CFG 1.5, `euler` + `sgm_uniform`). Wenn z-image-turbo andere Empfehlungen hat, dort eintragen.
6. Klick **Queue Prompt** — der Workflow läuft mit dem 1. Prompt aus `prompts.txt`.
7. Entweder weitere 17× klicken, oder im ComfyUI-Menü „Extra Options" → „Auto Queue" aktivieren, dann werden alle 18 Zeilen automatisch durchgespielt.
8. Ergebnisse landen in `ComfyUI/output/` als `zeitnest_00001_.png` … `zeitnest_00018_.png` mit Alpha-Kanal.

## Mapping & Umbenennen

Nach dem Run liegen `zeitnest_00001_.png` bis `zeitnest_00018_.png` im Output. Über `mapping.txt` weißt du, welcher Counter welchem Ziel-Filename entspricht. Schnell-Umbenennen via Shell:

```bash
cd <ComfyUI>/output/
mv zeitnest_00001_.png feature-eltern-entlastung.png
mv zeitnest_00002_.png feature-senioren-sinn.png
# ... usw, siehe mapping.txt
```

Oder als Skript:

```bash
awk 'NF>=2 && $1 ~ /^[0-9]+$/ {
  printf "mv zeitnest_%05d_.png %s\n", $1, $2
}' mapping.txt | bash
```

## Falls der Workflow nicht 1:1 lädt

Hand-geschriebene Workflow-JSONs sind anfällig für Node-Typ-Drift zwischen Custom-Node-Versionen. Wenn beim Laden Fehler kommen oder Nodes als „missing" markiert sind:

**Manueller Nachbau in 10 Nodes**, von links nach rechts:

1. **`Note`** — Hinweise (Optional)
2. **`Load Checkpoint`** (CheckpointLoaderSimple) — z-image-turbo
3. **`Load Prompts From File //Inspire`** (Inspire Pack)
   - `prompts` Output → CLIPTextEncode (positive) `text`
   - `name` Output → SaveImage `filename_prefix`
4. **`CLIPTextEncode`** (positive) — empty text widget, wird von Inspire gefüttert
   - `clip` ← Checkpoint
   - `text` ← Inspire `prompts`
5. **`CLIPTextEncode`** (negative) — Negative Prompt aus `prompts.json` `style.negative` reinkopieren
   - `clip` ← Checkpoint
6. **`Empty Latent Image`** — 1024 × 1024
7. **`KSampler`** — Settings je Modell (s.o.)
8. **`VAE Decode`**
9. **`RMBG`** (ComfyUI-RMBG) — Model `BiRefNet-general`
10. **`Save Image`** — `filename_prefix` Widget weg, stattdessen über Input von Inspire `name`

Verkabelung wie im Workflow-JSON, oder Drag-Drop intuitiv.

## Style ändern

Wenn du den globalen Stil tunen willst (z.B. mehr Wärme, andere Beleuchtung):

1. `prompts.json` öffnen → `style.suffix` editieren.
2. `prompts.txt` regenerieren:
   ```bash
   python3 -c "
   import json
   d = json.load(open('prompts.json'))
   suffix = d['style']['suffix']
   with open('prompts.txt', 'w') as f:
       for img in d['images']:
           f.write(img['prompt'].replace(chr(10),' ') + ' ' + suffix + '\n')
   "
   ```
3. Im Workflow „Auto Queue" wieder anwerfen.

## Status der Bilder (aus prompts.json)

- ✅ **done** (3): bereits vorhanden und nutzbar
- ⚠️ **todo_revision** (3): vorhanden, aber neu generieren
- 🔄 **optional_reuse** (1): kann übernommen oder neu generiert werden
- ❌ **todo** (11): noch komplett zu generieren

Siehe `mapping.txt` für die Status-Spalte pro Bild.
