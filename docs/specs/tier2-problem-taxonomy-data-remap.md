# Tier 2: Problem Taxonomy v3 — Data Remapping Spec

## Context

Taxonomy v3 is live in code and edge functions. But the reference data files still use old v2 IDs. The legacy map handles this at runtime, but the 6 new categories (minds_hurting, money_stress, lonely_disconnected, teams_leaders_broken, people_treated_unfairly, feeling_lost) have zero pre-existing data. This spec describes how to remap.

## ID Changes

**Kept:** kids_deserved_better, pain_not_believed, feeling_stupid, work_treated_nothing, work_hollows, world_losing
**Removed → New:**
- voice_taken → minds_hurting
- life_not_yours → people_treated_unfairly
- locked_out → people_treated_unfairly
- left_behind → lonely_disconnected
- forgot_what_for → feeling_lost
- stopped_wondering → feeling_lost

**Brand new (no existing data):** minds_hurting, money_stress, lonely_disconnected, teams_leaders_broken, people_treated_unfairly, feeling_lost

## Files to Remap

### 1. `public/data/problemTagsReassigned.json` (597 tags)

**Structure:** Each tag has `{ person, source, problem, confidence, evidence, category }`.
- `category` is the problem segment ID to update.

**Approach:**
1. Tags with kept IDs (kids_deserved_better, pain_not_believed, feeling_stupid, work_treated_nothing, work_hollows, world_losing) — keep as-is.
2. Tags with removed IDs — reclassify using the tag's `problem` text field against the new 12 categories. Don't blindly follow the legacy map (e.g., a `locked_out` tag about "can't afford therapy" should go to `money_stress`, not just `people_treated_unfairly`).
3. Some tags may now fit brand-new categories better than their legacy fallback. E.g., a `forgot_what_for` tag about "anxiety eating you alive" → `minds_hurting`, not `feeling_lost`.
4. Use Claude Haiku to batch-classify: send each tag's `problem` + `evidence` text, ask for the best-fit new category ID.

**Script outline:**
```js
// For each tag where category is in removed set:
//   Send to Claude: "Given this problem description, which of these 12 categories fits best?"
//   Update category field
//   Also scan kept-category tags — some may fit new categories better
```

**Validation:** After remap, count distribution. Each of the 12 categories should have >10 tags. Flag any category with <10 for manual review.

### 2. `public/data/careerModels.json` (299 profiles)

**Structure:** Each profile has `{ name, source, domain, primaryProblem, primarySkills, ... }`.
- `primaryProblem` is the problem segment ID to update.

**Approach:**
1. Profiles with kept IDs — review but likely keep.
2. Profiles with removed IDs — reclassify using `domain` + `name` + any other context fields.
3. Same batch classification approach as tags.

**Validation:** Each of the 12 categories should have >5 profiles. The new categories (especially money_stress, teams_leaders_broken, lonely_disconnected) may need additional profiles sourced if the existing 299 don't cover them.

### 3. Gap-filling JSON files (4 files)

| File | Records | Action |
|------|---------|--------|
| `gapFillingProblemTags.json` | Tags for underrepresented categories | Remap IDs, then check if new categories need more |
| `gapFillingCareerModels.json` | Career models for gaps | Remap primaryProblem |
| `gapFillingProfiles.json` | Additional profiles | Remap primaryProblem |
| `gapFillingPlaySkills.json` | Skill data | Check if problem refs exist |

### 4. `public/data/problemTaxonomyV2.json` — DELETE

No longer imported. Dead code as of commit `2e0f07f`.

## Execution Plan

**Phase A — Automated reclassification (scriptable):**
1. Write a Node script that reads each JSON file
2. For each record with a removed or ambiguous category, call Claude Haiku via Supabase edge function or direct API
3. Write results back to JSON
4. Commit

**Phase B — Validation:**
1. Print category distribution for each file
2. Flag categories with <10 tags or <5 profiles
3. Manual review of flagged items

**Phase C — New data generation (if needed):**
If money_stress, teams_leaders_broken, or lonely_disconnected have thin coverage, generate new tags/profiles for those categories using the same format as existing entries.

## Not in scope
- DB migration of existing user data (handled by legacy map at runtime)
- Supabase `nikigai_clusters.problem_tags` column values (edge functions now output new IDs; old data resolves via legacy map)
