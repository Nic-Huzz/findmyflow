# Taxonomy V2 Handoff

Date: 2026-04-12
Status: Skills + Problems taxonomy both shipped. Personas wheel unchanged.

## What changed

### Skills Wheel: 12 → 10 categories
Old: clarifying, analyzing, strategizing, organizing, building, designing, creating, expressing, connecting, influencing, nurturing, synthesizing
New: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up

Field rename: `playSkills` → `placemakes` (array of strings on each segment)

### Problems Wheel: 12 → 12 categories (different categories)
Old: physical_vitality, mental_wellbeing, personal_mastery, intimate_bonds, service_care, creative_expression, local_impact, cultural_movements, economic_freedom, social_justice, planetary_health, human_progress
New: kids_deserved_better, voice_taken, pain_not_believed, world_losing, life_not_yours, feeling_stupid, locked_out, work_treated_nothing, left_behind, forgot_what_for, stopped_wondering, work_hollows

Field rename: `playSkills` → `placemakes` (new field on problem segments, was not present before)

### Personas Wheel: unchanged
Same 12 ids: seekers, builders, healers, teachers, connectors, achievers, explorers, visionaries, protectors, creators, nurturers, challengers

## Backwards compatibility

Legacy compat functions in `wheelTaxonomy.js`:

```js
// Skills
LEGACY_SKILL_ID_MAP    // old skill id → new skill id
resolveSkillId(id)     // resolves old or new → valid new id
findSkillSegment(id)   // finds segment, handles legacy ids

// Problems
LEGACY_PROBLEM_ID_MAP  // old problem id → new problem id
resolveProblemId(id)   // resolves old or new → valid new id
findProblemSegment(id) // finds segment, handles legacy ids
```

All `SKILLS_SEGMENTS.find()` calls replaced with `findSkillSegment()`.
All `PROBLEM_SEGMENTS.find()` calls replaced with `findProblemSegment()`.
Mapping table lookups (SKILLS_TO_PROBLEMS, etc.) resolve ids before lookup.

Existing user data in Supabase with old ids will render correctly. Users re-doing flows will overwrite with new ids.

## Files changed

### Source files
| File | What changed |
|---|---|
| `src/lib/wheelTaxonomy.js` | SKILLS_SEGMENTS (10 cats) + PROBLEM_SEGMENTS (12 cats) + compat layers |
| `src/lib/wheelAlignment.js` | SKILLS_TO_PROBLEMS, PROBLEMS_TO_PERSONAS, SKILLS_TO_PERSONAS rewritten + all find() calls use compat |
| `src/lib/skillProductMapping.js` | Full rewrite for 10 skill categories |
| `src/flows/CuriosityCompassFlow.jsx` | placemakes fallback + V2 JSON import for "Looks like..." examples |
| `src/flows/FlowFinderSkills.jsx` | Keyword-to-index dict + hue calc (i*36) |
| `src/flows/FlowFinderExplainer.jsx` | Hue calc |
| `src/flows/PlayListFinderFlow.jsx` | Keyword-to-id dict + hue calc + resolveSkillId |
| `src/flows/SelfTestFlow.jsx` | findSkillSegment |
| `src/flows/LetsPlayFlow.jsx` | findSkillSegment |
| `src/flows/OfferBuilderFlow.jsx` | findSkillSegment |
| `src/components/LetsPlayInput.jsx` | findSkillSegment |
| `src/pages/FlowReportCard.jsx` | Skills + problems keyword dicts + hue calc |
| `src/pages/LibraryOfAnswers.jsx` | Skills + problems keyword dicts + hue calc |
| `src/pages/WheelDemo.jsx` | Hue calc |
| `supabase/functions/classify-response/taxonomy.ts` | Skills + problems segments updated |

### Data files (all in public/data/)
| File | Contents |
|---|---|
| `playSkillTaxonomyV2.json` | 10 skill categories, 43 placemakes with anchor people + examples |
| `problemTaxonomyV2.json` | 12 problem categories, 53 placemakes with anchor people + examples |
| `founderPlaySkills.json` | 75 founders tagged with new skill category ids |
| `nonFounderPlaySkills.json` | 200 non-founders tagged with new skill category ids |
| `nonFounderProfiles.json` | 200 non-founder narrative profiles (verified) |
| `nonFounderCandidates.json` | 200-person curated candidate list |
| `problemTags.json` | 557 free-form problem tags across 275 people |
| `problemTagsReassigned.json` | 524 tags assigned to 12 problem categories |
| `problemTagsForClustering.json` | High+medium confidence subset for clustering |
| `taxonomyCrossWalk.json` | Old skill tags → new category mapping |
| `taxonomyEvidenceCorpus.json` | Full 1252-item evidence corpus |
| `taxonomyEvidenceCorpus_highOnly.json` | 712 high-confidence subset |
| `taxonomyRevisionProposal.json` | Phase 2 skills proposal (archived, superseded by V2) |

### Docs
| File | Contents |
|---|---|
| `docs/playskill-taxonomy-v2-plan.md` | Skills taxonomy implementation plan |
| `docs/feature-brief-problem-taxonomy-v2.md` | Problem taxonomy feature brief |
| `docs/feature-brief-people-matching.md` | People matching feature brief (not yet built) |
| `docs/founder-playskills-analysis.md` | Founder tagging analysis |
| `docs/non-founder-corpus-verification.md` | Verification audit (1.6% error rate) |
| `docs/taxonomy-revision-rationale.md` | Phase 2 rationale (archived) |
| `docs/problem-taxonomy-clustering.md` | Problem clustering analysis |

## Skills taxonomy: 10 categories

| id | Display name | Placemakes | Tagline |
|---|---|---|---|
| storytelling | Storytelling | 5 | Writing, narrative, making meaning through story |
| teaching | Teaching | 4 | Explaining, simplifying, making the complex click |
| coaching | Coaching | 4 | Growing people, mentoring, holding space |
| performing | Performing | 4 | Stage, speaking, presenting, being the show |
| creating | Creating | 4 | Inventing, art, making things that didn't exist |
| building | Building | 5 | Making with hands, prototyping, shipping, craft |
| designing | Designing | 3 | Aesthetics, taste, beauty, shaping how things feel |
| leading | Leading | 5 | Strategy, vision, game-design, organizing, running things |
| connecting | Connecting | 4 | Community, gathering, hosting, introducing, being glue |
| speaking_up | Speaking up | 5 | Truth-telling, activism, courage, standing for something |

## Problems taxonomy: 12 categories

| id | Display name | Placemakes | Tagline |
|---|---|---|---|
| kids_deserved_better | Kids who deserved better | 5 | Children dismissed, labelled, hit, or left to face the worst alone |
| voice_taken | The voice that got taken | 5 | People whose voice was taken, suppressed, or erased |
| pain_not_believed | Pain that nobody takes seriously | 4 | Physical suffering that nobody names, treats, or believes is real |
| world_losing | The world we're losing | 4 | Ecological destruction happening while most people look away |
| life_not_yours | A life that isn't yours to live | 4 | Systems of control that own, oppress, or decide your life for you |
| feeling_stupid | Feeling stupid when you're not | 5 | Knowledge wrapped in jargon or explained so badly you blame yourself |
| locked_out | Locked out of what you need | 4 | Education, healthcare, opportunity blocked by cost or gatekeeping |
| work_treated_nothing | Your work being treated as nothing | 5 | Creative vision being blocked, stolen, ignored, or dismissed |
| left_behind | Being left behind | 5 | People abandoned by systems, falling through cracks |
| forgot_what_for | Forgetting what it was all for | 4 | The search for purpose when the old answers stop working |
| stopped_wondering | People who stopped wondering | 4 | The damage done when people stop questioning |
| work_hollows | Work that hollows you out | 4 | Jobs that strip dignity, treat workers as disposable |

## What's NOT done yet

1. **People matching feature** — briefed at `docs/feature-brief-people-matching.md`, not built. Would show users "people who play like you" based on category overlap.
2. **Personas wheel** — unchanged. Could get the same treatment (bottom-up re-taxonomy) in a future pass.
3. **Database cleanup** — old category ids persist in Supabase. Compat layer handles them at runtime. Users re-doing flows will overwrite naturally.
4. **Partial data files** — `nonFounderPlaySkills_partA-D.json` and `nonFounderProfiles_tier1a-tier3.json` are build artifacts that should be cleaned up (not committed to git).

## Edge function

`classify-response` deployed at v17 with both new skills (10) and problems (12) taxonomies. Personas unchanged.

## How to verify

```bash
# Build passes
npm run build

# Skills segments count
grep -c 'placemakes' src/lib/wheelTaxonomy.js
# Should return 22 (10 skills + 12 problems)

# No old skill ids in active code
grep -r "clarifying\|analyzing\|strategizing\|organizing\|expressing\|influencing\|nurturing\|synthesizing" src/lib/wheelTaxonomy.js | grep -v LEGACY | grep -v "// Absorbed"
# Should return nothing (only in LEGACY_SKILL_ID_MAP)

# No old problem ids in active code
grep -r "physical_vitality\|mental_wellbeing\|personal_mastery\|intimate_bonds\|service_care\|creative_expression\|local_impact\|cultural_movements\|economic_freedom\|social_justice\|planetary_health\|human_progress" src/lib/wheelTaxonomy.js | grep -v LEGACY
# Should return nothing (only in LEGACY_PROBLEM_ID_MAP)
```
