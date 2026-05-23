#!/usr/bin/env python3
"""
Batch-generiert alle 18 Zeitnest Landing-Page-Bilder über ComfyUIs /prompt-API.

Liest:
  - prompts.json       (Master mit Style-Suffix + 18 Image-Definitionen)
  - comfyui_workflow_api.json   (API-Format-Workflow als Template)

Schickt 18 Jobs an ComfyUI und wartet bis jedes fertig ist.
Ergebnisse landen in <ComfyUI>/output/<filename>_00001_.png mit Alpha-Kanal.

Voraussetzungen auf ComfyUI-Seite:
  - z-image-turbo Modelle in models/diffusion_models/, models/text_encoders/, models/vae/
  - Background-Removal-Custom-Node mit Klassen LoadBackgroundRemovalModel + RemoveBackground
  - Standard built-ins (KSampler, VAEDecode, JoinImageWithAlpha, SaveImage)

Aufruf:
  python3 batch_generate.py
  python3 batch_generate.py --url http://192.168.50.186:8188
  python3 batch_generate.py --only feature-kennenlernen,header-kinder
  python3 batch_generate.py --skip-done           # überspringt status=done/optional_reuse
  python3 batch_generate.py --dry-run             # zeigt nur was gesendet würde
"""
import argparse
import json
import random
import sys
import time
import urllib.parse
import urllib.request
import uuid
from copy import deepcopy
from pathlib import Path

HERE = Path(__file__).parent
PROMPTS_JSON = HERE / "prompts.json"
TEMPLATE_API = HERE / "comfyui_workflow_api.json"

PROMPT_NODE = "7"
SAMPLER_NODE = "10"
SAVE_NODE = "15"


def post_prompt(server_url, prompt_graph, client_id):
    """POST /prompt mit dem Workflow, returns prompt_id."""
    payload = json.dumps({"prompt": prompt_graph, "client_id": client_id}).encode("utf-8")
    req = urllib.request.Request(
        f"{server_url}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if "prompt_id" not in data:
        raise RuntimeError(f"Server hat kein prompt_id zurückgegeben: {data}")
    return data["prompt_id"]


def get_history(server_url, prompt_id):
    """GET /history/<id> — leer, solange der Job nicht fertig ist."""
    with urllib.request.urlopen(f"{server_url}/history/{prompt_id}") as resp:
        return json.loads(resp.read())


def wait_for_completion(server_url, prompt_id, timeout=600, poll_interval=2):
    """Pollt bis Job in History auftaucht (= fertig). Wirft bei Timeout."""
    start = time.time()
    while time.time() - start < timeout:
        history = get_history(server_url, prompt_id)
        if prompt_id in history:
            entry = history[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                msgs = status.get("messages", [])
                raise RuntimeError(f"ComfyUI-Error: {msgs}")
            return entry
        time.sleep(poll_interval)
    raise TimeoutError(f"Timeout nach {timeout}s — prompt_id {prompt_id} nicht fertig")


def build_workflow(template, prompt_text, filename_stem):
    """Deep-copy + Platzhalter ersetzen + zufälliger Seed."""
    wf = deepcopy(template)
    wf[PROMPT_NODE]["inputs"]["text"] = prompt_text
    wf[SAVE_NODE]["inputs"]["filename_prefix"] = filename_stem
    wf[SAMPLER_NODE]["inputs"]["seed"] = random.randint(0, 2**31 - 1)
    return wf


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default="http://127.0.0.1:8188", help="ComfyUI-Server-URL")
    ap.add_argument("--only", help="Komma-separierte IDs (siehe prompts.json) — nur diese generieren")
    ap.add_argument("--skip-done", action="store_true", help="Status done/optional_reuse überspringen")
    ap.add_argument("--dry-run", action="store_true", help="Nur anzeigen, was gesendet würde")
    ap.add_argument("--timeout", type=int, default=600, help="Sekunden pro Bild bis Timeout (Default 600)")
    args = ap.parse_args()

    server = args.url.rstrip("/")

    if not PROMPTS_JSON.exists():
        sys.exit(f"Nicht gefunden: {PROMPTS_JSON}")
    if not TEMPLATE_API.exists():
        sys.exit(f"Nicht gefunden: {TEMPLATE_API}")

    data = json.loads(PROMPTS_JSON.read_text())
    template = json.loads(TEMPLATE_API.read_text())
    style_suffix = data["style"]["suffix"]
    images = data["images"]

    if args.only:
        wanted = set(s.strip() for s in args.only.split(","))
        images = [img for img in images if img["id"] in wanted]

    if args.skip_done:
        images = [img for img in images if img["status"] not in ("done", "optional_reuse")]

    if not images:
        sys.exit("Keine Bilder zum Generieren übrig.")

    client_id = str(uuid.uuid4())
    print(f"→ Server: {server}")
    print(f"→ Client-ID: {client_id}")
    print(f"→ {len(images)} Bilder zu generieren\n")

    failures = []
    for i, img in enumerate(images, 1):
        filename_stem = img["filename"].replace(".png", "")
        full_prompt = f"{img['prompt']} {style_suffix}"
        print(f"[{i:02d}/{len(images)}] {img['id']:35s} → {filename_stem}_00001_.png")

        if args.dry_run:
            print(f"     ({len(full_prompt)} chars prompt, status={img['status']})")
            continue

        try:
            workflow = build_workflow(template, full_prompt, filename_stem)
            t0 = time.time()
            prompt_id = post_prompt(server, workflow, client_id)
            wait_for_completion(server, prompt_id, timeout=args.timeout)
            dt = time.time() - t0
            print(f"     ✓ {dt:.1f}s")
        except Exception as e:
            print(f"     ✗ FEHLER: {e}")
            failures.append((img["id"], str(e)))

    print()
    if failures:
        print(f"⚠ {len(failures)} Fehler:")
        for fid, msg in failures:
            print(f"  - {fid}: {msg}")
        sys.exit(1)
    print(f"✓ Alle {len(images)} Bilder fertig.")


if __name__ == "__main__":
    main()
