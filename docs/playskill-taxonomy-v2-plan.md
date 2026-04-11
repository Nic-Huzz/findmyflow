# PlaySkill Taxonomy v2: Implementation Plan

Date: 2026-04-11
Status: In progress

## Decision

Replace the current 12-category x 5-skill abstract taxonomy with **10 plain-English role-skill categories**, each containing 6-8 concrete "Looks like..." placemakes anchored in real people from the 275-person corpus (75 founders + 200 non-founders).

## The 10 Categories

| # | Category | Tagline | Absorbs from old structure |
|---|---|---|---|
| 1 | **Storytelling** | Writing, narrative, making meaning through story | expressing (write in your voice, tell a story), synthesizing (make meaning), creating (fill a blank page) |
| 2 | **Teaching** | Explaining, simplifying, making the complex click | clarifying (all 5 skills), synthesizing (connect dots, framework) |
| 3 | **Coaching** | Growing people, mentoring, holding space | nurturing (all 5 skills), influencing (move someone from stuck) |
| 4 | **Performing** | Stage, speaking, presenting, being the show | expressing (perform/present, turn message into moment), influencing (rally, make a pitch) |
| 5 | **Creating** | Inventing, art, making things that didn't exist | creating (all 5 skills), parts of designing (taste, aesthetics) |
| 6 | **Building** | Making with hands, prototyping, shipping, craft | building (all 5 skills) |
| 7 | **Designing** | Aesthetics, taste, beauty, shaping how things feel | designing (shape, polish, craft, beautiful+usable) |
| 8 | **Leading** | Strategy, vision, game-design, organizing, running things | strategizing (all 5), organizing (all 5) |
| 9 | **Connecting** | Community, gathering, hosting, introducing, being glue | connecting (all 5 skills) |
| 10 | **Speaking up** | Truth-telling, activism, courage, standing for something | expressing (say the thing), influencing (body as argument, change minds) |

## Why 10

- Every word passes the "oh that's me" test for a burnt-out person scrolling the wheel
- Same words people use to describe their heroes: "she's an incredible storyteller and coach"
- 10 headers x 6-8 placemakes = 60-80 recognition surfaces (same area as current 60 strings, radically lower cognitive load)
- The placemakes carry the nuance; the category just needs to be a recognizable header

## Implementation Steps

### Step 1: Lock the 10 categories
**Status:** Done (this document)

Finalize category names, taglines, and absorption mapping. No code changes.

### Step 2: Prototype one category with placemakes
**Status:** Next

Pick one category (Storytelling recommended, richest evidence). Write 6-8 placemakes in the "Looks like..." voice, each naming a specific person and moment from the 275-person corpus.

Format per placemake:
> *Telling a hard truth through memoir, like Andre Agassi confessing meth use and hating tennis in Open, breaking every rule of athlete self-mythology.*

Review the prototype. If the voice and density feel right, proceed to Step 3. If not, iterate.

**Gate:** User approves the prototype before scaling.

### Step 3: Write all 10 categories with placemakes
**Status:** Blocked on Step 2

One pass across all 10 categories. 6-8 placemakes each, drawn from the 712 high-confidence evidence corpus. Voice-consistent with the approved prototype.

Output: `public/data/playSkillTaxonomyV2.json`

Schema:
```json
{
  "version": "2.0",
  "categories": [
    {
      "id": "storytelling",
      "displayName": "Storytelling",
      "tagline": "Writing, narrative, making meaning through story",
      "placemakes": [
        {
          "id": "storytelling_hard_truth_memoir",
          "text": "Telling a hard truth through memoir, like Andre Agassi confessing meth use and hating tennis in Open",
          "anchorPerson": "Andre Agassi",
          "anchorSource": "founder"
        }
      ]
    }
  ]
}
```

### Step 4: Build the cross-walk
**Status:** Blocked on Step 3

Automated mapping of 1252 existing tags (founderPlaySkills.json + nonFounderPlaySkills.json) into the new 10 categories. Python script using the absorption rules from the table above.

Output: `public/data/taxonomyCrossWalk.json` mapping every old (category, skill) pair to a new category + placemake.

Handles:
- Clean ports (old category maps 1:1 to new)
- Splits (old expressing splits across Storytelling, Performing, Speaking up)
- Absorptions (old influencing dissolves into Performing, Speaking up, Coaching)
- Edge cases flagged for manual review

### Step 5: Update wheelTaxonomy.js
**Status:** Blocked on Step 4

Replace SKILLS_SEGMENTS in `src/lib/wheelTaxonomy.js` with the new 10-category structure. Single commit.

Changes:
- 12 segments become 10
- Each segment's `playSkills` array becomes a `placemakes` array
- Category ids change (e.g. `clarifying` becomes `teaching`)
- Colors and icons updated to match new categories
- Any components reading SKILLS_SEGMENTS updated

Scope check: grep for all SKILLS_SEGMENTS consumers before editing.

### Step 6: Ship and watch
**Status:** Blocked on Step 5

Deploy. Watch user engagement with placemakes vs old abstract skill strings. Key metrics:
- Time spent on wheel (should decrease with faster recognition)
- Number of skills selected per user (should stay similar, 3-6)
- Completion rate of the wheel step (should increase)
- Qualitative: do users screenshot their results? (the "I feel seen" signal)

## Files involved

| File | Action |
|---|---|
| `src/lib/wheelTaxonomy.js` | Rewrite SKILLS_SEGMENTS (Step 5) |
| `public/data/playSkillTaxonomyV2.json` | New file (Step 3) |
| `public/data/taxonomyCrossWalk.json` | New file (Step 4) |
| `public/data/founderPlaySkills.json` | Reference only (cross-walk input) |
| `public/data/nonFounderPlaySkills.json` | Reference only (cross-walk input) |
| `public/data/nonFounderProfiles.json` | Reference only (placemake source) |
| `public/data/founderDnaFounders.json` | Reference only (placemake source) |

## Data assets produced during this project

| File | Description | Status |
|---|---|---|
| `public/data/founderPlaySkills.json` | 75 founders tagged with playSkills + confidence + anti-tags | Complete |
| `public/data/nonFounderCandidates.json` | 200-person curated candidate list | Complete |
| `public/data/nonFounderProfiles.json` | 200 non-founder narrative profiles (verified, 4 corrections applied) | Complete |
| `public/data/nonFounderPlaySkills.json` | 200 non-founders tagged with playSkills + confidence + anti-tags | Complete |
| `public/data/taxonomyEvidenceCorpus.json` | Full 1252-item evidence corpus | Complete |
| `public/data/taxonomyEvidenceCorpus_highOnly.json` | 712 high-confidence subset | Complete |
| `public/data/taxonomyRevisionProposal.json` | Phase 2 proposal (12-category revision, superseded by v2) | Complete (archived) |
| `docs/founder-playskills-analysis.md` | Founder tagging analysis | Complete |
| `docs/non-founder-corpus-verification.md` | Verification audit (1.6% error rate, PASS) | Complete |
| `docs/taxonomy-revision-rationale.md` | Phase 2 rationale (superseded by v2) | Complete (archived) |
| `docs/taxonomy-option-b-rationale.md` | Option B rationale (not written, analysis done in conversation) | Skipped |
