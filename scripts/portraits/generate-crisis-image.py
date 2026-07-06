"""
Generate the Crisis slide background via Gemini 3.1 Flash.

Character consistency: matches the rest of the carousel (young man, curly brown
hair, small gold hoop earring, light moustache, vibrant geometric kimono shirt).

Run from project root:
    python3 scripts/generate-crisis-image.py
"""
import base64
import json
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
CAROUSEL_DIR = ROOT / "public" / "images" / "carousel"
VERSIONS_DIR = CAROUSEL_DIR / "versions"
OUTPUT = CAROUSEL_DIR / "slide-crisis.jpg"

PROMPT = (
    "Pixar 3D cinematic animation style. A young man in his late 20s with curly "
    "brown hair, stubble, wearing his vibrant geometric-patterned open kimono "
    "shirt (purple, magenta, teal geometric pattern) under a wrinkled white "
    "corporate shirt with loosened tie. He is slumped at his cluttered corporate "
    "office desk late at night — scattered papers, a glowing laptop screen, an "
    "abandoned coffee mug, stacks of folders. His head rests heavily in one hand, "
    "elbows on the desk, completely exhausted and defeated. The office around "
    "him is cold fluorescent blue-grey, empty, lifeless. "
    "\n\n"
    "Floating above his head, drawn in classic Pixar animation style with the "
    "characteristic small trailing cloud puffs leading from his head up to the "
    "main bubble, is a large glowing THOUGHT BUBBLE — warm golden, dreamy, "
    "slightly translucent. Inside the thought bubble: a miniature cinematic "
    "scene showing a MAGICAL WINDING PATH through an enchanted landscape — "
    "rolling golden hills, distant mountains at sunrise, wildflowers, soft "
    "warm light, Studio Ghibli feel. At the START of the path stands the SAME "
    "character (tiny scale), wearing his geometric kimono freely, looking ahead "
    "at the magical path with wide-eyed excitement and childlike wonder, "
    "seeing what's possible but not yet walking it. His face is lit up with "
    "hope and curiosity. "
    "\n\n"
    "The two realities contrast sharply: the dark cold corporate office in cool "
    "blue-grey shadow, and the warm glowing golden magical path inside the "
    "thought bubble. Dramatic cinematic lighting, shallow depth of field, "
    "emotional, raw, hopeful despite the darkness. High quality Pixar animation, "
    "painterly, rich detail. 1024x1024."
)


def load_api_key() -> str:
    if not ENV_FILE.exists():
        print(f"ERROR: {ENV_FILE} not found", file=sys.stderr)
        sys.exit(1)
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("GOOGLE_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    print("ERROR: GOOGLE_API_KEY not found in .env.local", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    api_key = load_api_key()
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-3.1-flash-image-preview:generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }

    print("Calling Gemini 3.1 Flash…")
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode('utf-8')[:500]}", file=sys.stderr)
        sys.exit(1)

    if "error" in data:
        print("API error:", json.dumps(data["error"], indent=2), file=sys.stderr)
        sys.exit(1)

    candidates = data.get("candidates", [])
    if not candidates:
        print("No candidates returned:", json.dumps(data, indent=2)[:1200])
        sys.exit(1)

    parts = candidates[0].get("content", {}).get("parts", [])
    for p in parts:
        if "inlineData" in p:
            img = base64.b64decode(p["inlineData"]["data"])

            # Save a timestamped version to the archive
            VERSIONS_DIR.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d-%H%M%S")
            archive = VERSIONS_DIR / f"slide-crisis-{ts}.jpg"
            archive.write_bytes(img)

            # Also write the canonical copy used by the carousel
            OUTPUT.write_bytes(img)

            print(f"Saved {len(img):,} bytes")
            print(f"  Archive:   {archive.relative_to(ROOT)}")
            print(f"  Canonical: {OUTPUT.relative_to(ROOT)}")
            return
        elif "text" in p:
            print("Text part:", p["text"][:200])

    print("No image in response:", json.dumps(data, indent=2)[:1200], file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
