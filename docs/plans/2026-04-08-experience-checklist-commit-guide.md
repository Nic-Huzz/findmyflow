# Experience Checklist v1 — Commit Guide

**Date:** 2026-04-08
**Status:** Code complete, migration applied to prod, ready to commit
**For:** future agent picking up this work to commit it
**Related plan:** `docs/plans/2026-04-07-experience-checklist-v1.md`

---

## Context

This session pivoted FindMyFlow's `/business` tab into the foundation of an Experience Creator OS. User zero is **Jock**, running a dance event in Bali on 2026-05-03. Phase 1 ships the pre-event checklist (marketing + organisation sections) against a real upcoming event so we get real-world validation inside 25 days.

The migration (`20260408000000_experience_checklist.sql`) has **already been pushed to production** via `SUPABASE_DB_PASSWORD=... npx supabase db push --linked`. Tables verified live, RLS verified blocking anon access. Nothing else needs to be run on the DB side.

Three earlier local-only migrations also got applied as a side effect of `db push` (they were sitting unpushed in the migrations folder):
- `20260403000000_fix_journey_level_default.sql`
- `20260404000000_challenge_intro_flag.sql`
- `20260404100000_milestone_columns.sql`

These are already-committed files — they don't need to be committed again, just noted.

## The two commits

Split the working tree into two clean commits so the history stays legible. Commit #1 is the feature; commit #2 is the bug pass.

---

### Commit 1 — `feat: experience checklist v1 (pre-event phase for /business)`

**Purpose:** Ship the pre-event checklist system as the first phase of the Experience Creator OS. Replaces the interest-capture landing at `/business` with a real catalog + create + detail flow. Legacy `BusinessPage` parked at `/business/app`.

**Files to stage:**

```
# New
supabase/migrations/20260408000000_experience_checklist.sql
src/lib/experienceChecklistTemplate.js
src/hooks/useExperienceData.js
src/pages/ExperienceCatalog.jsx
src/pages/ExperienceCatalog.css
src/pages/ExperienceCreate.jsx
src/pages/ExperienceCreate.css
src/pages/ExperienceDetail.jsx
src/pages/ExperienceDetail.css
docs/plans/2026-04-07-experience-checklist-v1.md
docs/plans/2026-04-08-experience-checklist-commit-guide.md

# Modified
src/AppRouter.jsx
src/components/BottomToolbar.jsx
```

**What's in each file:**

- **`supabase/migrations/20260408000000_experience_checklist.sql`** — creates `experiences` (name, date, status, `previous_experience_id`, `wahoo_note` / `scary_note` / `three_percent_note`, timestamps) and `experience_checklist_items` (phase, section, label, sort_order, is_custom, is_hidden, completed, completed_at, notes). Full RLS on both tables. Auto-update trigger on `experiences.updated_at`. Already applied to prod.

- **`src/lib/experienceChecklistTemplate.js`** — hardcoded seed template with 9 marketing + 12 organisation items (sharpened for live workshops: includes energy arc, recording decision, day-before reminder) plus 6 follow-up + 4 reflection items dormant until Phase 2. Exports `EXPERIENCE_CHECKLIST_TEMPLATE`, `SECTION_META`, `PHASE_META`, `buildChecklistRows(experienceId, userId)`.

- **`src/hooks/useExperienceData.js`** — three hooks:
  - `useExperienceList()` — for catalog
  - `useCreateExperience()` — creates experience + seeds checklist, rollback on seed failure
  - `useExperience(id)` — single experience with optimistic toggle, hide/unhide, add/delete custom items, update experience fields
  - Plus utilities: `parseLocalDate`, `formatExperienceDate`, `daysUntil`

- **`src/pages/ExperienceCatalog.jsx`** + `.css` — `/business` landing. Hero, "+ New Experience" button, previous 3% note card surfaced from most recent completed experience, upcoming list, past list, empty state.

- **`src/pages/ExperienceCreate.jsx`** + `.css` — `/business/experience/new`. Name + date form, countdown preview, optional previous 3% note banner, seeds checklist on submit.

- **`src/pages/ExperienceDetail.jsx`** + `.css` — `/business/experience/:id`. Header with countdown badge, Pre/Post phase tabs, section cards with animated SVG progress rings (purple→gold gradient stroke), checkboxes, hide/unhide skipped items toggle, add custom item inline, delete custom item. Post tab is a locked placeholder until Phase 2.

- **`src/AppRouter.jsx`** — adds three lazy imports (`ExperienceCatalog`, `ExperienceCreate`, `ExperienceDetail`) and three routes. `/business` now points at `ExperienceCatalog`. Legacy `BusinessPage` moved to `/business/app` for internal preview. Removed the short-lived `BusinessLanding` import from active use.

- **`src/components/BottomToolbar.jsx`** — "Business" nav item stays rightmost (already moved in an earlier commit this session — that commit is the previous `fix`/`feat` commit on main, NOT part of this one). This change adds a dedicated active-state branch so `Business` highlights on any `/business/*` path, not just the exact `/business` route.

- **`docs/plans/2026-04-07-experience-checklist-v1.md`** — the scoped plan document (data model, routes, seeded content, resolved decisions, build sequence).

- **`docs/plans/2026-04-08-experience-checklist-commit-guide.md`** — this file.

**Suggested commit message:**

```
feat: experience checklist v1 (pre-event phase for /business)

Pivots /business into the foundation of an Experience Creator OS. Phase 1
ships pre-event marketing + organisation checklists against real upcoming
events so creators can set each experience up to win.

Data model:
- experiences (name, date, status, previous_experience_id, wahoo/scary/3%
  reflection fields ready for Phase 2)
- experience_checklist_items (per-experience, seeded from template, with
  is_custom/is_hidden/completed flags)

Features:
- /business catalog with upcoming + past experiences and previous 3% note
  surfaced from the most recent completed experience
- /business/experience/new with name + date form, seeds the checklist from
  the template on submit
- /business/experience/:id with Pre/Post tabs, section cards, animated
  SVG progress rings, checkboxes, hide/unhide skipped items, add custom
  item inline, delete custom items
- 9-item marketing checklist + 12-item organisation checklist tuned for
  live workshops (energy arc, recording decision, day-before reminder)
- Post-event tab is a locked placeholder until Phase 2

Legacy BusinessPage is parked at /business/app for internal preview.
BottomToolbar highlights Business on any /business/* path.
```

---

### Commit 2 — `fix: scope catalog CSS, timezone-safe dates, correct lastReflection picker`

**Purpose:** Bug pass caught three issues that would have bitten Jock in production. All three are one-shot fixes, grouped because they're all correctness cleanups from the bug pass.

**Files to stage:**

```
src/pages/ExperienceCatalog.css     # scoped all selectors to .exp-catalog
src/pages/ExperienceCatalog.jsx     # use formatExperienceDate + correct past sort
src/pages/ExperienceDetail.jsx      # use formatExperienceDate instead of local
src/hooks/useExperienceData.js      # add parseLocalDate + formatExperienceDate utils, patch daysUntil
```

**The three fixes:**

1. **`lastReflection` picked the oldest past experience.** The list query orders by `experience_date ASC nullsFirst false`, so `past.find(e => e.three_percent_note)` returned the earliest historical event with a note rather than the most recent. Fixed by sorting `past` descending in the catalog before the find.

2. **Timezone shift on date parsing.** `new Date("2026-05-03")` parses as UTC midnight, which in timezones west of UTC renders as the day before via `toLocaleDateString`. For Jock in Bali (UTC+8) this was actually fine, but it's a footgun for any user in US/European timezones. Fixed by adding `parseLocalDate(dateStr)` in `useExperienceData.js` that parses YYYY-MM-DD as local-time Date components, and `formatExperienceDate(dateStr, opts)` that uses it. Both `ExperienceCatalog.jsx` and `ExperienceDetail.jsx` now use the shared util instead of their own `formatDate()` that called `new Date(dateStr)` directly. `daysUntil()` is also patched to use `parseLocalDate`.

3. **Unscoped CSS in `ExperienceCatalog.css` violated the project CSS scoping rule.** Classes like `.exp-badge`, `.exp-cta`, `.exp-card`, `.exp-section`, `.exp-spinner` etc. were defined without a parent prefix, which would bleed into any other page rendered alongside. Fixed by rewriting `ExperienceCatalog.css` with every selector scoped to `.exp-catalog`. `ExperienceCreate.css` and `ExperienceDetail.css` were already scoped correctly. The spinner keyframes were also renamed to `exp-catalog-spin` to avoid collision with `exp-spin-d` in detail.

**Verification after fixes:** production build passes clean. New chunks confirmed in `dist/assets`: `ExperienceCatalog-*.js`, `ExperienceCreate-*.js`, `ExperienceDetail-*.js`, `useExperienceData-*.js`.

**Suggested commit message:**

```
fix: scope catalog CSS, timezone-safe dates, correct lastReflection picker

Bug pass before Jock (user zero) starts using the experience checklist
for his Bali dance event on 2026-05-03.

- ExperienceCatalog.css: scope all selectors to .exp-catalog per project
  CSS convention. Unscoped classes (exp-badge, exp-cta, exp-card,
  exp-section, exp-spinner) would have bled into other pages. Rename
  spinner keyframes to exp-catalog-spin to avoid collision with
  exp-spin-d in ExperienceDetail.
- useExperienceData: add parseLocalDate + formatExperienceDate that parse
  YYYY-MM-DD in local time instead of UTC, avoiding the day-before render
  in timezones west of UTC. Patch daysUntil to use it. Update
  ExperienceCatalog + ExperienceDetail to import the shared util.
- ExperienceCatalog: sort past experiences descending before picking
  lastReflection, so the 3% note surfaced at the top of the catalog is
  from the most recent completed experience, not the oldest.
```

---

## Sanity checks before committing

Run these to make sure nothing regressed since the code was written:

```bash
# 1. Build should pass clean
npm run build

# 2. Confirm the migration is already on prod (do NOT re-run db push)
# Expected: experiences and experience_checklist_items return HTTP 200
SERVICE_KEY=$(grep SERVICE_ROLE_KEY scripts/db-query.sh | head -1 | cut -d'"' -f2)
curl -s -o /dev/null -w "experiences: HTTP %{http_code}\n" \
  "https://qlwfcfypnoptsocdpxuv.supabase.co/rest/v1/experiences?limit=0" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
curl -s -o /dev/null -w "experience_checklist_items: HTTP %{http_code}\n" \
  "https://qlwfcfypnoptsocdpxuv.supabase.co/rest/v1/experience_checklist_items?limit=0" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"

# 3. Git status should show the two groups of files listed above
git status
```

## Files that should NOT be in either commit

- `.claude/agents/` — untracked at session start, not part of this work
- The three earlier migrations that got applied as a side effect of db push are already tracked in git from prior commits and have no modifications
- No other unrelated working tree changes

## Commit order

Commit 1 first, then commit 2. This keeps the feature landing as a clean unit with the bug pass as a follow-up, which is truthful to how it was built and easier to cherry-pick or revert if needed.

## After committing

Do NOT push to remote without explicit user confirmation. The user has not authorized a push.

Phase 2 (post-event tab + reflection + mark-complete) should land ~1 week before 2026-05-03. Phase 3 (attendee upload → crm_contacts + experience_attendees join table) should land right after the event. Both are described in `docs/plans/2026-04-07-experience-checklist-v1.md`.
