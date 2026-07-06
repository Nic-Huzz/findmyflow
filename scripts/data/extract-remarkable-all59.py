"""
Analyze all 59 experience creators for the 5 remarkable triggers.
Uses existing data (career models, growth strategies) + Opus judgment.
Batch the 39 not yet analyzed.
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

# Already analyzed in detail
ALREADY_DONE = {
    "Brené Brown", "Wim Hof", "Tony Robbins", "Phil Jackson", "John Gottman",
    "Marie Forleo", "James Clear", "Gabor Mate", "Lin-Manuel Miranda",
    "Esther Perel", "Adriene Mishler", "Glennon Doyle", "Simon Sinek",
    "Dave Ramsey", "Myles Horton", "Priya Parker", "Holly Whitaker",
    "Tenzin Palmo", "Elizabeth Gilbert", "Jay Shetty"
}

remaining = sorted(ec_names - ALREADY_DONE)
print(f"Analyzing {len(remaining)} remaining creators...")

blocks = []
for name in remaining:
    cm = cm_map.get(name, {})
    career = cm.get("careerModel", {})
    gs = growth_data["creators"].get(name, {})
    blocks.append(f"""### {name}
- One-liner: {cm.get('oneLiner', '')}
- Trajectory: {career.get('trajectory', '')}
- Key decision: {career.get('keyDecision', '')}
- Early growth: {gs.get('early_growth', '')}
- Scaling move: {gs.get('scaling_move', '')}""")

prompt = f"""You are analyzing {len(remaining)} experience creators for 5 remarkable triggers.

## THE 5 TRIGGERS

1. **rule_broken**: They challenged a cultural standard or norm in their field. Not just did something different. Changed what's ACCEPTABLE or EXPECTED. The rule break creates a tribe of people who say "I believe this too."

   THREE PATTERNS of rule breaking:
   - **additive**: "I do something nobody else does" (e.g., Wim Hof adding ice baths to wellness, Tony Robbins adding fire walking to therapy)
   - **subtractive**: "I refuse to do something everyone assumes is required" (e.g., Adriene Mishler never correcting yoga form, Myles Horton refusing to teach and letting students teach each other)
   - **reframing**: "I ask a question that makes the old rule look absurd" (e.g., Gabor Mate: "Why the pain, not why the addiction?", Holly Whitaker: "Why is a 1935 programme still the only option?")

2. **unexpected_combination**: Two domains, methods, or identities brought together that the field hasn't seen combined. Sometimes the combination reveals the rule break, sometimes vice versa.

3. **extreme_action**: A specific visible behavior so far beyond normal it becomes the thing people talk about. Can be extreme in INTENSITY (Wim Hof's ice stunts), in CONTEXT (Phil Jackson meditating with NBA players), in RISK (Glennon Doyle coming out to a Christian audience), or in DURATION (Joseph Campbell reading in a shack for 5 years). Note: extreme COMMITMENT (showing up consistently for years) is the trust axis, not this trigger. Extreme action is about a specific VISIBLE behavior that makes people say "wait, what?"

4. **stupid_simplicity**: A conclusion or method so simple it feels insulting, arrived at through years of depth. The kind of sentence someone hears and says "that can't be right... but it is."

5. **impossible_result**: Evidence (data, scale, outcome) that defies what the field believed was possible.

## ALSO ASSESS

For each creator:
- **extreme_action_rule_connection**: How does the extreme action relate to the rule break?
  - "inseparable" = the practice IS the norm violation (every repetition breaks the rule)
  - "same_moment" = one event/project is both audacious and norm-violating
  - "evidence" = the extreme action proves the rule wrong through results
  - "sequential" = extreme experience happened first, rule break emerged later
  - "separate" = rule break exists without extreme action
  - "none" = no clear extreme action

## FOR EACH CREATOR

Rate each trigger YES / PARTIAL / NO with:
- The specific thing they did (1 sentence, written as dinner party gossip)
- The rule-breaking pattern if applicable (additive / subtractive / reframing)
- Confidence (0-100)

## RULES
- Do NOT use em dashes, semicolons, or double hyphens
- Be honest about confidence. If you're guessing, say 50%.
- "PARTIAL" means: there's something there but it's a stretch or the evidence is thin
- The dinner party sentence should make someone say "wait, what?"

## THE {len(remaining)} CREATORS

{chr(10).join(blocks)}

## OUTPUT FORMAT

Return ONLY valid JSON as an array:
[
  {{
    "name": "Person Name",
    "rule_broken": {{
      "present": "yes" | "partial" | "no",
      "evidence": "1 sentence: the specific rule they broke",
      "pattern": "additive" | "subtractive" | "reframing" | null,
      "confidence": 0-100
    }},
    "unexpected_combination": {{
      "present": "yes" | "partial" | "no",
      "evidence": "1 sentence: the two things combined",
      "confidence": 0-100
    }},
    "extreme_action": {{
      "present": "yes" | "partial" | "no",
      "evidence": "1 sentence: the specific extreme behavior",
      "confidence": 0-100
    }},
    "stupid_simplicity": {{
      "present": "yes" | "partial" | "no",
      "evidence": "1 sentence: the devastatingly simple conclusion",
      "confidence": 0-100
    }},
    "impossible_result": {{
      "present": "yes" | "partial" | "no",
      "evidence": "1 sentence: the result that defies belief",
      "confidence": 0-100
    }},
    "extreme_action_rule_connection": "inseparable" | "same_moment" | "evidence" | "sequential" | "separate" | "none",
    "remarkable_headline": "The dinner party sentence about this person"
  }},
  ...
]"""

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

print("Calling Claude Opus with streaming...")
start = time.time()

text = ""
with client.messages.stream(
    model="claude-opus-4-20250514",
    max_tokens=20000,
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
    with open(os.path.join(BASE, "scripts/remarkable-all59-raw.txt"), "w") as f:
        f.write(text)
    print("Raw response saved to scripts/remarkable-all59-raw.txt")
    sys.exit(1)

# Save results
out_path = os.path.join(BASE, "public/data/experienceCreatorRemarkableAnalysis.json")
with open(out_path, "w") as f:
    json.dump({
        "meta": {
            "generated": time.strftime("%Y-%m-%d"),
            "model": "claude-opus-4-20250514",
            "count": len(results),
            "note": "39 remaining creators. 20 already analyzed manually in docs/remarkable-triggers-detailed.md"
        },
        "creators": {r["name"]: r for r in results}
    }, f, indent=2)

print(f"\nSaved {len(results)} analyses to {out_path}")

# Summary stats
from collections import Counter
trigger_counts = {t: Counter() for t in ["rule_broken", "unexpected_combination", "extreme_action", "stupid_simplicity", "impossible_result"]}
rule_patterns = Counter()
connections = Counter()

for r in results:
    for trigger in trigger_counts:
        trigger_counts[trigger][r[trigger]["present"]] += 1
    if r["rule_broken"]["present"] == "yes" and r["rule_broken"].get("pattern"):
        rule_patterns[r["rule_broken"]["pattern"]] += 1
    connections[r.get("extreme_action_rule_connection", "none")] += 1

print("\n" + "="*60)
print("TRIGGER PRESENCE (39 creators):")
for trigger, counts in trigger_counts.items():
    print(f"  {trigger}: yes={counts.get('yes',0)} partial={counts.get('partial',0)} no={counts.get('no',0)}")

print(f"\nRULE BREAKING PATTERNS:")
for pattern, count in rule_patterns.most_common():
    print(f"  {pattern}: {count}")

print(f"\nEXTREME ACTION ↔ RULE BREAK CONNECTION:")
for conn, count in connections.most_common():
    print(f"  {conn}: {count}")

# Show a few examples
print("\n" + "="*60)
print("SAMPLE ENTRIES:")
for r in results[:6]:
    name = r["name"]
    rb = r["rule_broken"]
    headline = r.get("remarkable_headline", "")
    print(f"\n{name} (rule: {rb['present']}/{rb.get('pattern','?')}, connection: {r.get('extreme_action_rule_connection','?')})")
    print(f"  Headline: {headline}")
    print(f"  Rule: {rb.get('evidence','')}")
