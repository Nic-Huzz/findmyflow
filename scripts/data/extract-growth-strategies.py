"""
Extract growth strategies from career model data using Claude Opus.
One-time batch script. Outputs to public/data/experienceCreatorGrowthStrategies.json

Sends all 59 experience creators' trajectory + career model fields to Opus,
asks it to extract: early_growth_strategy, scaling_move, current_model, first_step_advice
"""

import json
import os
import sys
import time

try:
    import anthropic
except ImportError:
    print("Installing anthropic SDK...")
    os.system(f"{sys.executable} -m pip install anthropic")
    import anthropic

# Load data
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(BASE, "public/data/careerModels.json")) as f:
    career_data = json.load(f)
with open(os.path.join(BASE, "public/data/experienceCreatorDNA.json")) as f:
    dna_data = json.load(f)
with open(os.path.join(BASE, "public/data/experienceCreatorOfferMap.json")) as f:
    offer_data = json.load(f)

# Get experience creator names
ec_names = set(p["name"] for p in dna_data["profiles"] if p.get("experienceType"))

# Build creator profiles for the prompt
creators = []
cm_map = {p["name"]: p for p in career_data["profiles"]}
for name in sorted(ec_names):
    cm = cm_map.get(name, {})
    career = cm.get("careerModel", {})
    offers = offer_data.get("creators", {}).get(name, {})
    if not career.get("trajectory"):
        continue
    creators.append({
        "name": name,
        "oneLiner": cm.get("oneLiner", ""),
        "trajectory": career.get("trajectory", ""),
        "keyDecision": career.get("keyDecision", ""),
        "scaleModel": career.get("scaleModel", ""),
        "lessonsForUser": career.get("lessonsForUser", ""),
        "primaryRevenue": career.get("primaryRevenue", ""),
        "revenueStreams": career.get("revenueStreams", []),
        "currentAttraction": offers.get("attraction", []),
        "currentCore": offers.get("core", []),
        "currentContinuity": offers.get("continuity", []),
        "experienceType": next(
            (p.get("experienceType") for p in dna_data["profiles"] if p["name"] == name),
            ""
        ),
    })

print(f"Processing {len(creators)} experience creators...")

# Build the prompt
creator_blocks = []
for c in creators:
    block = f"""### {c['name']}
- One-liner: {c['oneLiner']}
- Experience type: {c['experienceType']}
- Trajectory: {c['trajectory']}
- Key decision: {c['keyDecision']}
- Scale model: {c['scaleModel']}
- Lessons: {c['lessonsForUser']}
- Primary revenue: {c['primaryRevenue']}
- Revenue streams: {', '.join(c['revenueStreams']) if c['revenueStreams'] else 'N/A'}
- Current attraction: {', '.join(c['currentAttraction']) if c['currentAttraction'] else 'N/A'}
- Current core: {', '.join(c['currentCore']) if c['currentCore'] else 'N/A'}
- Current continuity: {', '.join(c['currentContinuity']) if c['currentContinuity'] else 'N/A'}"""
    creator_blocks.append(block)

prompt = f"""You are analyzing the career trajectories of 59 experience creators (workshop leaders, retreat hosts, performers, facilitators, authors, cohort builders).

For each person, I need you to distinguish between:
1. What they did EARLY to grow from zero (their growth strategy when nobody knew them)
2. The specific decision or move that scaled them from niche to broad
3. What they do NOW as an established brand (their current model)

This distinction matters because a new experience creator needs to know what worked at the START, not what someone does now with an existing audience. "Netflix special" is not a growth strategy. "15 years of academic research that produced one viral TED talk" is.

For each creator, extract:

- **early_growth**: 1-2 sentences. What they actually did when nobody knew them. The specific activities, not vague descriptions. If they were an academic, say "published research papers." If they ran free workshops, say "ran free workshops in community spaces." Be concrete about the EARLIEST thing that built their audience.

- **scaling_move**: 1 sentence. The specific inflection point or decision that took them from niche to visible. Often a book, a viral moment, a key partnership, or a format change.

- **current_model**: 1 sentence. What they do now at scale. This is their established brand activity.

- **growth_category**: Classify their early growth into exactly ONE of these categories:
  - "free_content" (blog, YouTube, podcast, social media, newsletter)
  - "free_events" (free workshops, talks, community gatherings, open classes)
  - "academic" (research, papers, university teaching, clinical work)
  - "grassroots" (community organizing, local activism, word of mouth)
  - "one_project" (one breakout project, book, album, film, talk that went viral)
  - "apprenticeship" (learned under a master, rose through an institution)
  - "clinical" (built through 1:1 client/patient work, then systematized)

- **first_step**: 1 sentence. What a new creator inspired by this person should do THIS MONTH. Must be achievable with zero audience and zero budget. No "get a Netflix deal." More like "run one free workshop for 8 people."

IMPORTANT:
- Do NOT use em dashes, semicolons, or double hyphens in any field
- Use commas and full stops instead
- Be specific and concrete, not inspirational
- The early_growth should be what they did BEFORE anyone knew their name

Here are the 59 creators:

{chr(10).join(creator_blocks)}

Return ONLY valid JSON as an array:
[
  {{
    "name": "Person Name",
    "early_growth": "...",
    "scaling_move": "...",
    "current_model": "...",
    "growth_category": "...",
    "first_step": "..."
  }},
  ...
]"""

# Call Opus
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE, ".env.local"))

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

print("Calling Claude Opus with streaming (this may take 1-2 minutes)...")
start = time.time()

text = ""
with client.messages.stream(
    model="claude-opus-4-20250514",
    max_tokens=16000,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for chunk in stream.text_stream:
        text += chunk
        # Print progress dots
        if len(text) % 500 < len(chunk):
            print(".", end="", flush=True)

elapsed = time.time() - start
print(f"\nResponse received in {elapsed:.1f}s ({len(text)} chars)")
# Clean markdown fences if present
text = text.replace("```json", "").replace("```", "").strip()

try:
    results = json.loads(text)
except json.JSONDecodeError as e:
    print(f"JSON parse error: {e}")
    print("Raw response saved to scripts/growth-strategies-raw.txt")
    with open(os.path.join(BASE, "scripts/growth-strategies-raw.txt"), "w") as f:
        f.write(text)
    sys.exit(1)

# Validate
valid_categories = {"free_content", "free_events", "academic", "grassroots", "one_project", "apprenticeship", "clinical"}
for r in results:
    if r.get("growth_category") not in valid_categories:
        print(f"  WARNING: {r['name']} has invalid growth_category: {r.get('growth_category')}")

# Save
output = {
    "meta": {
        "generated": time.strftime("%Y-%m-%d"),
        "model": "claude-opus-4-20250514",
        "count": len(results),
    },
    "creators": {r["name"]: r for r in results},
}

out_path = os.path.join(BASE, "public/data/experienceCreatorGrowthStrategies.json")
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\nSaved {len(results)} growth strategies to {out_path}")

# Show a few examples
for name in ["Brené Brown", "Tony Robbins", "Wim Hof", "Marie Forleo", "Priya Parker"]:
    r = output["creators"].get(name)
    if r:
        print(f"\n{name}:")
        print(f"  Early growth: {r['early_growth']}")
        print(f"  Scaling move: {r['scaling_move']}")
        print(f"  Category: {r['growth_category']}")
        print(f"  First step: {r['first_step']}")
