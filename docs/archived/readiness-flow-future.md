# Readiness Assessment Flow — Future Feature

Status: Deferred from v1. Design complete, not built as standalone flow.
Date: 2026-06-15
Related: `docs/blow-up-brand-implementation-plan.md`, `docs/blow-up-thesis-consolidated.md`

## What it is

A separate flow (not part of the distillation) that assesses whether an experience creator is ready to certify/scale their method. Currently built as screens 8-10 of RemarkableFlow but being removed for v1 since most users won't be at this stage.

## The 3 Readiness Layers

| Layer | Question | Green | Amber | Red |
|-------|----------|-------|-------|-----|
| **Distilled** | Can you compress to one sentence? | Clear one-liner | Short but exists | Can't compress |
| **Proven** | How many people have experienced it? | 50+ | 10-50 | <10 or none |
| **Ceiling** | Is your format the bottleneck? | Reach or credibility ceiling | — | Not at a ceiling yet |

### Ceiling Types
- **Reach ceiling** (70% of creators): "My method is relevant to more people than my current format serves"
- **Credibility ceiling** (22%): "My method works but my current format can't prove it"

### Not-Ready Guidance (threaded with 3% chain)
- Layer 1 not ready: "Your method needs more compression. Try the distillation questions again."
- Layer 2 not ready: "You need proof. Run 5 experiences. Capture one 3% improvement after each."
- Layer 3 not ready: "Keep filling the room you're in. Run the 3% chain. Part 2 unlocks when your format becomes the bottleneck."

## Data
- Table: `blow_up_readiness` (already deployed)
- Fields: proof_count, proof_evidence, previous_experience, ceiling_type, layer1/2/3_status, all_ready, matched_founder_used, experience_count_at_time, remarkable_angle_id

## Screens (removed from RemarkableFlow, to be rebuilt as standalone)

### Screen 1: Proof
- "Have you run this? How many people?"
- Pre-fill with experience count from app data
- Options: Not yet / 1-10 / 10-50 / 50+
- Conditional: "What happened to them?" (if >0)
- "Have you done this before, even in a different context?"

### Screen 2: Ceiling
- "Which sounds most like where you are?"
- Reach ceiling / Credibility ceiling / Not at a ceiling yet

### Screen 3: Readiness Map
- Visual: 3 layers with green/amber/red dots
- DNA match mirror card
- Ready card ("Time to change the format") or Not-ready card (3% chain guidance)

## When to Build
When the user base has enough creators who have completed distillation AND run multiple experiences. The readiness flow unlocks AFTER distillation, not during it.

## Connection to Part 2
If readiness is "all green", the CTA links to the Part 2 vehicle selection flow (not yet built). The ceiling type (reach vs credibility) informs which vehicle is recommended.
