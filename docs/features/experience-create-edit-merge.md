# Merge ExperienceCreate + ExperienceDetail into One Page

*Spec: July 25 2026. Status: Not started.*

## Problem

Two separate pages for creating and editing experiences:
- `ExperienceCreate.jsx` (`/create/experience/new`) — form with name, date, price, capacity, type
- `ExperienceDetail.jsx` (`/create/experience/:id`) — checklist pipeline, no way to edit name/date/price/capacity

The "Edit" button on experience cards navigates to ExperienceDetail, which has no edit fields. Users can't change the date of an event after creation.

## Solution

Merge into one page. ExperienceDetail becomes the single page for both creation AND editing.

### Creation mode (`/create/experience/new`)

1. Show the form fields: name, date, price, capacity, type (same as current ExperienceCreate)
2. Template pre-fill and "run again" logic carries over from ExperienceCreate
3. On save → creates the experience, seeds checklist from template, stays on the same page
4. Checklist appears below the form after save

### Edit mode (`/create/experience/:id`)

1. Same form fields at the top, pre-filled from existing experience data
2. Fields are editable (inline, not a separate modal)
3. Auto-save on blur or debounce (same pattern as PositioningSummary)
4. Checklist pipeline below (unchanged)

### URL behavior

- `/create/experience/new` → creation mode (empty form, no checklist)
- `/create/experience/new?from=XYZ` → "run again" mode (pre-fill from previous)
- `/create/experience/new?templateId=XYZ` → template mode (pre-fill from template)
- `/create/experience/:id` → edit mode (existing experience, form + checklist)

### What changes

| File | Change |
|------|--------|
| `ExperienceDetail.jsx` | Add editable header section (name, date, price, capacity, type). Handle `id === 'new'` for creation mode. Absorb template/run-again logic from ExperienceCreate. |
| `ExperienceCreate.jsx` | Delete or redirect to ExperienceDetail with `id=new` |
| `AppRouter.jsx` | `/create/experience/new` routes to ExperienceDetail (not ExperienceCreate) |
| `CreatorHomeV2.jsx` | "Edit" button already routes to `/create/experience/:id` — no change needed |

### What to preserve from ExperienceCreate

- Template pre-fill logic (lines 44-59)
- "Run again" source fetching
- Previous experience 3% note display
- Experience type picker
- `saveToLibrary` toggle
- Validation (name required, date required)

### Design

```
/create/experience/:id (or /new)

┌─────────────────────────────────────────────┐
│  Barcelona Euro Disco Tour          [Save]  │
│  ─────────────────────────────────────────  │
│  Date: [4 Aug 2026]  Capacity: [100]       │
│  Price: [$25]        Type: [popup ▾]       │
│                                             │
│  (3% note from last event, if exists)      │
└─────────────────────────────────────────────┘

┌─ MARKETING CHECKLIST ───────────────────────┐
│  ☐ Post announcement                        │
│  ☐ Create event page                        │
│  ...                                        │
└─────────────────────────────────────────────┘

┌─ ORGANISATION CHECKLIST ────────────────────┐
│  ☐ Book venue                               │
│  ...                                        │
└─────────────────────────────────────────────┘
```

### Build estimate

30-45 minutes. Main risk: ExperienceDetail is a complex file. Need to read it fully before modifying.
