# Product Grouping in Product Selection

**Date:** 2026-02-19
**Status:** Approved

## Problem

Users complete Offer Builder with multiple solutions linked to the same existing product (via `existingProductId`). Product Selection currently treats each solution as a separate product, requiring mechanism + features + Value Equation for each one individually. A user with 11 solutions (6 belonging to one product) goes through 11 full cycles instead of ~4.

## Design

### Auto-grouping on load

When `loadProducts()` fetches `q8_solutions.solutions`, group by `existingProductId`:
- Solutions sharing the same `existingProductId` → single product group
- Solutions without `existingProductId` (or unique) → standalone, unchanged flow

### Flow per product group

1. **Mechanism** — one question: "How does [Product Name] solve their problems?"
2. **Features/Benefits** — auto-filled from solution descriptions, user can edit/add/remove
3. **Value Equation** — 3 questions answered once for the whole product group
4. **Transition** → next product group or summary

### Save format

Same `product_selections` structure in `offer_builder_assessments.responses`, with `groupedSolutionIds` and `existingProductId` for grouped products.

### Backward compatibility

- Old assessments without grouping load fine (no `type` field = standalone)
- Auto-save/resume preserves group state

## Files modified

- `src/flows/ProductSelectionFlow.jsx` — grouping logic, auto-fill features, welcome UI, summary UI
- `src/flows/ProductSelectionFlow.css` — group preview styles
- No database changes needed (stored as JSON in `offer_builder_assessments.responses`)

## Out of scope

- Re-grouping after Offer Builder (user must re-run Offer Builder to change groups)
- Drag-and-drop reordering of features within groups
- Per-feature Value Equation scoring (explicitly rejected — too many questions)
