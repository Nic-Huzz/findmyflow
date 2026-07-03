# Build Your App — Feature Reference

Hidden upsell flow under the `/create` portal. Guides experience creators through building and launching their own app using Claude Code + Supabase + Vercel.

Ported from the standalone BuildWithAI hackathon portal (archived at `zArchive/BuildwithAI`). Original Supabase project (`bomyrwtorhxxugakfsgo`) data exported to `docs/buildwithai-data-export.json` (40 profiles, 32 prework responses, 26 progress records, 3 feedback entries).

## Routes (hidden, no nav links)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/create/build-app` | `AppBuildDashboard` | Dashboard with prework card + 5 challenge cards |
| `/create/build-app/prework` | `AppBuildPrework` | 7-step product definition form |
| `/create/build-app/challenge/:number` | `AppBuildChallenge` | Individual challenge viewer |

All routes require AuthGate. Not wrapped in CreateGate (no Scope Map prerequisite).

## The Flow

**Prework (20-30 min)** — 7-step product definition:
1. Problem statement
2. Target user
3. Product description
4. Core features (3-5, name + description)
5. User flow (5-8 steps)
6. Design preferences (colors, style, font)
7. Out of scope

**5 Challenges:**
1. First Magic (20 min) — Visual prototype in Claude, design style picker, style guide
2. Foundation Build (75 min) — Spec sheet, scaffold project with Claude Code, connect Supabase
3. Test, Debug & Refine (60 min) — Structured testing loop, bug report templates
4. Polish & Deploy (45 min) — Mobile responsiveness, push to GitHub, deploy to Vercel
5. Celebrate & Share (10 min) — Feedback form + testimonial collection

Each challenge has a LEGO parallel analogy, copy-pasteable Claude/Claude Code prompts, info boxes, and a completion checklist.

## Unlock Logic

- Prework must be completed to unlock Challenge 1
- Each challenge unlocks when the previous one's checkboxes are all checked

## Files

### Components
- `src/components/AppBuild/AppBuildDashboard.jsx` + `.css` — Dashboard with progress rings
- `src/components/AppBuild/AppBuildChallenge.jsx` + `.css` — Recursive content renderer (steps, substeps, prompts, info boxes, checkboxes)
- `src/components/AppBuild/AppBuildPrework.jsx` + `.css` — 7-step product definition form

### Data & Logic
- `src/data/appBuildChallenges.js` — All challenge content + prework step definitions (static, not from DB)
- `src/hooks/useAppBuildData.js` — Progress tracking, checkbox toggle, prework save, feedback save, unlock logic

### Database
- `supabase/migrations/20260614100000_app_build.sql` — Tables + seed data
- `supabase/migrations/20260614100001_app_build_metadata_column.sql` — Added metadata JSONB column

**Tables:**
| Table | Purpose |
|-------|---------|
| `app_build_challenges` | 5 challenge definitions (seeded, JSONB content) |
| `app_build_progress` | Per-user per-challenge: checkboxes_completed, completed_at, metadata (feedback) |
| `app_build_prework` | Per-user: prework responses (JSONB), completed_at |

### Other
- `docs/buildwithai-data-export.json` — Full data export from original BuildWithAI Supabase project

## Key Patterns

- Challenge content is **static JS** (`appBuildChallenges.js`), not fetched from DB. The DB `app_build_challenges` table exists as a reference/backup but the app reads from the static module for speed.
- The `AppBuildChallenge` component uses a recursive rendering pattern: `StepItem` > `Substep` > `PromptBlock` / `InfoBox`. Each handles its own nested content.
- `PromptBlock` has a copy-to-clipboard button with "Copied!" feedback.
- Challenge 5 is special-cased (`is_feedback: true`) to render a feedback form instead of steps. Feedback saves to the `metadata` JSONB column on `app_build_progress`.
- Prework auto-saves on each "Next" step (`savePrework(responses, false)`), marks complete only on final step.

## Making It Accessible

When ready to surface this as an upsell:
1. Add a CTA card in CreatorHome or the `/create` portal
2. Optionally wrap routes in `CreateGate` if it should require Scope Map completion first
3. Optionally gate behind Stripe subscription
