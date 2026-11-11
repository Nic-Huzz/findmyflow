# CSS Variables Refactor — Agent Prompt

Copy everything below the line and paste into a new Claude Code session.

---

Read `docs/plans/css-variables-refactor-plan.md` for full context. You're replacing hardcoded CSS colors with CSS custom properties across 14 files. **The app must look IDENTICAL before and after — zero visual change.**

## Setup

```bash
git checkout main && git pull
git checkout -b feat/css-variables
```

## Phase 1: Create the token file

Create `src/styles/theme-tokens.css` with the `:root` block from the plan. **Light-theme values only** — do NOT include the `.theme-bioluminescent` block (that's a separate branch).

Import it in `src/main.jsx` (or wherever the app's CSS entry point is) BEFORE all other CSS imports so variables are available globally.

Commit: `"refactor: add CSS theme tokens"`

## Phase 2: Write the codemod script

Create `scripts/css-var-replace.mjs` — a Node.js script that:

1. Takes a CSS file path as argument
2. Reads the file
3. Applies replacements from a hardcoded mapping (defined in the script)
4. Writes the file back
5. Reports what it changed (count + examples)

The mapping must handle:
- Exact hex matches: `#1a1a2e` → `var(--text-primary)` etc.
- Case-insensitive hex: `#E9A23B` and `#e9a23b` both match
- `white` keyword when used as a background value → `var(--bg-surface)`
- Gradient stops: replace individual colors inside `linear-gradient()` 
- `rgba(94, 23, 235, ...)` — leave these ALONE for now (requires RGB triplet vars)

The script must SKIP replacements inside:
- `@keyframes` blocks (colors in animations should stay hardcoded)
- `url()` values
- CSS comments (`/* ... */`)
- Lines that already contain `var(--`

**Critical edge cases the script must handle:**
- `color: white` on a gradient button = `var(--text-on-accent)` NOT `var(--bg-surface)`
- `color: #fff` / `color: #ffffff` on dark backgrounds = `var(--text-on-accent)` 
- `background: #ffffff` / `background: white` = `var(--bg-surface)`
- `background: #f8f9fa` = `var(--bg-muted)` 
- The same hex can mean different things: `#5e17eb` as `background` → `var(--accent-primary)`, as `color` → `var(--accent-primary)`, as `border-color` → `var(--accent-primary)`. Most map to the same token but watch for context.

**The full mapping** (put this in the script):
```
background/surface: #ffffff, white → --bg-surface
background/muted: #f8f9fa, #f5f5f5, #f1f3f5, #f0f0f0 → --bg-muted  
background/hover: #faf8ff, #f5f3ff, #faf5ff → --bg-surface-hover
background/input: #f8f8fa → --bg-input
text/primary: #1a1a2e, #212529, #1a0b3d → --text-primary
text/secondary: #495057, #374151 → --text-secondary
text/muted: #6c757d, #6b7280 → --text-muted
text/faint: #9ca3af, #adb5bd → --text-faint
text/on-accent: white/#fff/#ffffff when color (not background) on accent elements → --text-on-accent
accent: #5e17eb → --accent-primary
accent-light: #8b5cf6 → --accent-primary-light
accent-dark: #7c3aed → --accent-primary-dark
gold: #E9A23B → --accent-gold
gold-light: #f0b94e, #f0b754, #f5c55a → --accent-gold-light
success: #10b981 → --color-success
success-dark: #059669 → --color-success-dark
danger: #ef4444 → --color-danger  
danger-dark: #dc2626 → --color-danger-dark
warning: #f97316 → --color-warning
neutral: #6b7280 → --color-neutral (only when used semantically, not as text)
border: #e9ecef → --border-default
border-light: #dee2e6, #e5e7eb, #e0e0e0 → --border-light
border-input: #eef0f3, #d1d5db → --border-input
```

Commit: `"refactor: add css-var-replace codemod script"`

## Phase 3: Run the script on each file

Process files smallest-first. For EACH file:

```bash
node scripts/css-var-replace.mjs src/components/ChallengeFilters.css
git diff src/components/ChallengeFilters.css  # review the diff
npm run build                                  # must succeed
git add src/components/ChallengeFilters.css
git commit -m "refactor: css variables in ChallengeFilters.css"
```

Order:
1. ChallengeFilters.css
2. QuestTaskSheet.css
3. WeeklyFocus.css
4. ChallengeStageTabs.css
5. RegulationCard.css
6. CapacityCard.css
7. DailyCheckin.css
8. QuadrantCard.css
9. BottomToolbar.css
10. QuestBoardCard.css
11. TuneTab.css
12. ProgressTab.css
13. LevelTab.css
14. Challenge.css

**After each file:** review the diff yourself before committing. Look for:
- `var(--bg-surface)` where it should be `var(--text-on-accent)` (white text on buttons)
- Replacements inside `@keyframes` (should not happen)
- Broken gradient syntax
- Double replacements (`var(var(--...))`)

If the build fails, fix before moving on. Do NOT skip to the next file.

## Phase 4: Inline JSX styles

```bash
grep -rn "style={{" src/components/ src/Challenge.jsx | grep -iE "'#[0-9a-f]|\"#[0-9a-f]"
```

For each match: if the color has a token equivalent, replace with `var(--token)` in a style string, or better yet remove the inline style and add a CSS class. Commit: `"refactor: replace inline color values with css variables"`

## Phase 5: Final verification

```bash
npm run build   # must exit 0
npm run dev      # start dev server
```

Open `localhost:5173/7-day-challenge`. Click through ALL 3 tabs. Open the daily checkin modal. Trigger a drain flow. Open a quest card. Check the progress tab. **The app must look identical to main branch.** If anything looks different, you introduced a bug — find and fix it.

Commit: `"refactor: css variables migration complete"`

## Rules

- ONE file, ONE commit. No batching.
- Build must pass after every file.  
- Never change the visual appearance. If a color looks wrong, the mapping is wrong — fix the mapping, not the color.
- The codemod script is your source of truth. If you need to add a new token, add it to BOTH `theme-tokens.css` and the script mapping, then re-run.
- Update CLAUDE.md if it references old color values (already done — verify the CSS Variables section exists under Architecture Patterns).
