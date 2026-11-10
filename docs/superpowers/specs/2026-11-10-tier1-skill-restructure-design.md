# Tier 1 Skill Node Restructure — Design Spec

**Date:** 2026-11-10
**Status:** Draft
**Depends on:** Money Map (shipped), Experience Dome Sub-Nodes (shipped), Courage Ladder (shipped)

## Problem

The current 5 Tier 1 skill nodes are too abstract. "Coding", "Product Design", "Graphic Design", "Spreadsheets", "Selling" sound like university courses, not jobs people get paid for. Users need to see themselves in the options — "I build apps" or "I run Meta ads", not "I do coding" or "I do selling."

Additionally, Product Design overlaps heavily with Coding now that AI tools make building and designing nearly the same skill. They should merge.

## Change Summary

**5 Tier 1s → 4 Tier 1s.** Product Design is absorbed into Coding (apps side) and Graphic Design (website design side).

**Sub-nodes renamed to actual paid roles.** Each sub-node is something you'd put on a freelancer profile or job listing.

## New Structure

| Tier 1 ID | Label | Sub-node ID | Sub-node Label | Freelancer profile line |
|---|---|---|---|---|
| `exp-coding` | Coding | `fmt-code-apps` | Apps | "I build apps and websites" |
| | | `fmt-code-tools` | Tools | "I build automations, bots, and Shopify stores" |
| `exp-graphic-design` | Graphic Design | `fmt-graphic-web` | Website design | "I design websites" |
| | | `fmt-graphic-content` | Content assets | "I make social posts, thumbnails, brand assets" |
| `exp-spreadsheets` | Spreadsheets | `fmt-sheet-modelling` | Modelling | "I build financial models and dashboards" |
| `exp-selling` | Selling | `fmt-sell-meta` | Meta ads | "I run Facebook and Instagram ads" |
| | | `fmt-sell-amazon` | Amazon ads | "I run Amazon PPC" |
| | | `fmt-sell-google` | Google ads | "I run Google ads" |
| | | `fmt-sell-cold-call` | Cold calling | "I do outbound sales calls" |
| | | `fmt-sell-setter` | Sales call setter | "I book sales calls for businesses" |

### What changed

| Old | New | What happened |
|---|---|---|
| `exp-product-design` | **Removed** | UX/web → Coding (Apps). Visual → Graphic Design (Website design). Industrial/Game dropped (too niche for V1). |
| `exp-coding` sub-nodes | **Added** | Was the only Tier 1 with zero sub-nodes. Now has Apps + Tools. |
| `fmt-proddesign-*` (4 nodes) | **Removed** | Absorbed into Coding and Graphic Design sub-nodes. |
| `fmt-graphic-*` (5 nodes) | **Replaced** (2 nodes) | Brand/Print/Digital/Illustration/Typography → Website design + Content assets. |
| `fmt-sheet-*` (5 nodes) | **Replaced** (1 node) | Financial/Data/Tracking/Automation/Reporting → Modelling (they're all the same job). |
| `fmt-sell-*` (7 nodes) | **Replaced** (5 nodes) | 1:1/Stage/Page/DM/Market/Negotiate/Fundraise → Meta ads/Amazon ads/Google ads/Cold calling/Sales call setter. |

### Design Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Product Design merged into Coding | With AI tools (Cursor, v0, Bolt), building and designing are the same skill. A "product designer" today builds apps. |
| 2 | Sub-nodes = freelancer profile lines | If you can't put it on Upwork, it's not specific enough. Every sub-node maps to a real paid role. |
| 3 | Apps vs Tools split | Apps = customer-facing products (mobile, web, SaaS). Tools = internal/productivity (Shopify stores, Notion templates, automations, bots, scripts). |
| 4 | Spreadsheets → single sub-node (Modelling) | Financial modelling, dashboards, reporting, automation are all the same job — "I build models." |
| 5 | Selling sub-nodes are platforms/methods | "Meta ads" and "Google ads" are different skills with different tools, certifications, and pay rates. They deserve separate nodes. |
| 6 | Tier 1 IDs stay the same where possible | `exp-coding`, `exp-graphic-design`, `exp-spreadsheets`, `exp-selling` keep their IDs. Only `exp-product-design` is removed. Minimizes DB migration. |

## Data Migration

### DB: quests.skill_node_id

Existing quests may have `skill_node_id = 'exp-product-design'`. These need migrating:

```sql
-- Migrate product-design quests to coding (closest match)
UPDATE quests
SET skill_node_id = 'exp-coding'
WHERE skill_node_id = 'exp-product-design';
```

No other Tier 1 IDs change, so no other migration needed.

### DB: groan_challenges.source_value

Challenges created from `exp-product-design` have `source_value = 'exp-product-design'`. These are historical records — leave them as-is for analytics. The engine looks up templates by `quest.skill_node_id`, not by `challenge.source_value`.

## Files to Change

### Data files (source of truth)

| File | Change |
|------|--------|
| `src/data/tier1Challenges.js` | Remove `exp-product-design` from `TIER1_IDS` and `TIER1_CHALLENGES`. Update `COURAGE_LADDER` to remove `exp-product-design` keys. Add sub-node-specific templates where useful (V2 — for now, per-Tier-1 templates still work). |
| `src/data/experienceDomeSubNodes.js` | Replace all `fmt-proddesign-*`, `fmt-graphic-*`, `fmt-sheet-*`, `fmt-sell-*` entries with new sub-nodes per the table above. Add `fmt-code-apps`, `fmt-code-tools` for Coding. |

### Flow/UI files

| File | Change |
|------|--------|
| `src/flows/MoneyMapFlow.jsx` | Remove product-design card from selection. Now shows 4 Tier 1 options instead of 5. |
| `src/flows/ChooseQuestsFlow.jsx` | No code change needed — uses `getSubNodes()` helper which reads from experienceDomeSubNodes.js. New sub-nodes appear automatically. |

### Engine/logic files

| File | Change |
|------|--------|
| `src/lib/financialSecurityEngine.js` | No change needed — looks up `quest.skill_node_id` in COURAGE_LADDER, which still has `exp-coding`, `exp-graphic-design`, `exp-spreadsheets`, `exp-selling`. |
| `src/lib/moneyMapUtils.js` | No change needed — reads from TIER1_CHALLENGES which will have 4 entries instead of 5. |

### Config/mapping files

| File | Change |
|------|--------|
| `src/lib/experienceDomeConfig.js` | Remove `exp-product-design` from 3 locations: label map (~line 153), TIER1_IDS array (~line 677), and VIRTUAL_EXPERIENCE_NODES (~line 797). |
| `src/data/domeSkillInference.json` | Remove `exp-product-design` entry. Merge its skill inferences into `exp-coding` if relevant. |
| `src/flows/ExperienceGameFlow.jsx` | Remove `exp-product-design` tick description (~line 109). |

### Other files (minor)

| File | Change |
|------|--------|
| `src/lib/huzzDomeData.js` | Remove `exp-product-design` demo data entry. |
| `src/data/voiceStems.js` | No change — only references `exp-selling` which stays. |
| `src/lib/domeSummary.js` | No change — uses `getSubNodes()` helper. |
| `supabase/functions/process-stems/index.ts` | Update example data to remove `exp-product-design` reference. |

### Untouched

| File | Why |
|------|-----|
| `src/lib/passionChallengeEngine.js` | Doesn't reference Tier 1 IDs. Works with quest dimensions, not skill nodes. |
| `src/components/FinancialSecurityCard.jsx` | Reads stages, not skill node IDs. |
| `src/components/QuestBoardCard.jsx` | No Tier 1 awareness. |

## Courage Ladder Update

The `COURAGE_LADDER` in `tier1Challenges.js` currently has per-skill templates for stages 2-6. With the restructure:

- Remove all `exp-product-design` keys from every stage
- Keep `exp-coding`, `exp-graphic-design`, `exp-spreadsheets`, `exp-selling` keys
- Update challenge copy to reflect the new framing (e.g., "Build 2 more small projects" → "Build 2 apps or tools for real people")
- Sub-node-specific courage ladders (different templates for Apps vs Tools) is V2

## Copy Updates

All user-facing labels in `TIER1_CHALLENGES` should be reviewed for 12-year-old readability:

| Old | New |
|---|---|
| "Coding / building software" | "Coding" (sub-label: "Build apps, websites, tools, and automations") |
| "Product design" | **Removed** |
| "Graphic design" | "Graphic Design" (sub-label: "Design websites, social posts, brand assets") |
| "Spreadsheets / data" | "Spreadsheets" (sub-label: "Build financial models and dashboards") |
| "Selling / pitching" | "Selling" (sub-label: "Run ads, make sales calls, book meetings") |

## Out of Scope (V2)

- Per-sub-node courage ladder templates (different challenges for "Apps" vs "Tools" within Coding)
- Per-sub-node pricing in experiencePricing.js (currently only has per-experience pricing, not per-sub-node)
- AI-suggested Tier 1 based on experience dome ratings (currently user picks manually)
- More Selling sub-nodes (e.g., LinkedIn ads, TikTok ads, email outreach) — add when users ask
