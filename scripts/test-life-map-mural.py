"""
Test: Generate a Pixar-style Life Map mural via Gemini 3.1 Flash.

Uses the same API pattern as generate-crisis-image.py.

Run from project root:
    python3 scripts/test-life-map-mural.py
"""
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
OUTPUT = ROOT / "docs" / "life-map-mural-test.png"

PROMPT = (
    "Pixar 3D cinematic animation style — the EXACT rendering quality of "
    "Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, "
    "large expressive eyes with visible iris detail and specular highlights, "
    "slightly exaggerated proportions (larger head-to-body ratio for children, "
    "stylized hands), volumetric atmospheric lighting with visible light rays, "
    "depth of field with subtle bokeh. "
    "\n\n"
    "Create a wide panoramic mural that tells one person's life story as a "
    "continuous journey flowing from left to right. The composition should feel "
    "like a painted Pixar concept-art banner, with scenes blending seamlessly "
    "into each other through atmospheric transitions, not separated into panels. "
    "\n\n"
    "The sky transitions from deep purple on the left (childhood/past) to warm "
    "gold on the right (present/future), like a sunrise across a life. "
    "\n\n"
    "SCENE 1 (far left): A small Pixar-style boy around age 7 with brown hair "
    "and big expressive eyes, sitting on a warm sunlit bedroom floor, deeply "
    "focused building an elaborate colorful Lego creation. A Spider-Man poster "
    "is on the wall behind him. Warm golden afternoon light streams through a "
    "window casting volumetric rays. Moving boxes stacked in the corner. "
    "Rendered in full Pixar 3D with subsurface skin lighting. "
    "\n\n"
    "SCENE 2 (left-center): The same character as a Pixar-style teenager "
    "around 15, outdoors on a green sports field at golden hour. He's sitting "
    "on a bench playing acoustic guitar, rugby ball at his feet. In the "
    "background, groups of kids hang out together, but he's slightly apart, "
    "content in his own space. Pixar-quality grass, atmospheric haze. "
    "\n\n"
    "SCENE 3 (center): The same Pixar character at around 23, standing at a "
    "literal fork in the road. One path leads to a grey, cold corporate office "
    "building with fluorescent lights. The other path leads to a warm, vibrant "
    "outdoor community gathering with string lights. He's turning away from "
    "corporate, taking his first step toward the community. Tie loosened, "
    "exhausted but determined. Dramatic Pixar lighting contrast. "
    "\n\n"
    "SCENE 4 (right-center): The same Pixar character at around 27, energized, "
    "standing at the front of a warm workshop room, gesturing passionately. "
    "Some audience members are lit up. Others in back rows appear dimmed and "
    "small. He looks at the dimmed ones with recognition and compassion. "
    "Pixar emotional expressiveness in faces. "
    "\n\n"
    "SCENE 5 (far right): The same Pixar character now, sitting at a glowing "
    "desk in a beautiful open workspace with tropical plants (Bali vibes). On "
    "his screen is a colorful app. Golden light radiates outward. Behind him, "
    "slightly transparent like a Pixar memory sequence (like in Inside Out), "
    "stands his younger exhausted 23-year-old self, watching with awe and "
    "relief. The golden light warms the younger version. "
    "\n\n"
    "CRITICAL STYLE REQUIREMENTS: Full Pixar/Disney 3D animation rendering "
    "quality throughout. NOT 2D illustration, NOT watercolor, NOT flat. Must "
    "look like it was rendered by Pixar's RenderMan engine. Smooth 3D surfaces, "
    "subsurface scattering on skin, volumetric lighting, cinematic camera "
    "depth of field. The entire mural must feel cohesive like one continuous "
    "Pixar concept-art painting. No text or words anywhere. Landscape "
    "orientation, wide panoramic aspect ratio."
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

    print("Calling Gemini 3.1 Flash for Life Map mural...")
    print("This may take 30-60 seconds...")
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
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
            OUTPUT.write_bytes(img)
            print(f"Saved {len(img):,} bytes to {OUTPUT.relative_to(ROOT)}")
            print(f"Open with: open {OUTPUT}")
            return
        elif "text" in p:
            print("Text part:", p["text"][:300])

    print("No image in response:", json.dumps(data, indent=2)[:1200], file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
