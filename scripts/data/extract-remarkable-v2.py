"""
Extract remarkable categories from data (open-ended, let Opus cluster).
V2: No pre-defined categories. Let the patterns emerge.
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
- Key decision: {career.get('keyDecision', '')}
- Previous remarkable_thing: {gs.get('remarkable_thing', '')}""")

prompt = f"""You are analyzing 59 experience creators through Seth Godin's lens of being REMARKABLE (literally worth remarking on).

Each of these people became internationally known. Something about them made people talk. I want you to do TWO things:

## TASK 1: For each creator, answer these questions

1. **remarkable_thing**: 1 sentence. The SPECIFIC contrast, paradox, or unexpected quality that made people unable to ignore them. Not what they achieved. What made people TALK. Think of it as: "Did you hear about the [person] who [remarkable thing]?"

2. **trust_behavior**: 1 sentence. The specific repetitive behavior they did consistently for years that built credibility. The boring part nobody sees.

3. **remarkable_type**: In 2-4 words, describe WHAT TYPE of remarkable this is. Do NOT use pre-defined categories. Just describe it naturally. Examples of what I mean (but don't use these, find your own from the data):
   - "unexpected combination"
   - "refusal to compromise"
   - "impossible proof"
   - "sacred clown"

   Be specific to each person. Two people might have the same type, or every person might be unique. Let the data decide.

## TASK 2: After analyzing all 59, cluster the remarkable_types

Look at all 59 remarkable_types you assigned. Find the natural clusters. Group them into 4-7 categories that emerge from the actual data. For each category:
- Give it a 2-3 word name
- Write a 1 sentence definition
- List which creators belong to it

The categories should feel like they could be options in a quiz: "Which type of remarkable are you?"

## RULES
- Do NOT use em dashes, semicolons, or double hyphens in any field
- Be specific and concrete, not inspirational
- The remarkable_thing should feel like gossip, not a biography

## THE 59 CREATORS

{chr(10).join(blocks)}

## OUTPUT FORMAT

Return ONLY valid JSON:
{{
  "creators": [
    {{
      "name": "Person Name",
      "remarkable_thing": "...",
      "trust_behavior": "...",
      "remarkable_type": "2-4 word natural description"
    }},
    ...
  ],
  "categories": [
    {{
      "id": "snake_case_id",
      "name": "2-3 Word Name",
      "definition": "1 sentence definition",
      "creators": ["Name1", "Name2", ...]
    }},
    ...
  ]
}}"""

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

print(f"Processing {len(ec_names)} creators (open-ended clustering)...")
print("Calling Claude Opus with streaming...")
start = time.time()

text = ""
with client.messages.stream(
    model="claude-opus-4-20250514",
    max_tokens=16000,
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
    with open(os.path.join(BASE, "scripts/remarkable-v2-raw.txt"), "w") as f:
        f.write(text)
    print("Raw response saved to scripts/remarkable-v2-raw.txt")
    sys.exit(1)

# Update growth strategies with new remarkable data
creators_data = results.get("creators", [])
categories = results.get("categories", [])

for r in creators_data:
    name = r["name"]
    if name in growth_data["creators"]:
        growth_data["creators"][name]["remarkable_thing"] = r["remarkable_thing"]
        growth_data["creators"][name]["trust_behavior"] = r["trust_behavior"]
        growth_data["creators"][name]["remarkable_type"] = r["remarkable_type"]

# Find which category each creator belongs to
cat_lookup = {}
for cat in categories:
    for creator_name in cat.get("creators", []):
        cat_lookup[creator_name] = cat["id"]

for name, cat_id in cat_lookup.items():
    if name in growth_data["creators"]:
        growth_data["creators"][name]["remarkable_category"] = cat_id

growth_data["meta"]["remarkable_v2_extracted"] = time.strftime("%Y-%m-%d")
growth_data["meta"]["remarkable_categories"] = categories

out_path = os.path.join(BASE, "public/data/experienceCreatorGrowthStrategies.json")
with open(out_path, "w") as f:
    json.dump(growth_data, f, indent=2)

print(f"\nMerged {len(creators_data)} creators into {out_path}")

# Show categories
print(f"\n{'='*60}")
print(f"EMERGENT CATEGORIES ({len(categories)}):")
print(f"{'='*60}")
for cat in categories:
    print(f"\n{cat['name']} ({cat['id']})")
    print(f"  {cat['definition']}")
    print(f"  Creators ({len(cat['creators'])}): {', '.join(cat['creators'][:6])}{'...' if len(cat['creators']) > 6 else ''}")

# Show some examples
print(f"\n{'='*60}")
print("SAMPLE ENTRIES:")
print(f"{'='*60}")
for name in ["Brené Brown", "Wim Hof", "Phil Jackson", "Fela Kuti", "Adriene Mishler", "Marie Forleo"]:
    r = next((x for x in creators_data if x["name"] == name), None)
    if r:
        cat_id = cat_lookup.get(name, "?")
        print(f"\n{name} ({r['remarkable_type']}) -> {cat_id}")
        print(f"  Remarkable: {r['remarkable_thing']}")
        print(f"  Trust: {r['trust_behavior']}")
