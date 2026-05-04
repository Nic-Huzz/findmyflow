"""
Generate slide 1 Pixar image: character at corporate desk looking out window at golden landscape.
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
OUTPUT = IMAGES_DIR / "4r-hook.jpg"

PROMPT = (
    "Pixar 3D cinematic animation style. A young man in his late 20s with "
    "curly brown hair, stubble, sitting at a sleek corporate desk in a modern "
    "high-rise office. He is turned away from his laptop and paperwork, looking "
    "out through a large floor-to-ceiling window. Through the window: a vast "
    "golden landscape with rolling hills, warm sunrise, wildflowers, an open "
    "path leading into the distance. His grey suit jacket is draped over the "
    "back of his chair, and underneath his white shirt his vibrant geometric-"
    "patterned kimono (purple, magenta, teal) is just visible at the collar "
    "and cuffs. His expression is longing, reflective, dreaming of something "
    "bigger. The office is cool blue-grey, the world outside is warm gold. "
    "Sharp contrast between the two worlds. Dramatic cinematic lighting, "
    "shallow depth of field, emotional, painterly. 1024x1024."
)


def load_api_key():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("GOOGLE_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("ERROR: GOOGLE_API_KEY not found")


def main():
    api_key = load_api_key()
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-3.1-flash-image-preview:generateContent?key={api_key}"
    )
    body = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }

    print("Generating hook image...")
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode('utf-8')[:300]}")

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for p in parts:
        if "inlineData" in p:
            img = base64.b64decode(p["inlineData"]["data"])
            VERSIONS_DIR.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d-%H%M%S")
            (VERSIONS_DIR / f"4r-hook-{ts}.jpg").write_bytes(img)
            OUTPUT.write_bytes(img)
            print(f"Saved {len(img):,} bytes")
            return
    print("No image returned")


if __name__ == "__main__":
    main()
