"""
Extract remarkable triggers for each experience creator.
V3: 5 pre-defined triggers based on WHY humans remark, not clustering.
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
- Key decision: {career.get('keyDecision', '')}
- Early growth: {gs.get('early_growth', '')}
- Scaling move: {gs.get('scaling_move', '')}""")

prompt = f"""You are identifying what made 59 experience creators REMARKABLE. Not famous. Not successful. Remarkable. Literally: worth remarking on.

The test: if someone heard about this person for the first time, what would make them say "wait, what?" and then tell a friend over dinner? That thing IS what's remarkable about them.

IMPORTANT DISTINCTION:
- Remarkable is NOT the breakthrough moment (the TED talk, the viral video, the book deal). That's distribution.
- Remarkable IS the extraordinary behavior or conclusion that made the breakthrough inevitable.
- Wim Hof getting on TV is not remarkable. A grieving father sitting in freezing water every day until his immune system changed IS remarkable.
- Brene Brown doing a TED talk is not remarkable. Spending 15 years researching the thing everyone hides from and concluding that shame is what connects us IS remarkable.

There are 5 triggers that make humans remark about something. Every remarkable person hits at least one:

1. **unexpected_combination**: Two things that don't belong together, together. A Zen Buddhist coaching NBA egos. A bartender teaching business. An academic sharing her shame on stage. The brain can't reconcile the two things and needs to talk about it.

2. **extreme_degree**: A normal thing taken so absurdly far it becomes extraordinary. 12 years in a cave. Freezing water daily for decades. Reading in a shack for 5 years. 40 years teaching the same truth. The commitment itself is the remarkable thing.

3. **rule_broken**: Did what the field explicitly says you should not do, and it worked. Published real therapy sessions. Never corrected yoga form. Called the dominant recovery program sexist. The violation of the norm IS the story.

4. **impossible_result**: Produced evidence that defies what people believe is possible. Predicted divorce with 90% accuracy. Parakeets reduced death rates. Four-year-olds discussed Plato. The DATA silenced skeptics.

5. **stupid_simplicity**: The answer is so simple it feels insulting, and it works. "Just show up every day." "Start with Why." "Kids learn from people they like." Everyone expects complexity. The simplicity IS the remarkable thing.

FOR EACH CREATOR, provide:

1. **remarkable_trigger**: Which of the 5 triggers (use the snake_case id). Pick the PRIMARY one. Some creators hit multiple, pick the one that would make someone say "wait, what?" loudest.

2. **remarkable_behavior**: 1 sentence. The specific BEHAVIOR or CONCLUSION (not the achievement, not the distribution) that made them remarkable. Write it as gossip. Write it as the thing you'd say at dinner. Start with the PERSON, not the action.
   - YES: "A grieving father who sat in freezing water every day until his immune system changed."
   - NO: "Pioneered a revolutionary cold exposure methodology."
   - YES: "A bartender who taught business to millions without a business degree."
   - NO: "Created an innovative online business education platform."

3. **trust_behavior**: 1 sentence. The specific boring, repetitive thing they did consistently for years that built credibility. The thing nobody sees or talks about.

RULES:
- Do NOT use em dashes, semicolons, or double hyphens
- The remarkable_behavior must pass the dinner party test: would someone actually SAY this?
- Focus on what they DID, not what happened TO them
- Strip all achievements, awards, follower counts, revenue figures

Here are the 59 creators:

{chr(10).join(blocks)}

Return ONLY valid JSON as an array:
[
  {{
    "name": "Person Name",
    "remarkable_trigger": "unexpected_combination" | "extreme_degree" | "rule_broken" | "impossible_result" | "stupid_simplicity",
    "remarkable_behavior": "The dinner party sentence",
    "trust_behavior": "The boring repetitive thing"
  }},
  ...
]"""

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

print(f"Processing {len(ec_names)} creators with 5 triggers...")
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
    with open(os.path.join(BASE, "scripts/remarkable-v3-raw.txt"), "w") as f:
        f.write(text)
    print("Raw response saved to scripts/remarkable-v3-raw.txt")
    sys.exit(1)

# Validate triggers
valid = {"unexpected_combination", "extreme_degree", "rule_broken", "impossible_result", "stupid_simplicity"}
for r in results:
    if r.get("remarkable_trigger") not in valid:
        print(f"  WARNING: {r['name']} has invalid trigger: {r.get('remarkable_trigger')}")

# Update growth strategies
for r in results:
    name = r["name"]
    if name in growth_data["creators"]:
        growth_data["creators"][name]["remarkable_trigger"] = r["remarkable_trigger"]
        growth_data["creators"][name]["remarkable_behavior"] = r["remarkable_behavior"]
        growth_data["creators"][name]["trust_behavior"] = r["trust_behavior"]

growth_data["meta"]["remarkable_v3_extracted"] = time.strftime("%Y-%m-%d")

out_path = os.path.join(BASE, "public/data/experienceCreatorGrowthStrategies.json")
with open(out_path, "w") as f:
    json.dump(growth_data, f, indent=2)

print(f"\nSaved to {out_path}")

# Distribution
from collections import Counter
dist = Counter(r["remarkable_trigger"] for r in results)
print(f"\nTrigger distribution:")
for t, c in dist.most_common():
    print(f"  {t}: {c}")

# Show examples per trigger
print(f"\n{'='*60}")
for trigger in ["unexpected_combination", "extreme_degree", "rule_broken", "impossible_result", "stupid_simplicity"]:
    matches = [r for r in results if r["remarkable_trigger"] == trigger]
    print(f"\n{trigger.upper()} ({len(matches)}):")
    for r in matches[:3]:
        print(f"  {r['name']}: {r['remarkable_behavior']}")
