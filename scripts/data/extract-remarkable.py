"""
Extract what made each experience creator remarkable using Claude Opus.
Adds to experienceCreatorGrowthStrategies.json.
"""

import json
import os
import sys
import time

try:
    import anthropic
except ImportError:
    os.system(f"{sys.executable} -m pip install anthropic")
    import anthropic

from dotenv import load_dotenv

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE, ".env.local"))

with open(os.path.join(BASE, "public/data/careerModels.json")) as f:
    career_data = json.load(f)
with open(os.path.join(BASE, "public/data/experienceCreatorDNA.json")) as f:
    dna_data = json.load(f)
with open(os.path.join(BASE, "public/data/experienceCreatorGrowthStrategies.json")) as f:
    growth_data = json.load(f)

ec_names = set(p["name"] for p in dna_data["profiles"] if p.get("experienceType"))
cm_map = {p["name"]: p for p in career_data["profiles"]}

blocks = []
for name in sorted(ec_names):
    cm = cm_map.get(name, {})
    career = cm.get("careerModel", {})
    gs = growth_data["creators"].get(name, {})

    blocks.append(f"""### {name}
- One-liner: {cm.get('oneLiner', '')}
- Trajectory: {career.get('trajectory', '')}
- Early growth: {gs.get('early_growth', '')}
- Scaling move: {gs.get('scaling_move', '')}
- Key decision: {career.get('keyDecision', '')}""")

prompt = f"""You are analyzing 59 experience creators through Seth Godin's lens: Marketing = Trust + Attention.

TRUST is built through: repetition, consistency, showing up, delivering results over time.
ATTENTION is earned by being REMARKABLE — literally worth remarking on. Not better. Different.

For each creator, I need you to identify:

1. **remarkable_thing**: 1 sentence. The SPECIFIC thing about them that was different, unexpected, or impossible to ignore. Not what they did (that's the scaling_move). WHY people couldn't stop talking about them. What made them remarkable was rarely their skill. It was a specific CONTRAST, PARADOX, or UNEXPECTED MOVE.

Examples of what "remarkable" means:
- Brene Brown: An academic researcher talking about SHAME on a TED stage. The contrast between clinical research and raw vulnerability was the remarkable thing.
- Wim Hof: A grieving father who could control his immune system in a lab. Science validating what looked like mysticism.
- Phil Jackson: A Zen Buddhist coaching the most competitive athletes on earth. Silence in the loudest sport.

2. **trust_behavior**: 1 sentence. The specific repetitive behavior that built trust over years. What did they do EVERY WEEK or EVERY DAY that compounded?

3. **remarkable_category**: Classify what TYPE of remarkable they were. Exactly ONE of:
- "contrast" — combined two things nobody expected together (academic + vulnerability, zen + basketball)
- "extreme" — took something normal to an extreme nobody else would (12 years in a cave, 5127 prototypes)
- "first" — did something nobody had done before in that space (first to codify, first to name, first to demonstrate)
- "defiance" — refused to do what everyone expected and succeeded anyway (quit medicine, challenged an industry)
- "translation" — took something from one world and brought it to another (monastic wisdom to Instagram, research to TED)

IMPORTANT:
- Do NOT use em dashes, semicolons, or double hyphens
- The remarkable_thing should feel like a headline someone would share
- Focus on the CONTRAST or PARADOX, not just the achievement

Here are the 59 creators:

{chr(10).join(blocks)}

Return ONLY valid JSON as an array:
[
  {{
    "name": "Person Name",
    "remarkable_thing": "...",
    "trust_behavior": "...",
    "remarkable_category": "..."
  }},
  ...
]"""

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

print(f"Processing {len(ec_names)} creators...")
print("Calling Claude Opus with streaming...")
start = time.time()

text = ""
with client.messages.stream(
    model="claude-opus-4-20250514",
    max_tokens=12000,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for chunk in stream.text_stream:
        text += chunk
        if len(text) % 500 < len(chunk):
            print(".", end="", flush=True)

elapsed = time.time() - start
print(f"\nResponse received in {elapsed:.1f}s ({len(text)} chars)")

text = text.replace("```json", "").replace("```", "").strip()

try:
    results = json.loads(text)
except json.JSONDecodeError as e:
    print(f"JSON parse error: {e}")
    with open(os.path.join(BASE, "scripts/remarkable-raw.txt"), "w") as f:
        f.write(text)
    print("Raw response saved to scripts/remarkable-raw.txt")
    sys.exit(1)

valid_cats = {"contrast", "extreme", "first", "defiance", "translation"}
for r in results:
    if r.get("remarkable_category") not in valid_cats:
        print(f"  WARNING: {r['name']} has invalid category: {r.get('remarkable_category')}")

# Merge into growth strategies
for r in results:
    name = r["name"]
    if name in growth_data["creators"]:
        growth_data["creators"][name]["remarkable_thing"] = r["remarkable_thing"]
        growth_data["creators"][name]["trust_behavior"] = r["trust_behavior"]
        growth_data["creators"][name]["remarkable_category"] = r["remarkable_category"]

growth_data["meta"]["remarkable_extracted"] = time.strftime("%Y-%m-%d")

out_path = os.path.join(BASE, "public/data/experienceCreatorGrowthStrategies.json")
with open(out_path, "w") as f:
    json.dump(growth_data, f, indent=2)

print(f"\nMerged {len(results)} remarkable entries into {out_path}")

for name in ["Brené Brown", "Tony Robbins", "Wim Hof", "Priya Parker", "Fela Kuti"]:
    r = next((x for x in results if x["name"] == name), None)
    if r:
        print(f"\n{name}:")
        print(f"  Remarkable: {r['remarkable_thing']}")
        print(f"  Trust: {r['trust_behavior']}")
        print(f"  Category: {r['remarkable_category']}")
