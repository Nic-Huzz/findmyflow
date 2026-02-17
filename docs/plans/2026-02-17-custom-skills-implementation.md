# Custom Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 7 custom skills (4 new, 3 upgrades) that prevent repeating context, consistency bugs, and design drift across FindMyFlow development.

**Architecture:** Skills are markdown files in `.claude/skills/` with YAML frontmatter. Each skill is a self-contained prompt that loads when invoked via `/skill-name`. Skills use decision trees and checklists — not narrative.

**Tech Stack:** Markdown with YAML frontmatter. No code dependencies.

**Design doc:** `docs/plans/2026-02-17-custom-skills-design.md`

**Parallelism:** Tasks 1-4 are independent (Tier 1 + 2). Tasks 5-6 are independent (Tier 3 upgrades). Task 7 depends on 5 and 6.

---

## Task 1: `before-editing` skill

**Files:**
- Create: `.claude/skills/before-editing.md`

**Step 1: Write the skill file**

```markdown
---
description: Use when about to write or modify any code — routes to the right context and conventions for the specific file types being touched
---
# Before Editing

Before writing or modifying code, identify what you're touching and load ONLY the relevant context.

## Decision Tree

| If touching... | MUST read first |
|---|---|
| CSS / JSX with UI | `docs/page-component-design-guide.md` — identify page's CSS prefix, load its token table |
| Quest system (`challengeQuestsUpdate.json`, `questCompletionHelpers.js`, `QuestCard.jsx`) | `docs/DEVELOPMENT_PATTERNS.md` — cross-reference existing quest IDs, points, categories across JSON and helpers |
| Migrations (`supabase/migrations/`) | Current table schema via `mcp__supabase__execute_sql` or `mcp__supabase__list_tables` — verify RLS patterns from existing policies |
| Edge functions (`supabase/functions/`) | An existing function in the same domain — match streaming/CORS/error patterns |
| Flows (`src/flows/`) | `src/flows/MoneyModelFlowBase.jsx` for base patterns — check if quest sync is needed |
| CRM pages (`src/pages/crm/`) | The tower's existing pages for layout patterns — check `src/lib/crm/towerStats.js` |

## Active Gotchas

- **Quest completions**: `challenge_day` has NOT NULL constraint — user-level completions MUST use `0`, not `null`
- **Supabase errors**: Always destructure `{ error }` and check it. Silent catches hide real bugs.
- **CSS scoping**: All selectors must be prefixed with page's 2-4 letter scope. No orphan generic classes.
- **SVG + CSS**: CSS `transform` in `@keyframes` OVERWRITES SVG `transform` attribute. Nest `<g>` elements — outer for position, inner for animation.
- **SVG filters**: `<filter>` elements destroy solid fills. Use CSS `filter: drop-shadow()` on wrapper div instead.
```

**Step 2: Verify skill loads**

Run: `/before-editing`
Expected: Skill content loads. Decision tree and gotchas are visible.

**Step 3: Commit**

```bash
git add .claude/skills/before-editing.md
git commit -m "feat: add before-editing skill — smart context router for file types"
```

---

## Task 2: `verify-changes` skill

**Files:**
- Create: `.claude/skills/verify-changes.md`

**Step 1: Write the skill file**

```markdown
---
description: Use after writing code and before committing — validates changed files against project conventions with file-type-specific checks
---
# Verify Changes

After writing code, validate changes against project conventions. Only check files you actually changed.

## How to Run

1. Identify changed files (staged + unstaged)
2. For each changed file, run the checks for its type below
3. Report each violation with file:line, what's wrong, and the fix

## Checks by File Type

### CSS files (`*.css`)

- [ ] Every new selector scoped to page's registered prefix (e.g., `.me-hero`, not `.hero`)
- [ ] Keyframes prefixed (e.g., `@keyframes meFloat`, not `@keyframes float`)
- [ ] No hardcoded hex outside token table: `#5e17eb`, `#E9A23B`, `#1a1a2e`, `#2d1b69`, `#f5f5f5`, `#ffffff`, `#333`, `#666`, `#999`
- [ ] `font-family: inherit` on all `button` selectors
- [ ] `font-weight: 800` or `900` on headings, not `600`
- [ ] Reduced motion block present if any `animation` or `@keyframes` added
- [ ] `position: relative; z-index: 1` on content inside dark cards with `::before` pseudo-element backgrounds
- [ ] `backdrop-filter` paired with fallback `background`

### Quest files (`challengeQuestsUpdate.json`, `questCompletionHelpers.js`)

- [ ] Quest IDs match in BOTH files
- [ ] Points values match in BOTH files
- [ ] Categories match in BOTH files (valid: `Business`, `Healing`, `Groans`, `Voices`, `Bonus`, `Tracker`)
- [ ] User-level quests use `challenge_day: 0`, not `null`

### Migration files (`supabase/migrations/*.sql`)

- [ ] Every `CREATE TABLE` has matching `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Every `CREATE TABLE` has at least one `CREATE POLICY`
- [ ] New NOT NULL columns on tables with existing rows use three-step pattern (add nullable → backfill → set NOT NULL)
- [ ] `UPDATE` statements have `WHERE` guards

### Supabase queries (`.from()` calls in JS/JSX)

- [ ] `{ error }` destructured from every Supabase query result
- [ ] Error is actually checked (`if (error)`) — not silently ignored in a try/catch
- [ ] `.maybeSingle()` used instead of `.single()` where the row might not exist

### New JSX components

- [ ] Corresponding CSS file exists with registered prefix
- [ ] No inline `style=` with brand color hex values
- [ ] Route added to `AppRouter.jsx` if it's a page

## Output Format

For each violation:
```
[CRITICAL] src/pages/NewPage.css:42
  Current:  .hero-card { background: #333366; }
  Fix:      .np-hero-card { background: linear-gradient(135deg, #1a1a2e, #2d1b69); }
```

Severity levels:
- **CRITICAL**: Breaks conventions (wrong colors, unscoped CSS, missing RLS)
- **WARNING**: Inconsistent but functional (missing reduced motion, imperfect scoping)
```

**Step 2: Verify skill loads**

Run: `/verify-changes`
Expected: Skill content loads. All file-type checklists are visible.

**Step 3: Commit**

```bash
git add .claude/skills/verify-changes.md
git commit -m "feat: add verify-changes skill — file-type-aware validation before commits"
```

---

## Task 3: `polish-page` skill

**Files:**
- Create: `.claude/skills/polish-page.md`

**Step 1: Write the skill file**

```markdown
---
description: Use when bringing an existing page or component up to the FindMyFlow design system standard — audits against token tables and anti-patterns, outputs prioritized fix list
---
# Polish Page

Bring an existing page up to design system compliance. Minimum viable edits — no redesign, no feature additions, no layout changes.

## Process

1. Read the target page's JSX + CSS files
2. Read `docs/page-component-design-guide.md` for the full token table and anti-patterns list
3. Check every rule below
4. Output a prioritized deviation list with file:line and corrected code
5. User approves which to fix. Apply only approved fixes.

## Checklist

### Card Types
- Dark hero card (`background: linear-gradient(135deg, #1a1a2e, #2d1b69)`) for primary/featured content
- White card (`background: #ffffff`) with left accent bar (`border-left: 4px solid`) for secondary/list content
- Flag if reversed (dark card for lists, white card for hero)

### Brand Colors

Every hex in the CSS must be from this table:

| Token | Hex | Usage |
|---|---|---|
| Purple primary | `#5e17eb` | Brand, secondary buttons, accents |
| Gold primary | `#E9A23B` | CTAs, primary buttons, highlights |
| Dark bg | `#1a1a2e` | Hero cards, dark sections |
| Purple dark | `#2d1b69` | Gradient endpoints |
| Light bg | `#f5f5f5` | Page backgrounds |
| White | `#ffffff` | Card backgrounds |
| Text dark | `#333` | Primary text |
| Text mid | `#666` | Secondary text |
| Text light | `#999` | Muted text, labels |

Flag any hex not in this table. Suggest the correct replacement.

### Typography
- Headings: `font-weight: 800` or `900`. Flag `600` or `700` on any `h1`-`h4`.
- Body: `font-weight: 400`
- Font stack must include `'Inter'`

### Buttons
- Primary CTA: gold `#E9A23B` background, dark text
- Secondary: purple `#5e17eb` background or outline
- Cancel/back: transparent or subtle grey
- ALL buttons must have `font-family: inherit`

### CSS Scoping
- Page prefix: 2-4 letters (e.g., `.me-`, `.fc-`, `.lp-`)
- Every selector prefixed: `.xx-element`
- Every keyframe prefixed: `@keyframes xxAnimation`
- No orphan generic classes (`.card`, `.button`, `.header`)

### Glass Morphism
- `backdrop-filter: blur()` must have fallback `background` for browsers without support
- Content inside dark cards with `::before` pseudo-elements needs `position: relative; z-index: 1`

### Accessibility
- Touch targets: 44px minimum height/width
- Reduced motion: `@media (prefers-reduced-motion: reduce)` block if any `animation` or `transition` exists
- Color contrast: text on colored backgrounds must be readable

### Anti-Patterns (flag any found)
1. Flat single-color backgrounds (should be gradient or textured)
2. Emerald/green buttons (legacy — should be gold)
3. Unstyled browser-default modals
4. Inline `style=` with brand color hex values
5. `font-weight: 600` on headings
6. Missing `font-family: inherit` on buttons
7. Unscoped CSS selectors
8. Desktop-only layouts (no `@media` breakpoints)
9. Hardcoded hex outside token table
10. Missing reduced-motion blocks for animations

## Output Format

```
CRITICAL (breaks design system):
1. src/pages/SomePage.css:42 — `.hero { background: #333366 }` → `.sp-hero { background: linear-gradient(135deg, #1a1a2e, #2d1b69); }`
2. ...

WARNING (inconsistent but functional):
1. ...

PASS:
✓ Card types correct
✓ Buttons use gold CTA
✓ ...
```
```

**Step 2: Verify skill loads**

Run: `/polish-page`
Expected: Skill content loads. Full checklist and token table are visible.

**Step 3: Commit**

```bash
git add .claude/skills/polish-page.md
git commit -m "feat: add polish-page skill — design system compliance checker"
```

---

## Task 4: `new-landing-page` skill

**Files:**
- Create: `.claude/skills/new-landing-page.md`

**Step 1: Write the skill file**

```markdown
---
description: Use when building a new public-facing page such as a lead magnet, workshop page, or event landing page — provides constraints and starter skeleton that works with the frontend-design skill
---
# New Landing Page

Build a new public-facing page with FindMyFlow brand constraints. This skill provides the skeleton and rules. The `frontend-design` skill handles the creative design.

## Step 1: Gather Requirements

Ask the user:
- Page purpose: lead magnet | workshop | event | waitlist
- Hero headline + subheadline
- Key sections needed (see section menu in Step 5)
- Target emotion: urgency | curiosity | transformation | community

## Step 2: Register CSS Prefix

Check existing prefixes in `docs/page-component-design-guide.md` to avoid conflicts. Choose a unique 2-4 letter prefix. All selectors and keyframes will use this prefix.

## Step 3: Create Starter Files

Create two files:

### `src/pages/<PageName>.jsx`

```jsx
import React, { useState } from 'react'
import './<PageName>.css'

export default function PageName() {
  return (
    <div className="xx-page">
      <section className="xx-hero">
        {/* Hero content */}
      </section>

      {/* Additional sections from Step 5 */}

      <section className="xx-cta">
        {/* Final call to action */}
      </section>
    </div>
  )
}
```

### `src/pages/<PageName>.css`

```css
/* Replace xx with registered prefix */
.xx-page {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.xx-hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #5e17eb 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.xx-hero h1 {
  font-weight: 900;
  font-size: 2.5rem;
}

.xx-cta-button {
  background: #E9A23B;
  color: #1a1a2e;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

/* Mobile breakpoints */
@media (max-width: 768px) {
  .xx-hero h1 { font-size: 1.8rem; }
  .xx-hero { padding: 3rem 1.5rem; }
}

@media (max-width: 480px) {
  .xx-hero h1 { font-size: 1.5rem; }
  .xx-hero { padding: 2rem 1rem; }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .xx-page * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Step 4: Add Route

Add to `src/AppRouter.jsx`:
- Public pages: no `<AuthGate>` wrapper
- Lead magnets: `/try/<slug>` pattern
- Workshop/event pages: descriptive route (e.g., `/workshop/healing-compass`)

## Step 5: Pick Sections

Based on proven patterns from recent landing pages:

| Section | Lead Magnet | Workshop | Event |
|---|---|---|---|
| Hero with gradient | Required | Required | Required |
| Interactive element (quiz, form) | Common | Rare | Rare |
| "What you'll learn" grid | Rare | Common | Rare |
| Features/benefits list | Rare | Common | Common |
| FAQ accordion | Common | Common | Rare |
| Social proof / testimonials | Rare | Rare | Common |
| Countdown timer | Rare | Rare | Common |
| Waitlist/signup modal | Common | Common | Common |
| Final CTA section | Required | Required | Required |

Mix and match. User picks which sections to include.

## Constraints (non-negotiable)

| MUST have | MUST NOT have |
|---|---|
| Purple→gold gradient hero | Flat single-color backgrounds |
| Mobile breakpoints (768px, 480px) | Desktop-only layouts |
| Reduced motion `@media` block | Unguarded animations |
| Scoped CSS with registered prefix | Generic class names |
| Brand token hex values only | Hardcoded rogue colors |
| `font-family: inherit` on buttons | Browser-default button fonts |
| `font-weight: 800+` on headings | `font-weight: 600` on headings |

## Step 6: Hand Off to Creative

With skeleton and constraints in place, use the `frontend-design` skill for creative design — animations, scroll effects, visual flair, content layout.
```

**Step 2: Verify skill loads**

Run: `/new-landing-page`
Expected: Skill content loads. Starter templates, section menu, and constraints table are visible.

**Step 3: Commit**

```bash
git add .claude/skills/new-landing-page.md
git commit -m "feat: add new-landing-page skill — constraints + skeleton for public pages"
```

---

## Task 5: `new-quest` skill (upgrade)

**Files:**
- Modify: `.claude/skills/new-quest.md` (full replacement)

**Step 1: Read existing skill**

Read `.claude/skills/new-quest.md` to confirm current content before overwriting.

**Step 2: Write the upgraded skill**

Replace entire file with:

```markdown
---
description: Use when adding a new quest to the 7-day Challenge system — guides through JSON definition, helper registration, cross-validation, and input component creation
agent: Explore
context: fork
---
# Add New Challenge Quest

Add a new quest to FindMyFlow's gamified 7-day Challenge system.

## Step 1: Read Current Quest System

Read these files to understand existing quests:
- `public/challengeQuestsUpdate.json` — **source of truth** for quest definitions
- `src/lib/questCompletionHelpers.js` — completion handlers, `flowToQuestMap`, `questPoints`
- `src/components/QuestCard.jsx` — rendering logic, input type routing

## Step 2: Gather Quest Details

Ask the user:
- Quest name and description
- Points value
- Category: `Business` | `Healing` | `Groans` | `Voices` | `Bonus` | `Tracker`
- Stage: 0-8 (or "all")
- Is it user-level or project-scoped?
- Frequency: `daily` | `weekly` | `one-time`
- Input type (see decision tree)

### Input Type Decision Tree

| User action needed | Input type | Example component |
|---|---|---|
| Write a reflection | `reflection` | `GroanReflectionInput.jsx` |
| Just tap complete | `simple` | Built into QuestCard |
| Complete an external flow | `flow-link` | Links to flow route, syncs on return |
| Custom multi-field form | `custom` | Build new `*QuestInput.jsx` component |

## Step 3: Add Quest to JSON

Add entry to `public/challengeQuestsUpdate.json` with all required fields.

## Step 4: Register in Helpers

Update `src/lib/questCompletionHelpers.js`:
- Add to `flowToQuestMap` if quest is flow-linked
- Add to `questPoints` with matching points value
- If user-level: `challenge_day` MUST be `0`, NOT `null` (NOT NULL DB constraint)

## Step 5: Cross-Validation Gate

Display side-by-side and verify ALL match:

```
JSON id:       ___    Helper id:       ___    MATCH? ✓/✗
JSON points:   ___    Helper points:   ___    MATCH? ✓/✗
JSON category: ___    Helper category: ___    MATCH? ✓/✗
```

**DO NOT PROCEED if any mismatch.** Fix before continuing.

## Step 6: Create Input Component (if needed)

If input type is `custom`:
1. Create component in `src/components/` following pattern of `GroanReflectionInput.jsx`
2. Update `QuestCard.jsx` rendering switch to handle the new input type

## Common Mistakes

- Quest ID mismatch between JSON and helpers → quest never registers as complete
- Points mismatch → incorrect scoring
- Category mismatch → quest appears in wrong tab
- `challenge_day: null` for user-level quests → DB insert error (silently caught)

## Output

Summarize: quest added, cross-validation passed, components created, testing steps.
```

**Step 3: Verify skill loads**

Run: `/new-quest`
Expected: Upgraded skill content loads. Cross-validation gate and input type decision tree are visible.

**Step 4: Commit**

```bash
git add .claude/skills/new-quest.md
git commit -m "fix: upgrade new-quest skill — correct source of truth, add cross-validation gate"
```

---

## Task 6: `new-migration` skill (upgrade)

**Files:**
- Modify: `.claude/skills/new-migration.md` (full replacement)

**Step 1: Read existing skill**

Read `.claude/skills/new-migration.md` to confirm current content before overwriting.

**Step 2: Write the upgraded skill**

Replace entire file with:

```markdown
---
description: Use when creating a new Supabase database migration — includes schema check, RLS enforcement gate, NOT NULL safety, and correct deployment instructions
---
# Create Supabase Migration

Create a new database migration for FindMyFlow's Supabase backend.

## Step 0: Check Existing Schema

Before writing any migration, check what exists:

```sql
-- Via mcp__supabase__execute_sql or mcp__supabase__list_tables
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '<target_table>'
```

Display the current schema. Write the migration against what actually exists.

## Step 1: Gather Migration Details

Ask the user:
- Migration name (snake_case, descriptive)
- What tables/columns to create or modify
- Any foreign key relationships
- RLS policies needed

## Step 2: Generate Filename

Format: `YYYYMMDDHHMMSS_<name>.sql`
- Use current date/time
- Example: `20260217150000_add_healing_entries.sql`

## Step 3: Write Migration

Create file in `supabase/migrations/`.

### Standard Table Template

```sql
-- Description of what this migration does
CREATE TABLE table_name (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- columns here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

## Safety Gates

### RLS Enforcement Gate

After writing the migration, scan for every `CREATE TABLE`. For each one, verify:
- [ ] `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` exists
- [ ] At least one `CREATE POLICY` on `<name>` exists

**DO NOT PROCEED if missing.**

### NOT NULL Safety Gate

| Adding... | Required approach |
|---|---|
| NOT NULL column to table WITH existing rows | Three-step: (1) `ADD COLUMN` as nullable, (2) `UPDATE SET` to backfill with `WHERE`, (3) `ALTER COLUMN SET NOT NULL` |
| NOT NULL column to empty table | Single step with `NOT NULL DEFAULT` is fine |
| Nullable column | No special handling |

Cite: `quest_completions.challenge_day` — NOT NULL constraint broke inserts that passed null.

### Data Update Safety

- `UPDATE` statements MUST have `WHERE` guards
- Never blindly update all rows

## Step 4: Deploy

- Primary: `mcp__supabase__apply_migration` MCP tool
- Alternative: Supabase dashboard SQL editor
- NOT `db-query.sh` (DNS doesn't resolve from this machine)

## Output

Show the full migration file and confirm deployment method.
```

**Step 3: Verify skill loads**

Run: `/new-migration`
Expected: Upgraded skill content loads. Schema check step, RLS gate, and NOT NULL gate are visible.

**Step 4: Commit**

```bash
git add .claude/skills/new-migration.md
git commit -m "fix: upgrade new-migration skill — add schema check, RLS gate, NOT NULL safety"
```

---

## Task 7: `new-flow` skill (depends on Tasks 5-6)

**Files:**
- Create: `.claude/skills/new-flow.md`

**Step 1: Read reference patterns**

Read these files to verify the inline checklists reference correct patterns:
- `src/flows/MoneyModelFlowBase.jsx` — config-driven pattern
- `src/flows/moneyModelConfigs.js` — config structure
- `src/flows/NervousSystemFlow.jsx` — standalone AI pattern
- `src/flows/MindSpace.jsx` — standalone capture pattern
- `src/AppRouter.jsx` — current route registration patterns
- `src/styles/flow-base.css` — available shared classes

**Step 2: Write the skill file**

```markdown
---
description: Use when building a new multi-step AI-guided flow experience — classifies flow type, picks base pattern, scaffolds with non-negotiable infrastructure patterns
---
# Create New Flow

Build a new multi-step flow for FindMyFlow.

## Step 1: Classify the Flow

Ask the user:
- Does it use AI processing? (Claude via edge function)
- Does it save to a dedicated table?
- Does it sync with the challenge/quest system?
- Is it project-scoped or user-scoped?
- How many steps?

## Step 2: Pick Base Pattern

| Pattern | When to use | Key reference file |
|---|---|---|
| **Config-driven wrapper** | Structurally similar to existing flow (offers, money models). ~35-line wrapper + config entry. | `src/flows/MoneyModelFlowBase.jsx` + `src/flows/moneyModelConfigs.js` |
| **Standalone with AI** | Unique multi-step with AI processing between steps. Streaming responses. | `src/flows/NervousSystemFlow.jsx` |
| **Standalone capture** | Quick assessment or single-screen capture. No AI mid-flow. | `src/flows/MindSpace.jsx` |

Read the reference file for the chosen pattern before scaffolding.

## Step 3: Scaffold with Non-Negotiables

These 4 patterns MUST be present in every flow:

### 1. Route in `AppRouter.jsx`

```jsx
<Route path="/flow-name" element={<AuthGate><FlowName /></AuthGate>} />
```

### 2. `flow_sessions` Record on Completion

```javascript
const { error } = await supabase.from('flow_sessions').insert({
  user_id: user.id,
  flow_type: 'flow-name',
  project_id: projectId, // null if user-level
  completed_at: new Date().toISOString(),
  data: resultData
})
if (error) console.error('Failed to save flow session:', error)
```

### 3. `useAutoSave` for Multi-Step Flows

```javascript
import { useAutoSave } from '../hooks/useAutoSave'

useAutoSave({
  key: 'flow-name-progress',
  data: { currentStep, responses },
  interval: 30000
})
```

### 4. Quest Sync (if applicable)

Only if the flow connects to the challenge system:

```javascript
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'

await syncFlowFinderWithChallenge(userId, flowType)
```

## Step 4: If New Table Needed

Inline checklist (same rules as `new-migration` skill):

1. Check existing schema via `mcp__supabase__execute_sql`:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns WHERE table_name = '<table>'
   ```
2. Write migration file in `supabase/migrations/` with timestamp name
3. **RLS gate**: Verify `ENABLE ROW LEVEL SECURITY` + policy for every `CREATE TABLE`
4. **NOT NULL gate**: If adding NOT NULL column to table with rows → three-step (nullable → backfill → set NOT NULL)
5. Deploy via `mcp__supabase__apply_migration` MCP tool

## Step 5: If Quest Integration Needed

Inline checklist (same rules as `new-quest` skill):

1. Add quest entry to `public/challengeQuestsUpdate.json`
2. Register in `src/lib/questCompletionHelpers.js` (`flowToQuestMap` + `questPoints`)
3. If user-level: `challenge_day: 0`, NOT `null`
4. **Cross-validation gate**: Verify IDs, points, categories match between JSON and helpers

## Shared CSS

Import shared flow styles — don't reinvent:

```javascript
import '../styles/flow-base.css'
```

Available classes: `.primary-button`, `.secondary-button`, `.welcome-container`, `.resume-prompt`, `.nav-buttons`, `.option-btn`, `.input-group`, `.loading-state`, `.spinner`, `.progress-dots`, `.error-message`

Only add custom CSS for flow-specific styling, using a scoped prefix.

## Output

Summarize: files created, route added, table (if any), quest sync (if any), what to build next.
```

**Step 3: Verify skill loads**

Run: `/new-flow`
Expected: Skill content loads. Base pattern table, non-negotiables with code, and inline checklists are visible.

**Step 4: Commit**

```bash
git add .claude/skills/new-flow.md
git commit -m "feat: add new-flow skill — guided workflow for multi-step AI flows"
```

---

## Final Step: Verify All Skills

After all 7 skills are committed, run a quick inventory check:

```bash
ls -la .claude/skills/
```

Expected: 9 skill files total (6 existing + 4 new - 1 since new-landing-page is net new but before-editing, verify-changes, polish-page, new-flow are all new, and new-quest + new-migration are replacements):

```
add-zarlo-context.md
before-editing.md        ← NEW
check-stage.md
db.md
new-edge-function.md
new-flow.md              ← NEW
new-landing-page.md      ← NEW
new-migration.md         ← UPGRADED
new-quest.md             ← UPGRADED
polish-page.md           ← NEW
verify-changes.md        ← NEW
```

That's 11 total (6 existing + 5 new). Verify each loads correctly by invoking them.
