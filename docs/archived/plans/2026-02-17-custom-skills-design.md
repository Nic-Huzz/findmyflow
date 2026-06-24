# Custom Skills Design — 7 Skills for FindMyFlow

**Date**: 2026-02-17
**Status**: Approved
**Problem**: Repeating context every session, consistency bugs (quest mismatches, missing RLS, silent failures), and design drift (wrong tokens, unscoped CSS, flat backgrounds).
**Solution**: 7 custom skills across 3 tiers — smart routing, targeted verification, UI enforcement, and upgraded scaffolding workflows.

---

## What Got Killed

- **`context-loader`** — redundant with CLAUDE.md + MEMORY.md already loaded at session start.
- **`design-audit`** — split between `verify-changes` (post-change validation) and `polish-page` (full-page audit). No need for a third skill doing the same checks.
- **`pre-commit-check`** — evolved into the smarter, file-type-aware `verify-changes`.

---

## Tier 1: Always Active

### Skill 1: `before-editing`

**Trigger**: Before writing or modifying any code.
**Style**: Smart router — routes to the right context for the specific task. Not "read everything," just what matters for THIS task.

| If touching... | Then MUST first... |
|---|---|
| CSS / JSX with UI | Read `docs/page-component-design-guide.md`, identify page's CSS prefix, load its token table |
| Quest system (JSON, helpers, QuestCard) | Read `docs/DEVELOPMENT_PATTERNS.md`, cross-reference `challengeQuestsUpdate.json` ↔ `questCompletionHelpers.js` for existing IDs/points/categories |
| Migrations | Check target table's current schema via `mcp__supabase__execute_sql`, verify RLS pattern from existing policies |
| Edge functions | Read an existing function in the same domain for streaming/CORS patterns |
| Flows | Read `MoneyModelFlowBase.jsx` for patterns, check if quest sync is needed |
| CRM pages | Read the tower's existing pages for layout patterns, check `towerStats.js` |

---

### Skill 2: `verify-changes`

**Trigger**: After writing code, before committing.
**Style**: Targeted verifier — runs checks ONLY on changed files, scoped to file type.

| Changed file type | Specific checks |
|---|---|
| `*.css` | Every new selector scoped to page prefix? `font-family: inherit` on buttons? No hardcoded hex outside token table? Reduced motion block if animations added? |
| `questCompletionHelpers.js` or `challengeQuestsUpdate.json` | IDs match across both files? Points match? Categories match? `challenge_day` set for user-level quests? |
| `*.sql` migration | `ENABLE ROW LEVEL SECURITY` present for every `CREATE TABLE`? Policy created? NOT NULL on columns with existing data handled safely? |
| Supabase `.from()` calls | `{ error }` destructured and handled? Not using `.single()` where `.maybeSingle()` is safer? |
| New JSX component | CSS file uses registered prefix? No inline styles for brand colors? |

Output: specific file:line references with the fix, not just pass/fail.

---

## Tier 2: UI Work

### Skill 3: `polish-page`

**Trigger**: "Bring this page up to design system standard."
**Style**: Checklist + targeted fixes. 3 steps, not 7.

**Process**:

1. **Read** the target page's JSX + CSS.
2. **Check against every rule** — one comprehensive pass:

| Check | Specific criteria |
|---|---|
| Card types | Dark hero for primary content, white + left accent bar for secondary. Not reversed? |
| Brand colors | Every hex in the CSS file is in the token table. Flag any rogue color with the correct replacement. |
| Typography | Headings 800-900 weight, body 400. No `font-weight: 600` on headings. |
| Buttons | Gold `#E9A23B` for primary CTA, purple for secondary. `font-family: inherit` present. |
| CSS scoping | Every selector uses the page's registered prefix. Keyframes prefixed. No orphan classes. |
| Glass morphism | `backdrop-filter` has fallback background. Dark card content has `position: relative; z-index: 1`. |
| Accessibility | Touch targets 44px+. Reduced motion block if animations exist. Sufficient contrast. |
| Anti-patterns | The 10 from the design guide: flat backgrounds, emerald buttons, unstyled modals, inline brand colors, etc. |

3. **Output a prioritized deviation list** — each item has: severity (critical/warning), file:line, current code, corrected code. User approves which to fix.

**What it is NOT**: A redesign. A feature addition. A layout change. Minimum viable edits to reach design system compliance.

---

### Skill 4: `new-landing-page`

**Trigger**: Building a new public-facing page (lead magnets, workshops, events).
**Style**: Constraints + starter template. Works WITH `frontend-design` skill, not instead of it.

**What it provides**:

**1. Starter skeleton** — the non-negotiable structure:
- Registered CSS prefix (checks existing prefixes for conflicts)
- Route added to `AppRouter.jsx`
- CSS file with correct scoping, brand token variables, mobile breakpoints, reduced motion block already in place
- JSX shell with semantic section structure

**2. Constraints checklist**:

| MUST have | MUST NOT have |
|---|---|
| Purple→gold gradient hero section | Flat single-color backgrounds |
| Mobile-first breakpoints (768px, 480px) | Desktop-only layouts |
| Reduced motion `@media` block | Unguarded animations |
| Scoped CSS with registered prefix | Generic class names |
| FAQ accordion if page has questions | Custom-built accordion (use existing pattern) |
| Brand token hex values only | Hardcoded rogue colors |

**3. Section menu** — based on 3 proven patterns:
- **Lead Magnet** (Earthquake Quiz): hero → interaction → capture → thank you
- **Workshop** (Healing Compass): story hero → what you'll learn → FAQ → CTA
- **Event/Season** (Fantasy League): hype hero → features → social proof → countdown → CTA
- User picks which sections to include, can mix and match.

**4. Hand off to `frontend-design`** for the creative work, with constraints locked in.

---

## Tier 3: Feature Work

### Skill 5: `new-quest` (upgrade of existing)

**What changed from current skill**: Source of truth corrected (`challengeQuestsUpdate.json`, not `useChallengeData.js`), cross-validation gate added, known-bug prevention encoded.

**Corrected workflow**:

1. **Read current quest system state**:
   - `public/challengeQuestsUpdate.json` (source of truth for quest definitions)
   - `src/lib/questCompletionHelpers.js` (completion handlers, `flowToQuestMap`, `questPoints`)
   - `src/components/QuestCard.jsx` (rendering logic, input type routing)

2. **Gather quest details** from user:
   - Name, description, points
   - Category: `Business` | `Healing` | `Groans` | `Voices` | `Bonus` | `Tracker`
   - Stage: 0-8 (or "all")
   - Is it user-level or project-scoped?
   - Input type decision tree:

| User action needed | Input type | Example component |
|---|---|---|
| Write a reflection | `reflection` | `GroanReflectionInput.jsx` |
| Just tap complete | `simple` | Built into QuestCard |
| Complete an external flow | `flow-link` | Links to flow route, syncs on return |
| Custom multi-field form | `custom` | Build new component |

3. **Add quest to `challengeQuestsUpdate.json`** with all fields.

4. **Register in `questCompletionHelpers.js`**:
   - Add to `flowToQuestMap` if flow-linked
   - Add to `questPoints` with matching points value
   - If user-level: ensure `challenge_day: 0` in the insert, NOT null

5. **Hard gate — cross-validation**: Display side-by-side:
   ```
   JSON id:       ___    Helper id:       ___    MATCH? ✓/✗
   JSON points:   ___    Helper points:   ___    MATCH? ✓/✗
   JSON category: ___    Helper category: ___    MATCH? ✓/✗
   ```
   Do not proceed if any mismatch.

6. **If custom input type**: Create component in `src/components/`, update `QuestCard.jsx` rendering switch.

---

### Skill 6: `new-migration` (upgrade of existing)

**What changed from current skill**: Safety gates added for ALTER TABLE, NOT NULL + existing data, RLS enforcement, corrected deployment instructions.

**New Step 0 — Schema check before writing anything**:
```sql
-- Via mcp__supabase__execute_sql or mcp__supabase__list_tables
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '<target_table>'
```
Display the current schema. Then write the migration against what actually exists.

**NOT NULL safety gate**:

| Adding... | Required approach |
|---|---|
| NOT NULL column to table WITH existing rows | Three-step: (1) add column as nullable, (2) `UPDATE` to backfill, (3) `ALTER COLUMN SET NOT NULL` |
| NOT NULL column to empty table | Single step with `NOT NULL DEFAULT` is fine |
| Nullable column | No special handling needed |

Cite: `quest_completions.challenge_day` bug — a NOT NULL column broke inserts that passed null.

**RLS enforcement gate**: After writing the migration, scan for every `CREATE TABLE`. For each one, verify the file also contains:
- `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`
- At least one `CREATE POLICY` on `<name>`

If missing, do not proceed. Show what to add.

**Corrected deployment instructions**:
- Primary: `mcp__supabase__apply_migration` tool
- Alternative: Supabase dashboard SQL editor
- NOT `db-query.sh` (DNS doesn't resolve from this machine)

Everything else (filename convention, standard template, foreign keys, indexes) stays the same.

---

### Skill 7: `new-flow`

**Trigger**: Building a new multi-step AI-guided flow experience.
**Style**: Guided workflow.

**Process**:

1. **Classify the flow** — ask user:
   - Does it use AI processing? (Claude via edge function)
   - Does it save to a dedicated table?
   - Does it sync with the challenge/quest system?
   - Is it project-scoped or user-scoped?
   - How many steps?

2. **Pick the right base pattern**:

| Pattern | When to use | What it gives you | Key file |
|---|---|---|---|
| Config-driven wrapper | New flow is structurally similar to existing (offers, money models) | ~35-line wrapper + config entry. Base handles steps, saving, AI calls. | `MoneyModelFlowBase.jsx` + `moneyModelConfigs.js` |
| Standalone with AI | Unique multi-step with AI processing between steps. Streaming responses. | Full component with step state, AI call pattern, streaming display, result saving. | `NervousSystemFlow.jsx` |
| Standalone capture | Quick assessment or single-screen capture. No AI mid-flow. | Simpler component with form state, single save on completion. | `MindSpace.jsx` |

3. **Scaffold with 4 non-negotiables** (flow-specific only — general coding practices enforced by `verify-changes`):

| # | Pattern | Detail |
|---|---|---|
| 1 | **Route in `AppRouter.jsx`** | Add route, wrap in `<AuthGate>` if authenticated. |
| 2 | **`flow_sessions` record on completion** | Insert with correct `flow_type`, `project_id` (null if user-level). |
| 3 | **`useAutoSave` for multi-step flows** | Save partial state to localStorage between steps. |
| 4 | **Quest sync (if applicable)** | Register in `flowToQuestMap`, call sync function, `challenge_day: 0` for user-level. |

4. **If new table needed** — inline checklist (same rules as `new-migration`):
   - Schema check via `mcp__supabase__execute_sql`
   - Migration file with RLS gate
   - NOT NULL safety check
   - Deployment via MCP tool

5. **If quest integration needed** — inline checklist (same rules as `new-quest`):
   - JSON entry in `challengeQuestsUpdate.json`
   - Helper registration in `questCompletionHelpers.js`
   - Cross-validation gate (ID/points/category)

Inline checklists make `new-flow` self-contained. Run standalone `new-migration` or `new-quest` only when doing those tasks outside of a flow.

---

## Build Priority

Based on current polish/consistency phase:

1. `before-editing` + `verify-changes` — prevents the most pain, used every session
2. `polish-page` — directly serves current work phase
3. `new-landing-page` — ready when needed
4. `new-quest` + `new-migration` + `new-flow` — upgrades for when building resumes

---

## Parking Lot

Ideas considered but not included:
- **`refactor-to-base`** — skill for identifying duplication and extracting configurable base components. Useful but too generic for a project-specific skill.
- **`new-edge-function` upgrade** — existing skill is adequate. Stale Deno imports could be updated but not high priority.
- **`content-pipeline`** — skill for scaffolding content generation features. Deferred until content engine is more active.
