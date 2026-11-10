# Tier 1 Skill Node Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Money Map Tier 1 from 5 abstract categories to 4 job-oriented categories, merge Product Design into Coding, and replace all sub-nodes with actual paid roles.

**Architecture:** Data-only restructure. Change the source-of-truth data files (`tier1Challenges.js`, `experienceDomeSubNodes.js`), remove `exp-product-design` references from all config/mapping files, update one DB migration, and rewrite courage ladder copy. No new components, no new flows, no architecture changes.

**Tech Stack:** React 18, Supabase (PostgreSQL), static JS data files

**Spec:** `docs/superpowers/specs/2026-11-10-tier1-skill-restructure-design.md`

## Global Constraints

- Write so a 12-year-old understands. No jargon. No em dashes in user-facing copy.
- Light theme throughout. Brand purple (#5e17eb) / gold (#E9A23B) for accents.
- Always import dimensions from `src/data/domeDimensions.js`, never redefine inline.
- Tier 1 IDs that stay: `exp-coding`, `exp-graphic-design`, `exp-spreadsheets`, `exp-selling`. Only `exp-product-design` is removed.

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/tier1Challenges.js` | Modify | Remove `exp-product-design` from TIER1_IDS, TIER1_CHALLENGES, and all COURAGE_LADDER stages. Update labels and copy for remaining 4 Tier 1s. |
| `src/data/experienceDomeSubNodes.js` | Modify | Remove `exp-product-design` sub-nodes. Replace `fmt-graphic-*`, `fmt-sheet-*`, `fmt-sell-*` with new job-oriented sub-nodes. Add `exp-coding` sub-nodes. |
| `src/lib/experienceDomeConfig.js` | Modify | Remove `exp-product-design` from label map, TIER1_IDS array, and VIRTUAL_EXPERIENCE_NODES. |
| `src/flows/ExperienceGameFlow.jsx` | Modify | Remove `exp-product-design` tick description. |
| `src/data/domeSkillInference.json` | Modify | Remove `exp-product-design` entry, merge skills into `exp-coding`. |
| `src/lib/huzzDomeData.js` | Modify | Remove `exp-product-design` demo data entry. |
| `supabase/migrations/20261110000002_migrate_product_design_to_coding.sql` | Create | Migrate existing `exp-product-design` quests to `exp-coding`. |

---

### Task 1: Data Sources — tier1Challenges.js + experienceDomeSubNodes.js

These are the two source-of-truth files. Change them first, everything else follows.

**Files:**
- Modify: `src/data/tier1Challenges.js`
- Modify: `src/data/experienceDomeSubNodes.js`

**Interfaces:**
- Produces: `TIER1_IDS` (4 entries), `TIER1_CHALLENGES` (4 entries), `COURAGE_LADDER` (4 skill keys per stage). New sub-node IDs: `fmt-code-apps`, `fmt-code-tools`, `fmt-graphic-web`, `fmt-graphic-content`, `fmt-sheet-modelling`, `fmt-sell-meta`, `fmt-sell-amazon`, `fmt-sell-google`, `fmt-sell-cold-call`, `fmt-sell-setter`.

- [ ] **Step 1: Update TIER1_IDS and TIER1_CHALLENGES in tier1Challenges.js**

Open `src/data/tier1Challenges.js`. Make these changes:

Remove `'exp-product-design'` from the `TIER1_IDS` array (line 9). Result:
```javascript
export const TIER1_IDS = [
  'exp-coding',
  'exp-graphic-design',
  'exp-spreadsheets',
  'exp-selling',
]
```

Remove the entire `'exp-product-design': { ... }` block from `TIER1_CHALLENGES` (lines 25-33).

Update the remaining 4 entries' `questLabel` and `cardDesc` fields:
```javascript
'exp-coding': {
  questLabel: 'Coding',
  rate: '$40-80/hr',
  freeRate: '$80-150/hr',
  cardDesc: 'Build apps, websites, tools, and automations',
  title: 'Build a simple website with AI',
  desc: 'Use an AI coding tool to build something small. A personal page, a calculator, anything. You don\'t need to know how to code. The AI does the hard part.',
  dims: { identity: 2, business_commitment: 2 },
},
'exp-graphic-design': {
  questLabel: 'Graphic Design',
  rate: '$30-60/hr',
  freeRate: '$75-200/hr',
  cardDesc: 'Design websites, social posts, brand assets',
  title: 'Create 3 designs',
  desc: 'Use a free design tool to make three things: a poster, a social media graphic, and a logo concept. Share your favourite one.',
  dims: { identity: 2, vulnerability: 2 },
},
'exp-spreadsheets': {
  questLabel: 'Spreadsheets',
  rate: '$35-70/hr',
  freeRate: '$80-200/hr',
  cardDesc: 'Build financial models and dashboards',
  title: 'Find patterns in data with AI',
  desc: 'Find any free spreadsheet online (sports stats, weather, anything). Ask AI to help you spot the interesting patterns. Write up what you found.',
  dims: { identity: 2, business_commitment: 2 },
},
'exp-selling': {
  questLabel: 'Selling',
  rate: '$40-80/hr',
  freeRate: '$150-400/hr',
  cardDesc: 'Run ads, make sales calls, book meetings',
  title: 'Pitch something you believe in',
  desc: 'Pick something you genuinely think is great. Could be a product, an idea, or something you made. Pitch it to 3 people and see what happens.',
  dims: { people: 3, vulnerability: 2, stakes: 2 },
},
```

- [ ] **Step 2: Update COURAGE_LADDER — remove exp-product-design keys**

In the `COURAGE_LADDER` object, delete every `'exp-product-design': { ... }` block. They appear in:
- `portfolio` stage (search for `'exp-product-design'` inside `portfolio:`)
- `first_opportunity.employment`
- `first_opportunity.free_work`
- `first_opportunity.warm_outreach`
- `first_opportunity.content`

Update the `exp-coding` portfolio challenge copy to reflect the broader scope:
```javascript
portfolio: {
  'exp-coding': {
    title: 'Build 2 apps or tools for real people',
    desc: 'Build something useful for yourself and one for a friend. Show them both and ask what they think.',
    dims: { identity: 2, business_commitment: 2 },
  },
  // ... rest unchanged
```

Update the `exp-coding` warm_outreach copy:
```javascript
'exp-coding': {
  title: 'Tell 10 people what you build',
  desc: 'Message 10 people you know. Tell them you build apps and tools now. Ask if they know anyone who needs one.',
  dims: { people: 2, vulnerability: 2, money: 2 },
},
```

- [ ] **Step 3: Replace sub-nodes in experienceDomeSubNodes.js**

Open `src/data/experienceDomeSubNodes.js`. Find the `'exp-product-design': [...]` block (around line 535) and **delete it entirely**.

Replace the `'exp-graphic-design': [...]` block (around line 543) with:
```javascript
'exp-graphic-design': [
  { id: 'fmt-graphic-web', label: 'Website design' },
  { id: 'fmt-graphic-content', label: 'Content assets (social posts, thumbnails, brand)' },
],
```

Replace the `'exp-spreadsheets': [...]` block (around line 562) with:
```javascript
'exp-spreadsheets': [
  { id: 'fmt-sheet-modelling', label: 'Financial modelling and dashboards' },
],
```

Replace the `'exp-selling': [...]` block (around line 774) with:
```javascript
'exp-selling': [
  { id: 'fmt-sell-meta', label: 'Meta ads (Facebook + Instagram)' },
  { id: 'fmt-sell-amazon', label: 'Amazon ads' },
  { id: 'fmt-sell-google', label: 'Google ads' },
  { id: 'fmt-sell-cold-call', label: 'Cold calling' },
  { id: 'fmt-sell-setter', label: 'Sales call setter' },
],
```

Add a NEW block for `'exp-coding'` (currently has no sub-nodes). Insert it near the other Tier 1 entries:
```javascript
'exp-coding': [
  { id: 'fmt-code-apps', label: 'Apps (mobile, web, SaaS)' },
  { id: 'fmt-code-tools', label: 'Tools (automations, bots, Shopify, Notion)' },
],
```

- [ ] **Step 4: Build check**

Run: `npm run build 2>&1 | tail -5`
Expected: Clean build. These are data-only changes — no new imports, no API changes.

- [ ] **Step 5: Commit**

```bash
git add src/data/tier1Challenges.js src/data/experienceDomeSubNodes.js
git commit -m "feat: restructure Tier 1 skills — 5→4 categories, job-oriented sub-nodes"
```

---

### Task 2: Config/Mapping Cleanup — Remove exp-product-design Everywhere

**Files:**
- Modify: `src/lib/experienceDomeConfig.js`
- Modify: `src/flows/ExperienceGameFlow.jsx`
- Modify: `src/data/domeSkillInference.json`
- Modify: `src/lib/huzzDomeData.js`
- Create: `supabase/migrations/20261110000002_migrate_product_design_to_coding.sql`

**Interfaces:**
- Consumes: Task 1's updated TIER1_IDS (4 entries)
- Produces: Codebase with zero references to `exp-product-design`

- [ ] **Step 1: Update experienceDomeConfig.js**

Open `src/lib/experienceDomeConfig.js`. Make 3 changes:

**a) Label map** (~line 153): Delete the `'exp-product-design': 'Product design',` line.

**b) Tools array** (~line 677): Delete the `'exp-product-design',      // Product design` line.

**c) VIRTUAL_EXPERIENCE_NODES** (~line 797): Delete the `{ id: 'exp-product-design', label: 'Product design', branch: 'tech', primal: 'tools' },` line.

- [ ] **Step 2: Update ExperienceGameFlow.jsx**

Open `src/flows/ExperienceGameFlow.jsx`. Find the tick descriptions object (~line 109). Delete the `'exp-product-design': 'UX, web design, industrial design, game design',` line.

- [ ] **Step 3: Update domeSkillInference.json**

Open `src/data/domeSkillInference.json`. Find the `"exp-product-design"` entry (~line 79). Delete the entire block including its trailing comma:
```json
"exp-product-design": {
  "skills": {
    "designing": "strong",
    "building": "moderate"
  }
},
```

Note: `exp-coding` has no entry in this file (coding doesn't infer dome skills). No merge needed — just delete the product-design block.

- [ ] **Step 4: Update huzzDomeData.js**

Open `src/lib/huzzDomeData.js`. Find and delete the `'exp-product-design': 'vibe_rise',` line (~line 160).

- [ ] **Step 5: Create DB migration**

```sql
-- supabase/migrations/20261110000002_migrate_product_design_to_coding.sql

-- Migrate product-design quests to coding (closest match after merge)
UPDATE quests
SET skill_node_id = 'exp-coding'
WHERE skill_node_id = 'exp-product-design';

-- Historical challenges keep their source_value for analytics
-- No change to groan_challenges.source_value
```

Apply via Supabase MCP or SQL editor.

- [ ] **Step 6: Verify no remaining references**

Search the entire `src/` directory for `exp-product-design`:
```bash
grep -r "exp-product-design" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.json"
```
Expected: Zero results.

Also check edge functions:
```bash
grep -r "exp-product-design" supabase/functions/ --include="*.ts"
```
If `process-stems/index.ts` still references it, update the example data to use `exp-coding` instead.

- [ ] **Step 7: Build check**

Run: `npm run build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 8: Commit**

```bash
git add src/lib/experienceDomeConfig.js src/flows/ExperienceGameFlow.jsx src/data/domeSkillInference.json src/lib/huzzDomeData.js supabase/migrations/20261110000002_migrate_product_design_to_coding.sql
git commit -m "fix: remove all exp-product-design references + DB migration to exp-coding"
```

---

### Task 3: Build Verification + End-to-End Check

**Files:**
- Possibly modify: any file from Tasks 1-2 if issues found

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified, clean build with no broken references

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 2: Grep for orphaned format sub-node IDs**

The old format IDs should no longer appear anywhere:
```bash
grep -r "fmt-proddesign-\|fmt-graphic-brand\|fmt-graphic-print\|fmt-graphic-digital\|fmt-graphic-illustration\|fmt-graphic-typography\|fmt-sheet-financial\|fmt-sheet-data\|fmt-sheet-tracking\|fmt-sheet-automation\|fmt-sheet-reporting\|fmt-sell-1on1\|fmt-sell-stage\|fmt-sell-page\|fmt-sell-dm\|fmt-sell-market\|fmt-sell-negotiate\|fmt-sell-fundraise" src/ --include="*.js" --include="*.jsx" --include="*.json"
```
Expected: Zero results. If any hit, fix the reference.

- [ ] **Step 3: Grep for new sub-node IDs exist in the right places**

```bash
grep -r "fmt-code-apps\|fmt-code-tools\|fmt-graphic-web\|fmt-graphic-content\|fmt-sheet-modelling\|fmt-sell-meta\|fmt-sell-amazon\|fmt-sell-google\|fmt-sell-cold-call\|fmt-sell-setter" src/ --include="*.js" --include="*.jsx"
```
Expected: All 10 IDs appear in `experienceDomeSubNodes.js` only (they're data, consumed via `getSubNodes()` helper).

- [ ] **Step 4: Verify DB migration applied**

```sql
SELECT skill_node_id, count(*) FROM quests
WHERE skill_node_id IS NOT NULL
GROUP BY skill_node_id;
```
Expected: No rows with `exp-product-design`. Any that existed should now show as `exp-coding`.

- [ ] **Step 5: Commit if fixes needed**

```bash
git add -A
git commit -m "fix: tier 1 restructure verification fixes"
```

---

## Self-Review

**Spec coverage:**
- ✅ 5→4 Tier 1s (Product Design removed) — Task 1 Step 1
- ✅ TIER1_IDS, TIER1_CHALLENGES updated — Task 1 Step 1
- ✅ COURAGE_LADDER exp-product-design keys removed — Task 1 Step 2
- ✅ Copy updated to job-oriented framing — Task 1 Steps 1-2
- ✅ New sub-nodes for all 4 Tier 1s — Task 1 Step 3
- ✅ Old sub-nodes removed — Task 1 Step 3
- ✅ experienceDomeConfig.js cleaned — Task 2 Step 1
- ✅ ExperienceGameFlow.jsx cleaned — Task 2 Step 2
- ✅ domeSkillInference.json cleaned + merged — Task 2 Step 3
- ✅ huzzDomeData.js cleaned — Task 2 Step 4
- ✅ DB migration for quests.skill_node_id — Task 2 Step 5
- ✅ groan_challenges.source_value left as-is — Task 2 Step 5 comment
- ✅ Orphan reference check — Task 3 Steps 2-3
- ✅ Sub-node-specific courage ladders deferred to V2 — not in plan (correct)

**Placeholder scan:** No TBDs, TODOs, or vague instructions. All steps have exact code or exact grep commands.

**Type consistency:** `TIER1_IDS` produces 4 entries in Task 1, consumed everywhere else. New sub-node IDs are consistent between Step 3 (data) and Task 3 Step 3 (verification grep). `exp-product-design` removal is consistent across all 6 files in Tasks 1-2.
