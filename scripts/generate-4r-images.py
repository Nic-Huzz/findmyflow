"""
Generate 4 Pixar images for the 4R's of Healing carousel.
Character consistency: young man, curly brown hair, stubble, geometric kimono shirt.
"""
import base64
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
IMAGES_DIR = ROOT / "public" / "images" / "carousel" / "images"
VERSIONS_DIR = ROOT / "public" / "images" / "carousel" / "versions"

CHARACTER = (
    "Pixar 3D cinematic animation style. A young man in his late 20s with "
    "curly brown hair, stubble, wearing his vibrant geometric-patterned open "
    "kimono shirt (purple, magenta, teal geometric pattern). "
)

SCENES = [
    {
        "name": "4r-recognise",
        "prompt": CHARACTER + (
            "He is standing in front of a large ornate door in a dark corridor, "
            "his hand reaching for the handle but frozen mid-reach, unable to "
            "turn it. Warm golden light spills through the crack under the door "
            "and around its edges, illuminating his face. His expression is "
            "longing mixed with hesitation. The corridor behind him is cold "
            "blue-grey. The door represents what he wants but can't reach. "
            "Dramatic cinematic lighting, shallow depth of field, emotional, "
            "painterly. 1024x1024."
        ),
    },
    {
        "name": "4r-reconnect",
        "prompt": CHARACTER + (
            "He is kneeling down in a warm softly-lit space, face to face with "
            "a younger version of himself — a small child (around 6 years old) "
            "with the same curly brown hair, wearing a smaller version of the "
            "geometric kimono. The child has arms crossed protectively, looking "
            "scared but starting to soften. The adult is reaching out gently, "
            "eye level with the child, compassionate and tender. Warm golden "
            "ambient light surrounds them both. The moment of meeting the wound. "
            "Emotional, intimate, Pixar quality. 1024x1024."
        ),
    },
    {
        "name": "4r-release",
        "prompt": CHARACTER + (
            "The same young man and the child version of himself standing "
            "together. The child is letting go of a heavy dark smoky cloud "
            "that had been wrapped around his chest — the cloud is dissolving "
            "upward into golden glowing particles, like fireflies or dust "
            "catching light. Both characters are watching the dark cloud "
            "transform into golden light as it rises. The child's arms are "
            "finally uncrossed, relaxed. Expression of relief and lightness "
            "on both faces. Warm golden light from above. The weight is "
            "lifting. Cinematic, emotional, beautiful. 1024x1024."
        ),
    },
    {
        "name": "4r-rewire",
        "prompt": CHARACTER + (
            "The young man walking confidently through the now wide-open ornate "
            "door into a landscape of warm golden sunrise light. Rolling hills, "
            "wildflowers, open sky. The child version of himself is riding on "
            "his shoulders, both smiling and laughing, arms open. The dark "
            "corridor is behind them, the golden world ahead. Freedom, "
            "integration, joy. They are moving forward together — the adult "
            "and the inner child reunited. Dramatic golden hour lighting, "
            "bokeh particles in the air, expansive, hopeful, alive. Pixar "
            "quality. 1024x1024."
        ),
    },
]


def load_api_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("GOOGLE_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    print("ERROR: GOOGLE_API_KEY not found", file=sys.stderr)
    sys.exit(1)


def generate(api_key, prompt, output_name):
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-3.1-flash-image-preview:generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }

    print(f"  Generating {output_name}...")
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
        print(f"  HTTP {e.code}: {e.read().decode('utf-8')[:300]}", file=sys.stderr)
        return False

    if "error" in data:
        print(f"  API error: {json.dumps(data['error'], indent=2)[:300]}", file=sys.stderr)
        return False

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for p in parts:
        if "inlineData" in p:
            img = base64.b64decode(p["inlineData"]["data"])

            VERSIONS_DIR.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d-%H%M%S")
            archive = VERSIONS_DIR / f"{output_name}-{ts}.jpg"
            archive.write_bytes(img)

            canonical = IMAGES_DIR / f"{output_name}.jpg"
            canonical.write_bytes(img)

            print(f"  Saved {len(img):,} bytes → {canonical.name}")
            return True

    print(f"  No image returned for {output_name}", file=sys.stderr)
    return False


def main():
    api_key = load_api_key()
    IMAGES_DIR.mkdir(exist_ok=True)

    print("Generating 4R images...")
    for scene in SCENES:
        success = generate(api_key, scene["prompt"], scene["name"])
        if not success:
            print(f"  FAILED: {scene['name']}")

    print("\nDone.")


if __name__ == "__main__":
    main()
