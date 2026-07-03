# Feature Brief: Problem Taxonomy v2 — "What breaks your heart enough to work on it?"

Date: 2026-04-12
Status: Brief written, not started
Depends on: PlaySkill Taxonomy v2 (complete)

## What it is

Overhaul the 12 PROBLEM_SEGMENTS in wheelTaxonomy.js from abstract UN-Development-Goal-style categories to felt, recognition-ready problem categories with placemakes, using the same method that produced the 10-category playSkill taxonomy.

Current problems taxonomy: physical_vitality, mental_wellbeing, personal_mastery, intimate_bonds, service_care, creative_expression, local_impact, cultural_movements, economic_freedom, social_justice, planetary_health, human_progress.

These read like a policy document. A burnt-out person scrolling "what problem do you care about?" needs: "Sitting with someone who can't get out of bed" not "Mental wellbeing."

## Why it matters

The playSkill taxonomy answers "how do you play?" The problem taxonomy answers "what pulls you forward?" Together they form the user's identity: "I'm a storytelling-coach who cares about silenced voices." That's a business. That's a life direction. That's the product FindMyFlow sells.

Without a felt problem taxonomy, the skills wheel has no purpose. Skills without a problem are hobbies. Skills aimed at a problem are a calling.

## Method (same pipeline as playSkill v2, adapted for problems)

### Phase 1: Tag 275 people with problems from existing narratives

Read the 766 non-founder narratives + 75 founder stageStories and tag each person with 1-3 problems they spent their life working on.

Evidence standard: the narrative must show the person WORKING ON or MOTIVATED BY the problem. Not "they lived during a time of inequality" but "they spent 27 years arguing that forest clearing and women's disempowerment were the same problem" (Maathai).

**Known challenge:** ~23% of the corpus (mostly founders) has weak problem signals. Their stageStories describe business strategy, not felt human problems. Options:
- Infer the underlying human problem (Dell's "eliminate middlemen" = "people pay too much for things they need")
- Do a supplementary research pass for the thin-signal founders
- Tag conservatively (2-3 tags instead of 4-6) and note the gap

### Phase 2: Cluster problems bottom-up

Same method as playSkill clustering: read all problem tags without respecting current 12 categories, find natural fault lines, identify 8-12 felt-problem clusters.

Preliminary clusters from the 30-narrative scan:

| Felt problem | Example people | Current closest category |
|---|---|---|
| Silencing (people whose voice was taken) | Angelou, Darwish, Achebe, Tempest, Lamarr | None clean |
| Displacement (torn from where you belong) | Tubman, Darwish, Gandhi, Makeba | social_justice (too abstract) |
| Systems that crush people | Malcolm X, Schultz's dad, Fowler | social_justice + economic_freedom (split) |
| Disconnection (can't feel whole) | Bohm, Rumi, Tempest, Campbell | mental_wellbeing (too clinical) |
| The planet breaking | Gore, Meadows, Maathai | planetary_health (works) |
| Bodies failing | Walker, Saunders, Apgar | physical_vitality (works but clinical) |
| Knowledge locked away | Khan, du Sautoy, Sullivan | personal_mastery (wrong bucket) |
| Dignity denied | Schultz, Carnegie, Feeney, Scott | economic_freedom (too narrow) |
| Lost meaning | Campbell, Rumi, Frankl | mental_wellbeing (wrong bucket) |
| Invisible stories | Miranda, Achebe, Angelou, Morrison | cultural_movements (closest) |

These are preliminary. The full corpus will surface more clusters and merge some of these.

### Phase 3: Name in felt voice + add placemakes

Same voice rules as playSkill v2:
- Plain English, no policy-speak
- Each category gets 3-5 placemakes with famous-person anchors
- "Looks like..." format
- Each placemake maps to a business opportunity ("turns into...")

Example for "Silencing":

**Silencing — people whose voice was taken**
*Turns into:* voice coaching, expressive arts therapy, advocacy platforms, storytelling workshops

1. *Sitting with someone learning to speak again after years of silence, like Maya Angelou's friend Bertha Flowers reading to her until the words came back after five mute years*
2. *Writing the declaration a stateless nation can carry in their pocket, like Mahmoud Darwish drafting the Palestinian Declaration of Independence in literary Arabic*
3. *Building a language supple enough to carry what English couldn't, like Chinua Achebe making an English that could hold Igbo proverbs without footnotes*

### Phase 4: Code migration

Same pattern as playSkill v2: update PROBLEM_SEGMENTS in wheelTaxonomy.js, cascade to wheelAlignment.js (PROBLEMS_TO_PERSONAS, SKILLS_TO_PROBLEMS), update keyword mappings in 4 consumer files, fix hue calculations, add legacy compat layer for old problem ids, deploy edge function.

Blast radius is identical to the skills migration (same files, parallel structure).

### Phase 5: Cross-wheel alignment update

After both Skills and Problems are on the new taxonomy, rewrite SKILLS_TO_PROBLEMS mapping (wheelAlignment.js) with the new id pairs. This is where the "coaching + silencing = voice therapy business" insight gets encoded.

## Data assets needed

| Asset | Status | Action |
|---|---|---|
| 275-person corpus narratives | Complete | Read through problem lens |
| Problem tags per person | Not started | Tag from narratives |
| Problem evidence corpus | Not started | Build from tags |
| Cluster analysis | Not started | Bottom-up clustering |
| New PROBLEM_SEGMENTS | Not started | Write from clusters |
| Placemakes with anchors | Not started | Write per category |
| Legacy compat for old problem ids | Not started | Same pattern as resolveSkillId |

## Estimated scope

Based on playSkill v2 timeline (which included method discovery and iteration):
- Problem tagging: parallel agents, same as founder/non-founder tagging passes
- Clustering + naming: one focused pass (method is proven)
- Code migration: same 15-file pattern, mechanical
- The full pass should be significantly faster than skills because the method, voice, and pipeline are calibrated

## What this does NOT include

- Changing the Persona wheel (third wheel, separate project)
- Building any new UI (the wheel already renders PROBLEM_SEGMENTS)
- Modifying CuriosityCompassFlow (it's skills-only currently)
- Any database migrations (legacy compat handles old data)

## Open questions

1. **How many problem categories?** The skills wheel landed on 10. Should problems match (10) or be different? The evidence will tell us.
2. **Should founder stageStories be reinterpreted or supplemented?** The 23% weak-signal founders need either inference or new research.
3. **How personal is too personal?** Rumi's "spiritual separation" and Agassi's "authenticity crisis" are real problems but may not generalize to a matching system. Where's the line?
4. **Does the problem need to be "solvable"?** Some problems in the corpus are existential (disconnection, lost meaning). These are real but the "turns into" business angle is less clear than "bodies failing → health coaching."
