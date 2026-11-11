# CSS Variables Refactor Plan

## Goal
Replace 200+ hardcoded color values across 13 CSS files with semantic CSS custom properties. This makes theme switching a 20-line variable swap instead of 2000 lines of `!important` overrides.

## Current State
- 13 CSS files totaling ~10K lines affect `/7-day-challenge`
- Colors like `#1a1a2e`, `#6c757d`, `#5e17eb`, `#ffffff`, `#e9ecef` are repeated everywhere
- Dark theme currently uses a 2000-line override file (`bioluminescent-theme.css`) with `!important` on every rule
- Some components use inline JSX styles with hardcoded colors (can't be overridden by CSS)

## Files to Refactor
1. `src/Challenge.css` (4,257 lines)
2. `src/components/level/LevelTab.css` (1,567 lines)
3. `src/components/ProgressTab.css` (1,197 lines)
4. `src/components/TuneTab.css` (985 lines)
5. `src/components/level/QuadrantCard.css` (379 lines)
6. `src/components/level/CapacityCard.css` (228 lines)
7. `src/components/ChallengeStageTabs.css` (179 lines)
8. `src/components/level/WeeklyFocus.css` (174 lines)
9. `src/components/level/QuestTaskSheet.css` (150 lines)
10. `src/components/ChallengeFilters.css` (117 lines)
11. `src/components/DailyCheckin.css` (308 lines)
12. `src/components/RegulationCard.css` (210 lines)
13. `src/components/BottomToolbar.css` (~400 lines)
14. `src/components/QuestBoardCard.css` (~700 lines)

## Phase 1: Audit & Map (automated script)

Run a script that scans all 14 files, extracts every color value, counts frequency, and outputs a mapping table.

```bash
# Extract all hex colors + rgba values, count occurrences
grep -ohE '#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)' src/Challenge.css src/components/*.css src/components/level/*.css | sort | uniq -c | sort -rn > color-audit.txt
```

Expected output: ~30-40 unique colors used 3+ times.

## Phase 2: Define Semantic Token Names

Create `src/styles/theme-tokens.css`:

```css
:root {
  /* Backgrounds */
  --bg-page: #f8f9fa;
  --bg-surface: #ffffff;
  --bg-surface-hover: #faf8ff;
  --bg-muted: #f5f5f5;
  --bg-input: #f8f9fa;

  /* Text */
  --text-primary: #1a1a2e;
  --text-secondary: #495057;
  --text-muted: #6c757d;
  --text-faint: #9ca3af;
  --text-on-accent: #ffffff;
  --text-on-gradient: #0a0a0a;

  /* Accent */
  --accent-primary: #5e17eb;
  --accent-primary-light: #8b5cf6;
  --accent-primary-dark: #7c3aed;
  --accent-primary-bg: rgba(94, 23, 235, 0.06);
  --accent-primary-border: rgba(94, 23, 235, 0.15);

  /* Gold */
  --accent-gold: #E9A23B;
  --accent-gold-bg: rgba(233, 162, 59, 0.1);

  /* Semantic */
  --color-success: #10b981;
  --color-success-bg: rgba(16, 185, 129, 0.12);
  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.1);
  --color-warning: #f97316;
  --color-neutral: #6b7280;

  /* Borders */
  --border-default: #e9ecef;
  --border-light: #dee2e6;
  --border-input: #e9ecef;
  --border-input-focus: #5e17eb;

  /* Shadows */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 6px 16px rgba(0, 0, 0, 0.12);
  --shadow-accent: 0 4px 12px rgba(94, 23, 235, 0.3);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #5e17eb 0%, #8b5cf6 100%);
  --gradient-bar: linear-gradient(90deg, #5e17eb, #a78bfa, #E9A23B);
  --gradient-gold: linear-gradient(135deg, #E9A23B 0%, #f0b94e 100%);
}

/* Bioluminescent Dark Theme */
.theme-bioluminescent,
[data-theme="bioluminescent"] {
  --bg-page: #0A0812;
  --bg-surface: rgba(18, 16, 28, 0.75);
  --bg-surface-hover: #1A1628;
  --bg-muted: #12101C;
  --bg-input: #12101C;

  --text-primary: #F2EEF8;
  --text-secondary: #BAB0D0;
  --text-muted: #8478A0;
  --text-faint: #5a4e70;
  --text-on-accent: #0a0a0a;
  --text-on-gradient: #0a0a0a;

  --accent-primary: #FF3CAC;
  --accent-primary-light: #E040FB;
  --accent-primary-dark: #cc2d8a;
  --accent-primary-bg: rgba(255, 60, 172, 0.06);
  --accent-primary-border: rgba(255, 60, 172, 0.15);

  --accent-gold: #FFB800;
  --accent-gold-bg: rgba(255, 184, 0, 0.1);

  --color-success: #00E5A0;
  --color-success-bg: rgba(0, 229, 160, 0.12);
  --color-danger: #FF5A6E;
  --color-danger-bg: rgba(255, 90, 110, 0.1);
  --color-warning: #FF8C42;
  --color-neutral: #8478A0;

  --border-default: rgba(255, 255, 255, 0.05);
  --border-light: rgba(255, 255, 255, 0.08);
  --border-input: rgba(255, 255, 255, 0.1);
  --border-input-focus: #FF3CAC;

  --shadow-card: 0 2px 10px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 4px 20px rgba(255, 60, 172, 0.08);
  --shadow-accent: 0 4px 16px rgba(255, 60, 172, 0.25);

  --gradient-primary: linear-gradient(135deg, #FF3CAC 0%, #E040FB 40%, #FFB800 100%);
  --gradient-bar: linear-gradient(90deg, #FF3CAC, #E040FB, #FFB800);
  --gradient-gold: linear-gradient(135deg, #FFB800 0%, #FFD060 100%);
}
```

## Phase 3: Mechanical Replacement (codemod script)

Write a Node.js script that:

1. Reads each CSS file
2. Replaces hardcoded values with `var(--token-name)` using the mapping
3. Writes the file back
4. Skips values inside `:root` blocks and inside `@keyframes`

```js
// Example mapping for the script
const replacements = {
  '#1a1a2e': 'var(--text-primary)',
  '#212529': 'var(--text-primary)',
  '#495057': 'var(--text-secondary)',
  '#6c757d': 'var(--text-muted)',
  '#9ca3af': 'var(--text-faint)',
  '#ffffff': 'var(--bg-surface)',
  'white': 'var(--bg-surface)',
  '#f8f9fa': 'var(--bg-muted)',
  '#e9ecef': 'var(--border-default)',
  '#dee2e6': 'var(--border-light)',
  '#5e17eb': 'var(--accent-primary)',
  '#8b5cf6': 'var(--accent-primary-light)',
  '#7c3aed': 'var(--accent-primary-dark)',
  '#E9A23B': 'var(--accent-gold)',
  '#10b981': 'var(--color-success)',
  '#ef4444': 'var(--color-danger)',
  '#f97316': 'var(--color-warning)',
  // ... etc
}
```

Rules:
- Only replace exact matches (not partial hex inside longer values)
- Skip values inside `url()`, `@keyframes`, comments
- Skip `color: white` when it's text on a gradient button (keep as-is or use --text-on-accent)
- Replace rgba variants of purple: `rgba(94, 23, 235, X)` → `rgba(var(--accent-primary-rgb), X)` (requires RGB triplet variables too)

## Phase 4: Fix Inline JSX Styles

Search all JSX files for inline `style={{` containing hardcoded colors:

```bash
grep -rn "style={{" src/components/ src/Challenge.jsx | grep -i "color\|background\|border"
```

For each match:
- If it's a one-off dynamic color (like NS state colors), keep inline but reference a constant
- If it's a repeated theme color, either remove the inline style and add a class, or use a CSS variable via `var()`

## Phase 5: Delete Override File

Once all CSS files use variables:
1. Remove `src/styles/bioluminescent-theme.css` (the 2000-line override)
2. Add `class="theme-bioluminescent"` to the root `<div>` in Challenge.jsx
3. Theme switching becomes: toggle one class

## Phase 6: Verify

- Run `npm run build` — check for CSS parse errors
- Open each tab (Daily/Weekly/Progress) in both themes
- Click through all modals (daily checkin, drain, regulation, weekly review, quest add)
- Check all states (completed, selected, hover, locked)
- Screenshot comparison against the mockup

## Branch Strategy

**Do the variable refactor on main, NOT on feat/bioluminescent-theme.**

1. `git checkout main` → `git checkout -b feat/css-variables`
2. Add `theme-tokens.css` with light-theme defaults in `:root`
3. Run codemod to replace hardcoded values with `var()` — zero visual change
4. Verify light theme looks identical (any visual diff = a bug)
5. Merge `feat/css-variables` to main
6. Rebase `feat/bioluminescent-theme` onto new main
7. Replace the 2000-line override file with ~50 lines that add `.theme-bioluminescent` variable overrides
8. Delete `bioluminescent-theme.css`

**Why this order:**
- Variable refactor is a pure infrastructure change, no visual impact, easy to verify
- Bioluminescent theme becomes trivially simple (variable swap, not selector override)
- If bioluminescent is scrapped, the variable work still lives on main for future theming
- Separates concerns: one PR for plumbing, one PR for aesthetics

## Execution Notes

- Do the variable refactor on a fresh branch from main
- Each file gets its own commit so you can revert individually
- The codemod script handles 80% of replacements; manual review handles edge cases
- Estimated: 2-3 hours with a focused agent, 1 hour of manual review

## Prompt for Subagent

> "Read src/styles/theme-tokens.css for the variable definitions. Then process each CSS file in this list one at a time. For each file: (1) read it fully, (2) replace every hardcoded color value that matches the mapping with its var() equivalent, (3) write the file back, (4) move to the next. Skip values inside @keyframes, url(), and comments. After all files are done, run npm run build to verify no parse errors."

Key safeguard: have the agent commit after each file so you can review diffs incrementally rather than getting one massive unverifiable change.
