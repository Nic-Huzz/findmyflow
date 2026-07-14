# RP Display System: Section-Level Badges

**Created:** 2026-07-14
**Status:** Design decision, ready for review

---

## The Problem

RP (Rise Points) are shown inconsistently across the app:
- Community task cards show `+2`, `+4`, `+8`, `+10` as inline gold text
- Weekly Review shows `+5 RP` as plain text in a button
- Practices show `3pts` inline on each item
- Floating points animation appears on task completion
- No section-level totals visible anywhere

Users can't tell at a glance how much a whole section is worth. Each item screaming its own number creates noise, not clarity.

## The Decision

**Show RP at the section header level, not on every item.**

Like a menu showing the price of a set meal, not pricing each ingredient.

### The Pattern

Each section header gets an RP badge showing the total earnable RP for that section. Individual items do NOT show points (with one exception: healing intentions, because each has different value and they're sparse).

### Visual Treatment

A small pill badge in the section header, right-aligned. Same visual language as the existing `7` badge on Active Wahoos and the `1/14` counter on Daily Practices.

```
  Section Header                    [⚡ 14 RP]
```

- Purple background (`#5e17eb`) with white text
- Lightning bolt prefix (matches streak/wahoo icon language)
- `RP` suffix (the app's currency name)
- Small, 12px font, pill-shaped (border-radius: 100px)
- Sits in the same position as existing counters (top-right of section header)

---

## Section-by-Section Plan

### Tune Tab

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **Daily Practices** | 6 practices | 3 each (dorsal=-2, sympathetic=-1, ventral=+1, vibe_rise=+2 for state items) | ~14 max | `⚡ 14 RP` in header next to `1/14` |
| **Reconnect** | 1 item | 3 | 3 | Included in Practices total |
| **Rest** | 1 item | 3 | 3 | Included in Practices total |
| **Stalls** | Variable (meal items) | 1 each (healthy) | ~3 | `⚡ 3 RP` own header |
| **Drains** | 5 categories | -2 each (negative) | -10 max | No badge (drains subtract, showing RP would be confusing) |
| **Experience Check-in** | Variable | 2 per prediction + 3 for outcome | ~5 | `⚡ 5 RP` own header |
| **Weekly Focus** | 1 value pick | 0 (no RP) | 0 | No badge |

**Change:** Remove `3pts` from individual practice items. Add RP badge to Daily Practices header and Stalls header. Drains show no RP badge (they subtract).

### Courage Tab

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **Active Wahoos** | Variable | 7-10 per wahoo (classification-dependent) | ~7-10 per wahoo | `⚡ 7-10 RP` in header (show per-wahoo average) |
| **Wahoo Creator** | N/A (creation tool) | 0 | 0 | No badge |
| **Wahoo Inspiration** | N/A (browsing) | 0 | 0 | No badge |

**Note:** Wahoo RP varies by post-completion classification (Vibe Rise = 10, Fun = 7, Pressure = 10, Uninterested = 9). The badge shows a range: `⚡ 7-10 RP each`. This is shown on the Active Wahoos section header.

**Change:** Add RP badge to Active Wahoos header. The existing `7` count badge stays (that's the wahoo count, not RP).

### Healing Tab

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **Each healing intention** | Individual cards | 5 per flow completion, 2 per outcome check | 5-7 each | `⚡ 5 RP` inline on each card |

**Exception:** Healing intentions keep individual RP display because they're sparse (typically 1-3 active), each is a significant commitment, and the RP motivates completion of multi-step flows.

**Change:** Add `⚡ 5 RP` badge to each healing intention card (next to "Continue healing flow").

### Quests Tab

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **Active Quests** | Variable | add task=2, complete task=3, achieve quest=10 | Variable | No section badge (too variable) |

**No change.** Quest RP is already shown on completion (`+3 RP` in success message). The quest board is about progress, not point farming.

### Community Tasks (new /community?tab=tasks)

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **All 6 tasks** | 6 cards | 2, 2, 4, 4, 8, 10 | 30 total | `⚡ 30 RP` in Tasks tab header |

**Change:** Add total RP badge to the Tasks tab section header. Remove individual `+N` from each card? **Decision needed:** keep individual points on cards (users want to know which tasks are worth more) or remove and only show total.

**Recommendation:** Keep individual points on cards BUT restyle them as subtle muted text instead of gold accent. The header badge shows the total, individual cards show relative value.

### Weekly Review

| Section | Items | RP Per Item | Total RP | Badge |
|---------|-------|------------|----------|-------|
| **Review completion** | 1 flow | 15 RP + 5 for sharing | 20 max | Show in CTA button copy |

**Change:** Update share button from `Share your week (+5 RP)` to match the badge style, or leave as-is (it's a CTA, not a section header).

---

## What Gets Removed

1. `3pts` text on individual Tune tab practice items (replaced by section header total)
2. The gold `+N` accent color on Community Task cards (replaced by muted text + header total)

## What Gets Added

1. RP badge on Daily Practices section header
2. RP badge on Stalls section header  
3. RP badge on Active Wahoos section header
4. RP badge on each Healing intention card (inline)
5. RP badge on Community Tasks tab header
6. Optional: RP badge on Experience Check-in section header

## Component

One reusable component, two sizes:

```jsx
// Section header badge (default)
<RPBadge points={14} />           // renders: ⚡ 14 RP

// Inline badge (smaller, for healing cards)
<RPBadge points={5} size="sm" />  // renders: ⚡ 5 RP (smaller)

// Range badge (for wahoos)
<RPBadge points="7-10" label="each" />  // renders: ⚡ 7-10 RP each
```

Styles: purple pill, white text, 12px (sm: 11px), border-radius 100px.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/RPBadge.jsx` | **New.** Reusable badge component. |
| `src/components/TuneTab.jsx` | Add badge to Daily Practices + Stalls headers. Remove `3pts` from items. |
| `src/components/PlayListTab.jsx` | Add badge to Active Wahoos header. |
| `src/components/HealingIntentionsList.jsx` | Add inline badge to each healing intention card. |
| `src/pages/CommunityFeed.jsx` | Add badge to Tasks tab header. |
| `src/components/ContentChallenges.jsx` | Restyle individual point values (muted, not gold). |
| `src/Challenge.css` | RPBadge styles (or colocated in component). |

---

## Open Questions

1. **Drains:** Show negative RP (`-10 RP`) or no badge? Current recommendation: no badge.
2. **Community Task individual points:** Keep them (muted) or remove entirely? Recommendation: keep muted.
3. **Quest tab:** Add a "potential RP" badge or leave as-is? Recommendation: leave as-is.
4. **Weekly Review share button:** Restyle to match or leave as CTA text? Recommendation: leave as-is.
