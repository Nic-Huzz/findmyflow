"""
Generate the Finding Flow slide background via Gemini 3.1 Flash.

Scene: the character in his element — dancing joyfully at a silent disco under
golden-hour light, surrounded by hundreds of others wearing glowing headphones,
a growing movement of people finding their flow together.

Character consistency: young man, curly brown hair, stubble, small gold hoop
earring, vibrant geometric-patterned kimono shirt (purple, magenta, teal).

Run from project root:
    python3 scripts/generate-finding-flow-image.py
"""
import base64
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
CAROUSEL_DIR = ROOT / "public" / "images" / "carousel"
VERSIONS_DIR = CAROUSEL_DIR / "versions"
OUTPUT = CAROUSEL_DIR / "slide-finding-flow.jpg"

PROMPT = (
    "Pixar 3D cinematic animation style. A young man in his late 20s with "
    "curly brown hair, stubble, small gold hoop earring, wearing his vibrant "
    "geometric-patterned open kimono shirt (purple, magenta, teal geometric "
    "pattern) flowing as he moves. He is dancing ecstatically with arms raised "
    "and a huge joyful smile, eyes closed in pure bliss, wearing glowing silent "
    "disco headphones that pulse with warm golden light. He is completely in "
    "his flow state, fully alive, fully himself. "
    "\n\n"
    "Around him, hundreds of other people are also dancing, all wearing their "
    "own glowing silent disco headphones that pulse in different vibrant colours "
    "(purple, gold, teal, magenta, pink) — a growing movement of people finding "
    "their flow together. Diverse crowd, all ages, all joyful, arms in the air, "
    "swaying, a sea of humanity moving to the music only they can hear. "
    "\n\n"
    "Setting: an open outdoor space at golden hour / magical sunset — rolling "
    "hills or an open meadow, warm orange and gold sky, soft bokeh light "
    "particles drifting through the air like fireflies, magical Ghibli-like "
    "atmosphere. The character is in the foreground, crowd extending back into "
    "the distance, creating depth. Dramatic warm cinematic lighting, shallow "
    "depth of field, feeling of movement and community and liberation. "
    "\n\n"
    "High quality Pixar animation, painterly, rich detail, vibrant colours, "
    "joyful, alive. 1024x1024."
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
        print("No candidates:", json.dumps(data, indent=2)[:1200])
        sys.exit(1)

    parts = candidates[0].get("content", {}).get("parts", [])
    for p in parts:
        if "inlineData" in p:
            img = base64.b64decode(p["inlineData"]["data"])

            VERSIONS_DIR.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d-%H%M%S")
            archive = VERSIONS_DIR / f"slide-finding-flow-{ts}.jpg"
            archive.write_bytes(img)

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
