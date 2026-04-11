# Feature Brief: People Who Play Like You

Date: 2026-04-12
Status: Data complete, UI not started
Location: In-app feature (Play Profile dashboard), NOT part of /get-started onboarding

## What it is

After a user picks their playSkill categories and placemakes (via CuriosityCompassFlow or /get-started), show them 3-5 notable people from a 275-person pool who share those play patterns. This is the second identity-matching lens alongside the existing Founder DNA personality match.

**Lens 1 (existing):** "Which founder has your DNA?" Matched via 5 personality sliders (euclidean distance). Lives in Play Profile.
**Lens 2 (this feature):** "Who else played the way you want to play?" Matched via playSkill category overlap. Lives alongside Lens 1.

## Why it matters

- Users arrive burnt out and disconnected from what lights them up
- Picking categories is the "what" ("I light up when I'm coaching and storytelling")
- Seeing famous people who shared that pattern is the "permission" ("Fred Rogers was a coach-storyteller too, and look what he built")
- The famous person becomes a reference point the user can return to: "What would my Fred Rogers version of this look like?"

## Where it lives

**PlayProfileDashboard.jsx** as a new section below the existing DNA match.

Not in /get-started or CuriosityCompassFlow. Those are discovery flows (picking categories). This is an application feature (seeing results). Users need to have picked their categories first.

## Data assets (all complete)

| File | What it contains | Status |
|---|---|---|
| `public/data/founderPlaySkills.json` | 75 founders, 301 tags across 10 categories + confidence + anti-tags | Complete, re-tagged |
| `public/data/nonFounderPlaySkills.json` | 200 non-founders, 787 tags across 10 categories + confidence + anti-tags | Complete, re-tagged |
| `public/data/nonFounderProfiles.json` | 200 non-founder narrative profiles (bio, oneLiner, narratives) | Complete, verified |
| `public/data/founderDnaFounders.json` | 75 founder profiles (bio, oneLiner, businessBio, stageStories) | Pre-existing |
| `public/data/playSkillTaxonomyV2.json` | 10 categories, 43 placemakes with anchor people and examples | Complete |

## Matching logic

### Input
User's saved playSkill picks: 1-3 categories, 1-3 placemakes per category.

Stored in `nikigai_clusters` table with `source_flow = 'curiosity_compass_wheel'` (from CuriosityCompassFlow Steps 5-7).

### Algorithm
1. Read user's picked category ids (e.g. `['coaching', 'storytelling', 'performing']`)
2. Load both playSkills files (275 people total)
3. For each person, count how many of the user's picked categories appear in that person's tags
4. Rank by overlap count (descending), then by high-confidence tag count as tiebreaker
5. Return top 5

### Enhancements (optional, not for v1)
- Weight by confidence: high-confidence tags score 3, medium 2, low 1
- Placemake-level matching: if user picked "Holding someone through a hard moment" specifically, boost people tagged with evidence matching that placemake
- Anti-tag filtering: if a person has anti-tags in the user's picked categories, demote them
- Mix founders and non-founders: ensure at least 1 of each in top 5

### v1 scope
Category-level matching only. No confidence weighting. No anti-tag filtering. Simple overlap count. Show top 5 interleaved.

## What to show per person

**Card content:**
- Name
- One-liner (from founderDnaFounders.json or nonFounderProfiles.json)
- Matching categories (highlighted, e.g. "Coaching, Storytelling")
- One evidence quote from their tags that matches the user's picked category (the "proof" that this person played this way)

**Card design:**
- Follow the existing Play Profile card style (section cards with purple/gold accents)
- Each card tappable to expand and show more evidence quotes
- "Why this match" subtitle showing which categories overlap

## Example

User picked: Coaching, Storytelling, Speaking up

Results:
1. **Fred Rogers** — "Treated every child as a person worthy of a slow, unhurried reply." Matches: Coaching, Storytelling. Evidence: "Aired a full televised minute of silence so children could think about who loved them."

2. **Toni Morrison** — "Wrote the book only she could write, starting at 4am." Matches: Storytelling, Coaching. Evidence: "As Random House editor, commissioned Muhammad Ali, Angela Davis, Gayl Jones, building an entire generation of Black literature from behind a desk."

3. **Fannie Lou Hamer** — "Sick and tired of being sick and tired." Matches: Speaking up, Storytelling. Evidence: "Testified 'I question America' at the 1964 Democratic Convention so forcefully that Johnson tried to bump her off live TV."

4. **Audre Lorde** — "Refused the prosthesis and wrote The Cancer Journals." Matches: Speaking up, Storytelling. Evidence: "Argued the cosmetic performance of recovery was a form of silencing."

5. **Wangari Maathai** — "Argued for 27 years that ecology, feminism and democracy were the same fight." Matches: Speaking up, Coaching. Evidence: "Turned 7 trees into a national tree-nursery network run by rural women."

## Dependencies

| Dependency | Status |
|---|---|
| User has picked playSkill categories | Via CuriosityCompassFlow Steps 5-7 (built) |
| PlaySkills data re-tagged to 10 categories | Done |
| PlayProfileDashboard.jsx exists | Yes (existing component) |
| DNA matching still works alongside | Yes, independent systems |

## What this does NOT include

- Replacing or modifying the existing DNA match (Lens 1 stays as-is)
- Any changes to /get-started or CuriosityCompassFlow
- User-nominated people or dataset expansion
- Matching based on individual placemake strings (v1 is category-level only)
- Any database migrations

## Implementation estimate

- Matching utility function: ~50 lines (read data, count overlaps, rank, return top 5)
- PlayProfile section component: ~100 lines (card rendering, expand/collapse)
- Integration into PlayProfileDashboard: ~20 lines (import, read user picks, render section)
- Total: ~170 lines of new code, 0 files modified beyond PlayProfileDashboard
