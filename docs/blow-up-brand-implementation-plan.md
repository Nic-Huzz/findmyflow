# Blow Up Your Brand: Implementation Plan

Status: Final — ready to build
Date: 2026-06-05
Related: `docs/blow-up-engine-nuances.md`, `docs/experience-creator-research-100.md`
Obsidian: `Frameworks/Refinement Phase - What Happens Before the Blow-Up.md`, `Frameworks/Blow-Up Recipes - Category, Content, Portable.md`, `Frameworks/3 Percent Chain - Success System.md`

---

## Context

### What the research found (129 creator profiles)

Every creator who sustained their blow-up went through 5 ingredients in order:

1. **Notice the gap** — "I see something others don't"
2. **Find the audience** — "These people need this"
3. **Distil the method** — One sentence. Others can teach it. Works without your personality.
4. **Hit a ceiling** — Reach ceiling (70%): method outgrows format. Credibility ceiling (22%): method works but format can't prove it.
5. **Change the format** — The blow-up moment. Wisdom stays the same. Vehicle changes.

Category creators (Radha Agrawal, Larry Harvey, Dawnbreak) appear to skip ingredients 2-3, but they actually imported them from previous ventures. No creator skips the chain. All 5 ingredients, always.

**Part 1 covers ingredients 1-4.** Part 2 (separate agent/flow) covers ingredient 5.

### The 3 Dimensions (for sustaining, not just blowing up)

| Dimension | What it means |
|-----------|--------------|
| **Create** | Made something new. A new category of experience. |
| **Capture** | Got the work seen. Content, social, podcast, press. |
| **Portable** | Method works without them. Book, framework, certification. |

Not all 3 are needed for the blow-up moment. But all 3 are needed to sustain it. The peaked/stalled data (32 profiles) proves: missing Portable = fragile, missing Create = commoditizable, missing Capture = invisible, missing ethics = catastrophic regardless.

Bridge is an accelerator (happens TO you when you're ready), not a dimension to build.

### DNA match role

The DNA match (5D Euclidean distance on workRhythm, fuelType, orientation, knowledgeStyle, scaleApproach) shows someone who WORKS like the user. Not someone in their industry. Not a prescription for which dimension to build first. DNA does NOT predict blow-up vehicle (tested, no correlation).

The mirror value: "Here's someone who operates like you. Here's how they went through the 5 ingredients."

---

## Part 1: Readiness Diagnostic

### Architecture: 3 Layers mapping to Ingredients 1-4

| Layer | Ingredients | What it answers | Gate |
|-------|------------|----------------|------|
| **Distillation** | 1 (notice gap) + 3 (distil method) | "Is your method specific enough?" | Can you compress to one sentence? |
| **Proof** | 2 (find audience) | "Does it work on real people?" | Have you run this? What happened? |
| **Ceiling** | 4 (hit a ceiling) | "Is your format the bottleneck?" | Reach ceiling / credibility ceiling / not yet |

### UX: Show full model, gate the handoff

Everyone sees all 3 layers and where they stand. The Part 2 handoff only unlocks when all 3 are ready. Failed gates get specific "not ready" guidance with the 3% chain as the operational mechanism:
- Layer 1 not ready → "Your method needs more compression. Try the distillation questions again."
- Layer 2 not ready → "You need proof. Run 5 experiences and capture one 3% improvement after each. Come back with stories."
- Layer 3 not ready → "You're not at a ceiling yet. Keep filling the room you're in. Run the 3% chain after every experience. Part 2 unlocks when your format becomes the bottleneck."

---

### Layer 1: Distillation (Category Pirates-aligned)

Resequence the existing RemarkableFlow diagnostic. Lead with Two Worlds (combination first, not problem first).

**Screen flow:**

1. **Education: The 3-Layer Model**
   - Replace current Trust/Attention/Triggers education screens
   - "We studied 129 experience creators. Every one who sustained had 3 ingredients. Every one who peaked was missing at least one."
   - Show 3 layers visually
   - 1-2 creator proof points from DNA match or selected creators
   - "Let's see where you are."

2. **Two Worlds** (CP Q1)
   - "What two worlds do you live in?"
   - Show user's play-skills from `nikigai_clusters` as prompts
   - "What would surprise people about your background relative to what you do now?"
   - This surfaces ingredient 1 (notice the gap) through the intersection

3. **Assumption to Remove** (CP Q2)
   - "What does everyone in your space assume is REQUIRED?"
   - Free text
   - This is the subtractive frame: what to REMOVE, not what to add

4. **What's Left** (CP Q3)
   - "Remove that assumption. What's left? How do YOU solve it?"
   - Show the user's selected problem from their Life Map data as context
   - Free text

5. **Compression Gate** (CP Q4)
   - "Describe your first event in one sentence: [number] people [doing what] [where] [when]"
   - This tests distillation. If they can compress → Layer 1 passes
   - Show DNA match's one-liner as example (from `oneLiner` field)

6. **AI Synthesis**
   - Generate: rule statement, remarkable bio, tribe statement (same as current)
   - Inputs are better due to resequenced questions
   - Save to `remarkable_angles` table

### Layer 2: Proof (ask directly)

7. **Proof Assessment**
   - "Have you run this? How many people have experienced your method?"
   - Options: Not yet / 1-10 people / 10-50 / 50+
   - "What happened to them? What changed?"
   - Free text for evidence
   - "Have you done something like this before, even in a different context?" (catches imported refinement from previous ventures)

### Layer 3: Ceiling (diagnosis)

8. **Ceiling Assessment**
   - "Which sounds more like where you are?"
   - Scenario A (Reach ceiling): "My method works. People love it. But I can only reach [X] people in my current format. It's relevant to way more."
   - Scenario B (Credibility ceiling): "My method works. But people who haven't experienced it don't believe me yet. I need proof that scales."
   - Scenario C (Not at a ceiling): "I'm still filling the room I'm in. My format isn't the bottleneck yet."

### The Reveal

9. **Readiness Map**
   - Visual: 3 layers shown as a vertical roadmap
   - Each layer: green (ready) / amber (in progress) / red (not yet)
   - DNA match's journey overlaid: "Your match [Creator] noticed the gap at [age/year], found their audience through [method], distilled to '[one-liner]', then hit a [reach/credibility] ceiling after [X] years."
   - If all green → "You're ready. Let's pick your vehicle." CTA to Part 2.
   - If not ready → Explainer slide per failed layer with specific 3% chain guidance
   - Save assessment to `blow_up_dimensions` table

---

## Files to Create

1. `supabase/migrations/YYYYMMDD_blow_up_dimensions.sql`

```sql
create table if not exists blow_up_dimensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  -- Layer 1: Distillation
  two_worlds text,
  assumption_to_remove text,
  whats_left text,
  one_sentence_event text,
  -- Layer 2: Proof
  proof_count text check (proof_count in ('not_yet', '1_10', '10_50', '50_plus')),
  proof_evidence text,
  previous_experience text,
  -- Layer 3: Ceiling
  ceiling_type text check (ceiling_type in ('reach', 'credibility', 'not_yet')),
  -- Readiness
  layer1_ready boolean default false,
  layer2_ready boolean default false,
  layer3_ready boolean default false,
  all_ready boolean default false,
  -- Meta
  matched_founder_used text,
  created_at timestamptz default now()
);

alter table blow_up_dimensions enable row level security;
create policy "Users own their dimension results" on blow_up_dimensions
  for all using (auth.uid() = user_id);
create index idx_blow_up_dimensions_user on blow_up_dimensions(user_id);
```

## Files to Modify

2. **`src/flows/RemarkableFlow.jsx`** — Major rewrite:
   - Replace education screens (Trust/Attention/Triggers → 3-Layer Model explainer)
   - Resequence diagnostic: Two Worlds → Assumption → What's Left → Compression Gate
   - Add Layer 2 (Proof) and Layer 3 (Ceiling) screens after AI synthesis
   - Add Readiness Map reveal screen
   - Add "not ready" explainer slides with 3% chain guidance
   - Remove EXTREME_ACTION step (moves to Part 2)
   - Remove dead TAGLINE step
   - Keep AI synthesis (rule statement, bio, tribe) but with resequenced inputs

3. **`src/flows/RemarkableFlow.css`** — New styles for:
   - 3-layer model visualization
   - Readiness map (green/amber/red states)
   - DNA mirror cards per layer
   - "Not ready" explainer slides

4. **`src/components/pipeline/PipelineNodeDetail.jsx`** (line 17-18) — Update `blow_up_brand` module description from "Find your remarkable angle" to "Readiness diagnostic"

5. **`src/hooks/useExperiencePipeline.js`** (line 19) — Update `blow_up_brand` check from `!!data.remarkableAngle` to `!!data.blowUpDimensions` (checks `blow_up_dimensions` table)

6. **`src/AppRouter.jsx`** — No route change (still `/create/remarkable`)

7. **`public/data/experienceCreatorDNA.json`** — Add `dimensions` + `bridgeAmplified` to all 32 profiles:
   ```json
   "dimensions": {
     "create": { "strength": "strong|starting|not_yet", "evidence": "..." },
     "capture": { "strength": "strong|starting|not_yet", "evidence": "..." },
     "portable": { "strength": "strong|starting|not_yet", "evidence": "..." }
   },
   "bridgeAmplified": { "flag": true|false, "bridge": "..." }
   ```

---

## Data Prep (before building screens)

Derive `dimensions` + `bridgeAmplified` for all 32 DNA profiles from existing fields (`blowUpMoment`, `blowUpPatterns`, `experienceEvolution`, `blowUpContext`, `bio`). This is a derivation task, not a research task. ~45 min.

Also update meta section with corrected engine data and dimension model explanation.

---

## Build Sequence

### Phase 1: Data
1. Derive + add `dimensions` + `bridgeAmplified` to 32 DNA profiles
2. Update meta section
3. Create `blow_up_dimensions` migration

### Phase 2: Rewrite RemarkableFlow
4. Replace education screens with 3-Layer Model explainer
5. Resequence diagnostic (Two Worlds → Assumption → What's Left → Compression Gate)
6. Keep AI synthesis with resequenced inputs
7. Add Layer 2 (Proof) and Layer 3 (Ceiling) screens
8. Add Readiness Map reveal
9. Add "not ready" explainer slides (thread 3% chain)
10. Remove EXTREME_ACTION and dead TAGLINE steps
11. Update CSS

### Phase 3: Integration
12. Update pipeline module check in `useExperiencePipeline.js`
13. Update module description in `PipelineNodeDetail.jsx`
14. Wire save to `blow_up_dimensions` table
15. Add Part 2 CTA (gated on `all_ready = true`)

---

## Verification

1. Walk through full flow: education → Two Worlds → Assumption → What's Left → Compression → AI synthesis → Proof → Ceiling → Readiness Map
2. Test "all ready" path: verify Part 2 CTA appears
3. Test "not ready" paths: verify each layer's explainer slide with 3% chain guidance
4. Verify DNA match mirror shows dimension evidence at each layer
5. Verify save to both `remarkable_angles` and `blow_up_dimensions` tables
6. Verify pipeline shows correct completion state
7. Test with no Life Map data (graceful fallback for new users)
8. Test retakeability (user can redo assessment as they progress)
